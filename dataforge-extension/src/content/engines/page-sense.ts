/**
 * PageSense - Pagination Detection Engine
 *
 * Detects pagination patterns on web pages using 5 complementary strategies.
 * Each strategy operates independently and returns a PaginationConfig with
 * a confidence score. Results are merged and ranked so the extension can
 * offer the best pagination approach to the user.
 *
 * Strategies:
 *   a) Navigation elements - <nav>, role="navigation", paging links/buttons
 *   b) URL analysis        - Query params (?page=, ?p=, ?offset=) and path segments (/page/N/)
 *   c) Infinite scroll      - IntersectionObserver sentinels, scroll listeners, loading attrs
 *   d) Load more buttons   - "Load more" / "Show more" / "See more" / "View all" buttons
 *   e) API monitoring       - XHR/fetch patterns with page/offset/cursor params
 */

import type { PaginationConfig, PaginationMode } from '../../types/extraction';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Text patterns that indicate a "next" control */
const NEXT_PATTERNS = [
  'next', 'next page', 'siguiente', 'suivant', 'weiter', 'volgende',
  'avanti', '>', '>>', '\u203A', '\u00BB', '\u2192', '\u2794',
  'next \u203A', 'next \u00BB',
];

/** Text patterns that indicate a "previous" control */
const PREV_PATTERNS = [
  'prev', 'previous', 'back', 'anterior', 'pr\u00E9c\u00E9dent',
  'zur\u00FCck', 'vorige', 'indietro',
  '<', '<<', '\u2039', '\u00AB', '\u2190',
];

/** Text patterns for "load more" buttons */
const LOAD_MORE_PATTERNS = [
  'load more', 'show more', 'see more', 'view more', 'view all',
  'see all', 'show all', 'load all', 'more results',
  'afficher plus', 'voir plus', 'mehr anzeigen', 'mehr laden',
  'mostrar m\u00E1s', 'ver m\u00E1s', 'ver todo',
];

/** URL parameter names commonly used for pagination */
const PAGE_PARAMS = ['page', 'p', 'pg', 'pn', 'pagenum', 'pagenumber', 'pageno'];
const OFFSET_PARAMS = ['offset', 'start', 'from', 'skip', 'begin'];
const CURSOR_PARAMS = ['cursor', 'after', 'next_cursor', 'continuation', 'token', 'next_token'];

/** Pagination-related class/attribute patterns */
const PAGINATION_CLASS_RE = /pag(e|ing|ination|er)|nav-page|page-nav|page-number|page-link/i;
const PAGINATION_ROLE_RE = /navigation/i;

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

/** Get visible text content of an element, trimmed and lowered */
function getVisibleText(el: Element): string {
  try {
    const text = (el as HTMLElement).innerText ?? el.textContent ?? '';
    return text.trim().toLowerCase();
  } catch {
    return (el.textContent ?? '').trim().toLowerCase();
  }
}

/** Check if element is visible (not hidden via CSS or attrs) */
function isVisible(el: Element): boolean {
  try {
    const htmlEl = el as HTMLElement;
    if (htmlEl.offsetParent === null && htmlEl.style?.position !== 'fixed') {
      // Could be hidden, but body and fixed elements have null offsetParent
      if (el.tagName !== 'BODY' && el.tagName !== 'HTML') {
        const style = window.getComputedStyle(el);
        if (style.display === 'none' || style.visibility === 'hidden') return false;
      }
    }
    if (el.hasAttribute('hidden')) return false;
    if (el.getAttribute('aria-hidden') === 'true') return false;
    return true;
  } catch {
    return true; // assume visible if we can't check
  }
}

/** Get the vertical position of an element (0 = top, 1 = bottom of page) */
function getVerticalPosition(el: Element): number {
  try {
    const rect = el.getBoundingClientRect();
    const docHeight = document.documentElement.scrollHeight || 1;
    return (rect.top + window.scrollY) / docHeight;
  } catch {
    return 0.5;
  }
}

