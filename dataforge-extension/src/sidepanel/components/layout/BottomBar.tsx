import React, { useCallback, useMemo } from 'react';

export interface BottomBarProps {
  /** Total items extracted so far */
  itemsCount: number;
  /** Elapsed time in seconds */
  elapsedTime: number;
  /** Overall progress 0-100 */
  progress: number;
  /** Whether extraction is currently paused */
  isPaused: boolean;
  /** Pause extraction */
  onPause?: () => void;
  /** Resume extraction */
  onResume?: () => void;
  /** Stop extraction entirely */
  onStop?: () => void;
  /** Navigate to data view */
  onViewData?: () => void;
}

/**
 * Formats seconds into mm:ss display.
 */
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

/**
 * BottomBar - 56px contextual footer shown during active extraction.
 * Displays a mini progress bar, items count, elapsed time, and Pause/Stop/View Data controls.
 */
const BottomBar: React.FC<BottomBarProps> = ({
  itemsCount,
  elapsedTime,
  progress,
  isPaused,
  onPause,
  onResume,
  onStop,
  onViewData,
}) => {
  const handlePauseResume = useCallback(() => {
    if (isPaused) {
      onResume?.();
    } else {
      onPause?.();
    }
  }, [isPaused, onPause, onResume]);

  const handleStop = useCallback(() => {
    onStop?.();
  }, [onStop]);

  const handleViewData = useCallback(() => {
    onViewData?.();
  }, [onViewData]);

  const timeDisplay = useMemo(() => formatTime(elapsedTime), [elapsedTime]);
  const clampedProgress = Math.min(100, Math.max(0, progress));

  return (
    <footer
      className="relative flex items-center h-14 px-3 bg-forge-bg/90 backdrop-blur-md border-t border-forge-border shrink-0 select-none animate-slide-in-up motion-reduce:animate-none"
      role="status"
      aria-label="Extraction progress"
    >
      {/* Mini progress bar — full width along top edge */}
      <div
        className="absolute top-0 left-0 right-0 h-0.5 bg-forge-border/40"
        aria-hidden="true"
      >
        <div
          className="h-full rounded-r-full transition-[width] duration-300 ease-out motion-reduce:transition-none"
          style={{
            width: `${clampedProgress}%`,
            background: 'linear-gradient(90deg, rgb(var(--accent-primary)), rgb(var(--accent-secondary)))',
            boxShadow: '0 0 8px var(--accent-glow)',
          }}
        />
      </div>

      {/* Stats section */}
      <div className="flex items-center gap-3 mr-auto min-w-0">
        {/* Items count */}
        <div className="flex items-center gap-1.5 text-xs">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent-primary shrink-0"
            aria-hidden="true"
          >
            <rect x="3" y="3" width="7" height="7" />
            <rect x="14" y="3" width="7" height="7" />
            <rect x="3" y="14" width="7" height="7" />
            <rect x="14" y="14" width="7" height="7" />
          </svg>
          <span className="text-forge-text font-semibold tabular-nums">
            {itemsCount.toLocaleString()}
          </span>
          <span className="text-forge-text-muted">items</span>
        </div>

        {/* Elapsed time */}
        <div className="flex items-center gap-1.5 text-xs">
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-accent-secondary shrink-0"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <span className="text-forge-text font-mono font-medium tabular-nums">
            {timeDisplay}
          </span>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1.5">
        {/* Pause / Resume */}
        <button
          type="button"
          onClick={handlePauseResume}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-forge-text-secondary hover:text-forge-text hover:bg-forge-bg-tertiary/60 transition-all duration-150 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
          aria-label={isPaused ? 'Resume extraction' : 'Pause extraction'}
          title={isPaused ? 'Resume' : 'Pause'}
        >
          {isPaused ? (
            /* Play icon */
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
          ) : (
            /* Pause icon */
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <rect x="6" y="4" width="4" height="16" rx="1" />
              <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
          )}
        </button>

        {/* Stop */}
        <button
          type="button"
          onClick={handleStop}
          className="flex items-center justify-center w-8 h-8 rounded-lg text-forge-text-secondary hover:text-status-error hover:bg-status-error/10 transition-all duration-150 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
          aria-label="Stop extraction"
          title="Stop"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="currentColor"
            aria-hidden="true"
          >
            <rect x="5" y="5" width="14" height="14" rx="2" />
          </svg>
        </button>

        {/* View Data */}
        <button
          type="button"
          onClick={handleViewData}
          className="flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-semibold transition-all duration-150 active:scale-95 motion-reduce:transition-none motion-reduce:active:scale-100"
          style={{
            background: 'linear-gradient(135deg, rgb(var(--accent-primary)), rgb(var(--accent-secondary)))',
            color: 'rgb(var(--forge-bg))',
            boxShadow: '0 0 12px var(--accent-glow)',
          }}
          aria-label="View extracted data"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          View Data
        </button>
      </div>
    </footer>
  );
};

export default BottomBar;
