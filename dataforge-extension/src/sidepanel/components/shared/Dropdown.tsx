import React, {
  type ReactNode,
  useState,
  useRef,
  useCallback,
  useEffect,
} from 'react';

export interface DropdownItem {
  /** Unique key for the item */
  key: string;
  /** Display label */
  label: string;
  /** Optional icon */
  icon?: ReactNode;
  /** Whether the item is disabled */
  disabled?: boolean;
  /** Whether this is a danger item (red) */
  danger?: boolean;
}

export interface DropdownProps {
  /** Menu items */
  items: DropdownItem[];
  /** Called when an item is selected */
  onSelect: (key: string) => void;
  /** Trigger element — rendered as the toggle button content */
  trigger: ReactNode;
  /** Alignment: left or right edge of trigger */
  align?: 'left' | 'right';
  /** Additional classes on the root */
  className?: string;
}

/**
 * Dropdown - Contextual menu with trigger button, items with icons,
 * and scale + fade entrance animation.
 *
 * Features:
 *  - Opens on trigger click, closes on outside click or Escape
 *  - Scale + fade animation (150ms) with transform-origin from trigger
 *  - Items support icons, disabled state, and danger styling
 *  - Keyboard navigation: ArrowDown/Up to move, Enter to select, Escape to close
 *  - Respects prefers-reduced-motion
 */
const Dropdown: React.FC<DropdownProps> = ({
  items,
  onSelect,
  trigger,
  align = 'left',
  className = '',
}) => {
  const [open, setOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  /* ---- Toggle ---- */
  const toggle = useCallback(() => {
    setOpen((prev) => {
      if (!prev) setFocusedIndex(-1);
      return !prev;
    });
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setFocusedIndex(-1);
  }, []);

  /* ---- Outside click ---- */
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, close]);

  /* ---- Escape key ---- */
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, close]);

  /* ---- Keyboard navigation ---- */
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!open) {
        if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setOpen(true);
          setFocusedIndex(0);
        }
        return;
      }

      const enabledIndices = items
        .map((item, i) => (!item.disabled ? i : -1))
        .filter((i) => i >= 0);

      switch (e.key) {
        case 'ArrowDown': {
          e.preventDefault();
          const currentPos = enabledIndices.indexOf(focusedIndex);
          const next = enabledIndices[(currentPos + 1) % enabledIndices.length];
          setFocusedIndex(next ?? 0);
          break;
        }
        case 'ArrowUp': {
          e.preventDefault();
          const currentPos = enabledIndices.indexOf(focusedIndex);
          const prev =
            enabledIndices[(currentPos - 1 + enabledIndices.length) % enabledIndices.length];
          setFocusedIndex(prev ?? 0);
          break;
        }
        case 'Enter':
        case ' ': {
          e.preventDefault();
          const item = items[focusedIndex];
          if (item && !item.disabled) {
            onSelect(item.key);
            close();
          }
          break;
        }
        case 'Escape':
          e.preventDefault();
          close();
          break;
      }
    },
    [open, items, focusedIndex, onSelect, close],
  );

  /* ---- Item click ---- */
  const handleItemClick = useCallback(
    (key: string, disabled?: boolean) => {
      if (disabled) return;
      onSelect(key);
      close();
    },
    [onSelect, close],
  );

  return (
    <div ref={rootRef} className={`relative inline-block ${className}`}>
      {/* Trigger */}
      <button
        type="button"
        onClick={toggle}
        onKeyDown={handleKeyDown}
        aria-haspopup="menu"
        aria-expanded={open}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary/50 rounded-lg"
      >
        {trigger}
      </button>

      {/* Menu */}
      {open && (
        <div
          ref={menuRef}
          role="menu"
          onKeyDown={handleKeyDown}
          className={[
            'absolute z-50 mt-1 min-w-[160px] py-1',
            'bg-forge-bg-secondary/95 backdrop-blur-xl',
            'border border-forge-border rounded-xl',
            'shadow-[0_8px_30px_rgba(0,0,0,0.4),0_0_8px_rgba(16,185,129,0.08)]',
            // Animation
            'animate-scale-in motion-reduce:animate-none',
            // Alignment
            align === 'right' ? 'right-0' : 'left-0',
          ].join(' ')}
          style={{
            transformOrigin: `${align === 'right' ? 'top right' : 'top left'}`,
          }}
        >
          {items.map((item, index) => (
            <button
              key={item.key}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => handleItemClick(item.key, item.disabled)}
              onMouseEnter={() => setFocusedIndex(index)}
              className={[
                'flex items-center gap-2.5 w-full px-3 py-2 text-left text-sm',
                'transition-colors duration-100 motion-reduce:transition-none',
                'focus-visible:outline-none',
                // State
                item.disabled
                  ? 'opacity-40 cursor-not-allowed'
                  : '',
                // Danger
                item.danger && !item.disabled
                  ? 'text-status-error hover:bg-status-error/10'
                  : '',
                // Normal
                !item.danger && !item.disabled
                  ? 'text-forge-text-secondary hover:text-forge-text hover:bg-forge-bg-tertiary/60'
                  : '',
                // Focused via keyboard
                focusedIndex === index && !item.disabled
                  ? item.danger
                    ? 'bg-status-error/10 text-status-error'
                    : 'bg-forge-bg-tertiary/60 text-forge-text'
                  : '',
              ].join(' ')}
            >
              {item.icon && (
                <span className="flex items-center shrink-0 w-4 h-4">{item.icon}</span>
              )}
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Dropdown;