/** Generate a CSS selector for an element (simple version for pagination) */
function quickSelector(el: Element): string {
  try {
    // Prefer ID
    if (el.id && !/^\d+$/.test(el.id) && !el.id.startsWith('__')) {
      return `#${CSS.escape(el.id)}`;
    }

    // Prefer aria-label or data-testid
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel) {
      return `[aria-label="${CSS.escape(ariaLabel)}"]`;
    }

    const testId = el.getAttribute('data-testid');
    if (testId) {
      return `[data-testid="${CSS.escape(testId)}"]`;
    }

    // Tag + meaningful class
    const tag = el.tagName.toLowerCase();
    const classes = (el.className?.toString?.() ?? '').split(/\s+/).filter(c => c.length > 2);
    const meaningful = classes.find(c =>
      !/^(mt-|mb-|p-|m-|w-|h-|text-|bg-|flex|grid|col-|d-)/i.test(c)
    );

    if (meaningful) {
      return `${tag}.${CSS.escape(meaningful)}`;
    }

    // href-based for links
    if (el.tagName === 'A') {
      const href = el.getAttribute('href');
      if (href && href.length < 200) {
        return `a[href="${CSS.escape(href)}"]`;
      }
    }

    return tag;
  } catch {
    return el.tagName?.toLowerCase() ?? '*';
  }
}

/** Find elements matching any of the given selectors */
function safeQueryAll(doc: Document, selectors: string[]): Element[] {
  const results: Element[] = [];
  for (const selector of selectors) {
    try {
      const matches = doc.querySelectorAll(selector);
      for (let i = 0; i < matches.length; i++) {
        results.push(matches[i]);
      }
    } catch {
      // Invalid selector, skip
    }
  }
  return results;
}

// ---------------------------------------------------------------------------
// Strategy A: Navigation Elements
// ---------------------------------------------------------------------------

