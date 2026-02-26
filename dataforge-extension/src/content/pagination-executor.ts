/**
 * PaginationExecutor – Execute pagination strategies to collect data across pages.
 *
 * Implements all 6 pagination modes:
 *   1. auto-scroll   – Infinite scroll via ScrollController
 *   2. click-next    – Click a "Next" button/link
 *   3. url-pattern   – Increment page numbers in URL pattern
 *   4. load-more     – Click a "Load More" button repeatedly
 *   5. api-intercept – Intercept XHR/fetch for paginated API endpoints
 *   6. manual-urls   – Navigate to a user-provided list of URLs
 *
 * Each mode yields batches of new elements via an async iterator.
 */

import type { PaginationConfig } from '../../types/extraction';
import { ScrollController } from './scroll-controller';
import { DOMChangeWatcher } from './mutation-observer';

/** A batch of newly discovered elements from one pagination step. */
export interface PaginationBatch {
  /** The elements found in this batch. */
  elements: Element[];
  /** Current page number (1-indexed). */
  page: number;
  /** Whether this is the last batch (no more pages). */
  isLast: boolean;
  /** The URL from which these elements were loaded (if applicable). */
  sourceUrl: string;
}

/** Maximum retries for a single pagination step. */
const MAX_RETRIES = 3;

/** Default delay between pagination steps (ms). */
const DEFAULT_DELAY_MS = 1000;

export class PaginationExecutor {
  private aborted = false;
  private scrollController: ScrollController;
  private watcher: DOMChangeWatcher;

  constructor() {
    this.scrollController = new ScrollController();
    this.watcher = new DOMChangeWatcher();
  }

  // -------------------------------------------------------------------------
  // Public API
  // -------------------------------------------------------------------------

  /**
   * Execute the pagination strategy and yield batches of new elements.
   *
   * @param config - Pagination configuration
   * @param itemSelector - CSS selector for the items being collected
   */
  async *execute(
    config: PaginationConfig,
    itemSelector: string,
  ): AsyncGenerator<PaginationBatch, void, unknown> {
    this.aborted = false;

    switch (config.mode) {
      case 'auto-scroll':
        yield* this.executeAutoScroll(config, itemSelector);
        break;

      case 'click-next':
        yield* this.executeClickNext(config, itemSelector);
        break;

      case 'url-pattern':
        yield* this.executeUrlPattern(config, itemSelector);
        break;

      case 'load-more':
        yield* this.executeLoadMore(config, itemSelector);
        break;

      case 'api-intercept':
        yield* this.executeApiIntercept(config, itemSelector);
        break;

      case 'manual-urls':
        yield* this.executeManualUrls(config, itemSelector);
        break;

      default:
        throw new Error(`Unknown pagination mode: ${config.mode}`);
    }
  }

  /**
   * Abort the current pagination execution.
   */
  abort(): void {
    this.aborted = true;
    this.scrollController.abort();
    this.watcher.stop();
  }

  // -------------------------------------------------------------------------
  // Mode 1: Auto-scroll (infinite scroll)
  // -------------------------------------------------------------------------

  private async *executeAutoScroll(
    config: PaginationConfig,
    itemSelector: string,
  ): AsyncGenerator<PaginationBatch, void, unknown> {
    const knownFingerprints = new Set<string>();
    this.collectFingerprints(itemSelector, knownFingerprints);

    // Yield the initial set of elements as page 1
    const initialElements = this.queryAll(itemSelector);
    if (initialElements.length > 0) {
      yield {
        elements: initialElements,
        page: 1,
        isLast: false,
        sourceUrl: window.location.href,
      };
    }

    let page = 1;
    const batchBuffer: Element[] = [];

    const result = await this.scrollController.scroll({
      itemSelector,
      scrollTarget: config.scrollTarget,
      speed: config.scrollSpeed || 'medium',
      maxSteps: config.maxPages > 0 ? config.maxPages * 5 : 0,
      onNewElements: (elements) => {
        batchBuffer.push(...elements);
      },
    });

    // Yield any remaining buffered elements
    if (batchBuffer.length > 0) {
      page++;
      yield {
        elements: batchBuffer,
        page,
        isLast: result.reachedEnd,
        sourceUrl: window.location.href,
      };
    } else if (result.reachedEnd) {
      yield {
        elements: [],
        page: page + 1,
        isLast: true,
        sourceUrl: window.location.href,
      };
    }
  }

  // -------------------------------------------------------------------------
  // Mode 2: Click next button
  // -------------------------------------------------------------------------

