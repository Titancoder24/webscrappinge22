import React, { type ReactNode, type HTMLAttributes } from 'react';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Enable hover glow effect */
  hoverable?: boolean;
  /** Card contents */
  children: ReactNode;
  /** Additional classes */
  className?: string;
}

/**
 * Card - Glass-morphism card component.
 *
 * Features:
 *  - Semi-transparent background (bg-forge-bg-tertiary/60) with backdrop-blur-xl
 *  - Emerald border (forge-border)
 *  - Optional hover glow effect with emerald shadow
 *  - Smooth transition respecting prefers-reduced-motion
 *  - Accepts all standard div attributes
 */
const Card: React.FC<CardProps> = ({
  hoverable = false,
  children,
  className = '',
  ...rest
}) => {
  return (
    <div
      className={[
        // Glass-morphism base
        'bg-forge-bg-tertiary/60 backdrop-blur-xl',
        'border border-forge-border rounded-xl',
        'p-4',
        // Transitions
        'transition-all duration-200 motion-reduce:transition-none',
        // Hover glow
        hoverable
          ? [
              'cursor-pointer',
              'hover:border-accent-primary/40',
              'hover:shadow-[0_0_20px_rgba(16,185,129,0.12),0_0_6px_rgba(16,185,129,0.08)]',
              'motion-safe:hover:translate-y-[-1px]',
            ].join(' ')
          : '',
        className,
      ].join(' ')}
      {...rest}
    >
      {children}
    </div>
  );
};

export default Card;
