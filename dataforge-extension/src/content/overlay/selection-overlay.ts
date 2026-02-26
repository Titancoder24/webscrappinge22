/**
 * SelectionOverlay – Creates and manages highlight overlays positioned over
 * selected page elements.
 *
 * All overlays live inside a single container div with pointer-events:none
 * and z-index:2147483646. Positioning uses GPU-accelerated translate3d
 * transforms. Handles scroll, resize, and element removal gracefully.
 *
 * Accent palette: emerald #10B981 / teal #14B8A6
 */

import { shouldAnimate, staggerDelay } from '@/utils/animation-utils';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CONTAINER_ID = 'df-overlay-container';
const HIGHLIGHT_CLASS = 'df-highlight';
const HIGHLIGHT_VISIBLE = 'df-highlight--visible';
const HIGHLIGHT_WAVE = 'df-highlight-wave';

/** Transition duration for micro-interactions (ms). */
const TRANSITION_MS = 150;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface OverlayEntry {
  /** The page element being highlighted. */
  target: Element;
  /** The overlay div positioned on top of the target. */
  overlay: HTMLDivElement;
  /** Pending animation frame for staggered reveal. */
  pendingRafId: number | null;
  /** Pending timeout for staggered reveal. */
  pendingTimeoutId: ReturnType<typeof setTimeout> | null;
}

// ---------------------------------------------------------------------------
// Class
// ---------------------------------------------------------------------------

export class SelectionOverlay {
  private container: HTMLDivElement | null = null;
  private entries: Map<Element, OverlayEntry> = new Map();
  private resizeObserver: ResizeObserver | null = null;
  private scrollHandler: (() => void) | null = null;
  private repositionRafId: number | null = null;
  private mutationObserver: MutationObserver | null = null;

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Show selection overlays on the provided elements.
   *
   * Previous overlays are cleared first. A staggered wave animation is
   * applied so highlights fan out naturally across the page.
   *
   * @param elements - Elements to highlight
   */
  show(elements: Element[]): void {
    this.hide();
    if (elements.length === 0) return;

    this.ensureContainer();

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      if (this.entries.has(el)) continue;

      const overlay = this.createOverlay(el);
      if (!overlay) continue;

      this.container!.appendChild(overlay);

      const entry: OverlayEntry = {
        target: el,
        overlay,
        pendingRafId: null,
        pendingTimeoutId: null,
      };

      // Stagger the reveal with a wave animation class
      const delay = staggerDelay(i);
      if (shouldAnimate() && delay > 0) {
        entry.pendingTimeoutId = setTimeout(() => {
          entry.pendingRafId = requestAnimationFrame(() => {
            overlay.classList.add(HIGHLIGHT_VISIBLE);
            overlay.classList.add(HIGHLIGHT_WAVE);
            entry.pendingRafId = null;
            entry.pendingTimeoutId = null;
          });
        }, delay);
      } else {
        entry.pendingRafId = requestAnimationFrame(() => {
          overlay.classList.add(HIGHLIGHT_VISIBLE);
          entry.pendingRafId = null;
        });
      }

      this.entries.set(el, entry);
    }