  private async *executeClickNext(
    config: PaginationConfig,
    itemSelector: string,
  ): AsyncGenerator<PaginationBatch, void, unknown> {
    const nextSelector = config.selector;
    if (!nextSelector) {
      throw new Error('click-next mode requires a selector for the "Next" button');
    }

    const maxPages = config.maxPages || 50;
    const delay = config.delayMs || DEFAULT_DELAY_MS;

    // Yield first page
    const firstPageElements = this.queryAll(itemSelector);
    yield {
      elements: firstPageElements,
      page: 1,
      isLast: false,
      sourceUrl: window.location.href,
    };

    for (let page = 2; page <= maxPages; page++) {
      if (this.aborted) break;

      // Find and click the next button
      const nextButton = this.findClickable(nextSelector);
      if (!nextButton) {
        // No more pages
        yield { elements: [], page, isLast: true, sourceUrl: window.location.href };
        break;
      }

      // Record current items to detect new ones
      const beforeCount = this.queryAll(itemSelector).length;

      // Click with retry logic
      let clicked = false;
      for (let attempt = 0; attempt < MAX_RETRIES && !clicked; attempt++) {
        try {
          await this.clickElement(nextButton);
          clicked = true;
        } catch {
          await this.sleep(500);
        }
      }

      if (!clicked) {
        yield { elements: [], page, isLast: true, sourceUrl: window.location.href };
        break;
      }

      // Wait for new content
      await this.waitForPageChange(itemSelector, beforeCount, delay);

      if (this.aborted) break;

      // Collect new elements
      const currentElements = this.queryAll(itemSelector);
      const newElements = currentElements.slice(beforeCount);

      const isLast = page >= maxPages || !this.findClickable(nextSelector);
      yield {
        elements: newElements.length > 0 ? newElements : currentElements,
        page,
        isLast,
        sourceUrl: window.location.href,
      };

      if (isLast) break;
      await this.sleep(delay);
    }
  }

  // -------------------------------------------------------------------------
  // Mode 3: URL pattern
  // -------------------------------------------------------------------------

  private async *executeUrlPattern(
    config: PaginationConfig,
    itemSelector: string,
  ): AsyncGenerator<PaginationBatch, void, unknown> {
    const pattern = config.urlPattern;
    if (!pattern) {
      throw new Error('url-pattern mode requires a urlPattern');
    }

    const maxPages = config.maxPages || 50;
    const delay = config.delayMs || DEFAULT_DELAY_MS;

    // Yield first page
    const firstPageElements = this.queryAll(itemSelector);
    yield {
      elements: firstPageElements,
      page: 1,
      isLast: false,
      sourceUrl: window.location.href,
    };

    let emptyPages = 0;

    for (let page = 2; page <= maxPages; page++) {
      if (this.aborted) break;

      // Generate URL for this page
      const url = pattern.replace(/\{page\}/g, String(page))
        .replace(/\{offset\}/g, String((page - 1) * firstPageElements.length));

      // Navigate to the URL
      try {
        const message = { type: 'NAVIGATE_URL' as const, url };
        chrome.runtime.sendMessage(message);
      } catch {
        // Cannot navigate - fall back to history API
        try {
          window.location.href = url;
        } catch {
          break;
        }
      }

      // Wait for page to load
      await this.waitForNavigation();
      await this.sleep(delay);

      if (this.aborted) break;

      // Collect elements from new page
      const elements = this.queryAll(itemSelector);

      if (elements.length === 0) {
        emptyPages++;
        if (emptyPages >= 2) {
          yield { elements: [], page, isLast: true, sourceUrl: url };
          break;
        }
      } else {
        emptyPages = 0;
      }

      yield {
        elements,
        page,
        isLast: page >= maxPages,
        sourceUrl: url,
      };
    }
  }

  // -------------------------------------------------------------------------
  // Mode 4: Load more button
  // -------------------------------------------------------------------------

  private async *executeLoadMore(
    config: PaginationConfig,
    itemSelector: string,
  ): AsyncGenerator<PaginationBatch, void, unknown> {
    const loadMoreSelector = config.selector;
    if (!loadMoreSelector) {
      throw new Error('load-more mode requires a selector for the "Load More" button');
    }

    const maxPages = config.maxPages || 50;
    const delay = config.delayMs || DEFAULT_DELAY_MS;
    const knownFingerprints = new Set<string>();
    this.collectFingerprints(itemSelector, knownFingerprints);

    // Yield first page
    const firstPageElements = this.queryAll(itemSelector);
    yield {
      elements: firstPageElements,
      page: 1,
      isLast: false,
      sourceUrl: window.location.href,
    };

    for (let page = 2; page <= maxPages; page++) {
      if (this.aborted) break;

      // Find the load more button
      const loadMoreButton = this.findClickable(loadMoreSelector);
      if (!loadMoreButton) {
        yield { elements: [], page, isLast: true, sourceUrl: window.location.href };
        break;
      }

      // Scroll the button into view
      this.scrollController.scrollToElement(loadMoreButton);
      await this.sleep(300);

      // Record current count
      const beforeCount = this.queryAll(itemSelector).length;

      // Click with retry
      let clicked = false;
      for (let attempt = 0; attempt < MAX_RETRIES && !clicked; attempt++) {
        try {
          await this.clickElement(loadMoreButton);
          clicked = true;
        } catch {
          await this.sleep(500);
        }
      }

      if (!clicked) {
        yield { elements: [], page, isLast: true, sourceUrl: window.location.href };
        break;
      }

      // Wait for new content
      await this.waitForPageChange(itemSelector, beforeCount, delay);

      if (this.aborted) break;

      // Find new elements (those not in known set)
      const newElements = this.findNewItems(itemSelector, knownFingerprints);

      const isLast = page >= maxPages || !this.findClickable(loadMoreSelector);
      yield {
        elements: newElements,
        page,
        isLast,
        sourceUrl: window.location.href,
      };

      if (isLast) break;
      await this.sleep(delay);
    }
  }

