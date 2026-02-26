/**
 * FloatingBadges – Small floating badges near detected patterns on the page.
 *
 * Displays glassmorphism-style badges such as "📦 ~24 products" or
 * "⭐ ~150 reviews" at the top-right of each pattern's bounding rect.
 * Includes a gentle float animation, click handling, and automatic
 * repositioning on scroll/resize.
 *
 * All DOM nodes are df-prefixed, pointer-events are enabled on badges for
 * click interaction, and the badges are placed inside a shared overlay
 * container at z-index:2147483646.
 *
 * Accent palette: emerald #10B981 / teal #14B8A6
 */

import { shouldAnimate, staggerDelay } from '@/utils/animation-utils';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CONTAINER_ID = 'df-badge-container';
const BADGE_CLASS = 'df-floating-badge';
const BADGE_VISIBLE = 'df-floating-badge--visible';

/** Transition duration for fade in/out (ms). */
const TRANSITION_MS = 150;

/** Padding from the top-right corner of the bounding rect (px). */
const OFFSET_X = 8;
const OFFSET_Y = -12;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Category emoji lookup. */
const CATEGORY_EMOJI: Record<string, string> = {
  product: '\u{1F4E6}',  // 📦
  review: '\u2B50',       // ⭐
  listing: '\u{1F4CB}',  // 📋
  article: '\u{1F4F0}',  // 📰
  'table-row': '\u{1F4CA}', // 📊
  card: '\u{1F0CF}',     // 🃏
  'feed-item': '\u{1F4E2}', // 📢
  generic: '\u{1F50D}',  // 🔍
};

export interface PatternInfo {
  /** Unique ID for this pattern. */
  id: string;
  /** CSS selector that matches the pattern's items. */
  selector: string;
  /** Approximate number of items detected. */
  itemCount: number;
  /** Human-readable category (e.g. "products", "reviews"). */
  category: string;
  /** Bounding rect of the pattern region (viewport-relative). */
  boundingRect: { top: number; left: number; width: number; height: number };
}

interface BadgeEntry {
  pattern: PatternInfo;
  element: HTMLDivElement;
  pendingRafId: number | null;
  pendingTimeoutId: ReturnType<typeof setTimeout> | null;
}

export type BadgeClickHandler = (pattern: PatternInfo) => void;

// ---------------------------------------------------------------------------
// Class
// ---------------------------------------------------------------------------

export class FloatingBadges {
  private container: HTMLDivElement | null = null;
  private entries: Map<string, BadgeEntry> = new Map();
  private scrollHandler: (() => void) | null = null;
  private repositionRafId: number | null = null;
  private onClickHandler: BadgeClickHandler | null = null;

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Register a click handler that fires when a user clicks a badge.
   * The handler receives the PatternInfo associated with the badge.
   */
  onClick(handler: BadgeClickHandler): void {
    this.onClickHandler = handler;
  }

  /**
   * Show badges for the provided patterns. Clears any existing badges first.
   * Badges appear with a staggered fade-in.
   *
   * @param patterns - Detected patterns to show badges for
   */
  showBadges(patterns: PatternInfo[]): void {
    this.hideBadges();
    if (patterns.length === 0) return;

    this.ensureContainer();

    for (let i = 0; i < patterns.length; i++) {
      const pattern = patterns[i];
      if (this.entries.has(pattern.id)) continue;

      const badge = this.createBadge(pattern);
      this.container!.appendChild(badge);

      const entry: BadgeEntry = {
        pattern,
        element: badge,
        pendingRafId: null,
        pendingTimeoutId: null,
      };

      // Staggered reveal
      const delay = staggerDelay(i, 40);
      if (shouldAnimate() && delay > 0) {
        entry.pendingTimeoutId = setTimeout(() => {
          entry.pendingRafId = requestAnimationFrame(() => {
            badge.classList.add(BADGE_VISIBLE);
            entry.pendingRafId = null;
            entry.pendingTimeoutId = null;
          });
        }, delay);
      } else {
        entry.pendingRafId = requestAnimationFrame(() => {
          badge.classList.add(BADGE_VISIBLE);
          entry.pendingRafId = null;
        });
      }

      this.entries.set(pattern.id, entry);
    }

    this.startTracking();
  }

