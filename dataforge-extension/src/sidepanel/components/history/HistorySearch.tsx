/**
 * HistorySearch - Search input component for filtering history items.
 *
 * Features:
 *  - Search icon prefix
 *  - Clear button when query is non-empty
 *  - Debounced input for performance
 *  - Filters by name, domain, and tool type
 *  - Emerald-themed input styling
 */

import React, { useCallback, useRef, useEffect, useState } from 'react';

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface HistorySearchProps {
  /** Current search query value. */
  value: string;
  /** Called when the search query changes (already debounced internally). */
  onChange: (query: string) => void;
  /** Placeholder text. */
  placeholder?: string;
}

// ---------------------------------------------------------------------------
// Debounce helper
// ---------------------------------------------------------------------------

function useDebouncedCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  delayMs: number,
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return useCallback(
    (...args: unknown[]) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => {
        callbackRef.current(...args);
      }, delayMs);
    },
    [delayMs],
  ) as T;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const HistorySearch: React.FC<HistorySearchProps> = ({
  value,
  onChange,
  placeholder = 'Search history by name, domain, or tool...',
}) => {
  const [localValue, setLocalValue] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync external value changes
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const debouncedOnChange = useDebouncedCallback(
    (query: string) => onChange(query),
    200,
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      setLocalValue(newValue);
      debouncedOnChange(newValue);
    },
    [debouncedOnChange],
  );

  const handleClear = useCallback(() => {
    setLocalValue('');
    onChange('');
    inputRef.current?.focus();
  }, [onChange]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClear();
      }
    },
    [handleClear],
  );

  return (
    <div className="relative">
      {/* Search icon */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-forge-text-muted/50"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={[
          'w-full h-9 pl-9 pr-9 rounded-lg text-sm',
          'bg-forge-bg-secondary border border-forge-border',
          'text-forge-text placeholder:text-forge-text-muted/40',
          'focus:border-accent-primary focus:ring-1 focus:ring-accent-primary/30',
          'focus:outline-none',
          'transition-all duration-200 motion-reduce:transition-none',
        ].join(' ')}
        aria-label="Search history"
      />

      {/* Clear button */}
      {localValue && (
        <button
          type="button"
          onClick={handleClear}
          className={[
            'absolute right-2 top-1/2 -translate-y-1/2',
            'flex items-center justify-center w-5 h-5 rounded',
            'text-forge-text-muted hover:text-forge-text',
            'hover:bg-forge-bg-tertiary/60',
            'transition-colors duration-150 motion-reduce:transition-none',
          ].join(' ')}
          aria-label="Clear search"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      )}
    </div>
  );
};

export default HistorySearch;
