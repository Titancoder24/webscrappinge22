/**
 * ScrollController – Auto-scroll and infinite scroll handling.
 *
 * Features:
 * - Adaptive scroll speed (starts medium, slows when content loads slowly)
 * - MutationObserver-based new element detection after each scroll
 * - Smart wait: waits for DOM mutations to settle rather than fixed delay
 * - Finds the actual scrollable container (not always window)
 * - Duplicate detection for newly loaded items
 * - End detection: 3 consecutive scrolls with no new unique items = done
 */

import { DOMChangeWatcher } from './mutation-observer';

/** Speed presets in pixels per scroll step. */
const SCROLL_SPEEDS: Record<string, number> = {
  slow: 300,
  medium: 600,
  fast: 1200,
};

/** Maximum consecutive empty scrolls before considering the page fully loaded. */
const MAX_EMPTY_SCROLLS = 3;

/** Default quiet period to wait for DOM to settle (ms). */
const DEFAULT_SETTLE_MS = 800;

/** Maximum time to wait for new content after a scroll (ms). */
const MAX_WAIT_MS = 8000;

/** Minimum interval between scroll steps (ms). */
const MIN_SCROLL_INTERVAL = 100;

export interface ScrollResult {
  /** Total new unique elements found during scrolling. */
  newElementCount: number;
  /** Total scroll distance covered (px). */
  totalScrollDistance: number;
  /** Number of scroll steps performed. */
  scrollSteps: number;
  /** Whether scrolling ended because end-of-content was detected. */
  reachedEnd: boolean;
  /** Whether scrolling was aborted by the caller. */
  aborted: boolean;
}

export interface ScrollOptions {
  /** CSS selector for the items being tracked (to count new items). */
  itemSelector?: string;
  /** Target scrollable container selector (auto-detected if omitted). */
  scrollTarget?: string;
  /** Scroll speed: 'slow', 'medium', 'fast'. Default 'medium'. */
  speed?: 'slow' | 'medium' | 'fast';
  /** Maximum number of scroll steps (0 = unlimited). */
  maxSteps?: number;
  /** Maximum total time to spend scrolling (ms). 0 = unlimited. */
  maxTimeMs?: number;
  /** Callback fired when new elements appear after a scroll. */
  onNewElements?: (elements: Element[]) => void;
  /** Callback fired on each scroll step with progress info. */
  onProgress?: (step: number, newItems: number) => void;
}

export class ScrollController {
  private abortFlag = false;
  private isScrolling = false;
  private watcher: DOMChangeWatcher;

