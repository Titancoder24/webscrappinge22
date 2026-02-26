import React, { useEffect, useRef, useState, useMemo } from 'react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface LiveCounterProps {
  /** The current count value */
  value: number;
  /** Label displayed below the number */
  label?: string;
  /** Extra className on the wrapper */
  className?: string;
}

// ---------------------------------------------------------------------------
// Single digit roller
// ---------------------------------------------------------------------------

const MILESTONES = new Set([100, 250, 500, 1000, 2500, 5000, 10000]);

interface DigitRollerProps {
  digit: string;
}

const DigitRoller: React.FC<DigitRollerProps> = ({ digit }) => {
  const [prev, setPrev] = useState(digit);
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    if (digit !== prev) {
      setRolling(true);
      const timer = setTimeout(() => {
        setPrev(digit);
        setRolling(false);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [digit, prev]);

  // If it's a separator (comma), just render it statically
  if (digit === ',') {
    return (
      <span className="inline-block w-[0.35em] text-center text-forge-text-muted">,</span>
    );
  }

  return (
    <span className="relative inline-block w-[0.65em] h-[1.2em] overflow-hidden">
      {/* Outgoing digit */}
      <span
        className={[
          'absolute inset-0 flex items-center justify-center transition-transform duration-350 ease-out',
          rolling ? '-translate-y-full opacity-0' : 'translate-y-0 opacity-100',
        ].join(' ')}
        style={{ transitionDuration: '350ms' }}
        aria-hidden={rolling}
      >
        {prev}
      </span>
      {/* Incoming digit */}
      {rolling && (
        <span
          className="absolute inset-0 flex items-center justify-center animate-counter-roll"
          aria-hidden={!rolling}
        >
          {digit}
        </span>
      )}
    </span>
  );
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const LiveCounter: React.FC<LiveCounterProps> = ({
  value,
  label = 'items extracted',
  className = '',
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const prevValueRef = useRef(value);
  const [pulse, setPulse] = useState(false);

  // Format number with commas
  const formatted = useMemo(() => {
    return value.toLocaleString('en-US');
  }, [value]);

  // Milestone pulse
  useEffect(() => {
    if (MILESTONES.has(value) && value !== prevValueRef.current) {
      setPulse(true);
      const timer = setTimeout(() => setPulse(false), 600);
      prevValueRef.current = value;
      return () => clearTimeout(timer);
    }
    prevValueRef.current = value;
  }, [value]);

  const digits = formatted.split('');

  return (
    <div
      ref={wrapperRef}
      className={`flex flex-col items-center gap-1 select-none ${className}`}
    >
      <div
        className={[
          'flex items-center text-3xl font-bold tabular-nums text-forge-text transition-transform duration-300',
          pulse ? 'scale-110' : 'scale-100',
        ].join(' ')}
        style={{ textShadow: '0 0 16px rgba(16, 185, 129, 0.4)' }}
        aria-live="polite"
        aria-label={`${value} ${label}`}
      >
        {digits.map((d, i) => (
          <DigitRoller key={`${i}-${digits.length}`} digit={d} />
        ))}
      </div>

      {/* Shockwave ring on milestone */}
      {pulse && (
        <div
          className="absolute w-16 h-16 rounded-full border-2 border-accent-primary/40 animate-shockwave pointer-events-none"
          aria-hidden="true"
        />
      )}

      <span className="text-xs font-medium text-forge-text-muted uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
};

export default React.memo(LiveCounter);
