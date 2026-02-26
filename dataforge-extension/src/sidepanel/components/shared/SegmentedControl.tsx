import React, {
  useRef,
  useLayoutEffect,
  useState,
  useCallback,
  useId,
} from 'react';

export interface SegmentOption<T extends string = string> {
  /** Unique value for this segment */
  value: T;
  /** Display label */
  label: string;
  /** Optional icon element */
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string = string> {
  /** Array of segment options */
  options: SegmentOption<T>[];
  /** Currently selected value */
  value: T;
  /** Called when user selects a new segment */
  onChange: (value: T) => void;
  /** Additional classes on the root container */
  className?: string;
}

/**
 * SegmentedControl - Tab-like segmented control with a smooth sliding
 * emerald indicator background behind the active segment.
 *
 * Features:
 *  - Sliding indicator tracks active segment position/width
 *  - Emerald bg on active segment
 *  - Smooth 200ms ease-out transition
 *  - Respects prefers-reduced-motion
 *  - Keyboard accessible with tablist role
 */
function SegmentedControl<T extends string = string>({
  options,
  value,
  onChange,
  className = '',
}: SegmentedControlProps<T>) {
  const groupId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<Map<T, HTMLButtonElement>>(new Map());
  const [indicator, setIndicator] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  const updateIndicator = useCallback(() => {
    const activeEl = itemRefs.current.get(value);
    const container = containerRef.current;
    if (activeEl && container) {
      const cRect = container.getBoundingClientRect();
      const aRect = activeEl.getBoundingClientRect();
      setIndicator({
        left: aRect.left - cRect.left,
        width: aRect.width,
      });
    }
  }, [value]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  useLayoutEffect(() => {
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [updateIndicator]);

  const setRef = useCallback(
    (key: T) => (el: HTMLButtonElement | null) => {
      if (el) {
        itemRefs.current.set(key, el);
      } else {
        itemRefs.current.delete(key);
      }
    },
    [],
  );

  return (
    <div
      ref={containerRef}
      role="tablist"
      aria-label="Segmented control"
      className={[
        'relative inline-flex items-center p-1 rounded-lg',
        'bg-forge-bg-secondary border border-forge-border',
        className,
      ].join(' ')}
    >
      {/* Sliding indicator */}
      <div
        className="absolute top-1 bottom-1 rounded-md transition-all duration-200 ease-out motion-reduce:transition-none"
        style={{
          left: indicator.left,
          width: indicator.width,
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25), rgba(20, 184, 166, 0.2))',
          border: '1px solid rgba(16, 185, 129, 0.3)',
          boxShadow: '0 0 8px rgba(16, 185, 129, 0.15)',
        }}
        aria-hidden="true"
      />

      {options.map((option) => {
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            ref={setRef(option.value)}
            type="button"
            role="tab"
            id={`${groupId}-${option.value}`}
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={[
              'relative z-10 flex items-center justify-center gap-1.5 px-3 py-1.5',
              'text-xs font-semibold rounded-md',
              'transition-colors duration-150 motion-reduce:transition-none',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50',
              isActive
                ? 'text-accent-primary'
                : 'text-forge-text-muted hover:text-forge-text-secondary',
            ].join(' ')}
          >
            {option.icon && (
              <span className="flex items-center shrink-0">{option.icon}</span>
            )}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

export default SegmentedControl;
