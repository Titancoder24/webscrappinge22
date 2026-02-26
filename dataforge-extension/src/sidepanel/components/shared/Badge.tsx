import React, { type ReactNode } from 'react';

export type BadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'info';

export interface BadgeProps {
  /** Visual variant */
  variant?: BadgeVariant;
  /** Badge label content */
  children: ReactNode;
  /** Optional additional classes */
  className?: string;
}

/* -------------------------------------------------------------------------- */
/*  Variant styles                                                            */
/* -------------------------------------------------------------------------- */

const variantStyles: Record<
  BadgeVariant,
  { base: string; hoverGlow: string }
> = {
  default: {
    base: 'bg-forge-bg-tertiary text-forge-text-secondary border-forge-border',
    hoverGlow: 'hover:shadow-[0_0_8px_rgba(16,185,129,0.2)]',
  },
  success: {
    base: 'bg-status-success/15 text-status-success border-status-success/30',
    hoverGlow: 'hover:shadow-[0_0_8px_rgba(16,185,129,0.35)]',
  },
  warning: {
    base: 'bg-status-warning/15 text-status-warning border-status-warning/30',
    hoverGlow: 'hover:shadow-[0_0_8px_rgba(245,158,11,0.35)]',
  },
  error: {
    base: 'bg-status-error/15 text-status-error border-status-error/30',
    hoverGlow: 'hover:shadow-[0_0_8px_rgba(239,68,68,0.35)]',
  },
  info: {
    base: 'bg-status-info/15 text-status-info border-status-info/30',
    hoverGlow: 'hover:shadow-[0_0_8px_rgba(139,92,246,0.35)]',
  },
};

/* -------------------------------------------------------------------------- */
/*  Badge                                                                     */
/* -------------------------------------------------------------------------- */

/**
 * Badge - Small pill-shaped label with color-coded variants.
 * Supports default, success, warning, error, info variants.
 * Glow on hover. Respects prefers-reduced-motion.
 */
const Badge: React.FC<BadgeProps> = ({ variant = 'default', children, className = '' }) => {
  const { base, hoverGlow } = variantStyles[variant];

  return (
    <span
      className={[
        // Shape
        'inline-flex items-center px-2 py-0.5 rounded-full',
        'text-[11px] font-semibold leading-none tracking-wide uppercase',
        'border select-none whitespace-nowrap',
        // Transition
        'transition-shadow duration-200 motion-reduce:transition-none',
        // Variant
        base,
        hoverGlow,
        className,
      ].join(' ')}
    >
      {children}
    </span>
  );
};

export default Badge;
