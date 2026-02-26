import React, { useMemo } from 'react';
import Button from '../../shared/Button';
import type { DownloadState } from './ImageDownloaderView';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface DownloadProgressProps {
  state: DownloadState;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DownloadProgress: React.FC<DownloadProgressProps> = ({ state }) => {
  const {
    isDownloading,
    mode,
    completed,
    total,
    currentFile,
    errors,
    zipReady,
    zipUrl,
  } = state;

  const percentage = useMemo(
    () => (total > 0 ? Math.round((completed / total) * 100) : 0),
    [completed, total],
  );

  const isComplete = !isDownloading && completed === total && total > 0;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-forge-border bg-forge-bg-secondary/40 p-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-forge-text-secondary flex items-center gap-2">
          {isDownloading ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-primary animate-spin" aria-hidden="true">
                <circle cx="12" cy="12" r="10" className="opacity-25" />
                <path d="M12 2a10 10 0 0 1 10 10" className="opacity-75" />
              </svg>
              {mode === 'zip' ? 'Creating ZIP...' : 'Downloading...'}
            </>
          ) : isComplete ? (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="text-status-success" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              {mode === 'zip' ? 'ZIP Ready' : 'Download Complete'}
            </>
          ) : (
            'Download'
          )}
        </h3>

        <span className="text-[11px] font-mono text-forge-text-muted">
          {completed}/{total}
        </span>
      </div>

      {/* Overall progress bar */}
      <div className="relative h-2 rounded-full bg-forge-bg-tertiary overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            background: errors.length > 0
              ? 'linear-gradient(90deg, #10B981, #F59E0B)'
              : 'linear-gradient(90deg, #10B981, #14B8A6)',
            boxShadow: isComplete
              ? '0 0 12px rgba(16, 185, 129, 0.5)'
              : '0 0 8px rgba(16, 185, 129, 0.3)',
          }}
        />
        {isDownloading && (
          <div
            className="absolute inset-y-0 w-16 animate-scanner"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(16, 185, 129, 0.3), transparent)',
            }}
          />
        )}
      </div>

      {/* Percentage */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-mono font-bold text-accent-primary">
          {percentage}%
        </span>
        {isDownloading && currentFile && (
          <span className="text-forge-text-muted truncate max-w-[180px] font-mono text-[10px]">
            {currentFile}
          </span>
        )}
      </div>

      {/* ZIP creation progress (extra indicator for ZIP mode) */}
      {mode === 'zip' && isDownloading && completed === total && (
        <div className="flex items-center gap-2 text-xs text-forge-text-secondary animate-pulse">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-accent-primary" aria-hidden="true">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Compressing files into ZIP archive...
        </div>
      )}

      {/* ZIP download button */}
      {zipReady && zipUrl && (
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            const a = document.createElement('a');
            a.href = zipUrl;
            a.download = `dataforge-images-${Date.now()}.zip`;
            a.click();
          }}
          iconLeft={
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          }
        >
          Save ZIP
        </Button>
      )}

      {/* Errors */}
      {errors.length > 0 && (
        <div className="flex flex-col gap-1 mt-1">
          <p className="text-[10px] font-semibold text-status-error">
            {errors.length} error{errors.length !== 1 ? 's' : ''}:
          </p>
          <div className="max-h-24 overflow-y-auto scrollbar-thin scrollbar-thumb-forge-border scrollbar-track-transparent">
            {errors.map((err, i) => (
              <p key={i} className="text-[10px] text-status-error/70 font-mono truncate">
                {err}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(DownloadProgress);
