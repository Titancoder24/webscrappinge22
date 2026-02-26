/**
 * ScannerBeam – Extraction scanner animation for individual elements.
 *
 * Plays a horizontal emerald gradient sweep across each element being scraped
 * (left to right, 200ms), followed by a brief green glow that fades over
 * 500ms, and a checkmark overlay that fades in then disappears.
 *
 * All animations use GPU-accelerated transform + opacity only. Respects
 * prefers-reduced-motion. Self-cleans all injected DOM elements.
 *
 * Accent palette: emerald #10B981 / teal #14B8A6
 */

import { shouldAnimate } from '@/utils/animation-utils';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const BEAM_CLASS = 'df-scanner-beam';
const COMPLETE_CLASS = 'df-scanner-complete';
const CHECKMARK_CLASS = 'df-checkmark';

/** Duration of the horizontal sweep (ms). */
const SCAN_DURATION_MS = 200;
/** Duration of the post-scan green glow fade (ms). */
const GLOW_DURATION_MS = 500;
/** Duration of the checkmark display (ms). */
const CHECKMARK_DURATION_MS = 800;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ScanEntry {
  /** The page element being scanned. */
  target: Element;
  /** The beam overlay element. */
  beam: HTMLDivElement | null;
  /** The glow overlay element. */
  glow: HTMLDivElement | null;
  /** The checkmark overlay element. */
  checkmark: HTMLDivElement | null;
  /** All pending timeout IDs for cleanup. */
  timeouts: ReturnType<typeof setTimeout>[];
  /** All pending rAF IDs for cleanup. */
  rafs: number[];
  /** Whether this entry has been cleaned up. */
  disposed: boolean;
}

// ---------------------------------------------------------------------------
// Class
// ---------------------------------------------------------------------------

