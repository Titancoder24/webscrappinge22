import React, {
  type ReactNode,
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';

export type TooltipPosition = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipProps {
  /** Tooltip text */
  content: string;
  /** Preferred position (auto-adjusts if it would overflow) */
  position?: TooltipPosition;
  /** Delay before showing in ms */
  delay?: number;
  /** The trigger element */
  children: ReactNode;
  /** Additional classes on the wrapper */
  className?: string;
}

/* -------------------------------------------------------------------------- */
/*  Position calculations                                                     */
/* -------------------------------------------------------------------------- */

interface Coords {
  top: number;
  left: number;
  transformOrigin: string;
}

function computePosition(
  triggerRect: DOMRect,
  tooltipRect: DOMRect,
  preferred: TooltipPosition,
): { position: TooltipPosition; coords: Coords } {
  const gap = 6;
  const viewW = window.innerWidth;
  const viewH = window.innerHeight;

  const positions: Record<TooltipPosition, Coords> = {
    top: {
      top: triggerRect.top - tooltipRect.height - gap,
      left: triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2,
      transformOrigin: 'bottom center',
    },
    bottom: {
      top: triggerRect.bottom + gap,
      left: triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2,
      transformOrigin: 'top center',
    },
    left: {
      top: triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2,
      left: triggerRect.left - tooltipRect.width - gap,
      transformOrigin: 'right center',
    },
    right: {
      top: triggerRect.top + triggerRect.height / 2 - tooltipRect.height / 2,
      left: triggerRect.right + gap,
      transformOrigin: 'left center',
    },
  };

  // Check if preferred position fits
  const tryOrder: TooltipPosition[] = [preferred, 'top', 'bottom', 'right', 'left'];
  for (const pos of tryOrder) {
    const c = positions[pos];
    if (c.top >= 2 && c.left >= 2 && c.top + tooltipRect.height <= viewH - 2 && c.left + tooltipRect.width <= viewW - 2) {
      return { position: pos, coords: c };
    }
  }

  // Fallback: use preferred, clamped
  const coords = positions[preferred];
  coords.top = Math.max(2, Math.min(coords.top, viewH - tooltipRect.height - 2));
  coords.left = Math.max(2, Math.min(coords.left, viewW - tooltipRect.width - 2));
  return { position: preferred, coords };
}

/* -------------------------------------------------------------------------- */
/*  Tooltip                                                                   */
/* -------------------------------------------------------------------------- */

/**
 * Tooltip - Small floating tooltip that appears on hover.
 * Auto-calculates position to avoid overflow. Emerald bg. Respects reduced motion.
 */
const Tooltip: React.FC<TooltipProps> = ({
  content,
  position: preferredPosition = 'top',
  delay = 300,
  children,
  className = '',
}) => {
  const [visible, setVisible] = useState(false);
  const [coords, setCoords] = useState<Coords | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const show = useCallback(() => {
    timerRef.current = setTimeout(() => {
      setVisible(true);
    }, delay);
  }, [delay]);

  const hide = useCallback(() => {
    clearTimeout(timerRef.current);
    setVisible(false);
    setCoords(null);
  }, []);

  // Calculate position after tooltip mounts and is visible
  useEffect(() => {
    if (!visible || !triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    const { coords: computedCoords } = computePosition(triggerRect, tooltipRect, preferredPosition);
    setCoords(computedCoords);
  }, [visible, preferredPosition]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  return (
    <div
      ref={triggerRef}
      className={`relative inline-flex ${className}`}
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocus={show}
      onBlur={hide}
    >
      {children}

      {visible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className={[
            'fixed z-[100] max-w-[200px] px-2.5 py-1.5 rounded-lg',
            'text-xs font-medium text-forge-bg leading-tight',
            'bg-accent-primary shadow-[0_0_12px_rgba(16,185,129,0.3)]',
            'pointer-events-none select-none',
            // Animation
            coords
              ? 'opacity-100 scale-100'
              : 'opacity-0 scale-95',
            'transition-all duration-150 motion-reduce:transition-none',
          ].join(' ')}
          style={
            coords
              ? {
                  top: coords.top,
                  left: coords.left,
                  transformOrigin: coords.transformOrigin,
                }
              : {
                  // Offscreen for measurement
                  top: -9999,
                  left: -9999,
                  visibility: 'hidden' as const,
                }
          }
        >
          {content}
        </div>
      )}
    </div>
  );
};

export default Tooltip;
