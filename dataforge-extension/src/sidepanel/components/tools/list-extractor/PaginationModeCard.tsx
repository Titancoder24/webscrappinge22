import React, { useCallback } from 'react';
import type { PaginationMode, PaginationConfig } from '../../../../types/extraction';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface PaginationModeCardProps {
  /** The pagination mode */
  mode: PaginationMode;
  /** Config for this mode (may include confidence) */
  config?: PaginationConfig;
  /** Whether this is the recommended mode */
  isRecommended: boolean;
  /** Whether this mode is currently selected */
  isSelected: boolean;
  /** Click handler */
  onClick: (mode: PaginationMode) => void;
}

// ---------------------------------------------------------------------------
// Mode metadata
// ---------------------------------------------------------------------------

interface ModeInfo {
  icon: string;
  name: string;
  description: string;
}

const MODE_INFO: Record<PaginationMode, ModeInfo> = {
  'auto-scroll': {
    icon: '\u21F5',  // up-down arrow
    name: 'Auto-Scroll',
    description: 'Scroll down to load more content automatically',
  },
  'click-next': {
    icon: '\u27A1\uFE0F',  // right arrow
    name: 'Click Next',
    description: 'Click "Next" button to navigate between pages',
  },
  'url-pattern': {
    icon: '\uD83D\uDD17',  // link
    name: 'URL Pattern',
    description: 'Iterate through sequential page URLs',
  },
  'load-more': {
    icon: '\u2795',  // plus
    name: 'Load More',
    description: 'Click "Load More" button to append content',
  },
  'api-intercept': {
    icon: '\u26A1',  // lightning
    name: 'API Intercept',
    description: 'Intercept API requests for data pagination',
  },
  'manual-urls': {
    icon: '\uD83D\uDCCB',  // clipboard
    name: 'Manual URLs',
    description: 'Provide a list of URLs to scrape',
  },
};

// ---------------------------------------------------------------------------
// Confidence indicator
// ---------------------------------------------------------------------------

const ConfidenceMeter: React.FC<{ value: number }> = ({ value }) => {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1 rounded-full bg-forge-border overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background:
              pct >= 70
                ? 'linear-gradient(90deg, #10B981, #14B8A6)'
                : pct >= 40
                  ? '#F59E0B'
                  : '#EF4444',
          }}
        />
      </div>
      <span className="text-[10px] tabular-nums font-medium text-forge-text-muted w-7 text-right">
        {pct}%
      </span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const PaginationModeCard: React.FC<PaginationModeCardProps> = ({
  mode,
  config,
  isRecommended,
  isSelected,
  onClick,
}) => {
  const info = MODE_INFO[mode];
  const confidence = config?.confidence ?? 0;

  const handleClick = useCallback(() => {
    onClick(mode);
  }, [mode, onClick]);

  return (
    <button
      type="button"
      onClick={handleClick}
      className={[
        'relative w-full text-left flex items-start gap-3 p-3 rounded-lg border transition-all duration-200',
        'hover:bg-accent-primary/5 active:scale-[0.99]',
        isSelected
          ? 'border-accent-primary bg-accent-primary/5'
          : 'border-forge-border bg-forge-bg-secondary hover:border-accent-primary/30',
      ].join(' ')}
      style={
        isSelected
          ? {
              boxShadow:
                '0 0 16px rgba(16, 185, 129, 0.15), inset 0 0 0 1px rgba(16, 185, 129, 0.1)',
            }
          : undefined
      }
      aria-pressed={isSelected}
    >
      {/* Recommended badge */}
      {isRecommended && (
        <div
          className="absolute -top-2 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white"
          style={{
            background: 'linear-gradient(135deg, #10B981, #14B8A6)',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
          }}
        >
          Recommended
        </div>
      )}

      {/* Icon */}
      <div
        className={[
          'flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-lg',
          isSelected ? 'bg-accent-primary/15' : 'bg-forge-bg-tertiary',
        ].join(' ')}
      >
        {info.icon}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-forge-text">{info.name}</span>
          {isSelected && (
            <div className="w-4 h-4 rounded-full bg-accent-primary flex items-center justify-center flex-shrink-0">
              <svg
                width="10"
                height="10"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
          )}
        </div>
        <span className="text-[10px] text-forge-text-muted leading-snug">
          {info.description}
        </span>
        {confidence > 0 && (
          <div className="mt-0.5">
            <ConfidenceMeter value={confidence} />
          </div>
        )}
      </div>
    </button>
  );
};

export default React.memo(PaginationModeCard);
