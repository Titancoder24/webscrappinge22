import React, { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  /** Visual variant */
  variant?: ButtonVariant;
  /** Size preset */
  size?: ButtonSize;
  /** Whether the button is in a loading state (shows spinner, disables interaction) */
  loading?: boolean;
  /** Icon element rendered to the left of children */
  iconLeft?: ReactNode;
  /** Icon element rendered to the right of children */
  iconRight?: ReactNode;
  /** Button content */
  children?: ReactNode;
}

/* -------------------------------------------------------------------------- */
/*  Style mappings                                                            */
/* -------------------------------------------------------------------------- */

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-7 px-2.5 text-xs gap-1.5 rounded-md',
  md: 'h-9 px-4 text-sm gap-2 rounded-lg',
  lg: 'h-11 px-5 text-base gap-2.5 rounded-lg',
};

const variantClasses: Record<ButtonVariant, string> = {
  primary: [
    'text-forge-bg font-semibold',
    'bg-gradient-to-br from-accent-primary to-accent-secondary',
    'shadow-[0_0_12px_rgba(16,185,129,0.3)]',
    'hover:shadow-[0_0_20px_rgba(16,185,129,0.5)]',
  ].join(' '),
  secondary: [
    'text-accent-primary font-medium',
    'bg-transparent border border-accent-primary/50',
    'hover:border-accent-primary hover:bg-accent-primary/10',
    'hover:shadow-[0_0_12px_rgba(16,185,129,0.2)]',
  ].join(' '),
  danger: [
    'text-white font-semibold',
    'bg-status-error',
    'hover:bg-red-600 hover:shadow-[0_0_12px_rgba(239,68,68,0.3)]',
  ].join(' '),
  ghost: [
    'text-forge-text-secondary font-medium',
    'bg-transparent',
    'hover:text-forge-text hover:bg-forge-bg-tertiary/60',
  ].join(' '),
};

/* -------------------------------------------------------------------------- */
/*  Spinner                                                                   */
/* -------------------------------------------------------------------------- */

const Spinner: React.FC<{ className?: string }> = ({ className = 'w-4 h-4' }) => (
  <svg
    className={`animate-spin ${className}`}
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      className="opacity-25"
    />
    <path
      d="M12 2a10 10 0 0 1 10 10"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      className="opacity-75"
    />
  </svg>
);

/* -------------------------------------------------------------------------- */
/*  Button                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Button - Production-grade button component with multiple variants and sizes.
 *
 * Features:
 *  - Four variants: primary (emerald gradient), secondary (outline), danger, ghost
 *  - Three sizes: sm, md, lg
 *  - Hover: scale(1.02) + glow shadow
 *  - Active: scale(0.98) press feedback
 *  - Loading state with spinner
 *  - Left/right icon support
 *  - Respects prefers-reduced-motion
 *  - Forwards ref for parent focus management
 */
const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      disabled,
      iconLeft,
      iconRight,
      children,
      className = '',
      ...rest
    },
    ref,
  ) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type="button"
        disabled={isDisabled}
        className={[
          // Base
          'inline-flex items-center justify-center select-none whitespace-nowrap',
          'transition-all duration-150 ease-out',
          // Motion-safe interactions
          'motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98]',
          // Reduced motion
          'motion-reduce:transition-none motion-reduce:hover:scale-100 motion-reduce:active:scale-100',
          // Focus
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/60 focus-visible:ring-offset-1 focus-visible:ring-offset-forge-bg',
          // Disabled
          isDisabled ? 'opacity-50 cursor-not-allowed pointer-events-none' : 'cursor-pointer',
          // Variant + size
          variantClasses[variant],
          sizeClasses[size],
          className,
        ].join(' ')}
        aria-busy={loading}
        {...rest}
      >
        {/* Loading spinner replaces left icon */}
        {loading ? (
          <Spinner className={size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4'} />
        ) : (
          iconLeft && <span className="shrink-0 flex items-center">{iconLeft}</span>
        )}

        {children && <span className="truncate">{children}</span>}

        {!loading && iconRight && (
          <span className="shrink-0 flex items-center">{iconRight}</span>
        )}
      </button>
    );
  },
);

Button.displayName = 'Button';

export default Button;
