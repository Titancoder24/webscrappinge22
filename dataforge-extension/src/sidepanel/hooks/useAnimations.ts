/**
 * useAnimations - Hook for managing animation state.
 *
 * Respects the user's `prefers-reduced-motion` media query and the
 * application-level `animationsEnabled` setting from the store.
 *
 * Components should check `shouldAnimate` before applying animations
 * to ensure accessibility compliance.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useStore } from '../store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseAnimationsReturn {
  /** Whether animations are globally enabled (respects both OS + app setting). */
  animationsEnabled: boolean;
  /** Whether the OS-level prefers-reduced-motion is active. */
  prefersReducedMotion: boolean;
  /** Convenience: true only if both OS and app allow animations. */
  shouldAnimate: boolean;
  /** Get animation class or empty string based on animation state. */
  animClass: (className: string) => string;
  /** Get animation delay style for staggered animations. */
  staggerDelay: (index: number, baseDelayMs?: number) => React.CSSProperties;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useAnimations(): UseAnimationsReturn {
  const appAnimationsEnabled = useStore((s) => s.settings.general.animationsEnabled);

  const [prefersReducedMotion, setPrefersReducedMotion] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  // Listen for OS-level motion preference changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mql = window.matchMedia('(prefers-reduced-motion: reduce)');

    const handler = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, []);

  const animationsEnabled = appAnimationsEnabled && !prefersReducedMotion;

  const shouldAnimate = animationsEnabled;

  // Return animation class only if animations are enabled
  const animClass = useCallback(
    (className: string): string => {
      return shouldAnimate ? className : '';
    },
    [shouldAnimate],
  );

  // Return stagger delay style for list/card entrance animations
  const staggerDelay = useCallback(
    (index: number, baseDelayMs: number = 50): React.CSSProperties => {
      if (!shouldAnimate) return {};
      return {
        animationDelay: `${index * baseDelayMs}ms`,
        animationFillMode: 'both',
      };
    },
    [shouldAnimate],
  );

  return useMemo(
    () => ({
      animationsEnabled,
      prefersReducedMotion,
      shouldAnimate,
      animClass,
      staggerDelay,
    }),
    [animationsEnabled, prefersReducedMotion, shouldAnimate, animClass, staggerDelay],
  );
}
