/**
 * TableHeader -- Sticky header row for the DataForge data table.
 *
 * Features:
 * - Column headers with name + sort indicator (up/down arrow)
 * - Click to cycle sort: asc -> desc -> none
 * - Right-click context menu: rename, hide, change type, delete
 * - Drag to resize column width (resize handle on right edge)
 * - Drag to reorder columns (ghost preview, spring animation)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import type { ColumnDef } from '@/types/table';
import type { DataType } from '@/types/extraction';
import { useDataTableStore } from './useDataTableStore';

// ---------------------------------------------------------------------------
// Data type options for the context menu
// ---------------------------------------------------------------------------

const DATA_TYPES: { value: DataType; label: string }[] = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'price', label: 'Price' },
  { value: 'url', label: 'URL' },
  { value: 'image', label: 'Image' },
  { value: 'email', label: 'Email' },
  { value: 'date', label: 'Date' },
  { value: 'rating', label: 'Rating' },
  { value: 'phone', label: 'Phone' },
  { value: 'location', label: 'Location' },
];

// ---------------------------------------------------------------------------
// Context menu state
// ---------------------------------------------------------------------------

interface ContextMenuState {
  columnId: string;
  x: number;
  y: number;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface TableHeaderProps {
  columns: ColumnDef[];
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TableHeader: React.FC<TableHeaderProps> = ({ columns }) => {
  const sorts = useDataTableStore((s) => s.sorts);
  const toggleSort = useDataTableStore((s) => s.toggleSort);
  const resizeColumn = useDataTableStore((s) => s.resizeColumn);
  const renameColumn = useDataTableStore((s) => s.renameColumn);
  const toggleColumnVisibility = useDataTableStore((s) => s.toggleColumnVisibility);
  const removeColumn = useDataTableStore((s) => s.removeColumn);
  const updateColumn = useDataTableStore((s) => s.updateColumn);
  const columnOrder = useDataTableStore((s) => s.columnOrder);
  const setColumnOrder = useDataTableStore((s) => s.setColumnOrder);

  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [renamingColumnId, setRenamingColumnId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [typeMenuColumnId, setTypeMenuColumnId] = useState<string | null>(null);

  // Drag-to-resize state
  const [resizingColumnId, setResizingColumnId] = useState<string | null>(null);
  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(0);

  // Drag-to-reorder state
  const [draggingColumnId, setDraggingColumnId] = useState<string | null>(null);
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);

  const renameInputRef = useRef<HTMLInputElement>(null);

  // ---- Close context menu on outside click ----
  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = () => {
      setContextMenu(null);
      setTypeMenuColumnId(null);
    };
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, [contextMenu]);

  // ---- Focus rename input ----
  useEffect(() => {
    if (renamingColumnId && renameInputRef.current) {
      renameInputRef.current.focus();
      renameInputRef.current.select();
    }
  }, [renamingColumnId]);

  // ---- Resize handlers ----

  const handleResizeStart = useCallback(
    (e: React.MouseEvent, col: ColumnDef) => {
      e.preventDefault();
      e.stopPropagation();
      setResizingColumnId(col.id);
      resizeStartX.current = e.clientX;
      resizeStartWidth.current = col.width;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const delta = moveEvent.clientX - resizeStartX.current;
        resizeColumn(col.id, resizeStartWidth.current + delta);
      };

      const handleMouseUp = () => {
        setResizingColumnId(null);
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [resizeColumn],
  );

  // ---- Sort click ----

  const handleSortClick = useCallback(
    (columnId: string) => {
      toggleSort(columnId);
    },
    [toggleSort],
  );

  // ---- Context menu ----

  const handleContextMenu = useCallback((e: React.MouseEvent, columnId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ columnId, x: e.clientX, y: e.clientY });
    setTypeMenuColumnId(null);
  }, []);

  // ---- Rename ----

  const handleStartRename = useCallback(
    (columnId: string) => {
      const col = columns.find((c) => c.id === columnId);
      if (col) {
        setRenamingColumnId(columnId);
        setRenameValue(col.name);
      }
      setContextMenu(null);
    },
    [columns],
  );

  const handleCommitRename = useCallback(() => {
    if (renamingColumnId && renameValue.trim()) {
      renameColumn(renamingColumnId, renameValue.trim());
    }
    setRenamingColumnId(null);
    setRenameValue('');
  }, [renamingColumnId, renameValue, renameColumn]);

  const handleRenameKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        handleCommitRename();
      } else if (e.key === 'Escape') {
        setRenamingColumnId(null);
        setRenameValue('');
      }
      e.stopPropagation();
    },
    [handleCommitRename],
  );

  // ---- Drag to reorder ----

  const handleDragStart = useCallback(
    (e: React.DragEvent, columnId: string) => {
      setDraggingColumnId(columnId);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', columnId);
      // Ghost preview opacity
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.style.opacity = '0.5';
      }
    },
    [],
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, columnId: string) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (columnId !== draggingColumnId) {
        setDragOverColumnId(columnId);
      }
    },
    [draggingColumnId],
  );

  const handleDragLeave = useCallback(() => {
    setDragOverColumnId(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetColumnId: string) => {
      e.preventDefault();
      if (!draggingColumnId || draggingColumnId === targetColumnId) return;

      const order = [...columnOrder];
      const fromIdx = order.indexOf(draggingColumnId);
      const toIdx = order.indexOf(targetColumnId);
      if (fromIdx === -1 || toIdx === -1) return;

      order.splice(fromIdx, 1);
      order.splice(toIdx, 0, draggingColumnId);
      setColumnOrder(order);
      setDraggingColumnId(null);
      setDragOverColumnId(null);
    },
    [draggingColumnId, columnOrder, setColumnOrder],
  );

  const handleDragEnd = useCallback(
    (e: React.DragEvent) => {
      if (e.currentTarget instanceof HTMLElement) {
        e.currentTarget.style.opacity = '1';
      }
      setDraggingColumnId(null);
      setDragOverColumnId(null);
    },
    [],
  );

  // ---- Render sort indicator ----

  const getSortIndicator = (columnId: string) => {
    const sort = sorts.find((s) => s.columnId === columnId);
    if (!sort) return null;
    const idx = sorts.indexOf(sort);
    return (
      <span className="ml-1 text-accent-primary flex items-center gap-0.5">
        <span className="text-[10px]">{sort.direction === 'asc' ? '\u25B2' : '\u25BC'}</span>
        {sorts.length > 1 && (
          <span className="text-[8px] text-accent-secondary">{idx + 1}</span>
        )}
      </span>
    );
  };

  return (
    <div
      className="flex items-stretch h-9 bg-forge-bg-secondary border-b-2 border-forge-border sticky top-0 z-20 select-none"
      role="row"
      aria-rowindex={1}
    >
      {/* Row number column header */}
      <div className="flex-shrink-0 w-10 flex items-center justify-center text-[10px] text-forge-text-muted/50 font-mono border-r border-forge-border/40">
        #
      </div>

      {/* Column headers */}
      {columns.map((col) => {
        const isDragTarget = dragOverColumnId === col.id && draggingColumnId !== col.id;

        return (
          <div
            key={col.id}
            role="columnheader"
            aria-sort={
              sorts.find((s) => s.columnId === col.id)?.direction === 'asc'
                ? 'ascending'
                : sorts.find((s) => s.columnId === col.id)?.direction === 'desc'
                  ? 'descending'
                  : 'none'
            }
            className={[
              'relative flex items-center gap-1 px-2 text-xs font-semibold text-forge-text-secondary',
              'border-r border-forge-border/40 cursor-pointer',
              'hover:bg-accent-primary/[0.06] hover:text-forge-text',
              'transition-all duration-100',
              isDragTarget && 'bg-accent-primary/10 border-l-2 border-l-accent-primary',
              draggingColumnId === col.id && 'opacity-50',
            ]
              .filter(Boolean)
              .join(' ')}
            style={{ width: col.width, minWidth: col.width, maxWidth: col.width }}
            onClick={() => handleSortClick(col.id)}
            onContextMenu={(e) => handleContextMenu(e, col.id)}
            draggable
            onDragStart={(e) => handleDragStart(e, col.id)}
            onDragOver={(e) => handleDragOver(e, col.id)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, col.id)}
            onDragEnd={handleDragEnd}
          >
            {/* Column name (or rename input) */}
            {renamingColumnId === col.id ? (
              <input
                ref={renameInputRef}
                type="text"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={handleRenameKeyDown}
                onBlur={handleCommitRename}
                className="flex-1 bg-forge-bg border border-accent-primary rounded px-1 py-0.5 text-xs text-forge-text outline-none min-w-0"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <span className="truncate flex-1">{col.name}</span>
            )}

            {/* Sort indicator */}
            {getSortIndicator(col.id)}

            {/* Data type badge */}
            <span className="text-[8px] text-forge-text-muted/40 uppercase tracking-wider flex-shrink-0">
              {col.dataType.slice(0, 3)}
            </span>

            {/* Resize handle */}
            <div
              className={[
                'absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize z-10',
                'hover:bg-accent-primary/30',
                resizingColumnId === col.id && 'bg-accent-primary/50',
              ]
                .filter(Boolean)
                .join(' ')}
              onMouseDown={(e) => handleResizeStart(e, col)}
              onClick={(e) => e.stopPropagation()}
              role="separator"
              aria-orientation="vertical"
            />
          </div>
        );
      })}

      {/* Context menu */}
      {contextMenu && (
        <div
          className="fixed z-50 min-w-[180px] rounded-lg border border-forge-border bg-forge-bg-secondary shadow-xl py-1 animate-scale-in"
          style={{
            left: Math.min(contextMenu.x, (typeof window !== 'undefined' ? window.innerWidth : 400) - 200),
            top: contextMenu.y,
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Rename */}
          <button
            className="w-full text-left px-3 py-1.5 text-xs text-forge-text hover:bg-accent-primary/10 flex items-center gap-2"
            onClick={() => handleStartRename(contextMenu.columnId)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
            </svg>
            Rename
          </button>

          {/* Change Type (submenu) */}
          <div className="relative">
            <button
              className="w-full text-left px-3 py-1.5 text-xs text-forge-text hover:bg-accent-primary/10 flex items-center gap-2"
              onClick={(e) => {
                e.stopPropagation();
                setTypeMenuColumnId(typeMenuColumnId === contextMenu.columnId ? null : contextMenu.columnId);
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="4 7 4 4 20 4 20 7" />
                <line x1="9" y1="20" x2="15" y2="20" />
                <line x1="12" y1="4" x2="12" y2="20" />
              </svg>
              Change Type
              <span className="ml-auto text-forge-text-muted">{'\u25B8'}</span>
            </button>

            {/* Type submenu */}
            {typeMenuColumnId === contextMenu.columnId && (
              <div className="absolute left-full top-0 ml-1 min-w-[120px] rounded-lg border border-forge-border bg-forge-bg-secondary shadow-xl py-1 animate-fade-in">
                {DATA_TYPES.map((dt) => {
                  const col = columns.find((c) => c.id === contextMenu.columnId);
                  const isActive = col?.dataType === dt.value;
                  return (
                    <button
                      key={dt.value}
                      className={[
                        'w-full text-left px-3 py-1.5 text-xs hover:bg-accent-primary/10 flex items-center gap-2',
                        isActive ? 'text-accent-primary font-semibold' : 'text-forge-text',
                      ].join(' ')}
                      onClick={() => {
                        updateColumn(contextMenu.columnId, { dataType: dt.value });
                        setContextMenu(null);
                        setTypeMenuColumnId(null);
                      }}
                    >
                      {isActive && <span className="text-accent-primary">{'\u2713'}</span>}
                      <span className={isActive ? '' : 'ml-5'}>{dt.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Hide */}
          <button
            className="w-full text-left px-3 py-1.5 text-xs text-forge-text hover:bg-accent-primary/10 flex items-center gap-2"
            onClick={() => {
              toggleColumnVisibility(contextMenu.columnId);
              setContextMenu(null);
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
            Hide Column
          </button>

          <div className="my-1 border-t border-forge-border/40" />

          {/* Delete */}
          <button
            className="w-full text-left px-3 py-1.5 text-xs text-status-error hover:bg-status-error/10 flex items-center gap-2"
            onClick={() => {
              removeColumn(contextMenu.columnId);
              setContextMenu(null);
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
            Delete Column
          </button>
        </div>
      )}
    </div>
  );
};

export default TableHeader;
