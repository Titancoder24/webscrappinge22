import React, { useId, useMemo } from 'react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ProgressRingProps {
  /** 0-100 percentage value */
  value: number;
  /** Outer diameter in px (default 120) */
  size?: number;
  /** Stroke width in px (default 8) */
  strokeWidth?: number;
  /** Optional center content override (defaults to percentage text) */
  children?: React.ReactNode;
  /** Extra className on the wrapper */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ProgressRing: React.FC<ProgressRingProps> = ({
  value,
  size = 120,
  strokeWidth = 8,
  children,
  className = '',
}) => {
  const gradientId = useId();
  const filterId = useId();

  const clamped = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (clamped / 100) * circumference;
  const center = size / 2;

  // Rounded percentage for display
  const displayPct = useMemo(() => Math.round(clamped), [clamped]);

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="transform -rotate-90"
        aria-hidden="true"
      >
        <defs>
          {/* Emerald-to-teal gradient */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#14B8A6" />
          </linearGradient>

          {/* Glow filter */}
          <filter id={filterId} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="rgba(16, 185, 129, 0.1)"
          strokeWidth={strokeWidth}
        />

        {/* Progress arc with animated dashoffset */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          filter={`url(#${filterId})`}
          className="transition-[stroke-dashoffset] duration-500 ease-out"
        />
      </svg>

      {/* Pulsing outer glow ring */}
      <div
        className="absolute inset-0 rounded-full pointer-events-none animate-pulse-glow"
        style={{
          boxShadow:
            clamped > 0
              ? '0 0 20px rgba(16, 185, 129, 0.15), inset 0 0 20px rgba(16, 185, 129, 0.05)'
              : 'none',
        }}
      />

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children ?? (
          <span
            className="text-2xl font-bold tabular-nums text-accent-primary"
            style={{ textShadow: '0 0 12px rgba(16, 185, 129, 0.5)' }}
          >
            {displayPct}%
          </span>
        )}
      </div>
    </div>
  );
};

export default React.memo(ProgressRing);
