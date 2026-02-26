/**
 * Throttle utility.
 *
 * Ensures the provided function is called at most once per `interval`
 * milliseconds. Supports leading and trailing invocations.
 */

export interface ThrottledFunction<T extends (...args: unknown[]) => unknown> {
  (...args: Parameters<T>): void;
  /** Cancel any pending trailing invocation. */
  cancel(): void;
  /** Whether there is a pending trailing invocation. */
  readonly pending: boolean;
}

export interface ThrottleOptions {
  /** Invoke on the leading edge. Default: true */
  leading?: boolean;
  /** Invoke on the trailing edge. Default: true */
  trailing?: boolean;
}

/**
 * Creates a throttled version of the provided function.
 *
 * @param fn - The function to throttle
 * @param interval - Minimum interval in milliseconds between invocations
 * @param options - Optional leading/trailing configuration
 * @returns A throttled function with cancel capability
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  fn: T,
  interval: number,
  options: ThrottleOptions = {},
): ThrottledFunction<T> {
  const { leading = true, trailing = true } = options;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  let lastCallTime: number = 0;
  let lastArgs: Parameters<T> | null = null;
  let isPending = false;

  function invokeTrailing(): void {
    if (trailing && lastArgs !== null) {
      const args = lastArgs;
      lastArgs = null;
      lastCallTime = Date.now();
      isPending = false;
      fn(...args);
      // Schedule cleanup for the next interval
      timeoutId = setTimeout(invokeTrailing, interval);
    } else {
      timeoutId = null;
      isPending = false;
      lastArgs = null;
    }
  }

  function throttled(...args: Parameters<T>): void {
    const now = Date.now();
    const elapsed = now - lastCallTime;

    lastArgs = args;

    if (elapsed >= interval) {
      // Enough time has passed — invoke immediately if leading
      if (leading) {
        lastCallTime = now;
        lastArgs = null;
        fn(...args);
      }

      // Set up a trailing invocation timer
      if (timeoutId === null && trailing) {
        isPending = true;
        timeoutId = setTimeout(invokeTrailing, interval);
      }
    } else {
      // Within the throttle window — schedule trailing
      isPending = true;
      if (timeoutId === null && trailing) {
        const remaining = interval - elapsed;
        timeoutId = setTimeout(invokeTrailing, remaining);
      }
    }
  }

  throttled.cancel = function cancel(): void {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
    lastCallTime = 0;
    isPending = false;
  };

  Object.defineProperty(throttled, 'pending', {
    get(): boolean {
      return isPending;
    },
  });

  return throttled as ThrottledFunction<T>;
}