function detectNavigationPagination(doc: Document): PaginationConfig[] {
  const results: PaginationConfig[] = [];

  try {
    // Find pagination containers
    const paginationContainers: Element[] = [];

    // 1. <nav> elements with pagination-related attributes
    const navs = doc.querySelectorAll('nav');
    for (let i = 0; i < navs.length; i++) {
      const nav = navs[i];
      const cls = nav.className?.toString?.() ?? '';
      const ariaLabel = nav.getAttribute('aria-label') ?? '';
      const role = nav.getAttribute('role') ?? '';
      if (
        PAGINATION_CLASS_RE.test(cls) ||
        /pag/i.test(ariaLabel) ||
        PAGINATION_ROLE_RE.test(role)
      ) {
        paginationContainers.push(nav);
      }
    }

    // 2. Any element with pagination-related class
    const allPagElements = safeQueryAll(doc, [
      '[class*="pagination"]',
      '[class*="pager"]',
      '[class*="paging"]',
      '[class*="page-nav"]',
      '[class*="nav-page"]',
      '[role="navigation"]',
      'ul.pagination',
      '.pagination',
      '.pager',
    ]);
    for (const el of allPagElements) {
      if (!paginationContainers.includes(el)) {
        paginationContainers.push(el);
      }
    }

    // 3. Find "Next" buttons/links in these containers (or in the full doc as fallback)
    const searchRoots = paginationContainers.length > 0
      ? paginationContainers
      : [doc.body || doc.documentElement];

    for (const container of searchRoots) {
      if (!container) continue;

      // Find links and buttons
      const clickables = container.querySelectorAll('a, button, [role="button"]');
      let nextElement: Element | null = null;
      let nextConfidence = 0;

      for (let i = 0; i < clickables.length; i++) {
        const el = clickables[i];
        if (!isVisible(el)) continue;

        const text = getVisibleText(el);
        const ariaLabel = (el.getAttribute('aria-label') ?? '').toLowerCase();
        const title = (el.getAttribute('title') ?? '').toLowerCase();
        const rel = (el.getAttribute('rel') ?? '').toLowerCase();
        const combined = `${text} ${ariaLabel} ${title}`;

        // Check for "next" indicators
        let isNext = false;
        let conf = 0;

        if (rel === 'next') {
          isNext = true;
          conf = 0.95;
        } else {
          for (const pattern of NEXT_PATTERNS) {
            if (combined.includes(pattern)) {
              isNext = true;
              // Longer matches are more reliable
              conf = Math.max(conf, pattern.length > 3 ? 0.85 : 0.65);
            }
          }
        }

        // Skip if it's actually a "previous" button
        if (isNext) {
          let isPrev = false;
          for (const pattern of PREV_PATTERNS) {
            if (combined.includes(pattern) && !combined.includes('next')) {
              isPrev = true;
              break;
            }
          }
          if (isPrev) continue;
        }

        if (isNext && conf > nextConfidence) {
          nextConfidence = conf;
          nextElement = el;
        }
      }

      if (nextElement && nextConfidence > 0) {
        // Boost confidence if element is near the bottom of the page
        const vertPos = getVerticalPosition(nextElement);
        if (vertPos > 0.7) nextConfidence = Math.min(nextConfidence + 0.1, 1.0);

        // Boost if inside a pagination container
        if (paginationContainers.length > 0 && paginationContainers.some(c => c.contains(nextElement!))) {
          nextConfidence = Math.min(nextConfidence + 0.05, 1.0);
        }

        const selector = quickSelector(nextElement);

        results.push({
          mode: 'click-next',
          selector,
          maxPages: 50,
          delayMs: 1000,
          confidence: nextConfidence,
        });

        // Also try to extract URL pattern from the next link
        if (nextElement.tagName === 'A') {
          const href = nextElement.getAttribute('href');
          if (href) {
            const urlConfig = analyzeUrlForPattern(href, doc.location?.href);
            if (urlConfig) {
              results.push(urlConfig);
            }
          }
        }
      }
    }
  } catch {
    // Strategy failed silently
  }

  return results;
}

// ---------------------------------------------------------------------------
// Strategy B: URL Analysis
// ---------------------------------------------------------------------------

function detectUrlPagination(doc: Document): PaginationConfig[] {
  const results: PaginationConfig[] = [];

  try {
    const currentUrl = doc.location?.href;
    if (!currentUrl) return results;

    const parsed = new URL(currentUrl);

    // Check query parameters for page indicators
    for (const param of PAGE_PARAMS) {
      const value = parsed.searchParams.get(param);
      if (value && /^\d+$/.test(value)) {
        const pageNum = parseInt(value, 10);
        // Build pattern by replacing the page number
        const pattern = currentUrl.replace(
          new RegExp(`([?&])${escapeRegex(param)}=\\d+`),
          `$1${param}={page}`
        );

        results.push({
          mode: 'url-pattern',
          urlPattern: pattern,
          maxPages: 50,
          delayMs: 1000,
          confidence: 0.90,
          apiPageParam: param,
        });
        break; // Use the first matching param
      }
    }

    // Check for offset parameters
    for (const param of OFFSET_PARAMS) {
      const value = parsed.searchParams.get(param);
      if (value && /^\d+$/.test(value)) {
        const pattern = currentUrl.replace(
          new RegExp(`([?&])${escapeRegex(param)}=\\d+`),
          `$1${param}={offset}`
        );

        results.push({
          mode: 'url-pattern',
          urlPattern: pattern,
          maxPages: 50,
          delayMs: 1000,
          confidence: 0.85,
          apiPageParam: param,
        });
        break;
      }
    }

    // Check for path-based pagination: /page/2/, /p/2/
    const pathMatch = parsed.pathname.match(/\/(page|p|pg)\/(\d+)\/?/i);
    if (pathMatch) {
      const pattern = currentUrl.replace(
        /\/(page|p|pg)\/\d+/i,
        `/${pathMatch[1]}/{page}`
      );

      results.push({
        mode: 'url-pattern',
        urlPattern: pattern,
        maxPages: 50,
        delayMs: 1000,
        confidence: 0.90,
      });
    }

    // Scan page links to detect pagination URL patterns even when current URL has no page param
    if (results.length === 0) {
      const pageLinks = findPaginationLinks(doc, currentUrl);
      if (pageLinks) {
        results.push(pageLinks);
      }
    }
  } catch {
    // URL parsing failed
  }

  return results;
}

