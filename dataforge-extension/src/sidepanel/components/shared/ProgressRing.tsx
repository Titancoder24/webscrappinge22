import React, { type ReactNode, useMemo, useId } from 'react';

export interface ProgressRingProps {
  /** Progress value 0-100 */
  progress: number;
  /** Outer diameter in pixels */
  size?: number;
  /** Ring stroke width in pixels */
  strokeWidth?: number;
  /** Content rendered at the center (number, icon, etc.) */
  children?: ReactNode;
  /** Additional classes on the root element */
  className?: string;
}

/**
 * ProgressRing - SVG circular progress indicator with emerald-to-teal gradient stroke.
 *
 * Features:
 *  - Smooth animated stroke-dashoffset transition
 *  - Gradient stroke from emerald (#10B981) to teal (#14B8A6)
 *  - Glow drop-shadow on the progress arc
 *  - Center slot for custom content (number, icon)
 *  - Respects prefers-reduced-motion
 */
const ProgressRing: React.FC<ProgressRingProps> = ({
  progress,
  size = 64,
  strokeWidth = 4,
  children,
  className = '',
}) => {
  const gradientId = useId();
  const glowFilterId = useId();

  const clamped = Math.min(100, Math.max(0, progress));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (clamped / 100) * circumference;

  const center = size / 2;

  // Memoize circle styles to avoid recalc
  const progressStyle = useMemo(
    () => ({
      strokeDasharray: `${circumference} ${circumference}`,
      strokeDashoffset: dashOffset,
      transition: 'stroke-dashoffset 0.6s ease-out',
    }),
    [circumference, dashOffset],
  );

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
      role="progressbar"
      aria-valuenow={Math.round(clamped)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`Progress: ${Math.round(clamped)}%`}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="rotate-[-90deg]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#14B8A6" />
          </linearGradient>
          <filter id={glowFilterId}>
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Track ring */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-forge-border/40"
        />

        {/* Progress arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          filter={`url(#${glowFilterId})`}
          style={progressStyle}
          className="motion-reduce:[transition:none]"
        />
      </svg>

      {/* Center content */}
      {children && (
        <div className="absolute inset-0 flex items-center justify-center">
          {children}
        </div>
      )}
    </div>
  );
};

export default ProgressRing;