  /**
   * Hide all badges with a fade-out, then clean up the DOM.
   */
  hideBadges(): void {
    for (const [, entry] of this.entries) {
      this.cancelPending(entry);
      entry.element.classList.remove(BADGE_VISIBLE);
    }

    const teardown = (): void => {
      this.stopTracking();
      for (const [, entry] of this.entries) {
        entry.element.remove();
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
   * Recalculate badge positions. Call if the source layout has changed.
   */
  updatePositions(): void {
    this.repositionAll();
  }

  /**
   * Full teardown. Removes all DOM elements and event listeners.
   */
  destroy(): void {
    this.stopTracking();

    for (const [, entry] of this.entries) {
      this.cancelPending(entry);
      entry.element.remove();
    }
    this.entries.clear();

    if (this.container) {
      this.container.remove();
      this.container = null;
    }

    this.onClickHandler = null;
  }

  // -----------------------------------------------------------------------
  // Container
  // -----------------------------------------------------------------------

  private ensureContainer(): void {
    if (this.container && this.container.isConnected) return;

    const existing = document.getElementById(CONTAINER_ID) as HTMLDivElement | null;
    if (existing) {
      this.container = existing;
      return;
    }

    const container = document.createElement('div');
    container.id = CONTAINER_ID;
    container.style.cssText =
      'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:2147483646;overflow:visible;';
    document.documentElement.appendChild(container);
    this.container = container;
  }

  // -----------------------------------------------------------------------
  // Badge creation & positioning
  // -----------------------------------------------------------------------

  private createBadge(pattern: PatternInfo): HTMLDivElement {
    const badge = document.createElement('div');
    badge.className = BADGE_CLASS;

    // Build label: "📦 ~24 products"
    const emoji = CATEGORY_EMOJI[pattern.category] || CATEGORY_EMOJI.generic;
    const label = `${emoji} ~${pattern.itemCount} ${pattern.category}${pattern.itemCount !== 1 ? 's' : ''}`;
    badge.textContent = label;

    // Enable click
    badge.style.pointerEvents = 'auto';
    badge.style.cursor = 'pointer';

    badge.addEventListener('click', (e: MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      if (this.onClickHandler) {
        this.onClickHandler(pattern);
      }
    });

    // Hover feedback
    badge.addEventListener('mouseenter', () => {
      badge.style.transform = this.getBadgeTransform(pattern.boundingRect) + ' scale(1.05)';
    });
    badge.addEventListener('mouseleave', () => {
      badge.style.transform = this.getBadgeTransform(pattern.boundingRect);
    });

    // Position
    this.positionBadge(badge, pattern.boundingRect);

    return badge;
  }

  private getBadgeTransform(rect: { top: number; left: number; width: number; height: number }): string {
    const x = rect.left + rect.width + OFFSET_X;
    const y = rect.top + OFFSET_Y;
    return `translate3d(${x}px, ${y}px, 0)`;
  }

  private positionBadge(
    badge: HTMLDivElement,
    rect: { top: number; left: number; width: number; height: number },
  ): void {
    badge.style.transform = this.getBadgeTransform(rect);

    // Clamp to viewport so badges don't overflow off-screen
    requestAnimationFrame(() => {
      if (!badge.isConnected) return;
      const badgeRect = badge.getBoundingClientRect();
      let x = rect.left + rect.width + OFFSET_X;
      let y = rect.top + OFFSET_Y;

      // Right edge clamp
      if (x + badgeRect.width > window.innerWidth - 8) {
        x = rect.left - badgeRect.width - OFFSET_X;
      }
      // Top edge clamp
      if (y < 4) {
        y = 4;
      }
      // Bottom edge clamp
      if (y + badgeRect.height > window.innerHeight - 4) {
        y = window.innerHeight - badgeRect.height - 4;
      }

      badge.style.transform = `translate3d(${x}px, ${y}px, 0)`;
    });
  }

  // -----------------------------------------------------------------------
  // Reposition on scroll/resize
  // -----------------------------------------------------------------------

  private repositionAll(): void {
    if (this.repositionRafId !== null) return;

    this.repositionRafId = requestAnimationFrame(() => {
      this.repositionRafId = null;

      for (const [, entry] of this.entries) {
        // Try to get a fresh bounding rect from the selector
        const fresh = this.getFreshRect(entry.pattern.selector);
        if (fresh) {
          entry.pattern.boundingRect = fresh;
        }
        this.positionBadge(entry.element, entry.pattern.boundingRect);
      }
    });
  }

  /**
   * Query the DOM for the first element matching the selector and return
   * its bounding rect. Returns null if the selector is invalid or no
   * elements match.
   */
  private getFreshRect(
    selector: string,
  ): { top: number; left: number; width: number; height: number } | null {
    try {
      const els = document.querySelectorAll(selector);
      if (els.length === 0) return null;

      // Compute a bounding rect that encompasses all matched elements
      let top = Infinity;
      let left = Infinity;
      let bottom = -Infinity;
      let right = -Infinity;

      for (let i = 0; i < els.length; i++) {
        const r = els[i].getBoundingClientRect();
        if (r.width === 0 && r.height === 0) continue;
        if (r.top < top) top = r.top;
        if (r.left < left) left = r.left;
        if (r.bottom > bottom) bottom = r.bottom;
        if (r.right > right) right = r.right;
      }

      if (top === Infinity) return null;

      return {
        top,
        left,
        width: right - left,
        height: bottom - top,
      };
    } catch {
      return null;
    }
  }

  // -----------------------------------------------------------------------
  // Event tracking
  // -----------------------------------------------------------------------

  private startTracking(): void {
    if (this.scrollHandler) return;

    this.scrollHandler = () => this.repositionAll();
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

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  private cancelPending(entry: BadgeEntry): void {
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
