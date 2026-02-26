/**
 * ProgressCounter – Floating extraction counter displayed on the page.
 *
 * Shows a small emerald-themed badge reading "47 extracted..." positioned at
 * the bottom-right of the extraction area. The number pulses on each update.
 * Fully self-contained: manages its own DOM, event listeners, and cleanup.
 *
 * All animations are GPU-accelerated (transform + opacity). Respects
 * prefers-reduced-motion. All class names use the df- prefix.
 *
 * Accent palette: emerald #10B981 / teal #14B8A6
 */

import { shouldAnimate, animateNumber } from '@/utils/animation-utils';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const COUNTER_ID = 'df-progress-counter';
const COUNTER_CLASS = 'df-progress-counter';
const COUNTER_VISIBLE = 'df-progress-counter--visible';
const COUNTER_PULSE = 'df-progress-counter--pulse';

/** Transition duration for show/hide (ms). */
const TRANSITION_MS = 200;
/** Duration of the number pulse animation (ms). */
const PULSE_MS = 300;

// ---------------------------------------------------------------------------
// Class
// ---------------------------------------------------------------------------

export class ProgressCounter {
  private element: HTMLDivElement | null = null;
  private countSpan: HTMLSpanElement | null = null;
  private currentCount: number = 0;
  private cancelNumberAnimation: (() => void) | null = null;
  private pulseTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private anchorRect: { left: number; top: number; width: number; height: number } | null = null;
  private scrollHandler: (() => void) | null = null;
  private repositionRafId: number | null = null;

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Show the progress counter badge. If it is already visible, this is a
   * no-op. Optionally provide an anchor rect to position the counter at the
   * bottom-right of a specific page region.
   *
   * @param anchorRect - Optional bounding rect to anchor the counter near
   */
  show(anchorRect?: { left: number; top: number; width: number; height: number }): void {
    if (anchorRect) {
      this.anchorRect = anchorRect;
    }

    this.ensureElement();

    requestAnimationFrame(() => {
      if (this.element) {
        this.element.classList.add(COUNTER_VISIBLE);
      }
    });

    this.startTracking();
  }

  /**
   * Update the displayed count. Animates the number transition and plays a
   * brief pulse on the badge.
   *
   * @param count - The new extraction count
   */
  update(count: number): void {
    if (count === this.currentCount) return;

    this.ensureElement();

    const previousCount = this.currentCount;
    this.currentCount = count;

    // Cancel any in-progress number animation
    if (this.cancelNumberAnimation) {
      this.cancelNumberAnimation();
      this.cancelNumberAnimation = null;
    }

    // Animate the number change
    if (this.countSpan) {
      if (shouldAnimate() && Math.abs(count - previousCount) > 1) {
        this.cancelNumberAnimation = animateNumber(
          previousCount,
          count,
          PULSE_MS,
          (value: number) => {
            if (this.countSpan) {
              this.countSpan.textContent = String(value);
            }
          },
        );
      } else {
        this.countSpan.textContent = String(count);
      }
    }

    // Pulse effect
    this.triggerPulse();
  }

  /**
   * Hide the counter with a fade-out transition, then clean up.
   */
  hide(): void {
    if (this.cancelNumberAnimation) {
      this.cancelNumberAnimation();
      this.cancelNumberAnimation = null;
    }

    if (this.pulseTimeoutId !== null) {
      clearTimeout(this.pulseTimeoutId);
      this.pulseTimeoutId = null;
    }

    if (this.element) {
      this.element.classList.remove(COUNTER_VISIBLE);
    }

    const teardown = (): void => {
      this.stopTracking();

      if (this.element) {
        this.element.remove();
        this.element = null;
        this.countSpan = null;
      }

      this.currentCount = 0;
      this.anchorRect = null;
    };

    if (shouldAnimate()) {
      setTimeout(teardown, TRANSITION_MS + 20);
    } else {
      teardown();
    }
  }

