/**
 * ElementHighlighter – Visual highlighting of elements on web pages.
 *
 * Creates a single overlay container (position:fixed, pointer-events:none,
 * z-index:2147483647) and renders highlight borders using CSS transforms
 * for GPU acceleration. Uses emerald green (#10B981) as the default accent.
 */

const OVERLAY_ID = 'dataforge-overlay';
const HIGHLIGHT_CLASS = 'dataforge-highlight';
const VISIBLE_CLASS = 'dataforge-highlight--visible';
const HOVER_CLASS = 'dataforge-highlight--hover';
const SELECTED_CLASS = 'dataforge-highlight--selected';
const PULSE_CLASS = 'dataforge-highlight--pulse';
const BADGE_CLASS = 'dataforge-highlight__badge';

/** Default stagger delay between individual highlight animations (ms). */
const WAVE_DELAY_MS = 30;
/** Transition duration for fade in/out (ms). */
const FADE_DURATION_MS = 150;

interface HighlightEntry {
  element: Element;
  overlay: HTMLDivElement;
  rafId: number | null;
}

export class ElementHighlighter {
  private container: HTMLDivElement | null = null;
  private highlights: Map<Element, HighlightEntry> = new Map();
  private color: string = '#10B981';
  private resizeObserver: ResizeObserver | null = null;
  private scrollHandler: (() => void) | null = null;
  private repositionRafId: number | null = null;

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Highlight all elements matching a CSS selector.
   * Applies a staggered "wave" animation across matched elements.
   *
   * @param selector - CSS selector string
   * @returns Number of elements highlighted
   */
  highlightElements(selector: string): number {
    this.clearAll();
    this.ensureContainer();

    let elements: NodeListOf<Element>;
    try {
      elements = document.querySelectorAll(selector);
    } catch {
      return 0;
    }

    if (elements.length === 0) return 0;

    for (let i = 0; i < elements.length; i++) {
      const el = elements[i];
      const overlay = this.createOverlayBox(el);

      if (!overlay) continue;

      const entry: HighlightEntry = { element: el, overlay, rafId: null };
      this.highlights.set(el, entry);
      this.container!.appendChild(overlay);

      // Stagger the wave effect
      const delay = i * WAVE_DELAY_MS;
      entry.rafId = requestAnimationFrame(() => {
        setTimeout(() => {
          overlay.classList.add(VISIBLE_CLASS);
          entry.rafId = null;
        }, delay);
      });
    }

    this.startTracking();
    return elements.length;
  }

  /**
   * Highlight a single element, typically on hover.
   * Does not clear existing highlights.
   *
   * @param el - The element to highlight
   * @param mode - 'hover' for mouseover styling, 'selected' for click confirmation
   */
  highlightSingle(el: Element, mode: 'hover' | 'selected' = 'hover'): void {
    this.ensureContainer();

    // Remove previous single highlight if same element
    const existing = this.highlights.get(el);
    if (existing) {
      existing.overlay.classList.remove(HOVER_CLASS, SELECTED_CLASS, PULSE_CLASS);
      if (mode === 'hover') {
        existing.overlay.classList.add(HOVER_CLASS);
      } else {
        existing.overlay.classList.add(SELECTED_CLASS, PULSE_CLASS);
      }
      this.repositionOverlay(existing);
      return;
    }

    const overlay = this.createOverlayBox(el);
    if (!overlay) return;

    if (mode === 'hover') {
      overlay.classList.add(HOVER_CLASS);
    } else {
      overlay.classList.add(SELECTED_CLASS, PULSE_CLASS);
    }

    const entry: HighlightEntry = { element: el, overlay, rafId: null };
    this.highlights.set(el, entry);
    this.container!.appendChild(overlay);

    // Immediate show
    requestAnimationFrame(() => {
      overlay.classList.add(VISIBLE_CLASS);
    });

    this.startTracking();
  }

  /**
   * Remove a single element's highlight.
   */
  removeSingle(el: Element): void {
    const entry = this.highlights.get(el);
    if (!entry) return;

    entry.overlay.classList.remove(VISIBLE_CLASS);

    // Wait for fade-out transition to finish before removing from DOM
    setTimeout(() => {
      if (entry.rafId !== null) {
        cancelAnimationFrame(entry.rafId);
      }
      entry.overlay.remove();
      this.highlights.delete(el);

      if (this.highlights.size === 0) {
        this.stopTracking();
      }
    }, FADE_DURATION_MS);
  }

  /**
   * Clear all highlights and remove the overlay container.
   */
  clearAll(): void {
    this.stopTracking();

    for (const [, entry] of this.highlights) {
      if (entry.rafId !== null) {
        cancelAnimationFrame(entry.rafId);
      }
      entry.overlay.remove();
    }
    this.highlights.clear();

    if (this.container) {
      this.container.remove();
      this.container = null;
    }
  }