  // -------------------------------------------------------------------------
  // Mode 5: API intercept
  // -------------------------------------------------------------------------

  private async *executeApiIntercept(
    config: PaginationConfig,
    itemSelector: string,
  ): AsyncGenerator<PaginationBatch, void, unknown> {
    const endpoint = config.apiEndpoint;
    const pageParam = config.apiPageParam || 'page';
    if (!endpoint) {
      throw new Error('api-intercept mode requires an apiEndpoint');
    }

    const maxPages = config.maxPages || 50;
    const delay = config.delayMs || DEFAULT_DELAY_MS;

    // Yield first page (current DOM)
    const firstPageElements = this.queryAll(itemSelector);
    yield {
      elements: firstPageElements,
      page: 1,
      isLast: false,
      sourceUrl: window.location.href,
    };

    for (let page = 2; page <= maxPages; page++) {
      if (this.aborted) break;

      // Build the API URL
      let apiUrl: string;
      try {
        const url = new URL(endpoint, window.location.origin);
        url.searchParams.set(pageParam, String(page));
        apiUrl = url.toString();
      } catch {
        break;
      }

      // Fetch the API
      let response: Response;
      let retries = 0;
      while (retries < MAX_RETRIES) {
        try {
          response = await fetch(apiUrl, {
            credentials: 'same-origin',
            headers: { 'Accept': 'application/json' },
          });
          if (response!.ok) break;
          retries++;
          await this.sleep(1000 * retries);
        } catch {
          retries++;
          await this.sleep(1000 * retries);
        }
      }

      if (!response! || !response.ok) {
        yield { elements: [], page, isLast: true, sourceUrl: apiUrl };
        break;
      }

      // Parse the response
      let data: unknown;
      try {
        data = await response.json();
      } catch {
        yield { elements: [], page, isLast: true, sourceUrl: apiUrl };
        break;
      }

      // Check if the response contains data
      const items = this.extractItemsFromApiResponse(data);
      if (items.length === 0) {
        yield { elements: [], page, isLast: true, sourceUrl: apiUrl };
        break;
      }

      // Wait for DOM to update if the API triggers content injection
      await this.sleep(delay);

      // Re-query DOM for any newly rendered items
      const currentElements = this.queryAll(itemSelector);
      yield {
        elements: currentElements,
        page,
        isLast: page >= maxPages,
        sourceUrl: apiUrl,
      };

      if (this.aborted) break;
      await this.sleep(delay);
    }
  }

  // -------------------------------------------------------------------------
  // Mode 6: Manual URLs
  // -------------------------------------------------------------------------

  private async *executeManualUrls(
    config: PaginationConfig,
    itemSelector: string,
  ): AsyncGenerator<PaginationBatch, void, unknown> {
    const urls = config.manualUrls;
    if (!urls || urls.length === 0) {
      throw new Error('manual-urls mode requires an array of URLs');
    }

    const delay = config.delayMs || DEFAULT_DELAY_MS;
    const maxPages = Math.min(config.maxPages || urls.length, urls.length);

    for (let i = 0; i < maxPages; i++) {
      if (this.aborted) break;

      const url = urls[i];

      // For the first URL, check if we're already on it
      if (i === 0 && window.location.href === url) {
        const elements = this.queryAll(itemSelector);
        yield {
          elements,
          page: 1,
          isLast: maxPages === 1,
          sourceUrl: url,
        };
        continue;
      }

      // Navigate to the URL
      try {
        const message = { type: 'NAVIGATE_URL' as const, url };
        chrome.runtime.sendMessage(message);
      } catch {
        try {
          window.location.href = url;
        } catch {
          continue;
        }
      }

      // Wait for page to load
      await this.waitForNavigation();
      await this.sleep(delay);

      if (this.aborted) break;

      const elements = this.queryAll(itemSelector);
      yield {
        elements,
        page: i + 1,
        isLast: i >= maxPages - 1,
        sourceUrl: url,
      };
    }
  }

