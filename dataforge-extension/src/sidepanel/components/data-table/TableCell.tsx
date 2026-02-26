/**
 * TableCell -- Individual cell component for the DataForge data table.
 *
 * Features:
 * - Type-aware rendering (URLs as links, images as thumbnails, prices/dates formatted)
 * - Double-click to edit inline (Enter to confirm, Escape to cancel)
 * - Brief emerald highlight flash on edit commit (200ms)
 * - Truncation with tooltip on hover for long text
 * - Copy value on Ctrl+C when cell is active
 * - Image URL hover triggers ImagePreview via store
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { ColumnDef } from '@/types/table';
import { useDataTableStore, type CellAddress } from './useDataTableStore';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface TableCellProps {
  value: string | number | null;
  column: ColumnDef;
  rowId: string;
  isActive: boolean;
  isEditing: boolean;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const URL_REGEX = /^https?:\/\/.+/i;
const IMAGE_EXT_REGEX = /\.(png|jpe?g|gif|webp|svg|avif|ico|bmp)(\?.*)?$/i;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const DATE_ISO_REGEX = /^\d{4}-\d{2}-\d{2}/;

function isImageUrl(val: string): boolean {
  return URL_REGEX.test(val) && IMAGE_EXT_REGEX.test(val);
}

function formatPrice(val: string | number): string {
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(/[^0-9.\-]/g, ''));
  if (Number.isNaN(num)) return String(val);
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
}

function formatDateValue(val: string | number): string {
  const ts = typeof val === 'number' ? val : Date.parse(String(val));
  if (Number.isNaN(ts)) return String(val);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(ts));
}

function safeUrl(val: string): string | null {
  try {
    new URL(val);
    return val;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TableCell: React.FC<TableCellProps> = React.memo(
  ({ value, column, rowId, isActive, isEditing }) => {
    const startEditing = useDataTableStore((s) => s.startEditing);
    const setEditValue = useDataTableStore((s) => s.setEditValue);
    const commitEdit = useDataTableStore((s) => s.commitEdit);
    const cancelEdit = useDataTableStore((s) => s.cancelEdit);
    const editValue = useDataTableStore((s) => s.editValue);
    const setActiveCell = useDataTableStore((s) => s.setActiveCell);
    const showImagePreview = useDataTableStore((s) => s.showImagePreview);
    const hideImagePreview = useDataTableStore((s) => s.hideImagePreview);

    const cellRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [justEdited, setJustEdited] = useState(false);
    const [showTooltip, setShowTooltip] = useState(false);
    const tooltipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const strValue = value == null ? '' : String(value);

    // Focus input when entering edit mode
    useEffect(() => {
      if (isEditing && inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, [isEditing]);

    // Flash effect on commit
    useEffect(() => {
      if (justEdited) {
        const timer = setTimeout(() => setJustEdited(false), 200);
        return () => clearTimeout(timer);
      }
    }, [justEdited]);

    // ---- Event handlers ----

    const handleDoubleClick = useCallback(() => {
      const cell: CellAddress = { rowId, columnId: column.id };
      startEditing(cell, strValue);
    }, [rowId, column.id, strValue, startEditing]);

    const handleClick = useCallback(() => {
      setActiveCell({ rowId, columnId: column.id });
    }, [rowId, column.id, setActiveCell]);

    const handleInputKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          setJustEdited(true);
          commitEdit();
        } else if (e.key === 'Escape') {
          e.preventDefault();
          cancelEdit();
        }
        // Stop propagation so table keyboard nav doesn't fire
        e.stopPropagation();
      },
      [commitEdit, cancelEdit],
    );

    const handleInputChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        setEditValue(e.target.value);
      },
      [setEditValue],
    );

    const handleInputBlur = useCallback(() => {
      // Commit on blur for convenience
      setJustEdited(true);
      commitEdit();
    }, [commitEdit]);

    // Copy on Ctrl+C when active
    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if ((e.ctrlKey || e.metaKey) && e.key === 'c' && isActive && !isEditing) {
          e.preventDefault();
          navigator.clipboard?.writeText(strValue).catch(() => {
            /* silently fail */
          });
        }
      },
      [isActive, isEditing, strValue],
    );

    // Tooltip on hover for long text
    const handleMouseEnter = useCallback(
      (e: React.MouseEvent) => {
        // Start tooltip timer
        if (strValue.length > 40 && cellRef.current) {
          tooltipTimerRef.current = setTimeout(() => setShowTooltip(true), 500);
        }

        // Image preview
        if (column.dataType === 'image' || isImageUrl(strValue)) {
          const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
          showImagePreview(strValue, { x: rect.right + 8, y: rect.top });
        }
      },
      [strValue, column.dataType, showImagePreview],
    );

    const handleMouseLeave = useCallback(() => {
      if (tooltipTimerRef.current) {
        clearTimeout(tooltipTimerRef.current);
        tooltipTimerRef.current = null;
      }
      setShowTooltip(false);
      hideImagePreview();
    }, [hideImagePreview]);

    // ---- Render cell content by type ----

    const renderContent = () => {
      if (value == null || strValue === '') {
        return <span className="text-forge-text-muted/40 italic text-xs select-none">empty</span>;
      }

      // Editing mode
      if (isEditing) {
        return (
          <input
            ref={inputRef}
            type="text"
            value={editValue}
            onChange={handleInputChange}
            onKeyDown={handleInputKeyDown}
            onBlur={handleInputBlur}
            className="w-full h-full bg-forge-bg-secondary border border-accent-primary rounded px-1.5 py-0.5 text-xs text-forge-text outline-none font-mono"
            spellCheck={false}
          />
        );
      }

      switch (column.dataType) {
        case 'url': {
          const href = safeUrl(strValue);
          if (href) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent-primary hover:text-accent-tertiary underline underline-offset-2 truncate block"
                title={strValue}
                onClick={(e) => e.stopPropagation()}
              >
                {strValue.replace(/^https?:\/\/(www\.)?/, '').slice(0, 60)}
              </a>
            );
          }
          return <span className="truncate block">{strValue}</span>;
        }

        case 'image': {
          if (isImageUrl(strValue)) {
            return (
              <div className="flex items-center gap-1.5">
                <div className="w-6 h-6 rounded border border-forge-border overflow-hidden flex-shrink-0 bg-forge-bg-tertiary">
                  <img
                    src={strValue}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
                <span className="truncate text-forge-text-secondary text-[10px]">
                  {strValue.split('/').pop()?.split('?')[0] ?? 'image'}
                </span>
              </div>
            );
          }
          return <span className="truncate block">{strValue}</span>;
        }

        case 'email': {
          if (EMAIL_REGEX.test(strValue)) {
            return (
              <a
                href={`mailto:${strValue}`}
                className="text-accent-secondary hover:text-accent-tertiary underline underline-offset-2 truncate block"
                onClick={(e) => e.stopPropagation()}
              >
                {strValue}
              </a>
            );
          }
          return <span className="truncate block">{strValue}</span>;
        }

        case 'price':
          return <span className="truncate block font-mono text-accent-tertiary">{formatPrice(strValue)}</span>;

        case 'number':
          return (
            <span className="truncate block font-mono text-right">
              {Number.isNaN(Number(strValue)) ? strValue : new Intl.NumberFormat('en-US').format(Number(strValue))}
            </span>
          );

        case 'date':
          return <span className="truncate block text-forge-text-secondary">{formatDateValue(strValue)}</span>;

        case 'rating': {
          const rating = parseFloat(strValue);
          if (!Number.isNaN(rating)) {
            const fullStars = Math.floor(Math.min(5, Math.max(0, rating)));
            return (
              <span className="flex items-center gap-0.5" title={`${rating}/5`}>
                {Array.from({ length: 5 }, (_, i) => (
                  <span
                    key={i}
                    className={i < fullStars ? 'text-accent-primary' : 'text-forge-border/60'}
                  >
                    {'\u2605'}
                  </span>
                ))}
                <span className="text-[10px] text-forge-text-muted ml-1">{rating.toFixed(1)}</span>
              </span>
            );
          }
          return <span className="truncate block">{strValue}</span>;
        }

        case 'phone':
          return (
            <a
              href={`tel:${strValue.replace(/\s/g, '')}`}
              className="text-accent-secondary hover:text-accent-tertiary truncate block"
              onClick={(e) => e.stopPropagation()}
            >
              {strValue}
            </a>
          );

        default: {
          // Auto-detect URLs in text fields
          if (URL_REGEX.test(strValue)) {
            const href = safeUrl(strValue);
            if (href) {
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent-primary hover:text-accent-tertiary underline underline-offset-2 truncate block"
                  title={strValue}
                  onClick={(e) => e.stopPropagation()}
                >
                  {strValue.replace(/^https?:\/\/(www\.)?/, '').slice(0, 60)}
                </a>
              );
            }
          }
          return <span className="truncate block">{strValue}</span>;
        }
      }
    };

    return (
      <div
        ref={cellRef}
        role="gridcell"
        tabIndex={isActive ? 0 : -1}
        className={[
          'relative px-2 py-1 text-xs leading-[34px] h-9 overflow-hidden cursor-default select-none',
          'border-r border-forge-border/30 last:border-r-0',
          'transition-colors duration-75',
          isActive && !isEditing && 'ring-1 ring-inset ring-accent-primary/50 bg-accent-primary/5',
          isEditing && 'ring-2 ring-inset ring-accent-primary bg-forge-bg-secondary p-0',
          justEdited && 'bg-accent-primary/20',
        ]
          .filter(Boolean)
          .join(' ')}
        style={{ width: column.width, minWidth: column.width, maxWidth: column.width }}
        onClick={handleClick}
        onDoubleClick={handleDoubleClick}
        onKeyDown={handleKeyDown}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        data-row-id={rowId}
        data-col-id={column.id}
      >
        {renderContent()}

        {/* Tooltip */}
        {showTooltip && !isEditing && strValue.length > 40 && (
          <div
            className="absolute z-50 bottom-full left-0 mb-1 px-2 py-1.5 rounded bg-forge-bg-tertiary border border-forge-border text-[11px] text-forge-text max-w-[300px] whitespace-pre-wrap break-words shadow-lg pointer-events-none animate-fade-in"
            role="tooltip"
          >
            {strValue}
          </div>
        )}
      </div>
    );
  },
);

TableCell.displayName = 'TableCell';

export default TableCell;