    this.startTracking();
  }

  /**
   * Hide all overlays with a fade-out transition, then clean up.
   */
  hide(): void {
    // Fade out all overlays
    for (const [, entry] of this.entries) {
      this.cancelPending(entry);
      entry.overlay.classList.remove(HIGHLIGHT_VISIBLE, HIGHLIGHT_WAVE);
    }

    // Wait for the transition to finish, then tear down
    const teardown = (): void => {
      this.stopTracking();
      for (const [, entry] of this.entries) {
        entry.overlay.remove();
      }
      this.entries.clear();

      if (this.container) {
        this.container.remove();
        this.container = null;
      }
    };

    if (this.entries.size > 0 && shouldAnimate()) {
      setTimeout(teardown, TRANSITION_MS + 20);
    } else {
      teardown();
    }
  }

  /**
   * Recalculate all overlay positions. Call this if the page layout has
   * changed outside of scroll/resize (e.g. after an accordion toggle).
   */
  update(): void {
    this.repositionAll();
  }

  /** Number of currently visible overlays. */
  get count(): number {
    return this.entries.size;
  }

  /**
   * Full cleanup. Call when the extension deactivates to remove every trace
   * from the host page's DOM.
   */
  destroy(): void {
    this.stopTracking();

    for (const [, entry] of this.entries) {
      this.cancelPending(entry);
      entry.overlay.remove();
    }
    this.entries.clear();

    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }

  // -----------------------------------------------------------------------
  // Container management
  // -----------------------------------------------------------------------

  private ensureContainer(): void {
    if (this.container && this.container.isConnected) return;

    // Re-attach to an existing container if the page still has one
    const existing = document.getElementById(CONTAINER_ID) as HTMLDivElement | null;
    if (existing) {
      this.container = existing;
      return;
    }

    const container = document.createElement('div');
    container.id = CONTAINER_ID;
    container.className = 'df-overlay-container';
    document.documentElement.appendChild(container);
    this.container = container;
  }

  // -----------------------------------------------------------------------
  // Overlay creation & positioning
  // -----------------------------------------------------------------------

  private createOverlay(el: Element): HTMLDivElement | null {
    let rect: DOMRect;
    try {
      rect = el.getBoundingClientRect();
    } catch {
      return null;
    }

    // Skip zero-size or invisible elements
    if (rect.width === 0 && rect.height === 0) return null;

    const overlay = document.createElement('div');
    overlay.className = HIGHLIGHT_CLASS;
    this.positionOverlay(overlay, rect);
    return overlay;
  }

  /**
   * Position an overlay using translate3d for GPU acceleration.
   * The overlay sits at top:0; left:0 and is moved entirely via transform.
   */
  private positionOverlay(overlay: HTMLDivElement, rect: DOMRect): void {
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
    overlay.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0)`;
  }

  private repositionEntry(entry: OverlayEntry): void {
    if (!entry.target.isConnected) {
      entry.overlay.remove();
      this.entries.delete(entry.target);
      return;
    }

    try {
      const rect = entry.target.getBoundingClientRect();
      // Hide overlay if element scrolled off screen
      if (
        rect.bottom < 0 ||
        rect.top > window.innerHeight ||
        rect.right < 0 ||
        rect.left > window.innerWidth
      ) {
        entry.overlay.style.opacity = '0';
      } else {
        entry.overlay.style.opacity = '';
        this.positionOverlay(entry.overlay, rect);
      }
    } catch {
      // Element may have been detached mid-iteration
      entry.overlay.remove();
      this.entries.delete(entry.target);
    }
  }

  private repositionAll(): void {
    if (this.repositionRafId !== null) return;

    this.repositionRafId = requestAnimationFrame(() => {
      this.repositionRafId = null;

      for (const [, entry] of this.entries) {
        this.repositionEntry(entry);
      }

      if (this.entries.size === 0) {
        this.stopTracking();
      }
    });
  }

  // -----------------------------------------------------------------------
  // Tracking (scroll, resize, mutation, element size changes)
  // -----------------------------------------------------------------------

  private startTracking(): void {
    if (this.scrollHandler) return; // Already tracking

    // Scroll & resize
    this.scrollHandler = () => this.repositionAll();
    window.addEventListener('scroll', this.scrollHandler, { passive: true, capture: true });
    window.addEventListener('resize', this.scrollHandler, { passive: true });

    // ResizeObserver for individual elements changing size
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => this.repositionAll());
      for (const [el] of this.entries) {
        try {
          this.resizeObserver.observe(el);
        } catch {
          /* element may not be observable */
        }
      }
    }

    // MutationObserver to detect target removal from the DOM
    this.mutationObserver = new MutationObserver((mutations) => {
      let needsReposition = false;
      for (const mutation of mutations) {
        for (let i = 0; i < mutation.removedNodes.length; i++) {
          const node = mutation.removedNodes[i];
          if (node instanceof Element && this.entries.has(node)) {
            const entry = this.entries.get(node)!;
            this.cancelPending(entry);
            entry.overlay.remove();
            this.entries.delete(node);
            needsReposition = true;
          }
        }
      }
      if (needsReposition) this.repositionAll();
    });
    this.mutationObserver.observe(document.body, { childList: true, subtree: true });
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

    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }

    if (this.mutationObserver) {
      this.mutationObserver.disconnect();
      this.mutationObserver = null;
    }
  }

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  private cancelPending(entry: OverlayEntry): void {
    if (entry.pendingRafId !== null) {
      cancelAnimationFrame(entry.pendingRafId);
      entry.pendingRafId = null;
    }
    if (entry.pendingTimeoutId !== null) {
      clearTimeout(entry.pendingTimeoutId);
      entry.pendingTimeoutId = null;
    }
  }
}
