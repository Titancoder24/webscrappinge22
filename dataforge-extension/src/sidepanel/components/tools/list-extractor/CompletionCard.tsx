import React, { useEffect, useState, useCallback, useId, useMemo } from 'react';
import type { ExtractionSummary } from '../../../../types/extraction';
import { formatDuration, formatFileSize, formatNumber } from '../../../../utils/format';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CompletionCardProps {
  /** Final extraction summary */
  summary: ExtractionSummary;
  /** Navigate to data table view */
  onOpenDataTable: () => void;
  /** Trigger export flow */
  onExport: () => void;
  /** Reset and start a new extraction */
  onNewExtraction: () => void;
  /** Extra className */
  className?: string;
}

// ---------------------------------------------------------------------------
// Confetti particle
// ---------------------------------------------------------------------------

interface Particle {
  id: number;
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  delay: number;
}

const CONFETTI_COLORS = ['#10B981', '#14B8A6', '#34D399', '#6EE7B7', '#A7F3D0'];

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: 40 + Math.random() * 20, // percentage around center
    y: 30 + Math.random() * 10,
    rotation: Math.random() * 360,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 4 + Math.random() * 4,
    delay: Math.random() * 0.3,
  }));
}

// ---------------------------------------------------------------------------
// Checkmark path-drawing SVG
// ---------------------------------------------------------------------------

const AnimatedCheckmark: React.FC<{ size?: number }> = ({ size = 64 }) => {
  const filterId = useId();

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      className="mx-auto"
      aria-hidden="true"
    >
      <defs>
        <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Background circle */}
      <circle
        cx="32"
        cy="32"
        r="28"
        fill="rgba(16, 185, 129, 0.1)"
        stroke="#10B981"
        strokeWidth="2"
        strokeDasharray="176"
        strokeDashoffset="176"
        className="animate-[drawCircle_0.6s_ease-out_forwards]"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="176"
          to="0"
          dur="0.6s"
          fill="freeze"
          calcMode="spline"
          keySplines="0.65 0 0.35 1"
          keyTimes="0;1"
        />
      </circle>

      {/* Checkmark path */}
      <path
        d="M20 33 L28 41 L44 25"
        stroke="#10B981"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        filter={`url(#${filterId})`}
        strokeDasharray="40"
        strokeDashoffset="40"
      >
        <animate
          attributeName="stroke-dashoffset"
          from="40"
          to="0"
          dur="0.4s"
          begin="0.4s"
          fill="freeze"
          calcMode="spline"
          keySplines="0.65 0 0.35 1"
          keyTimes="0;1"
        />
      </path>
    </svg>
  );
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CompletionCard: React.FC<CompletionCardProps> = ({
  summary,
  onOpenDataTable,
  onExport,
  onNewExtraction,
  className = '',
}) => {
  const [showConfetti, setShowConfetti] = useState(true);
  const particles = useMemo(() => generateParticles(16), []);

  // Dismiss confetti after animation
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const stats = useMemo(
    () => [
      { label: 'Total Items', value: formatNumber(summary.totalItems) },
      { label: 'Total Time', value: formatDuration(summary.totalTime / 1000) },
      { label: 'Data Size', value: formatFileSize(summary.dataSize) },
    ],
    [summary],
  );

  return (
    <div
      className={`relative flex flex-col items-center gap-5 p-6 rounded-xl bg-forge-bg-secondary border border-forge-border overflow-hidden ${className}`}
    >
      {/* Confetti burst */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          {particles.map((p) => (
            <div
              key={p.id}
              className="absolute rounded-sm animate-confetti"
              style={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                width: p.size,
                height: p.size,
                backgroundColor: p.color,
                animationDelay: `${p.delay}s`,
                transform: `rotate(${p.rotation}deg)`,
              }}
            />
          ))}
        </div>
      )}

      {/* Animated checkmark */}
      <AnimatedCheckmark size={64} />

      {/* Title */}
      <div className="text-center">
        <h3
          className="text-lg font-bold text-forge-text"
          style={{ textShadow: '0 0 12px rgba(16, 185, 129, 0.4)' }}
        >
          Extraction Complete
        </h3>
        <p className="text-sm text-forge-text-muted mt-1">
          All data has been extracted successfully
        </p>
      </div>

      {/* Stats row */}
      <div className="flex items-center justify-center gap-4 w-full">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-lg bg-forge-bg-tertiary/50"
          >
            <span
              className="text-base font-bold tabular-nums text-accent-primary"
              style={{ textShadow: '0 0 8px rgba(16, 185, 129, 0.3)' }}
            >
              {stat.value}
            </span>
            <span className="text-[10px] font-medium text-forge-text-muted uppercase tracking-wider">
              {stat.label}
            </span>
          </div>
        ))}
      </div>

      {/* Error count if any */}
      {summary.errors > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-status-warning">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          {summary.errors} error{summary.errors !== 1 ? 's' : ''} encountered
        </div>
      )}

      {/* CTA buttons */}
      <div className="flex flex-col gap-2 w-full mt-1">
        {/* Primary CTA */}
        <button
          type="button"
          onClick={onOpenDataTable}
          className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-semibold text-white transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
          style={{
            background: 'linear-gradient(135deg, #10B981, #14B8A6)',
            boxShadow: '0 0 16px rgba(16, 185, 129, 0.3), 0 2px 8px rgba(0, 0, 0, 0.2)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="3" y1="9" x2="21" y2="9" />
            <line x1="3" y1="15" x2="21" y2="15" />
            <line x1="9" y1="3" x2="9" y2="21" />
          </svg>
          Open Data Table
        </button>

        <div className="flex gap-2">
          {/* Export */}
          <button
            type="button"
            onClick={onExport}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-accent-primary border border-forge-border hover:border-accent-primary/50 hover:bg-accent-primary/5 transition-all duration-200 active:scale-[0.98]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Export
          </button>

          {/* New Extraction */}
          <button
            type="button"
            onClick={onNewExtraction}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-semibold text-forge-text-secondary hover:text-forge-text hover:bg-forge-bg-tertiary/60 transition-all duration-200 active:scale-[0.98]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="1 4 1 10 7 10" />
              <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
            </svg>
            New Extraction
          </button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(CompletionCard);