  /**
   * Full cleanup. Removes every trace from the DOM immediately.
   */
  destroy(): void {
    if (this.cancelNumberAnimation) {
      this.cancelNumberAnimation();
      this.cancelNumberAnimation = null;
    }

    if (this.pulseTimeoutId !== null) {
      clearTimeout(this.pulseTimeoutId);
      this.pulseTimeoutId = null;
    }

    this.stopTracking();

    if (this.element) {
      this.element.remove();
      this.element = null;
      this.countSpan = null;
    }

    this.currentCount = 0;
    this.anchorRect = null;
  }

  /** Current displayed count. */
  get count(): number {
    return this.currentCount;
  }

  // -----------------------------------------------------------------------
  // DOM construction
  // -----------------------------------------------------------------------

  private ensureElement(): void {
    if (this.element && this.element.isConnected) return;

    // Reuse existing element if still in the DOM
    const existing = document.getElementById(COUNTER_ID) as HTMLDivElement | null;
    if (existing) {
      this.element = existing;
      this.countSpan = existing.querySelector('.df-progress-counter__count') as HTMLSpanElement | null;
      return;
    }

    const el = document.createElement('div');
    el.id = COUNTER_ID;
    el.className = COUNTER_CLASS;

    // Icon (small emerald dot)
    const dot = document.createElement('span');
    dot.className = 'df-progress-counter__dot';

    // Count
    const count = document.createElement('span');
    count.className = 'df-progress-counter__count';
    count.textContent = String(this.currentCount);

    // Label
    const label = document.createElement('span');
    label.className = 'df-progress-counter__label';
    label.textContent = ' extracted\u2026';

    el.appendChild(dot);
    el.appendChild(count);
    el.appendChild(label);

    this.positionElement(el);
    document.documentElement.appendChild(el);

    this.element = el;
    this.countSpan = count;
  }

  private positionElement(el: HTMLDivElement): void {
    if (this.anchorRect) {
      // Position at the bottom-right of the anchor area
      const x = this.anchorRect.left + this.anchorRect.width - 8;
      const y = this.anchorRect.top + this.anchorRect.height + 12;

      // Clamp to viewport
      const clampedX = Math.min(x, window.innerWidth - 180);
      const clampedY = Math.min(y, window.innerHeight - 50);

      el.style.bottom = '';
      el.style.right = '';
      el.style.transform = `translate3d(${clampedX}px, ${clampedY}px, 0)`;
    }
    // If no anchor, the CSS positions it at bottom-right by default
  }

  // -----------------------------------------------------------------------
  // Pulse animation
  // -----------------------------------------------------------------------

  private triggerPulse(): void {
    if (!this.element || !shouldAnimate()) return;

    // Remove existing pulse class to reset the animation
    this.element.classList.remove(COUNTER_PULSE);

    if (this.pulseTimeoutId !== null) {
      clearTimeout(this.pulseTimeoutId);
    }

    // Force reflow to restart animation
    void this.element.offsetHeight;
    this.element.classList.add(COUNTER_PULSE);

    this.pulseTimeoutId = setTimeout(() => {
      if (this.element) {
        this.element.classList.remove(COUNTER_PULSE);
      }
      this.pulseTimeoutId = null;
    }, PULSE_MS);
  }

  // -----------------------------------------------------------------------
  // Event tracking
  // -----------------------------------------------------------------------

  private startTracking(): void {
    if (this.scrollHandler) return;

    this.scrollHandler = () => {
      if (this.repositionRafId !== null) return;
      this.repositionRafId = requestAnimationFrame(() => {
        this.repositionRafId = null;
        if (this.element && this.anchorRect) {
          this.positionElement(this.element);
        }
      });
    };

    window.addEventListener('scroll', this.scrollHandler, { passive: true, capture: true });
    window.addEventListener('resize', this.scrollHandler, { passive: true });
  }

  private stopTracking(): void {
    if (this.repositionRafId !== null) {
      cancelAnimationFrame(this.repositionRafId);
      this.repositionRafId = null;
    }

    if (this.scrollHandler) {
      window.removeEventListener('scroll', this.scrollHandler, { capture: true } as EventListenerOptions);
      window.removeEventListener('resize', this.scrollHandler);
      this.scrollHandler = null;
    }
  }
}