export class ScannerBeam {
  private entries: Map<Element, ScanEntry> = new Map();

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Play the scanner beam animation across an element.
   *
   * A horizontal emerald gradient sweeps from left to right over 200ms.
   * The beam element is absolutely positioned to cover the target element
   * using viewport-relative coordinates.
   *
   * @param el - The DOM element to scan
   * @returns A promise that resolves when the scan animation completes
   */
  scanElement(el: Element): Promise<void> {
    return new Promise<void>((resolve) => {
      // Clean up any previous scan on this element
      this.cleanupEntry(el);

      const entry: ScanEntry = {
        target: el,
        beam: null,
        glow: null,
        checkmark: null,
        timeouts: [],
        rafs: [],
        disposed: false,
      };
      this.entries.set(el, entry);

      if (!shouldAnimate()) {
        resolve();
        return;
      }

      const rect = this.getRect(el);
      if (!rect) {
        resolve();
        return;
      }

      // Create the beam element
      const beam = document.createElement('div');
      beam.className = BEAM_CLASS;
      this.positionOverlay(beam, rect);

      // The beam starts translated fully left and sweeps to the right
      beam.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0)`;
      beam.style.opacity = '0';
      document.documentElement.appendChild(beam);
      entry.beam = beam;

      // Trigger the sweep
      const raf = requestAnimationFrame(() => {
        if (entry.disposed) return;
        beam.style.opacity = '1';

        // Use a CSS transition for the sweep
        beam.style.transition = `transform ${SCAN_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1), opacity 60ms ease-out`;
        // The internal pseudo-element or gradient handles the sweep visually;
        // here we animate a clip or transform to reveal left-to-right
        beam.style.clipPath = 'inset(0 100% 0 0)';

        const raf2 = requestAnimationFrame(() => {
          if (entry.disposed) return;
          beam.style.transition = `clip-path ${SCAN_DURATION_MS}ms cubic-bezier(0.22, 1, 0.36, 1), opacity 60ms ease-out`;
          beam.style.clipPath = 'inset(0 0% 0 0)';
        });
        entry.rafs.push(raf2);
      });
      entry.rafs.push(raf);

      // Resolve after sweep completes and clean up beam
      const timeout = setTimeout(() => {
        if (entry.disposed) return;
        beam.style.opacity = '0';
        beam.style.transition = `opacity 100ms ease-out`;

        const cleanupTimeout = setTimeout(() => {
          if (!entry.disposed) {
            beam.remove();
            entry.beam = null;
          }
          resolve();
        }, 120);
        entry.timeouts.push(cleanupTimeout);
      }, SCAN_DURATION_MS);
      entry.timeouts.push(timeout);
    });
  }

  /**
   * Mark an element as extraction-complete.
   *
   * Plays a brief green glow that fades over 500ms, followed by a checkmark
   * overlay that fades in and then disappears.
   *
   * @param el - The DOM element to mark complete
   */
  markComplete(el: Element): void {
    const existing = this.entries.get(el);
    const entry: ScanEntry = existing || {
      target: el,
      beam: null,
      glow: null,
      checkmark: null,
      timeouts: [],
      rafs: [],
      disposed: false,
    };
    if (!existing) this.entries.set(el, entry);

    if (!shouldAnimate()) return;

    const rect = this.getRect(el);
    if (!rect) return;

    // --- Glow overlay ---
    const glow = document.createElement('div');
    glow.className = COMPLETE_CLASS;
    this.positionOverlay(glow, rect);
    glow.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0)`;
    glow.style.opacity = '0';
    document.documentElement.appendChild(glow);
    entry.glow = glow;

    // Fade in the glow
    const glowRaf = requestAnimationFrame(() => {
      if (entry.disposed) return;
      glow.style.transition = `opacity 80ms ease-out`;
      glow.style.opacity = '1';
    });
    entry.rafs.push(glowRaf);

    // Fade out the glow
    const glowFadeTimeout = setTimeout(() => {
      if (entry.disposed) return;
      glow.style.transition = `opacity ${GLOW_DURATION_MS}ms ease-out`;
      glow.style.opacity = '0';
    }, 150);
    entry.timeouts.push(glowFadeTimeout);

    // Remove glow DOM
    const glowRemoveTimeout = setTimeout(() => {
      if (!entry.disposed) {
        glow.remove();
        entry.glow = null;
      }
    }, 150 + GLOW_DURATION_MS + 50);
    entry.timeouts.push(glowRemoveTimeout);

    // --- Checkmark overlay ---
    const check = document.createElement('div');
    check.className = CHECKMARK_CLASS;
    this.positionOverlay(check, rect);
    check.style.transform = `translate3d(${rect.left + rect.width / 2 - 12}px, ${rect.top + rect.height / 2 - 12}px, 0)`;
    check.style.opacity = '0';
    check.style.width = '24px';
    check.style.height = '24px';

    // Inline SVG checkmark
    check.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;">
      <path d="M5 13l4 4L19 7" stroke="#10B981" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>`;

    document.documentElement.appendChild(check);
    entry.checkmark = check;

    // Fade in checkmark
    const checkRaf = requestAnimationFrame(() => {
      if (entry.disposed) return;
      check.style.transition = `opacity 150ms ease-out, transform 150ms ease-out`;
      check.style.opacity = '1';
      check.style.transform = `translate3d(${rect.left + rect.width / 2 - 12}px, ${rect.top + rect.height / 2 - 12}px, 0) scale(1)`;
    });
    entry.rafs.push(checkRaf);

    // Fade out checkmark
    const checkFadeTimeout = setTimeout(() => {
      if (entry.disposed) return;
      check.style.transition = `opacity 300ms ease-out`;
      check.style.opacity = '0';
    }, CHECKMARK_DURATION_MS - 300);
    entry.timeouts.push(checkFadeTimeout);

    // Remove checkmark DOM
    const checkRemoveTimeout = setTimeout(() => {
      if (!entry.disposed) {
        check.remove();
        entry.checkmark = null;
      }
      // Fully clean up entry
      this.entries.delete(el);
    }, CHECKMARK_DURATION_MS + 50);
    entry.timeouts.push(checkRemoveTimeout);
  }

  /**
   * Reset all scanner state. Removes every beam, glow, and checkmark from
   * the DOM and cancels all pending animations.
   */
  reset(): void {
    for (const [el] of this.entries) {
      this.cleanupEntry(el);
    }
    this.entries.clear();
  }

  /**
   * Full teardown alias. Same as reset().
   */
  destroy(): void {
    this.reset();
  }

  // -----------------------------------------------------------------------
  // Internal helpers
  // -----------------------------------------------------------------------

  private cleanupEntry(el: Element): void {
    const entry = this.entries.get(el);
    if (!entry) return;

    entry.disposed = true;

    for (const t of entry.timeouts) clearTimeout(t);
    for (const r of entry.rafs) cancelAnimationFrame(r);
    entry.timeouts.length = 0;
    entry.rafs.length = 0;

    if (entry.beam) {
      entry.beam.remove();
      entry.beam = null;
    }
    if (entry.glow) {
      entry.glow.remove();
      entry.glow = null;
    }
    if (entry.checkmark) {
      entry.checkmark.remove();
      entry.checkmark = null;
    }

    this.entries.delete(el);
  }

  private getRect(
    el: Element,
  ): { left: number; top: number; width: number; height: number } | null {
    try {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) return null;
      return { left: r.left, top: r.top, width: r.width, height: r.height };
    } catch {
      return null;
    }
  }

  /**
   * Apply width/height on an overlay. The caller sets transform separately
   * for GPU-accelerated positioning.
   */
  private positionOverlay(
    overlay: HTMLDivElement,
    rect: { width: number; height: number },
  ): void {
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.pointerEvents = 'none';
    overlay.style.zIndex = '2147483646';
  }
}