/** Analyze a single URL (like a "next" link) for pagination pattern */
function analyzeUrlForPattern(href: string, currentUrl?: string): PaginationConfig | null {
  try {
    const base = currentUrl || href;
    const resolved = new URL(href, base);
    const resolvedStr = resolved.href;

    // Check query params
    for (const param of PAGE_PARAMS) {
      const value = resolved.searchParams.get(param);
      if (value && /^\d+$/.test(value)) {
        const pattern = resolvedStr.replace(
          new RegExp(`([?&])${escapeRegex(param)}=\\d+`),
          `$1${param}={page}`
        );
        return {
          mode: 'url-pattern',
          urlPattern: pattern,
          maxPages: 50,
          delayMs: 1000,
          confidence: 0.80,
          apiPageParam: param,
        };
      }
    }

    // Check path-based
    const pathMatch = resolved.pathname.match(/\/(page|p|pg)\/(\d+)\/?/i);
    if (pathMatch) {
      const pattern = resolvedStr.replace(
        /\/(page|p|pg)\/\d+/i,
        `/${pathMatch[1]}/{page}`
      );
      return {
        mode: 'url-pattern',
        urlPattern: pattern,
        maxPages: 50,
        delayMs: 1000,
        confidence: 0.80,
      };
    }
  } catch {
    // ignore
  }

  return null;
}

/** Scan the page for numbered pagination links to detect URL patterns */
function findPaginationLinks(doc: Document, currentUrl: string): PaginationConfig | null {
  try {
    // Find links with numeric text content (page numbers)
    const links = doc.querySelectorAll('a[href]');
    const numberedLinks: { href: string; num: number }[] = [];

    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const text = getVisibleText(link).trim();
      if (/^\d{1,4}$/.test(text)) {
        const num = parseInt(text, 10);
        if (num >= 1 && num <= 500) {
          const href = link.getAttribute('href');
          if (href) {
            numberedLinks.push({ href, num });
          }
        }
      }
    }

    if (numberedLinks.length < 2) return null;

    // Sort by number
    numberedLinks.sort((a, b) => a.num - b.num);

    // Find a consistent URL pattern across consecutive page links
    for (let i = 0; i < numberedLinks.length - 1; i++) {
      const a = numberedLinks[i];
      const b = numberedLinks[i + 1];

      if (b.num - a.num !== 1) continue; // not consecutive

      try {
        const urlA = new URL(a.href, currentUrl).href;
        const urlB = new URL(b.href, currentUrl).href;

        // Find the differing part (should be the page number)
        const numStrA = a.num.toString();
        const numStrB = b.num.toString();

        const posA = urlA.lastIndexOf(numStrA);
        const posB = urlB.lastIndexOf(numStrB);

        if (posA >= 0 && posB >= 0) {
          // The surrounding context should be the same
          const prefixA = urlA.substring(0, posA);
          const suffixA = urlA.substring(posA + numStrA.length);
          const prefixB = urlB.substring(0, posB);
          const suffixB = urlB.substring(posB + numStrB.length);

          if (prefixA === prefixB && suffixA === suffixB) {
            const pattern = prefixA + '{page}' + suffixA;
            return {
              mode: 'url-pattern',
              urlPattern: pattern,
              maxPages: 50,
              delayMs: 1000,
              confidence: 0.75,
            };
          }
        }
      } catch {
        continue;
      }
    }
  } catch {
    // ignore
  }

  return null;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// ---------------------------------------------------------------------------
