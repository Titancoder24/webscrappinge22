import React, { useEffect, useRef, useState, useMemo } from 'react';

export interface AnimatedCounterProps {
  /** The target numeric value */
  value: number;
  /** Animation duration in ms */
  duration?: number;
  /** Optional formatter. Default: toLocaleString() */
  format?: (n: number) => string;
  /** Additional classes on the container */
  className?: string;
}

/**
 * Single digit column that rolls vertically to reveal the correct digit.
 */
const DigitColumn: React.FC<{
  digit: string;
  duration: number;
  index: number;
}> = ({ digit, duration, index }) => {
  const isNumeric = /\d/.test(digit);

  if (!isNumeric) {
    // Static separator character (comma, period, etc.)
    return (
      <span className="inline-block text-forge-text-secondary" aria-hidden="true">
        {digit}
      </span>
    );
  }

  const digitNum = parseInt(digit, 10);
  // Stagger per digit position for a cascade effect
  const stagger = index * 40;

  return (
    <span
      className="relative inline-block overflow-hidden"
      style={{ width: '0.65em', height: '1.2em' }}
      aria-hidden="true"
    >
      <span
        className="absolute left-0 flex flex-col items-center motion-reduce:[transition:none]"
        style={{
          transition: `transform ${duration}ms cubic-bezier(0.22, 1, 0.36, 1) ${stagger}ms`,
          transform: `translateY(${-digitNum * 1.2}em)`,
          width: '100%',
        }}
      >
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => (
          <span
            key={d}
            className="flex items-center justify-center"
            style={{ height: '1.2em', lineHeight: '1.2em' }}
          >
            {d}
          </span>
        ))}
      </span>
    </span>
  );
};

/**
 * AnimatedCounter - Odometer-style number display.
 *
 * Each digit rolls up independently with a spring-like cubic-bezier curve.
 * Supports custom formatting (commas, decimals, etc.).
 * Respects prefers-reduced-motion (shows instant change).
 */
const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  duration = 400,
  format,
  className = '',
}) => {
  const [displayValue, setDisplayValue] = useState(value);
  const prevValueRef = useRef(value);
  const reducedMotion = useRef(false);

  // Check reduced motion preference once
  useEffect(() => {
    reducedMotion.current = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  // Update displayed value (instant for reduced motion)
  useEffect(() => {
    if (reducedMotion.current) {
      setDisplayValue(value);
    } else {
      // Small delay so the digit columns animate from old -> new
      setDisplayValue(value);
    }
    prevValueRef.current = value;
  }, [value]);

  const formatted = useMemo(() => {
    const fn = format ?? ((n: number) => n.toLocaleString());
    return fn(displayValue);
  }, [displayValue, format]);

  const chars = formatted.split('');

  return (
    <span
      className={`inline-flex items-center font-mono font-bold tabular-nums text-forge-text ${className}`}
      aria-live="polite"
      aria-atomic="true"
    >
      {/* Accessible text (hidden visually, read by screen readers) */}
      <span className="sr-only">{formatted}</span>

      {/* Visual rolling digits */}
      {chars.map((char, i) => (
        <DigitColumn
          key={`${chars.length}-${i}`}
          digit={char}
          duration={duration}
          index={i}
        />
      ))}
    </span>
  );
};

export default AnimatedCounter;
