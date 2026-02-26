import React, {
  useState,
  useRef,
  useCallback,
  useEffect,
  forwardRef,
  type InputHTMLAttributes,
} from 'react';

export interface SearchInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'type'> {
  /** Current value (controlled) */
  value?: string;
  /** Debounced change handler */
  onChange?: (value: string) => void;
  /** Debounce delay in ms. 0 = no debounce */
  debounce?: number;
  /** Placeholder text */
  placeholder?: string;
  /** Additional classes on the wrapper */
  className?: string;
}

/**
 * SearchInput - Search input with magnifying glass icon, emerald focus ring,
 * clear button, and debounced onChange.
 *
 * Features:
 *  - Leading magnifying glass icon
 *  - Trailing clear button (visible when value is non-empty)
 *  - Debounced onChange (configurable, default 250ms)
 *  - Emerald focus ring
 *  - Respects prefers-reduced-motion
 *  - Forwards ref to the underlying <input>
 */
const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  (
    {
      value: controlledValue,
      onChange,
      debounce = 250,
      placeholder = 'Search...',
      className = '',
      ...rest
    },
    ref,
  ) => {
    const isControlled = controlledValue !== undefined;
    const [internalValue, setInternalValue] = useState(controlledValue ?? '');
    const displayValue = isControlled ? controlledValue : internalValue;
    const timerRef = useRef<ReturnType<typeof setTimeout>>();

    // Sync internal state when controlled value changes
    useEffect(() => {
      if (isControlled) {
        setInternalValue(controlledValue);
      }
    }, [isControlled, controlledValue]);

    const emitChange = useCallback(
      (val: string) => {
        if (debounce > 0) {
          clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            onChange?.(val);
          }, debounce);
        } else {
          onChange?.(val);
        }
      },
      [onChange, debounce],
    );

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        if (!isControlled) {
          setInternalValue(val);
        }
        emitChange(val);
      },
      [isControlled, emitChange],
    );

    const handleClear = useCallback(() => {
      if (!isControlled) {
        setInternalValue('');
      }
      clearTimeout(timerRef.current);
      onChange?.('');
    }, [isControlled, onChange]);

    // Cleanup debounce timer
    useEffect(() => {
      return () => clearTimeout(timerRef.current);
    }, []);

    const hasValue = displayValue.length > 0;

    return (
      <div className={`relative flex items-center ${className}`}>
        {/* Magnifying glass icon */}
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="absolute left-3 text-forge-text-muted pointer-events-none"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        <input
          ref={ref}
          type="search"
          value={displayValue}
          onChange={handleChange}
          placeholder={placeholder}
          className={[
            'w-full h-9 pl-9 pr-8 rounded-lg',
            'bg-forge-bg-secondary border border-forge-border',
            'text-sm text-forge-text placeholder:text-forge-text-muted/50',
            'transition-all duration-150 motion-reduce:transition-none',
            // Focus ring
            'focus:outline-none focus:border-accent-primary focus:ring-2 focus:ring-accent-primary/20',
            'focus:shadow-[0_0_12px_rgba(16,185,129,0.15)]',
            // Disable default search cancel button
            '[&::-webkit-search-cancel-button]:hidden',
          ].join(' ')}
          aria-label={placeholder}
          {...rest}
        />

        {/* Clear button */}
        {hasValue && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-2 flex items-center justify-center w-5 h-5 rounded text-forge-text-muted hover:text-forge-text hover:bg-forge-bg-tertiary/60 transition-colors duration-100 motion-reduce:transition-none"
            aria-label="Clear search"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
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
  },
);

SearchInput.displayName = 'SearchInput';

export default SearchInput;