  /**
   * Change the highlight border color.
   *
   * @param color - CSS color value
   */
  setHighlightColor(color: string): void {
    this.color = color;

    for (const [, entry] of this.highlights) {
      entry.overlay.style.borderColor = color;
      // Update the background with low opacity version
      entry.overlay.style.background = this.colorToBackground(color);
    }
  }

  /**
   * Add a count badge to the top-right of highlighted elements.
   *
   * @param count - Number to display
   */
  showBadge(count: number): void {
    if (!this.container) return;

    // Remove existing badges
    const existing = this.container.querySelectorAll(`.${BADGE_CLASS}`);
    for (let i = 0; i < existing.length; i++) {
      existing[i].remove();
    }

    // Add badge to the first highlight
    const firstEntry = this.highlights.values().next().value as HighlightEntry | undefined;
    if (firstEntry) {
      const badge = document.createElement('div');
      badge.className = BADGE_CLASS;
      badge.textContent = String(count);
      firstEntry.overlay.appendChild(badge);
    }
  }

  /** Number of currently active highlights. */
  get count(): number {
    return this.highlights.size;
  }

  // -------------------------------------------------------------------------
  // Internal
  // -------------------------------------------------------------------------

  private ensureContainer(): void {
    if (this.container && this.container.isConnected) return;

    // Check if container already exists in the DOM (e.g., from prior run)
    const existing = document.getElementById(OVERLAY_ID) as HTMLDivElement | null;
    if (existing) {
      this.container = existing;
      return;
    }

    const container = document.createElement('div');
    container.id = OVERLAY_ID;
    container.className = 'dataforge-overlay';
    document.documentElement.appendChild(container);
    this.container = container;
  }

  private createOverlayBox(el: Element): HTMLDivElement | null {
    let rect: DOMRect;
    try {
      rect = el.getBoundingClientRect();
    } catch {
      return null;
    }

    // Skip zero-size elements
    if (rect.width === 0 && rect.height === 0) return null;

    const overlay = document.createElement('div');
    overlay.className = HIGHLIGHT_CLASS;
    overlay.style.borderColor = this.color;
    overlay.style.background = this.colorToBackground(this.color);

    this.positionOverlay(overlay, rect);

    return overlay;
  }

  private positionOverlay(overlay: HTMLDivElement, rect: DOMRect): void {
    // Use transform for GPU acceleration instead of top/left
    overlay.style.width = `${rect.width}px`;
    overlay.style.height = `${rect.height}px`;
    overlay.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0)`;
    overlay.style.top = '0';
    overlay.style.left = '0';
  }

  private repositionOverlay(entry: HighlightEntry): void {
    try {
      const rect = entry.element.getBoundingClientRect();
      this.positionOverlay(entry.overlay, rect);
    } catch {
      // Element may have been removed
    }
  }

  private repositionAll(): void {
    if (this.repositionRafId !== null) return;

    this.repositionRafId = requestAnimationFrame(() => {
      this.repositionRafId = null;

      for (const [el, entry] of this.highlights) {
        // Check if element is still in the DOM
        if (!el.isConnected) {
          entry.overlay.remove();
          this.highlights.delete(el);
          continue;
        }
        this.repositionOverlay(entry);
      }

      if (this.highlights.size === 0) {
        this.stopTracking();
      }
    });
  }

  /**
   * Start listening for scroll and resize events to reposition overlays.
   */
  private startTracking(): void {
    if (this.scrollHandler) return;

    this.scrollHandler = () => this.repositionAll();
    window.addEventListener('scroll', this.scrollHandler, { passive: true, capture: true });
    window.addEventListener('resize', this.scrollHandler, { passive: true });

    // Use ResizeObserver to track individual element size changes
    if (typeof ResizeObserver !== 'undefined' && !this.resizeObserver) {
      this.resizeObserver = new ResizeObserver(() => this.repositionAll());
      for (const [el] of this.highlights) {
        try {
          this.resizeObserver.observe(el);
        } catch {
          // ignore
        }
      }
    }
  }

  /**
   * Stop tracking scroll/resize events.
   */
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
  }

  /**
   * Convert a hex color to a semi-transparent background.
   */
  private colorToBackground(color: string): string {
    // Parse hex color
    const hex = color.replace('#', '');
    if (hex.length === 6) {
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return `rgba(${r}, ${g}, ${b}, 0.08)`;
    }
    // Fallback for non-hex colors
    return 'rgba(16, 185, 129, 0.08)';
  }
}
