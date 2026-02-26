import React, { useId, useMemo } from 'react';
import type { SpeedEntry } from '../../../store';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SpeedGraphProps {
  /** Speed history entries (timestamp + itemsPerSec) */
  data: SpeedEntry[];
  /** Chart width in px (default 200) */
  width?: number;
  /** Chart height in px (default 48) */
  height?: number;
  /** Extra className */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SpeedGraph: React.FC<SpeedGraphProps> = ({
  data,
  width = 200,
  height = 48,
  className = '',
}) => {
  const gradientId = useId();
  const fillGradientId = useId();

  const { linePath, areaPath } = useMemo(() => {
    if (data.length < 2) {
      return { linePath: '', areaPath: '' };
    }

    const maxSpeed = Math.max(...data.map((d) => d.itemsPerSec), 1);
    const padding = 2;
    const chartW = width - padding * 2;
    const chartH = height - padding * 2;

    const points = data.map((entry, i) => {
      const x = padding + (i / (data.length - 1)) * chartW;
      const y = padding + chartH - (entry.itemsPerSec / maxSpeed) * chartH;
      return { x, y };
    });

    // Smooth line through points using cubic bezier approximation
    let line = `M ${points[0].x},${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx = (prev.x + curr.x) / 2;
      line += ` C ${cpx},${prev.y} ${cpx},${curr.y} ${curr.x},${curr.y}`;
    }

    // Area: same path but close at bottom
    const lastPt = points[points.length - 1];
    const firstPt = points[0];
    const area = `${line} L ${lastPt.x},${height - padding} L ${firstPt.x},${height - padding} Z`;

    return { linePath: line, areaPath: area };
  }, [data, width, height]);

  // Current speed label
  const currentSpeed = data.length > 0 ? data[data.length - 1].itemsPerSec : 0;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-forge-text-muted uppercase tracking-wider">
          Speed
        </span>
        <span
          className="text-xs font-bold tabular-nums text-accent-primary"
          style={{ textShadow: '0 0 8px rgba(16, 185, 129, 0.4)' }}
        >
          {currentSpeed.toFixed(1)} items/s
        </span>
      </div>

      <svg
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          {/* Line gradient */}
          <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#10B981" />
            <stop offset="100%" stopColor="#14B8A6" />
          </linearGradient>

          {/* Fill gradient (faded) */}
          <linearGradient id={fillGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10B981" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Area fill */}
        {areaPath && (
          <path d={areaPath} fill={`url(#${fillGradientId})`} />
        )}

        {/* Line stroke */}
        {linePath && (
          <path
            d={linePath}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        )}

        {/* No data placeholder */}
        {data.length < 2 && (
          <text
            x={width / 2}
            y={height / 2}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="rgba(74, 222, 128, 0.3)"
            fontSize="10"
            fontFamily="Inter, sans-serif"
          >
            Collecting data...
          </text>
        )}
      </svg>
    </div>
  );
};

export default React.memo(SpeedGraph);
