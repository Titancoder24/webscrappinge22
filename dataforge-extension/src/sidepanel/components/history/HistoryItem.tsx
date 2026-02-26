/**
 * HistoryItem - Individual history entry card.
 *
 * Features:
 *  - Type-specific icon (list/page/email/image/text)
 *  - Domain + page title
 *  - Row count, relative date, and status badge
 *  - Click to reopen data table
 *  - Delete button with confirmation
 *  - Emerald-themed glassmorphism card
 */

import React, { useCallback, useState } from 'react';
import type { ToolType } from '../../../types/extraction';
import type { HistoryItem as HistoryItemType, HistoryStatus } from '../../store/history-slice';
import { formatDate, formatNumber } from '../../../utils/format';
import Badge from '../shared/Badge';

// ---------------------------------------------------------------------------
// Type icon mapping
// ---------------------------------------------------------------------------

const TOOL_ICONS: Record<ToolType, string> = {
  'list-extractor': '\u{1F4CB}',
  'page-extractor': '\u{1F4C4}',
  'email-extractor': '\u{1F4E7}',
  'image-downloader': '\u{1F5BC}\uFE0F',
  'text-extractor': '\u{1F4DD}',
  'templates': '\u{1F4BE}',
};

const STATUS_VARIANT: Record<HistoryStatus, 'success' | 'warning' | 'error'> = {
  completed: 'success',
  partial: 'warning',
  error: 'error',
};

const STATUS_LABEL: Record<HistoryStatus, string> = {
  completed: 'Completed',
  partial: 'Partial',
  error: 'Error',
};

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface HistoryItemProps {
  /** The history item data. */
  item: HistoryItemType;
  /** Called when the user clicks the item to view data. */
  onView: (item: HistoryItemType) => void;
  /** Called when the user confirms deletion. */
  onDelete: (id: string) => void;
  /** Optional style for stagger animation. */
  style?: React.CSSProperties;
  /** Optional class name. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return url;
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const HistoryItem: React.FC<HistoryItemProps> = ({
  item,
  onView,
  onDelete,
  style,
  className = '',
}) => {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClick = useCallback(() => {
    onView(item);
  }, [item, onView]);

  const handleDeleteClick = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (showConfirm) {
        onDelete(item.id);
        setShowConfirm(false);
      } else {
        setShowConfirm(true);
      }
    },
    [showConfirm, item.id, onDelete],
  );

  const handleCancelDelete = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowConfirm(false);
  }, []);

  // Reset confirm state when mouse leaves
  const handleMouseLeave = useCallback(() => {
    if (showConfirm) {
      setShowConfirm(false);
    }
  }, [showConfirm]);

  const domain = extractDomain(item.sourceUrl);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      onMouseLeave={handleMouseLeave}
      style={style}
      className={[
        'group relative flex items-start gap-3 p-3 rounded-xl cursor-pointer select-none',
        'bg-forge-bg-tertiary/40 backdrop-blur-xl',
        'border border-forge-border',
        'transition-all duration-200 motion-reduce:transition-none',
        'hover:border-accent-primary/30',
        'hover:shadow-[0_0_15px_rgba(16,185,129,0.08)]',
        'hover:bg-forge-bg-tertiary/60',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50',
        className,
      ].join(' ')}
      aria-label={`View extraction: ${item.name}`}
    >
      {/* Type icon */}
      <div
        className={[
          'flex items-center justify-center w-9 h-9 rounded-lg shrink-0',
          'bg-gradient-to-br from-accent-primary/15 to-accent-secondary/15',
          'border border-accent-primary/10',
        ].join(' ')}
      >
        <span className="text-base leading-none" aria-hidden="true">
          {TOOL_ICONS[item.tool] || '\u{1F4CB}'}
        </span>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* Name + Status */}
        <div className="flex items-center gap-2 mb-0.5">
          <h4 className="text-sm font-medium text-forge-text truncate">
            {item.name}
          </h4>
          <Badge variant={STATUS_VARIANT[item.status]} className="shrink-0">
            {STATUS_LABEL[item.status]}
          </Badge>
        </div>

        {/* Domain */}
        <p className="text-xs text-forge-text-muted truncate mb-1">
          {domain}
        </p>

        {/* Meta row: row count + date */}
        <div className="flex items-center gap-3 text-[11px] text-forge-text-muted/70">
          <span className="flex items-center gap-1">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="7" height="7" />
              <rect x="14" y="3" width="7" height="7" />
              <rect x="3" y="14" width="7" height="7" />
              <rect x="14" y="14" width="7" height="7" />
            </svg>
            {formatNumber(item.rowCount)} rows
          </span>
          <span className="flex items-center gap-1">
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            {formatDate(item.createdAt, 'relative')}
          </span>
        </div>
      </div>

      {/* Delete button */}
      <div className="flex items-center gap-1 shrink-0 mt-1">
        {showConfirm && (
          <button
            type="button"
            onClick={handleCancelDelete}
            className={[
              'flex items-center justify-center w-6 h-6 rounded',
              'text-forge-text-muted hover:text-forge-text',
              'hover:bg-forge-bg-tertiary/60',
              'transition-colors duration-150 motion-reduce:transition-none',
              'animate-fade-in',
            ].join(' ')}
            aria-label="Cancel delete"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
        <button
          type="button"
          onClick={handleDeleteClick}
          className={[
            'flex items-center justify-center w-6 h-6 rounded',
            'transition-all duration-150 motion-reduce:transition-none',
            showConfirm
              ? 'text-status-error bg-status-error/10 hover:bg-status-error/20'
              : [
                  'text-forge-text-muted/40',
                  'opacity-0 group-hover:opacity-100',
                  'hover:text-status-error hover:bg-status-error/10',
                ].join(' '),
          ].join(' ')}
          aria-label={showConfirm ? 'Confirm delete' : 'Delete extraction'}
          title={showConfirm ? 'Click again to confirm' : 'Delete'}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default HistoryItem;
