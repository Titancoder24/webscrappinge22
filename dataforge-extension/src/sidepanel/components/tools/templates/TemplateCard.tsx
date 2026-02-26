import React, { useState, useCallback } from 'react';
import Badge from '../../shared/Badge';
import type { Template } from '../../../../types/template';
import { formatDate } from '../../../../utils/format';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface TemplateCardProps {
  template: Template;
  viewMode: 'grid' | 'list';
  onApply: (id: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getFaviconUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=32`;
}

function getSuccessRateColor(rate: number): string {
  if (rate >= 0.9) return 'text-status-success';
  if (rate >= 0.7) return 'text-accent-primary';
  if (rate >= 0.5) return 'text-status-warning';
  return 'text-status-error';
}

function getSuccessRateBadge(rate: number): 'success' | 'warning' | 'error' | 'default' {
  if (rate >= 0.9) return 'success';
  if (rate >= 0.7) return 'default';
  if (rate >= 0.5) return 'warning';
  return 'error';
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  viewMode,
  onApply,
  onEdit,
  onDelete,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [faviconError, setFaviconError] = useState(false);

  const handleApply = useCallback(() => {
    onApply(template.id);
  }, [template.id, onApply]);

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onEdit(template.id);
    },
    [template.id, onEdit],
  );

  const handleDeleteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  }, []);

  const handleDeleteConfirm = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(template.id);
      setShowDeleteConfirm(false);
    },
    [template.id, onDelete],
  );

  const handleDeleteCancel = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  }, []);

  const columnCount = template.config.fields.length;
  const successPct = Math.round(template.successRate * 100);

  if (viewMode === 'list') {
    return (
      <button
        type="button"
        onClick={handleApply}
        className={[
          'group flex items-center gap-3 w-full px-3 py-2.5 rounded-lg border transition-all duration-200 text-left',
          'border-forge-border/50 bg-forge-bg-secondary/40',
          'hover:border-accent-primary/30 hover:bg-forge-bg-secondary/60',
          'hover:shadow-[0_0_12px_rgba(16,185,129,0.08)]',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50',
        ].join(' ')}
      >
        {/* Favicon */}
        <div className="w-8 h-8 rounded-lg bg-forge-bg-tertiary/60 flex items-center justify-center shrink-0 overflow-hidden">
          {!faviconError ? (
            <img
              src={getFaviconUrl(template.domain)}
              alt=""
              width={16}
              height={16}
              onError={() => setFaviconError(true)}
              className="w-4 h-4"
            />
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-forge-text-muted" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-forge-text truncate">{template.name}</p>
          <p className="text-[10px] text-forge-text-muted truncate">{template.domain}</p>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-mono text-forge-text-muted">{columnCount} col</span>
          <Badge variant={getSuccessRateBadge(template.successRate)}>
            {successPct}%
          </Badge>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            type="button"
            onClick={handleEdit}
            className="p-1 rounded hover:bg-forge-bg-tertiary text-forge-text-muted hover:text-forge-text-secondary transition-colors"
            title="Edit"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={handleDeleteClick}
            className="p-1 rounded hover:bg-status-error/10 text-forge-text-muted hover:text-status-error transition-colors"
            title="Delete"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
            </svg>
          </button>
        </div>

        {/* Delete confirmation */}
        {showDeleteConfirm && (
          <div
            className="absolute right-0 top-full mt-1 z-20 flex items-center gap-1 p-2 rounded-lg border border-status-error/30 bg-forge-bg-secondary shadow-xl animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="text-[10px] text-status-error font-medium mr-1">Delete?</span>
            <button
              type="button"
              onClick={handleDeleteConfirm}
              className="px-2 py-0.5 rounded bg-status-error text-white text-[10px] font-semibold hover:bg-red-600 transition-colors"
            >
              Yes
            </button>
            <button
              type="button"
              onClick={handleDeleteCancel}
              className="px-2 py-0.5 rounded bg-forge-bg-tertiary text-forge-text-muted text-[10px] font-semibold hover:text-forge-text-secondary transition-colors"
            >
              No
            </button>
          </div>
        )}
      </button>
    );
  }

  // Grid view card
  return (
    <button
      type="button"
      onClick={handleApply}
      className={[
        'group relative flex flex-col gap-3 w-full p-4 rounded-xl border transition-all duration-200 text-left',
        'border-forge-border/50 bg-forge-bg-tertiary/40 backdrop-blur-sm',
        'hover:border-accent-primary/30 hover:bg-forge-bg-tertiary/60',
        'hover:shadow-[0_0_20px_rgba(16,185,129,0.1)]',
        'motion-safe:hover:translate-y-[-1px]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50',
      ].join(' ')}
    >
      {/* Top row: favicon + name */}
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-forge-bg-secondary/80 border border-forge-border/50 flex items-center justify-center shrink-0 overflow-hidden">
          {!faviconError ? (
            <img
              src={getFaviconUrl(template.domain)}
              alt=""
              width={20}
              height={20}
              onError={() => setFaviconError(true)}
              className="w-5 h-5"
            />
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-forge-text-muted" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-forge-text truncate">{template.name}</h3>
          <p className="text-[10px] text-forge-text-muted truncate mt-0.5">{template.domain}</p>
          {template.description && (
            <p className="text-[10px] text-forge-text-muted/70 truncate mt-0.5">
              {template.description}
            </p>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex items-center gap-1.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-forge-text-muted" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="9" y1="21" x2="9" y2="9" />
          </svg>
          <span className="text-[10px] font-medium text-forge-text-secondary">
            {columnCount} columns
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-forge-text-muted" aria-hidden="true">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="text-[10px] text-forge-text-muted">
            {template.lastUsed > 0 ? formatDate(template.lastUsed, 'relative') : 'Never used'}
          </span>
        </div>

        <Badge variant={getSuccessRateBadge(template.successRate)}>
          {successPct}% success
        </Badge>
      </div>

      {/* Use count */}
      {template.useCount > 0 && (
        <p className="text-[9px] text-forge-text-muted">
          Used {template.useCount} time{template.useCount !== 1 ? 's' : ''}
        </p>
      )}

      {/* Actions overlay */}
      <div className="absolute top-3 right-3 flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          type="button"
          onClick={handleEdit}
          className="p-1.5 rounded-md bg-forge-bg/80 backdrop-blur-sm hover:bg-forge-bg-tertiary text-forge-text-muted hover:text-forge-text-secondary transition-colors"
          title="Edit template"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button
          type="button"
          onClick={handleDeleteClick}
          className="p-1.5 rounded-md bg-forge-bg/80 backdrop-blur-sm hover:bg-status-error/10 text-forge-text-muted hover:text-status-error transition-colors"
          title="Delete template"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
          </svg>
        </button>
      </div>

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div
          className="absolute top-12 right-3 z-20 flex items-center gap-1 p-2 rounded-lg border border-status-error/30 bg-forge-bg-secondary shadow-xl animate-scale-in"
          onClick={(e) => e.stopPropagation()}
        >
          <span className="text-[10px] text-status-error font-medium mr-1">Delete?</span>
          <button
            type="button"
            onClick={handleDeleteConfirm}
            className="px-2 py-1 rounded bg-status-error text-white text-[10px] font-semibold hover:bg-red-600 transition-colors"
          >
            Yes
          </button>
          <button
            type="button"
            onClick={handleDeleteCancel}
            className="px-2 py-1 rounded bg-forge-bg-tertiary text-forge-text-muted text-[10px] font-semibold hover:text-forge-text-secondary transition-colors"
          >
            No
          </button>
        </div>
      )}
    </button>
  );
};

export default React.memo(TemplateCard);
