/**
 * SettingsSection - Collapsible settings section with animated expand/collapse.
 *
 * Features:
 *  - Header with title and rotating chevron
 *  - Animated expand/collapse transition
 *  - Children slot for settings controls (toggles, sliders, inputs)
 *  - Accessible: ARIA expanded state, keyboard support
 */

import React, { useState, useCallback, useRef, useEffect, type ReactNode } from 'react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface SettingsSectionProps {
  /** Section title displayed in the header. */
  title: string;
  /** Optional icon or emoji displayed before the title. */
  icon?: ReactNode;
  /** Whether the section starts expanded (default true). */
  defaultExpanded?: boolean;
  /** Section content -- settings controls. */
  children: ReactNode;
  /** Optional additional class names. */
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SettingsSection: React.FC<SettingsSectionProps> = ({
  title,
  icon,
  defaultExpanded = true,
  children,
  className = '',
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const contentRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState<number | undefined>(undefined);

  // Measure content height for smooth animation
  useEffect(() => {
    if (contentRef.current) {
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setContentHeight(entry.contentRect.height);
        }
      });
      observer.observe(contentRef.current);
      return () => observer.disconnect();
    }
  }, []);

  const handleToggle = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleToggle();
      }
    },
    [handleToggle],
  );

  const sectionId = `settings-section-${title.toLowerCase().replace(/\s+/g, '-')}`;
  const contentId = `${sectionId}-content`;

  return (
    <div
      className={[
        'rounded-xl border border-forge-border overflow-hidden',
        'bg-forge-bg-tertiary/30 backdrop-blur-sm',
        'transition-colors duration-200 motion-reduce:transition-none',
        className,
      ].join(' ')}
    >
      {/* Header */}
      <button
        type="button"
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        aria-expanded={isExpanded}
        aria-controls={contentId}
        id={sectionId}
        className={[
          'w-full flex items-center gap-2.5 px-4 py-3',
          'text-left select-none cursor-pointer',
          'hover:bg-forge-bg-tertiary/40',
          'transition-colors duration-150 motion-reduce:transition-none',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset',
          'focus-visible:ring-accent-primary/50',
        ].join(' ')}
      >
        {/* Icon */}
        {icon && (
          <span className="text-sm leading-none shrink-0" aria-hidden="true">
            {icon}
          </span>
        )}

        {/* Title */}
        <span className="flex-1 text-sm font-semibold text-forge-text">
          {title}
        </span>

        {/* Chevron */}
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
            'text-forge-text-muted shrink-0',
            'transition-transform duration-200 motion-reduce:transition-none',
            isExpanded ? 'rotate-180' : 'rotate-0',
          ].join(' ')}
          aria-hidden="true"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {/* Collapsible content */}
      <div
        id={contentId}
        role="region"
        aria-labelledby={sectionId}
        className="overflow-hidden transition-[max-height,opacity] duration-300 ease-out motion-reduce:transition-none"
        style={{
          maxHeight: isExpanded ? (contentHeight ?? 500) + 32 : 0,
          opacity: isExpanded ? 1 : 0,
        }}
      >
        <div ref={contentRef} className="px-4 pb-4 pt-1">
          {/* Separator line */}
          <div className="h-px bg-forge-border/40 mb-3" />
          {children}
        </div>
      </div>
    </div>
  );
};

export default SettingsSection;
