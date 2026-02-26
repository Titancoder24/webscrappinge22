import React, { useRef, useLayoutEffect, useState, useCallback } from 'react';

export type NavigationTab = 'tools' | 'history' | 'data';

export interface NavigationProps {
  /** Currently active tab */
  activeTab: NavigationTab;
  /** Callback when a tab is selected */
  onTabChange: (tab: NavigationTab) => void;
  /** Optional badge counts for tabs */
  badges?: Partial<Record<NavigationTab, number>>;
}

const TAB_DEFINITIONS: { key: NavigationTab; label: string }[] = [
  { key: 'tools', label: 'TOOLS' },
  { key: 'history', label: 'HISTORY' },
  { key: 'data', label: 'DATA' },
];

/**
 * Navigation - 44px segmented tab control for the main panel sections.
 * Active tab has emerald gradient underline and text glow with smooth sliding animation.
 */
const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange, badges }) => {
  const tabRefs = useRef<Map<NavigationTab, HTMLButtonElement>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{ left: number; width: number }>({
    left: 0,
    width: 0,
  });

  const updateIndicator = useCallback(() => {
    const activeEl = tabRefs.current.get(activeTab);
    const container = containerRef.current;
    if (activeEl && container) {
      const containerRect = container.getBoundingClientRect();
      const tabRect = activeEl.getBoundingClientRect();
      setIndicatorStyle({
        left: tabRect.left - containerRect.left,
        width: tabRect.width,
      });
    }
  }, [activeTab]);

  useLayoutEffect(() => {
    updateIndicator();
  }, [updateIndicator]);

  // Also update on window resize
  useLayoutEffect(() => {
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [updateIndicator]);

  const setTabRef = useCallback((key: NavigationTab) => (el: HTMLButtonElement | null) => {
    if (el) {
      tabRefs.current.set(key, el);
    } else {
      tabRefs.current.delete(key);
    }
  }, []);

  return (
    <nav
      ref={containerRef}
      className="relative flex items-center h-11 px-2 bg-forge-bg-secondary/80 backdrop-blur-sm border-b border-forge-border shrink-0"
      role="tablist"
      aria-label="Main navigation"
    >
      {TAB_DEFINITIONS.map(({ key, label }) => {
        const isActive = activeTab === key;
        const badgeCount = badges?.[key];

        return (
          <button
            key={key}
            ref={setTabRef(key)}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${key}`}
            id={`tab-${key}`}
            onClick={() => onTabChange(key)}
            className={[
              'relative flex items-center justify-center flex-1 h-full px-3 gap-1.5',
              'text-xs font-semibold tracking-widest uppercase',
              'transition-colors duration-200 motion-reduce:transition-none',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50 focus-visible:ring-offset-1 focus-visible:ring-offset-forge-bg-secondary',
              isActive
                ? 'text-accent-primary'
                : 'text-forge-text-muted hover:text-forge-text-secondary',
            ].join(' ')}
            style={
              isActive
                ? { textShadow: '0 0 10px rgba(16, 185, 129, 0.6)' }
                : undefined
            }
          >
            {label}
            {badgeCount != null && badgeCount > 0 && (
              <span
                className={[
                  'inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold leading-none',
                  isActive
                    ? 'bg-accent-primary/20 text-accent-primary'
                    : 'bg-forge-bg-tertiary text-forge-text-muted',
                ].join(' ')}
              >
                {badgeCount > 99 ? '99+' : badgeCount}
              </span>
            )}
          </button>
        );
      })}

      {/* Sliding indicator underline */}
      <div
        className="absolute bottom-0 h-0.5 rounded-full transition-all duration-300 ease-out motion-reduce:transition-none"
        style={{
          left: indicatorStyle.left,
          width: indicatorStyle.width,
          background: 'linear-gradient(90deg, #10B981, #14B8A6)',
          boxShadow: '0 0 8px rgba(16, 185, 129, 0.5), 0 0 2px rgba(16, 185, 129, 0.3)',
        }}
        aria-hidden="true"
      />
    </nav>
  );
};

export default Navigation;
