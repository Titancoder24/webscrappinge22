/**
 * ToolCard - Individual tool card with glassmorphism design.
 *
 * Features:
 *  - Glassmorphism card with semi-transparent backdrop
 *  - Icon with gradient background circle
 *  - Title and one-line description
 *  - Emerald border glow on hover
 *  - Subtle lift animation on hover
 *  - Optional badge (e.g. "NEW", "BETA")
 *  - Staggered entrance animation support via style prop
 */

import React, { useCallback, type ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface ToolCardProps {
  /** Icon element (emoji or SVG). */
  icon: ReactNode;
  /** Tool title. */
  title: string;
  /** Short one-line description. */
  description: string;
  /** Click handler to open the tool. */
  onClick: () => void;
  /** Optional badge label (e.g. "NEW", "BETA"). */
  badge?: string;
  /** Optional style for stagger animation delay. */
  style?: React.CSSProperties;
  /** Optional additional class names. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const ToolCard: React.FC<ToolCardProps> = ({
  icon,
  title,
  description,
  onClick,
  badge,
  style,
  className = '',
}) => {
  const handleClick = useCallback(() => {
    onClick();
  }, [onClick]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    },
    [onClick],
  );

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      style={style}
      className={[
        // Base layout
        'group relative flex items-center gap-3 p-3.5 rounded-xl cursor-pointer select-none',
        // Glassmorphism
        'bg-forge-bg-tertiary/60 backdrop-blur-xl',
        'border border-forge-border',
        // Transitions
        'transition-all duration-300 ease-out',
        'motion-reduce:transition-none',
        // Hover effects
        'hover:border-accent-primary/40',
        'hover:shadow-[0_0_20px_rgba(16,185,129,0.12),0_0_6px_rgba(16,185,129,0.08)]',
        'motion-safe:hover:translate-y-[-2px]',
        // Focus
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50',
        'focus-visible:ring-offset-1 focus-visible:ring-offset-forge-bg',
        // Active press
        'motion-safe:active:scale-[0.98]',
        className,
      ].join(' ')}
      aria-label={`Open ${title}`}
    >
      {/* Icon with gradient background */}
      <div
        className={[
          'flex items-center justify-center w-10 h-10 rounded-lg shrink-0',
          'bg-gradient-to-br from-accent-primary/20 to-accent-secondary/20',
          'border border-accent-primary/10',
          'transition-all duration-300',
          'group-hover:from-accent-primary/30 group-hover:to-accent-secondary/30',
          'group-hover:border-accent-primary/20',
          'group-hover:shadow-[0_0_12px_rgba(16,185,129,0.2)]',
        ].join(' ')}
      >
        <span className="text-lg leading-none">{icon}</span>
      </div>

      {/* Text content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3
            className={[
              'text-sm font-semibold text-forge-text',
              'transition-colors duration-200',
              'group-hover:text-accent-primary',
            ].join(' ')}
          >
            {title}
          </h3>

          {/* Badge */}
          {badge && (
            <span
              className={[
                'inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-bold',
                'leading-none tracking-wider uppercase',
                'bg-accent-primary/15 text-accent-primary border border-accent-primary/20',
              ].join(' ')}
            >
              {badge}
            </span>
          )}
        </div>

        <p className="text-xs text-forge-text-muted mt-0.5 truncate">
          {description}
        </p>
      </div>

      {/* Chevron right arrow */}
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={[
          'text-forge-text-muted/40 shrink-0',
          'transition-all duration-200',
          'group-hover:text-accent-primary group-hover:translate-x-0.5',
          'motion-reduce:group-hover:translate-x-0',
        ].join(' ')}
        aria-hidden="true"
      >
        <polyline points="9 18 15 12 9 6" />
      </svg>
    </div>
  );
};

export default ToolCard;