// Strategy C: Infinite Scroll Detection
// ---------------------------------------------------------------------------

function detectInfiniteScroll(doc: Document): PaginationConfig[] {
  const results: PaginationConfig[] = [];

  try {
    let confidence = 0;
    let scrollTarget: string | undefined;

    // 1. Look for sentinel/loading elements at the bottom of content
    const sentinelSelectors = [
      '[data-loading]', '[data-infinite]', '[data-sentinel]',
      '.loading-sentinel', '.scroll-sentinel', '.infinite-scroll-trigger',
      '.infinite-loader', '.load-trigger', '.scroll-trigger',
      '[class*="sentinel"]', '[class*="infinite"]',
      '[class*="loading-more"]', '[class*="load-more-sentinel"]',
    ];

    const sentinels = safeQueryAll(doc, sentinelSelectors);
    for (const sentinel of sentinels) {
      if (isVisible(sentinel) || sentinel.hasAttribute('data-loading')) {
        const vertPos = getVerticalPosition(sentinel);
        if (vertPos > 0.6) {
          confidence = Math.max(confidence, 0.70);
          scrollTarget = quickSelector(sentinel);
        }
      }
    }

    // 2. Check for data-* attributes that indicate infinite scroll state
    const infiniteAttrs = doc.querySelectorAll(
      '[data-has-more], [data-next-page], [data-page], [data-offset], [data-cursor]'
    );
    if (infiniteAttrs.length > 0) {
      confidence = Math.max(confidence, 0.65);
    }

    // 3. Check for scroll-related data attributes on the body or main containers
    const containers = safeQueryAll(doc, [
      '[data-infinite-scroll]', '[infinite-scroll]',
      '[data-scroll-pagination]', '.infinite-scroll',
      '[class*="infinite-scroll"]',
    ]);
    if (containers.length > 0) {
      confidence = Math.max(confidence, 0.80);
      scrollTarget = scrollTarget ?? quickSelector(containers[0]);
    }

    // 4. Check for spinning/loading indicators near the bottom
    const spinners = safeQueryAll(doc, [
      '.spinner', '.loading', '.loader', '[class*="spinner"]', '[class*="loader"]',
      '[role="progressbar"]', '.sk-spinner', '.lds-ring',
      '[class*="loading-indicator"]',
    ]);
    for (const spinner of spinners) {
      const vertPos = getVerticalPosition(spinner);
      if (vertPos > 0.7) {
        confidence = Math.max(confidence, 0.55);
      }
    }

    // 5. Detect IntersectionObserver markers via common patterns
    // Check for elements with data-observe or data-intersection attributes
    const observerTargets = safeQueryAll(doc, [
      '[data-observe]', '[data-intersection]', '[data-waypoint]',
      '.waypoint', '.intersection-observer',
    ]);
    if (observerTargets.length > 0) {
      for (const target of observerTargets) {
        const vertPos = getVerticalPosition(target);
        if (vertPos > 0.6) {
          confidence = Math.max(confidence, 0.60);
          scrollTarget = scrollTarget ?? quickSelector(target);
        }
      }
    }

    if (confidence > 0.4) {
      results.push({
        mode: 'auto-scroll',
        scrollTarget,
        scrollSpeed: 'medium',
        maxPages: 50,
        delayMs: 2000,
        confidence,
      });
    }
  } catch {
    // Strategy failed silently
  }

  return results;
}

// ---------------------------------------------------------------------------
// Strategy D: Load More Buttons
// ---------------------------------------------------------------------------

