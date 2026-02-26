import React, { useRef, useEffect, useCallback } from 'react';
import type { ImageCategory } from './ImageDownloaderView';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CategoryFilterProps {
  activeCategory: ImageCategory;
  onCategoryChange: (category: ImageCategory) => void;
  counts: Record<ImageCategory, number>;
}

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------

const CATEGORIES: { key: ImageCategory; label: string; icon: React.ReactNode }[] = [
  {
    key: 'all',
    label: 'All',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="3" width="7" height="7" />
        <rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" />
      </svg>
    ),
  },
  {
    key: 'photos',
    label: 'Photos',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <circle cx="8.5" cy="8.5" r="1.5" />
        <polyline points="21 15 16 10 5 21" />
      </svg>
    ),
  },
  {
    key: 'icons',
    label: 'Icons',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="8" y1="12" x2="16" y2="12" />
        <line x1="12" y1="8" x2="12" y2="16" />
      </svg>
    ),
  },
  {
    key: 'logos',
    label: 'Logos',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
      </svg>
    ),
  },
  {
    key: 'banners',
    label: 'Banners',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect x="2" y="7" width="20" height="10" rx="2" ry="2" />
      </svg>
    ),
  },
  {
    key: 'svg',
    label: 'SVG',
    icon: (
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <polyline points="16 18 22 12 16 6" />
        <polyline points="8 6 2 12 8 18" />
      </svg>
    ),
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const CategoryFilter: React.FC<CategoryFilterProps> = ({
  activeCategory,
  onCategoryChange,
  counts,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<HTMLButtonElement>(null);

  // Scroll active tab into view
  useEffect(() => {
    if (activeRef.current && scrollRef.current) {
      const container = scrollRef.current;
      const tab = activeRef.current;
      const containerRect = container.getBoundingClientRect();
      const tabRect = tab.getBoundingClientRect();

      if (tabRect.left < containerRect.left || tabRect.right > containerRect.right) {
        tab.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [activeCategory]);

  const handleClick = useCallback(
    (category: ImageCategory) => {
      onCategoryChange(category);
    },
    [onCategoryChange],
  );

  return (
    <div
      ref={scrollRef}
      className="flex items-center gap-1 overflow-x-auto scrollbar-none -mx-1 px-1 pb-1"
      role="tablist"
      aria-label="Image categories"
    >
      {CATEGORIES.map(({ key, label, icon }) => {
        const isActive = activeCategory === key;
        const count = counts[key] ?? 0;

        // Skip categories with 0 count (except 'all')
        if (key !== 'all' && count === 0) return null;

        return (
          <button
            key={key}
            ref={isActive ? activeRef : undefined}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => handleClick(key)}
            className={[
              'relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold whitespace-nowrap transition-all duration-200 shrink-0',
              isActive
                ? 'bg-accent-primary/15 text-accent-primary'
                : 'text-forge-text-muted hover:text-forge-text-secondary hover:bg-forge-bg-tertiary/40',
            ].join(' ')}
          >
            <span className="shrink-0">{icon}</span>
            {label}
            {count > 0 && (
              <span
                className={[
                  'inline-flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full text-[9px] font-bold leading-none',
                  isActive
                    ? 'bg-accent-primary/25 text-accent-primary'
                    : 'bg-forge-bg-tertiary text-forge-text-muted',
                ].join(' ')}
              >
                {count}
              </span>
            )}

            {/* Active underline */}
            {isActive && (
              <div
                className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                style={{
                  background: 'linear-gradient(90deg, #10B981, #14B8A6)',
                  boxShadow: '0 0 6px rgba(16, 185, 129, 0.4)',
                }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
};

export default React.memo(CategoryFilter);
