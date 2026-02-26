/**
 * Debounce utility.
 *
 * Delays invoking the provided function until after `delay` milliseconds have
 * elapsed since the last time the debounced function was invoked. Optionally
 * supports leading-edge invocation and cancellation.
 */

export interface DebouncedFunction<T extends (...args: unknown[]) => unknown> {
  (...args: Parameters<T>): void;
  /** Cancel any pending invocation. */
  cancel(): void;
  /** Immediately invoke any pending invocation. */
  flush(): void;
  /** Whether there is a pending invocation. */
  readonly pending: boolean;
}

export interface DebounceOptions {
  /** Invoke on the leading edge of the timeout. Default: false */
  leading?: boolean;
  /** Maximum time the function can be delayed before being invoked (ms). */
  maxWait?: number;
}

/**
 * Creates a debounced version of the provided function.
 *
 * @param fn - The function to debounce
 * @param delay - Delay in milliseconds
 * @param options - Optional leading/maxWait configuration
 * @returns A debounced function with cancel/flush capabilities
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delay: number,
  options: DebounceOptions = {},
): DebouncedFunction<T> {
  const { leading = false, maxWait } = options;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let maxWaitTimeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastArgs: Parameters<T> | null = null;
  let lastCallTime: number | null = null;
  let isPending = false;

  function invoke(): void {
    if (lastArgs === null) return;
    const args = lastArgs;
    lastArgs = null;
    lastCallTime = null;
    isPending = false;
    clearTimers();
    fn(...args);
  }

  function clearTimers(): void {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    if (maxWaitTimeoutId !== null) {
      clearTimeout(maxWaitTimeoutId);
      maxWaitTimeoutId = null;
    }
  }

  function debounced(...args: Parameters<T>): void {
    lastArgs = args;
    lastCallTime = Date.now();
    isPending = true;

    // Leading-edge invocation: invoke immediately if no pending timeout
    if (leading && timeoutId === null) {
      invoke();
    }

    // Reset trailing timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(invoke, delay);

    // Set maxWait timer if configured and not already set
    if (maxWait !== undefined && maxWaitTimeoutId === null) {
      maxWaitTimeoutId = setTimeout(invoke, maxWait);
    }
  }

  debounced.cancel = function cancel(): void {
    clearTimers();
    lastArgs = null;
    lastCallTime = null;
    isPending = false;
  };

  debounced.flush = function flush(): void {
    if (isPending) {
      invoke();
    }
  };

  Object.defineProperty(debounced, 'pending', {
    get(): boolean {
      return isPending;
    },
  });

  return debounced as DebouncedFunction<T>;
}