  constructor() {
    this.watcher = new DOMChangeWatcher();
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Perform an auto-scroll sequence, waiting for new content after each step.
   * Returns a summary of the scroll session.
   */
  async scroll(options: ScrollOptions = {}): Promise<ScrollResult> {
    if (this.isScrolling) {
      throw new Error('ScrollController: already scrolling');
    }

    this.isScrolling = true;
    this.abortFlag = false;

    const {
      itemSelector,
      scrollTarget,
      speed = 'medium',
      maxSteps = 0,
      maxTimeMs = 0,
      onNewElements,
      onProgress,
    } = options;

    const scrollContainer = this.findScrollContainer(scrollTarget);
    const scrollAmount = SCROLL_SPEEDS[speed] || SCROLL_SPEEDS.medium;

    let currentSpeed = scrollAmount;
    let totalNewElements = 0;
    let totalScrollDistance = 0;
    let scrollSteps = 0;
    let emptyScrolls = 0;
    let reachedEnd = false;
    const startTime = Date.now();

    // Track known item fingerprints for dedup
    const knownFingerprints = new Set<string>();
    if (itemSelector) {
      this.collectFingerprints(itemSelector, knownFingerprints);
    }

    while (!this.abortFlag) {
      // Check limits
      if (maxSteps > 0 && scrollSteps >= maxSteps) break;
      if (maxTimeMs > 0 && (Date.now() - startTime) > maxTimeMs) break;

      // Check if already at the bottom
      if (this.isAtScrollEnd(scrollContainer)) {
        // Wait a moment for lazy-loaded content
        await this.waitForContent(DEFAULT_SETTLE_MS);
        if (this.isAtScrollEnd(scrollContainer)) {
          reachedEnd = true;
          break;
        }
      }

      // Perform one scroll step
      const scrollBefore = this.getScrollPosition(scrollContainer);
      this.performScroll(scrollContainer, currentSpeed);
      const scrollAfter = this.getScrollPosition(scrollContainer);
      const scrollDelta = scrollAfter - scrollBefore;
      totalScrollDistance += Math.abs(scrollDelta);
      scrollSteps++;

      // If the page didn't actually scroll, we might be at the end
      if (Math.abs(scrollDelta) < 1) {
        emptyScrolls++;
        if (emptyScrolls >= MAX_EMPTY_SCROLLS) {
          reachedEnd = true;
          break;
        }
        // Wait and try again
        await this.waitForContent(DEFAULT_SETTLE_MS);
        continue;
      }

      // Wait for new content to load
      const newElements = await this.waitForNewContent(
        itemSelector,
        knownFingerprints,
        scrollContainer,
      );

      if (newElements.length > 0) {
        totalNewElements += newElements.length;
        emptyScrolls = 0;

        // Adapt speed: content is loading well, maintain or increase speed
        currentSpeed = Math.min(currentSpeed + 50, SCROLL_SPEEDS.fast);

        if (onNewElements) {
          try {
            onNewElements(newElements);
          } catch {
            // Swallow callback errors
          }
        }
      } else {
        emptyScrolls++;

        // Adapt speed: slow down to give content time to load
        currentSpeed = Math.max(currentSpeed - 100, SCROLL_SPEEDS.slow);

        if (emptyScrolls >= MAX_EMPTY_SCROLLS) {
          reachedEnd = true;
          break;
        }
      }

      if (onProgress) {
        try {
          onProgress(scrollSteps, totalNewElements);
        } catch {
          // Swallow callback errors
        }
      }

      // Small pause between scroll steps
      await this.sleep(MIN_SCROLL_INTERVAL);
    }

    this.isScrolling = false;

    return {
      newElementCount: totalNewElements,
      totalScrollDistance,
      scrollSteps,
      reachedEnd,
      aborted: this.abortFlag,
    };
  }

  /**
   * Abort a currently running scroll sequence.
   */
  abort(): void {
    this.abortFlag = true;
  }

  /** Whether a scroll sequence is currently running. */
  get active(): boolean {
    return this.isScrolling;
  }

  /**
   * Scroll to a specific element, bringing it into view.
   */
  scrollToElement(el: Element): void {
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch {
      // Fallback
      try {
        el.scrollIntoView(true);
      } catch {
        // ignore
      }
    }
  }

  // -------------------------------------------------------------------------
  // Scrollable container detection
  // -------------------------------------------------------------------------

  /**
   * Find the actual scrollable container. Many sites use a scrollable div
   * rather than the window/document scroll.
   */
  private findScrollContainer(targetSelector?: string): Element | Window {
    // If a specific target is provided, try to use it
    if (targetSelector) {
      try {
        const target = document.querySelector(targetSelector);
        if (target && this.isScrollable(target)) {
          return target;
        }
      } catch {
        // Invalid selector
      }
    }

    // Auto-detect: walk up from body looking for scrollable containers
    const candidates: Element[] = [];
    const allElements = document.querySelectorAll('*');

    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];
      if (this.isScrollable(el)) {
        const rect = el.getBoundingClientRect();
        // Only consider large containers (at least 50% of viewport)
        if (rect.height > window.innerHeight * 0.5) {
          candidates.push(el);
        }
      }
    }

    // Sort by size (prefer larger containers) and by depth (prefer shallower)
    if (candidates.length > 0) {
      candidates.sort((a, b) => {
        const aRect = a.getBoundingClientRect();
        const bRect = b.getBoundingClientRect();
        const aSize = aRect.width * aRect.height;
        const bSize = bRect.width * bRect.height;
        return bSize - aSize;
      });

      // Return the largest scrollable container, unless it's html/body
      const best = candidates[0];
      if (best.tagName !== 'HTML' && best.tagName !== 'BODY') {
        return best;
      }
    }

