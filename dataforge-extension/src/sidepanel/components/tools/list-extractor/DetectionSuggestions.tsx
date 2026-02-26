import React, { useCallback } from 'react';
import type { DetectedPattern, PatternCategory } from '../../../../types/extraction';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface DetectionSuggestionsProps {
  /** Detected patterns from PatternSense */
  patterns: DetectedPattern[];
  /** Currently selected pattern ID */
  selectedPatternId: string | null;
  /** Callback when a pattern card is clicked */
  onSelectPattern: (id: string) => void;
  /** Whether page is being scanned */
  isScanning: boolean;
  /** Extra className */
  className?: string;
}

// ---------------------------------------------------------------------------
// Category icon map
// ---------------------------------------------------------------------------

const CATEGORY_ICONS: Record<PatternCategory, string> = {
  product: '\uD83D\uDED2',    // shopping cart
  review: '\u2B50',            // star
  listing: '\uD83D\uDCCB',    // clipboard
  article: '\uD83D\uDCF0',    // newspaper
  'table-row': '\uD83D\uDCCA', // chart
  card: '\uD83C\uDFB4',       // playing card
  'feed-item': '\uD83D\uDCE1', // satellite
  generic: '\uD83D\uDD0D',    // magnifier
};

const CATEGORY_LABELS: Record<PatternCategory, string> = {
  product: 'Product Listing',
  review: 'Review Items',
  listing: 'Listing Items',
  article: 'Article Items',
  'table-row': 'Table Rows',
  card: 'Card Elements',
  'feed-item': 'Feed Items',
  generic: 'Repeating Pattern',
};

// ---------------------------------------------------------------------------
// Confidence bar
// ---------------------------------------------------------------------------

const ConfidenceBar: React.FC<{ value: number }> = ({ value }) => {
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-1.5">
      <div className="flex-1 h-1.5 rounded-full bg-forge-border overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            background: pct >= 70
              ? 'linear-gradient(90deg, #10B981, #14B8A6)'
              : pct >= 40
                ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
                : '#EF4444',
          }}
        />
      </div>
      <span className="text-[10px] tabular-nums font-semibold text-forge-text-muted w-8 text-right">
        {pct}%
      </span>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Pattern card
// ---------------------------------------------------------------------------

interface PatternCardProps {
  pattern: DetectedPattern;
  isSelected: boolean;
  isTopSuggestion: boolean;
  onSelect: (id: string) => void;
}

const PatternCard: React.FC<PatternCardProps> = ({
  pattern,
  isSelected,
  isTopSuggestion,
  onSelect,
}) => {
  const icon = CATEGORY_ICONS[pattern.category] ?? CATEGORY_ICONS.generic;
  const label = CATEGORY_LABELS[pattern.category] ?? 'Pattern';

  const handleClick = useCallback(() => {
    onSelect(pattern.id);
  }, [pattern.id, onSelect]);

  // Build sample data preview
  const samplePreview = pattern.sampleElements.slice(0, 2).join(' | ');

  return (
    <button
      type="button"
      onClick={handleClick}
      className={[
        'relative w-full text-left flex flex-col gap-2 p-3 rounded-lg border transition-all duration-200',
        'hover:bg-accent-primary/5 active:scale-[0.99]',
        isSelected
          ? 'border-accent-primary bg-accent-primary/5'
          : 'border-forge-border bg-forge-bg-secondary hover:border-accent-primary/30',
      ].join(' ')}
      style={
        isSelected
          ? { boxShadow: '0 0 12px rgba(16, 185, 129, 0.15), inset 0 0 0 1px rgba(16, 185, 129, 0.1)' }
          : undefined
      }
      aria-pressed={isSelected}
    >
      {/* Quick Extract badge */}
      {isTopSuggestion && (
        <div
          className="absolute -top-2 right-3 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white animate-float-badge"
          style={{
            background: 'linear-gradient(135deg, #10B981, #14B8A6)',
            boxShadow: '0 2px 8px rgba(16, 185, 129, 0.3)',
          }}
        >
          Quick Extract
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center gap-2">
        <span className="text-lg flex-shrink-0">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-forge-text truncate">
              {label}
            </span>
            <span
              className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold tabular-nums"
              style={{
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#10B981',
              }}
            >
              {pattern.itemCount} items
            </span>
          </div>
          {/* Confidence bar */}
          <div className="mt-1">
            <ConfidenceBar value={pattern.confidence} />
          </div>
        </div>

        {/* Selected indicator */}
        {isSelected && (
          <div className="flex-shrink-0 w-5 h-5 rounded-full bg-accent-primary flex items-center justify-center">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
        )}
      </div>

      {/* Sample data preview */}
      {samplePreview && (
        <div className="text-[10px] text-forge-text-muted font-mono truncate pl-7 -mt-0.5">
          {samplePreview}
        </div>
      )}
    </button>
  );
};

// ---------------------------------------------------------------------------
// Scanning skeleton
// ---------------------------------------------------------------------------

const ScanSkeleton: React.FC = () => (
  <div className="flex flex-col gap-2">
    {[0, 1, 2].map((i) => (
      <div
        key={i}
        className="flex items-center gap-3 p-3 rounded-lg border border-forge-border bg-forge-bg-secondary animate-pulse"
      >
        <div className="w-8 h-8 rounded-lg bg-forge-bg-tertiary" />
        <div className="flex-1 flex flex-col gap-1.5">
          <div className="h-3 w-24 rounded bg-forge-bg-tertiary" />
          <div className="h-1.5 w-full rounded-full bg-forge-bg-tertiary" />
        </div>
      </div>
    ))}
    <div className="flex items-center justify-center gap-2 py-2">
      <div className="w-4 h-4 rounded-full border-2 border-accent-primary border-t-transparent animate-spin" />
      <span className="text-xs text-forge-text-muted">Analyzing page structure...</span>
    </div>
  </div>
);

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DetectionSuggestions: React.FC<DetectionSuggestionsProps> = ({
  patterns,
  selectedPatternId,
  onSelectPattern,
  isScanning,
  className = '',
}) => {
  // Sort by confidence descending
  const sortedPatterns = [...patterns].sort((a, b) => b.confidence - a.confidence);

  if (isScanning) {
    return (
      <div className={className}>
        <ScanSkeleton />
      </div>
    );
  }

  if (patterns.length === 0) {
    return (
      <div className={`flex flex-col items-center gap-2 py-6 ${className}`}>
        <div className="w-10 h-10 rounded-full bg-forge-bg-tertiary flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-forge-text-muted" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </div>
        <p className="text-xs text-forge-text-muted text-center">
          No patterns detected yet.<br />
          Activate selection mode to scan the page.
        </p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-forge-text-muted">
          Detected Patterns
        </span>
        <span className="text-[10px] text-forge-text-muted tabular-nums">
          {patterns.length} found
        </span>
      </div>

      {sortedPatterns.map((pattern, idx) => (
        <PatternCard
          key={pattern.id}
          pattern={pattern}
          isSelected={pattern.id === selectedPatternId}
          isTopSuggestion={idx === 0}
          onSelect={onSelectPattern}
        />
      ))}
    </div>
  );
};

export default React.memo(DetectionSuggestions);
