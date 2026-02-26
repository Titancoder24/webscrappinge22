import React, { useMemo, useId } from 'react';

export interface SparklineProps {
  /** Array of numeric data points */
  data: number[];
  /** Width of the SVG in pixels */
  width?: number;
  /** Height of the SVG in pixels */
  height?: number;
  /** Stroke color. Defaults to emerald. */
  strokeColor?: string;
  /** Stroke width */
  strokeWidth?: number;
  /** Show area fill under the line */
  showFill?: boolean;
  /** Additional classes */
  className?: string;
}

/**
 * Sparkline - Mini SVG line graph for displaying extraction speed over time.
 *
 * Features:
 *  - Smooth bezier-curved line via catmull-rom to cubic bezier conversion
 *  - Emerald stroke with optional gradient fill
 *  - Glow filter on the line
 *  - Animated line draw-in via stroke-dashoffset
 *  - Respects prefers-reduced-motion
 */
const Sparkline: React.FC<SparklineProps> = ({
  data,
  width = 120,
  height = 32,
  strokeColor = '#10B981',
  strokeWidth = 1.5,
  showFill = true,
  className = '',
}) => {
  const gradientId = useId();
  const fillGradientId = useId();
  const glowId = useId();

  // Padding inside SVG
  const px = 2;
  const py = 4;
  const chartW = width - px * 2;
  const chartH = height - py * 2;

  const { linePath, areaPath, pathLength } = useMemo(() => {
    if (data.length < 2) {
      return { linePath: '', areaPath: '', pathLength: 0 };
    }

    const minVal = Math.min(...data);
    const maxVal = Math.max(...data);
    const range = maxVal - minVal || 1;

    // Normalize data to chart coordinates
    const points = data.map((val, i) => ({
      x: px + (i / (data.length - 1)) * chartW,
      y: py + chartH - ((val - minVal) / range) * chartH,
    }));

    // Build smooth cubic bezier path using monotone interpolation
    let d = `M ${points[0].x},${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[Math.max(0, i - 1)];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[Math.min(points.length - 1, i + 2)];

      // Catmull-Rom to Cubic Bezier control points
      const tension = 0.3;
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;

      d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }

    // Area path: line path + close to bottom
    const lastPoint = points[points.length - 1];
    const firstPoint = points[0];
    const area = `${d} L ${lastPoint.x},${py + chartH} L ${firstPoint.x},${py + chartH} Z`;

    // Estimate path length for animation
    let totalLen = 0;
    for (let i = 1; i < points.length; i++) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      totalLen += Math.sqrt(dx * dx + dy * dy);
    }
    // Bezier paths are ~1.3x longer than straight-line segments
    totalLen *= 1.3;

    return { linePath: d, areaPath: area, pathLength: Math.ceil(totalLen) };
  }, [data, chartW, chartH, px, py]);

  if (data.length < 2) {
    // Not enough data to render
    return (
      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className={className}
        aria-hidden="true"
      />
    );
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      role="img"
      aria-label="Extraction speed sparkline"
    >
      <defs>
        {/* Stroke gradient */}
        <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#14B8A6" />
        </linearGradient>

        {/* Area fill gradient (top: semi-transparent, bottom: transparent) */}
        <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={strokeColor} stopOpacity="0.2" />
          <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
        </linearGradient>

        {/* Glow filter */}
        <filter id={glowId}>
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Area fill */}
      {showFill && (
        <path
          d={areaPath}
          fill={`url(#${fillGradientId})`}
          className="opacity-60"
        />
      )}

      {/* Line with glow */}
      <path
        d={linePath}
        fill="none"
        stroke={`url(#${gradientId})`}
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#${glowId})`}
        style={{
          strokeDasharray: pathLength,
          strokeDashoffset: 0,
          // Animation: line draws in from left
          animation: `sparkline-draw 0.8s ease-out`,
        }}
        className="motion-reduce:[animation:none]"
      />

      {/* Inline keyframes for the draw animation */}
      <style>
        {`
          @keyframes sparkline-draw {
            from { stroke-dashoffset: ${pathLength}; }
            to { stroke-dashoffset: 0; }
          }
        `}
      </style>

      {/* Current value dot (last point) */}
      {data.length >= 2 && (() => {
        const minVal = Math.min(...data);
        const maxVal = Math.max(...data);
        const range = maxVal - minVal || 1;
        const lastVal = data[data.length - 1];
        const dotX = px + chartW;
        const dotY = py + chartH - ((lastVal - minVal) / range) * chartH;

        return (
          <circle
            cx={dotX}
            cy={dotY}
            r={2.5}
            fill={strokeColor}
            className="drop-shadow-[0_0_3px_rgba(16,185,129,0.6)]"
          />
        );
      })()}
    </svg>
  );
};

export default Sparkline;