function detectLoadMoreButtons(doc: Document, listSelector?: string): PaginationConfig[] {
  const results: PaginationConfig[] = [];

  try {
    // Find all buttons and clickable elements
    const clickables = doc.querySelectorAll('button, a, [role="button"], input[type="button"], input[type="submit"]');
    const candidates: { el: Element; confidence: number }[] = [];

    for (let i = 0; i < clickables.length; i++) {
      const el = clickables[i];
      if (!isVisible(el)) continue;

      const text = getVisibleText(el);
      const ariaLabel = (el.getAttribute('aria-label') ?? '').toLowerCase();
      const title = (el.getAttribute('title') ?? '').toLowerCase();
      const combined = `${text} ${ariaLabel} ${title}`;

      for (const pattern of LOAD_MORE_PATTERNS) {
        if (combined.includes(pattern)) {
          let conf = 0.75;

          // Boost if the text is primarily the load-more phrase (not incidental)
          if (text.length < pattern.length + 15) conf += 0.10;

          // Boost if it's below the list
          const vertPos = getVerticalPosition(el);
          if (vertPos > 0.5) conf += 0.05;
          if (vertPos > 0.7) conf += 0.05;

          // Boost if near the list selector
          if (listSelector) {
            try {
              const listEl = doc.querySelector(listSelector);
              if (listEl) {
                const listRect = listEl.getBoundingClientRect();
                const btnRect = el.getBoundingClientRect();
                // Button should be below or at the bottom of the list
                if (btnRect.top >= listRect.bottom - 50) {
                  conf += 0.05;
                }
              }
            } catch {
              // ignore
            }
          }

          candidates.push({ el, confidence: Math.min(conf, 1.0) });
          break; // Only match first pattern per element
        }
      }
    }

    // Take the best candidate
    if (candidates.length > 0) {
      candidates.sort((a, b) => b.confidence - a.confidence);
      const best = candidates[0];

      results.push({
        mode: 'load-more',
        selector: quickSelector(best.el),
        maxPages: 50,
        delayMs: 1500,
        confidence: best.confidence,
      });
    }
  } catch {
    // Strategy failed silently
  }

  return results;
}

// ---------------------------------------------------------------------------
// Strategy E: API Pattern Monitoring
// ---------------------------------------------------------------------------

function detectApiPatterns(doc: Document): PaginationConfig[] {
  const results: PaginationConfig[] = [];

  try {
    // Strategy: Look for script tags or data attributes that reveal API endpoints
    // We can't intercept actual network requests from content script without
    // background page cooperation, but we can find clues in the DOM.

    // 1. Check for Next.js / Nuxt.js / SPA data scripts
    const dataScripts = doc.querySelectorAll(
      'script[id="__NEXT_DATA__"], script[id="__NUXT__"], script[type="application/json"]'
    );

    for (let i = 0; i < dataScripts.length; i++) {
      const script = dataScripts[i];
      const text = script.textContent ?? '';
      if (text.length > 10000000) continue; // skip huge scripts

      try {
        // Look for API endpoint patterns in the JSON data
        const apiPatterns = text.match(/"(\/api\/[^"]+)"/g);
        if (apiPatterns) {
          for (const match of apiPatterns) {
            const endpoint = match.replace(/"/g, '');
            // Check if it has pagination params
            for (const param of [...PAGE_PARAMS, ...OFFSET_PARAMS, ...CURSOR_PARAMS]) {
              if (endpoint.includes(param)) {
                results.push({
                  mode: 'api-intercept',
                  apiEndpoint: endpoint,
                  apiPageParam: param,
                  maxPages: 50,
                  delayMs: 1000,
                  confidence: 0.60,
                });
                break;
              }
            }
          }
        }
      } catch {
        // JSON parse errors, etc.
      }
    }

    // 2. Check for data attributes revealing API state
    const apiStateElements = safeQueryAll(doc, [
      '[data-api-url]', '[data-endpoint]', '[data-fetch-url]',
      '[data-next-url]', '[data-next-page-url]',
      '[data-api]', '[data-source-url]',
    ]);

    for (const el of apiStateElements) {
      const apiUrl = el.getAttribute('data-api-url') ??
                     el.getAttribute('data-endpoint') ??
                     el.getAttribute('data-fetch-url') ??
                     el.getAttribute('data-next-url') ??
                     el.getAttribute('data-next-page-url') ??
                     el.getAttribute('data-api') ??
                     el.getAttribute('data-source-url');

      if (apiUrl) {
        for (const param of [...PAGE_PARAMS, ...OFFSET_PARAMS, ...CURSOR_PARAMS]) {
          if (apiUrl.includes(param)) {
            results.push({
              mode: 'api-intercept',
              apiEndpoint: apiUrl,
              apiPageParam: param,
              maxPages: 50,
              delayMs: 1000,
              confidence: 0.55,
            });
            break;
          }
        }
      }
    }

    // 3. Check for rel="next" link in <head>
    const relNext = doc.querySelector('link[rel="next"]');
    if (relNext) {
      const href = relNext.getAttribute('href');
      if (href) {
        const urlConfig = analyzeUrlForPattern(href, doc.location?.href);
        if (urlConfig) {
          urlConfig.confidence = Math.min(urlConfig.confidence + 0.10, 1.0);
          results.push(urlConfig);
        }
      }
    }
  } catch {
    // Strategy failed silently
  }

  return results;
}

