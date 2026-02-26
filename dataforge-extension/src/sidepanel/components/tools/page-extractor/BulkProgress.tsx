import React, { useMemo, useState, useCallback } from 'react';
import type { BulkURLEntry, BulkURLStatus } from './PageExtractorView';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BulkProgressProps {
  entries: BulkURLEntry[];
  isExtracting: boolean;
}

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

const STATUS_CONFIG: Record<
  BulkURLStatus,
  { label: string; icon: React.ReactNode; color: string }
> = {
  pending: {
    label: 'Pending',
    color: 'text-forge-text-muted',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-forge-text-muted" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
  processing: {
    label: 'Processing',
    color: 'text-accent-primary',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-primary animate-spin" aria-hidden="true">
        <circle cx="12" cy="12" r="10" className="opacity-25" />
        <path d="M12 2a10 10 0 0 1 10 10" className="opacity-75" />
      </svg>
    ),
  },
  success: {
    label: 'Success',
    color: 'text-status-success',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-status-success" aria-hidden="true">
        <polyline points="20 6 9 17 4 12" />
      </svg>
    ),
  },
  partial: {
    label: 'Partial',
    color: 'text-status-warning',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-status-warning" aria-hidden="true">
        <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
    ),
  },
  failed: {
    label: 'Failed',
    color: 'text-status-error',
    icon: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-status-error" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <line x1="15" y1="9" x2="9" y2="15" />
        <line x1="9" y1="9" x2="15" y2="15" />
      </svg>
    ),
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const BulkProgress: React.FC<BulkProgressProps> = ({ entries, isExtracting }) => {
  const [expandedErrors, setExpandedErrors] = useState<Set<string>>(new Set());

  // Calculate stats
  const stats = useMemo(() => {
    const total = entries.length;
    const completed = entries.filter(
      (e) => e.status === 'success' || e.status === 'partial' || e.status === 'failed',
    ).length;
    const success = entries.filter((e) => e.status === 'success').length;
    const partial = entries.filter((e) => e.status === 'partial').length;
    const failed = entries.filter((e) => e.status === 'failed').length;
    const processing = entries.filter((e) => e.status === 'processing').length;
    const pending = entries.filter((e) => e.status === 'pending').length;
    const totalRows = entries.reduce((sum, e) => sum + e.rowCount, 0);
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return { total, completed, success, partial, failed, processing, pending, totalRows, percentage };
  }, [entries]);

  // Toggle error details
  const toggleError = useCallback((id: string) => {
    setExpandedErrors((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Extract domain for display
  const getDomain = (url: string): string => {
    try {
      return new URL(url).hostname;
    } catch {
      return url;
    }
  };

  // Get path for display
  const getPath = (url: string): string => {
    try {
      const u = new URL(url);
      return u.pathname + u.search;
    } catch {
      return url;
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* Overall progress bar */}
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-forge-text-secondary">
            {isExtracting ? 'Extracting...' : stats.completed === stats.total ? 'Complete' : 'Paused'}
          </span>
          <span className="font-mono text-forge-text-muted">
            {stats.completed}/{stats.total}
          </span>
        </div>

        {/* Progress bar */}
        <div className="relative h-2 rounded-full bg-forge-bg-tertiary overflow-hidden">
          {/* Success portion */}
          <div
            className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${stats.total > 0 ? (stats.success / stats.total) * 100 : 0}%`,
              background: 'linear-gradient(90deg, #10B981, #14B8A6)',
              boxShadow: '0 0 8px rgba(16, 185, 129, 0.4)',
            }}
          />
          {/* Partial portion */}
          <div
            className="absolute inset-y-0 rounded-full bg-status-warning transition-all duration-500 ease-out"
            style={{
              left: `${stats.total > 0 ? (stats.success / stats.total) * 100 : 0}%`,
              width: `${stats.total > 0 ? (stats.partial / stats.total) * 100 : 0}%`,
            }}
          />
          {/* Failed portion */}
          <div
            className="absolute inset-y-0 rounded-full bg-status-error transition-all duration-500 ease-out"
            style={{
              left: `${stats.total > 0 ? ((stats.success + stats.partial) / stats.total) * 100 : 0}%`,
              width: `${stats.total > 0 ? (stats.failed / stats.total) * 100 : 0}%`,
            }}
          />
          {/* Scanning animation for processing */}
          {isExtracting && stats.processing > 0 && (
            <div
              className="absolute inset-y-0 w-16 animate-scanner"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.3), transparent)',
              }}
            />
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-[10px] font-semibold">
          {stats.success > 0 && (
            <span className="text-status-success flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-status-success" />
              {stats.success} success
            </span>
          )}
          {stats.partial > 0 && (
            <span className="text-status-warning flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-status-warning" />
              {stats.partial} partial
            </span>
          )}
          {stats.failed > 0 && (
            <span className="text-status-error flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-status-error" />
              {stats.failed} failed
            </span>
          )}
          {stats.totalRows > 0 && (
            <span className="text-forge-text-muted ml-auto">
              {stats.totalRows} rows total
            </span>
          )}
        </div>
      </div>

      {/* URL list */}
      <div className="flex flex-col gap-1 max-h-64 overflow-y-auto scrollbar-thin scrollbar-thumb-forge-border scrollbar-track-transparent rounded-lg border border-forge-border bg-forge-bg-secondary/30 p-2">
        {entries.map((entry) => {
          const config = STATUS_CONFIG[entry.status];
          const hasError = entry.status === 'failed' && entry.error;
          const isExpanded = expandedErrors.has(entry.id);

          return (
            <div key={entry.id}>
              <div
                className={[
                  'flex items-center gap-2 px-2 py-1.5 rounded-md transition-colors',
                  entry.status === 'processing'
                    ? 'bg-accent-primary/5'
                    : 'hover:bg-forge-bg-tertiary/30',
                ].join(' ')}
              >
                {/* Status icon */}
                <span className="shrink-0">{config.icon}</span>

                {/* URL */}
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-mono text-forge-text-secondary truncate block">
                    {getDomain(entry.url)}
                    <span className="text-forge-text-muted">{getPath(entry.url)}</span>
                  </span>
                </div>

                {/* Row count */}
                {entry.rowCount > 0 && (
                  <span className="text-[10px] font-mono text-accent-primary shrink-0">
                    {entry.rowCount} rows
                  </span>
                )}

                {/* Processing scanner animation */}
                {entry.status === 'processing' && (
                  <div className="w-12 h-1 rounded-full bg-forge-bg-tertiary overflow-hidden shrink-0">
                    <div
                      className="h-full w-1/2 rounded-full animate-scanner"
                      style={{
                        background: 'linear-gradient(90deg, transparent, #10B981, transparent)',
                      }}
                    />
                  </div>
                )}

                {/* Expand error */}
                {hasError && (
                  <button
                    type="button"
                    onClick={() => toggleError(entry.id)}
                    className="p-0.5 rounded text-forge-text-muted hover:text-status-error transition-colors shrink-0"
                    title="Show error details"
                  >
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className={[
                        'transition-transform duration-200',
                        isExpanded ? 'rotate-180' : '',
                      ].join(' ')}
                      aria-hidden="true"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                )}
              </div>

              {/* Expanded error details */}
              {hasError && isExpanded && (
                <div className="ml-6 mr-2 mt-1 mb-2 p-2 rounded bg-status-error/5 border border-status-error/20 text-[10px] text-status-error/80 font-mono animate-scale-in">
                  {entry.error}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default React.memo(BulkProgress);