  // -------------------------------------------------------------------------
  // Click helpers
  // -------------------------------------------------------------------------

  /**
   * Find a clickable element matching the selector. Checks visibility and
   * disabled state.
   */
  private findClickable(selector: string): HTMLElement | null {
    try {
      const elements = document.querySelectorAll(selector);
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i] as HTMLElement;

        // Skip hidden elements
        try {
          const style = getComputedStyle(el);
          if (style.display === 'none' || style.visibility === 'hidden') continue;
          if (parseFloat(style.opacity) === 0) continue;
        } catch {
          continue;
        }

        // Skip disabled elements
        if (el.hasAttribute('disabled')) continue;
        if (el.getAttribute('aria-disabled') === 'true') continue;

        return el;
      }
    } catch {
      // Invalid selector
    }
    return null;
  }

  /**
   * Click an element, dispatching both mousedown/mouseup and click events
   * to handle various event handler patterns.
   */
  private async clickElement(el: HTMLElement): Promise<void> {
    // Scroll into view first
    try {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch {
      // ignore
    }
    await this.sleep(150);

    // Dispatch a full click sequence
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    const eventInit: MouseEventInit = {
      bubbles: true,
      cancelable: true,
      view: window,
      clientX: x,
      clientY: y,
    };

    el.dispatchEvent(new MouseEvent('mousedown', eventInit));
    el.dispatchEvent(new MouseEvent('mouseup', eventInit));
    el.dispatchEvent(new MouseEvent('click', eventInit));

    // Also try the native click in case event listeners are on the element itself
    try {
      el.click();
    } catch {
      // ignore
    }
  }

  // -------------------------------------------------------------------------
  // Wait helpers
  // -------------------------------------------------------------------------

  /**
   * Wait for new items to appear after a click/navigation.
   */
  private async waitForPageChange(
    itemSelector: string,
    beforeCount: number,
    maxWait: number,
  ): Promise<void> {
    const deadline = Date.now() + Math.max(maxWait, 3000);

    while (Date.now() < deadline) {
      if (this.aborted) return;

      const currentCount = this.queryAll(itemSelector).length;
      if (currentCount !== beforeCount) return;

      await this.sleep(200);
    }
  }

  /**
   * Wait for a full page navigation to complete.
   */
  private waitForNavigation(): Promise<void> {
    return new Promise(resolve => {
      // If the page has already loaded, resolve immediately
      if (document.readyState === 'complete') {
        resolve();
        return;
      }

      const handler = (): void => {
        window.removeEventListener('load', handler);
        resolve();
      };

      window.addEventListener('load', handler);

      // Safety timeout
      setTimeout(() => {
        window.removeEventListener('load', handler);
        resolve();
      }, 10000);
    });
  }

  // -------------------------------------------------------------------------
  // DOM query helpers
  // -------------------------------------------------------------------------

  private queryAll(selector: string): Element[] {
    try {
      return Array.from(document.querySelectorAll(selector));
    } catch {
      return [];
    }
  }

  private collectFingerprints(selector: string, set: Set<string>): void {
    const elements = this.queryAll(selector);
    for (const el of elements) {
      set.add(this.fingerprint(el));
    }
  }

  private findNewItems(selector: string, known: Set<string>): Element[] {
    const elements = this.queryAll(selector);
    const newItems: Element[] = [];
    for (const el of elements) {
      const fp = this.fingerprint(el);
      if (!known.has(fp)) {
        known.add(fp);
        newItems.push(el);
      }
    }
    return newItems;
  }

  private fingerprint(el: Element): string {
    const text = (el.textContent || '').trim().slice(0, 120);
    const tag = el.tagName;
    return `${tag}|${text}`;
  }

  /**
   * Extract array of items from a generic API response.
   * Looks for common patterns like {data: [...]}, {results: [...]}, {items: [...]}, or just [...].
   */
  private extractItemsFromApiResponse(data: unknown): unknown[] {
    if (Array.isArray(data)) return data;

    if (data && typeof data === 'object') {
      const obj = data as Record<string, unknown>;

      // Try common keys
      const keys = ['data', 'results', 'items', 'records', 'rows', 'entries', 'hits', 'list', 'content'];
      for (const key of keys) {
        if (Array.isArray(obj[key])) {
          return obj[key] as unknown[];
        }
      }

      // Try nested: data.items, data.results, etc.
      if (obj.data && typeof obj.data === 'object') {
        const nested = obj.data as Record<string, unknown>;
        for (const key of keys) {
          if (Array.isArray(nested[key])) {
            return nested[key] as unknown[];
          }
        }
      }
    }

    return [];
  }

  // -------------------------------------------------------------------------
  // Utility
  // -------------------------------------------------------------------------

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