// ---------------------------------------------------------------------------
// Result Merging & Deduplication
// ---------------------------------------------------------------------------

/** Merge and deduplicate pagination configs from all strategies */
function mergeResults(configs: PaginationConfig[]): PaginationConfig[] {
  if (configs.length === 0) return [];

  // Group by mode
  const byMode = new Map<PaginationMode, PaginationConfig[]>();
  for (const config of configs) {
    const group = byMode.get(config.mode) ?? [];
    group.push(config);
    byMode.set(config.mode, group);
  }

  // For each mode, keep the highest confidence config
  const merged: PaginationConfig[] = [];
  for (const [, group] of byMode) {
    group.sort((a, b) => b.confidence - a.confidence);

    // For url-pattern mode, check if patterns are different enough to keep multiples
    if (group[0].mode === 'url-pattern' && group.length > 1) {
      const seen = new Set<string>();
      for (const config of group) {
        const key = config.urlPattern ?? '';
        if (!seen.has(key)) {
          seen.add(key);
          merged.push(config);
          if (merged.length >= 3) break; // max 3 URL patterns
        }
      }
    } else {
      merged.push(group[0]);
    }
  }

  // Sort by confidence
  merged.sort((a, b) => b.confidence - a.confidence);

  return merged;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Detect pagination patterns on a web page.
 *
 * Runs all 5 detection strategies in parallel and returns a ranked list of
 * pagination configurations. The highest-confidence result should be used
 * as the default, but the user can choose alternatives.
 *
 * @param doc - The Document to analyze
 * @param listSelector - Optional CSS selector for the main list/grid being extracted
 * @returns Array of PaginationConfig objects sorted by confidence (highest first)
 */
export function detectPagination(doc: Document, listSelector?: string): PaginationConfig[] {
  const allConfigs: PaginationConfig[] = [];

  // Run all strategies, catching errors per-strategy so one failure
  // doesn't prevent the others from returning results.

  try {
    const navConfigs = detectNavigationPagination(doc);
    allConfigs.push(...navConfigs);
  } catch {
    // Strategy A failed
  }

  try {
    const urlConfigs = detectUrlPagination(doc);
    allConfigs.push(...urlConfigs);
  } catch {
    // Strategy B failed
  }

  try {
    const scrollConfigs = detectInfiniteScroll(doc);
    allConfigs.push(...scrollConfigs);
  } catch {
    // Strategy C failed
  }

  try {
    const loadMoreConfigs = detectLoadMoreButtons(doc, listSelector);
    allConfigs.push(...loadMoreConfigs);
  } catch {
    // Strategy D failed
  }

  try {
    const apiConfigs = detectApiPatterns(doc);
    allConfigs.push(...apiConfigs);
  } catch {
    // Strategy E failed
  }

  return mergeResults(allConfigs);
}
