import React, { useCallback, useId } from 'react';

export interface ToggleProps {
  /** Whether the toggle is on */
  checked: boolean;
  /** Called when toggle state changes */
  onChange: (checked: boolean) => void;
  /** Toggle label */
  label?: string;
  /** Whether the toggle is disabled */
  disabled?: boolean;
  /** Additional classes on the root element */
  className?: string;
}

/**
 * Toggle - Switch control with emerald active color.
 *
 * Features:
 *  - Smooth slide + color transition (200ms)
 *  - Subtle bounce on the thumb via cubic-bezier
 *  - Emerald bg when on, muted bg when off
 *  - Accessible with role=switch and aria-checked
 *  - Respects prefers-reduced-motion
 */
const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  className = '',
}) => {
  const id = useId();

  const handleClick = useCallback(() => {
    if (!disabled) {
      onChange(!checked);
    }
  }, [checked, disabled, onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (disabled) return;
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        onChange(!checked);
      }
    },
    [checked, disabled, onChange],
  );

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={[
          'relative inline-flex items-center shrink-0',
          'w-10 h-[22px] rounded-full p-0.5',
          'transition-colors duration-200 ease-out motion-reduce:transition-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50 focus-visible:ring-offset-1 focus-visible:ring-offset-forge-bg',
          // Colors
          checked
            ? 'bg-accent-primary shadow-[0_0_10px_rgba(16,185,129,0.3)]'
            : 'bg-forge-border',
          // Disabled
          disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        ].join(' ')}
      >
        {/* Thumb */}
        <span
          className={[
            'inline-block w-[18px] h-[18px] rounded-full bg-white shadow-sm',
            // Bounce via cubic-bezier
            'transition-transform duration-200 motion-reduce:transition-none',
            checked ? 'translate-x-[18px]' : 'translate-x-0',
          ].join(' ')}
          style={{
            transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
          aria-hidden="true"
        />
      </button>

      {label && (
        <label
          htmlFor={id}
          className={[
            'text-sm select-none',
            disabled ? 'text-forge-text-muted/60 cursor-not-allowed' : 'text-forge-text-secondary cursor-pointer',
          ].join(' ')}
        >
          {label}
        </label>
      )}
    </div>
  );
};

export default Toggle;