    // Default to window
    return window;
  }

  /**
   * Check if an element is scrollable (has overflow content).
   */
  private isScrollable(el: Element): boolean {
    try {
      const style = getComputedStyle(el);
      const overflowY = style.overflowY;
      const overflowX = style.overflowX;

      const hasOverflow = overflowY === 'scroll' || overflowY === 'auto'
        || overflowX === 'scroll' || overflowX === 'auto';

      if (!hasOverflow) return false;

      // Check if content actually overflows
      return el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth;
    } catch {
      return false;
    }
  }

  // -------------------------------------------------------------------------
  // Scroll operations
  // -------------------------------------------------------------------------

  private performScroll(container: Element | Window, amount: number): void {
    try {
      if (container === window) {
        window.scrollBy({ top: amount, behavior: 'smooth' });
      } else {
        (container as Element).scrollBy({ top: amount, behavior: 'smooth' });
      }
    } catch {
      // Fallback for browsers that don't support scrollBy with options
      if (container === window) {
        window.scrollBy(0, amount);
      } else {
        (container as Element).scrollTop += amount;
      }
    }
  }

  private getScrollPosition(container: Element | Window): number {
    if (container === window) {
      return window.scrollY || document.documentElement.scrollTop;
    }
    return (container as Element).scrollTop;
  }

  private getScrollMax(container: Element | Window): number {
    if (container === window) {
      return document.documentElement.scrollHeight - window.innerHeight;
    }
    const el = container as Element;
    return el.scrollHeight - el.clientHeight;
  }

  private isAtScrollEnd(container: Element | Window): boolean {
    const pos = this.getScrollPosition(container);
    const max = this.getScrollMax(container);
    // Allow 5px tolerance
    return pos >= max - 5;
  }

  // -------------------------------------------------------------------------
  // Content detection
  // -------------------------------------------------------------------------

  /**
   * Wait for new content to appear after a scroll.
   * Uses MutationObserver to detect DOM changes, then checks for new items.
   */
  private async waitForNewContent(
    itemSelector: string | undefined,
    knownFingerprints: Set<string>,
    _scrollContainer: Element | Window,
  ): Promise<Element[]> {
    // Wait for DOM to settle
    try {
      await this.watcher.waitForSettle(DEFAULT_SETTLE_MS, MAX_WAIT_MS);
    } catch {
      // Timeout – proceed anyway
    }

    // If no item selector, we can't track specific items
    if (!itemSelector) {
      return [];
    }

    // Find new unique items
    return this.findNewItems(itemSelector, knownFingerprints);
  }

  /**
   * Wait for any content change or a fixed time period.
   */
  private waitForContent(ms: number): Promise<void> {
    return new Promise(resolve => {
      const timer = setTimeout(() => {
        resolve();
      }, ms);

      // Also resolve early if the DOM changes
      const tempObserver = new MutationObserver(() => {
        clearTimeout(timer);
        tempObserver.disconnect();
        // Give a bit more time for the full batch to arrive
        setTimeout(resolve, 200);
      });

      try {
        tempObserver.observe(document.body, { childList: true, subtree: true });
      } catch {
        clearTimeout(timer);
        resolve();
      }
    });
  }

  /**
   * Find items matching the selector that are not in the known fingerprint set.
   */
  private findNewItems(selector: string, knownFingerprints: Set<string>): Element[] {
    let elements: NodeListOf<Element>;
    try {
      elements = document.querySelectorAll(selector);
    } catch {
      return [];
    }

    const newElements: Element[] = [];
    for (let i = 0; i < elements.length; i++) {
      const fp = this.fingerprint(elements[i]);
      if (!knownFingerprints.has(fp)) {
        knownFingerprints.add(fp);
        newElements.push(elements[i]);
      }
    }

    return newElements;
  }

  /**
   * Collect fingerprints of all elements currently matching the selector.
   */
  private collectFingerprints(selector: string, set: Set<string>): void {
    try {
      const elements = document.querySelectorAll(selector);
      for (let i = 0; i < elements.length; i++) {
        set.add(this.fingerprint(elements[i]));
      }
    } catch {
      // Invalid selector
    }
  }

  /**
   * Generate a lightweight fingerprint for an element to detect duplicates.
   * Uses text content snippet + structural position.
   */
  private fingerprint(el: Element): string {
    const text = (el.textContent || '').trim().slice(0, 120);
    const tag = el.tagName;
    const classes = el.className ? el.className.toString().slice(0, 60) : '';

    // Include first child's text for more uniqueness
    const firstChild = el.firstElementChild;
    const childText = firstChild ? (firstChild.textContent || '').trim().slice(0, 40) : '';

    return `${tag}|${classes}|${text}|${childText}`;
  }

  // -------------------------------------------------------------------------
  // Utility
  // -------------------------------------------------------------------------

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
