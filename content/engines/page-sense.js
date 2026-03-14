/**
 * PageSense™ — Pagination Detection Engine
 * Multi-strategy detection of pagination patterns: navigation elements, URL analysis,
 * infinite scroll, load more buttons, and API pagination patterns.
 * No ML. Just comprehensive heuristic analysis.
 */
(function () {
  'use strict';

  const NEXT_KEYWORDS = [
    'next', 'volgende', 'siguiente', 'suivant', 'nächste', 'prossimo',
    'далее', '次', '다음', '›', '»', '→', '>', '>>', 'more',
    'next page', 'load more', 'show more', 'see more', 'view more',
    'see all', 'view all', 'load all', 'show all', 'more results',
  ];

  const LOAD_MORE_KEYWORDS = [
    'load more', 'show more', 'see more', 'view more', 'more results',
    'load additional', 'show additional', 'expand', 'see all results',
  ];

  const PAGE_URL_PATTERNS = [
    /[?&](page|p|pg|pn|pagenum|pagenumber)=(\d+)/i,
    /[?&](offset|start|skip|from)=(\d+)/i,
    /\/page\/(\d+)/i,
    /\/p\/(\d+)/i,
    /\/(\d+)\/?$/,
  ];

  class PageSense {
    constructor() {
      this.scrollObserver = null;
      this.mutationCount = 0;
      this.lastScrollMutations = 0;
    }

    /**
     * Detect all pagination strategies on the current page.
     * @param {Document} doc
     * @returns {Array} Sorted by confidence, each with { type, config, confidence, element? }
     */
    detect(doc = document) {
      const results = [];

      // Strategy 1: Next button detection
      const nextButton = this._findNextButton(doc);
      if (nextButton) {
        results.push({
          type: 'click-next',
          confidence: nextButton.confidence,
          element: nextButton.element,
          selector: nextButton.selector,
          config: {
            selector: nextButton.selector,
            waitForNavigation: nextButton.isLink,
            waitTime: 2000,
          },
        });
      }

      // Strategy 2: Pagination navigation (page numbers)
      const pageNav = this._findPageNavigation(doc);
      if (pageNav) {
        results.push({
          type: 'click-next',
          confidence: pageNav.confidence,
          element: pageNav.nextElement,
          selector: pageNav.nextSelector,
          config: {
            selector: pageNav.nextSelector,
            waitForNavigation: true,
            waitTime: 2000,
            totalPages: pageNav.totalPages,
          },
        });
      }

      // Strategy 3: URL pattern detection
      const urlPattern = this._detectURLPattern(doc);
      if (urlPattern) {
        results.push({
          type: 'url-pattern',
          confidence: urlPattern.confidence,
          config: {
            pattern: urlPattern.pattern,
            currentPage: urlPattern.currentPage,
            paramName: urlPattern.paramName,
            increment: urlPattern.increment,
            maxPages: 100,
          },
        });
      }

      // Strategy 4: Load more button
      const loadMore = this._findLoadMoreButton(doc);
      if (loadMore) {
        results.push({
          type: 'load-more',
          confidence: loadMore.confidence,
          element: loadMore.element,
          selector: loadMore.selector,
          config: {
            selector: loadMore.selector,
            waitTime: 1500,
            maxClicks: 50,
          },
        });
      }

      // Strategy 5: Infinite scroll detection
      const infiniteScroll = this._detectInfiniteScroll(doc);
      if (infiniteScroll) {
        results.push({
          type: 'auto-scroll',
          confidence: infiniteScroll.confidence,
          config: {
            scrollTarget: infiniteScroll.scrollTarget || 'window',
            scrollSpeed: 'medium',
            waitTime: 1500,
            maxScrolls: 50,
            sentinelSelector: infiniteScroll.sentinelSelector,
          },
        });
      }

      // Always include manual scroll as fallback
      results.push({
        type: 'auto-scroll',
        confidence: 0.1,
        config: {
          scrollTarget: 'window',
          scrollSpeed: 'medium',
          waitTime: 2000,
          maxScrolls: 20,
        },
      });

      // Deduplicate by type (keep highest confidence)
      const seen = new Map();
      for (const r of results) {
        if (!seen.has(r.type) || seen.get(r.type).confidence < r.confidence) {
          seen.set(r.type, r);
        }
      }

      const deduped = Array.from(seen.values());
      deduped.sort((a, b) => b.confidence - a.confidence);
      return deduped;
    }

    /**
     * Find "Next" button or link.
     */
    _findNextButton(doc) {
      const candidates = [];

      // Search all links and buttons
      const elements = doc.querySelectorAll('a, button, [role="button"], [class*="next"], [class*="pagination"]');

      for (const el of elements) {
        if (!el.offsetParent && el.offsetWidth === 0) continue; // hidden

        const text = (el.textContent || '').trim().toLowerCase();
        const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
        const title = (el.getAttribute('title') || '').toLowerCase();
        const classes = (el.className || '').toLowerCase();
        const rel = (el.getAttribute('rel') || '').toLowerCase();

        let score = 0;
        let matched = false;

        // Check text content
        for (const kw of NEXT_KEYWORDS.slice(0, 10)) { // primary next keywords
          if (text === kw || text.includes(kw)) {
            score += 5;
            matched = true;
            break;
          }
        }

        // Check arrow characters
        if (/^[›»→>]+$/.test(text.trim())) {
          score += 4;
          matched = true;
        }

        // Check aria-label
        if (ariaLabel.includes('next')) {
          score += 4;
          matched = true;
        }

        // Check title
        if (title.includes('next')) {
          score += 3;
          matched = true;
        }

        // Check class name
        if (/next|forward|arrow-right/.test(classes)) {
          score += 3;
          matched = true;
        }

        // Check rel="next"
        if (rel === 'next') {
          score += 5;
          matched = true;
        }

        // Position bonus: bottom half of page
        const rect = el.getBoundingClientRect();
        if (rect.top > doc.documentElement.clientHeight * 0.5) score += 1;

        // Is it a link with href?
        if (el.tagName === 'A' && el.href && !el.href.startsWith('javascript:')) {
          score += 1;
        }

        if (matched && score > 2) {
          candidates.push({
            element: el,
            selector: this._generateSelector(el),
            confidence: Math.min(score / 12, 0.95),
            isLink: el.tagName === 'A',
          });
        }
      }

      candidates.sort((a, b) => b.confidence - a.confidence);
      return candidates[0] || null;
    }

    /**
     * Find pagination navigation (page 1, 2, 3... links).
     */
    _findPageNavigation(doc) {
      // Look for nav elements or elements with pagination-related classes
      const navSelectors = [
        'nav[aria-label*="pag"]',
        '[class*="pagination"]',
        '[class*="pager"]',
        '[role="navigation"]',
        'nav',
      ];

      for (const sel of navSelectors) {
        const navEls = doc.querySelectorAll(sel);
        for (const nav of navEls) {
          const links = nav.querySelectorAll('a, button');
          const pageLinks = [];

          for (const link of links) {
            const text = (link.textContent || '').trim();
            if (/^\d+$/.test(text)) {
              pageLinks.push({ element: link, page: parseInt(text) });
            }
          }

          if (pageLinks.length >= 2) {
            // Find current page (usually has active/current class or is not a link)
            const currentPage = this._findCurrentPage(nav, pageLinks);
            const maxPage = Math.max(...pageLinks.map(p => p.page));

            // Find next page link
            const nextPage = pageLinks.find(p => p.page === currentPage + 1);
            if (nextPage) {
              return {
                confidence: 0.9,
                nextElement: nextPage.element,
                nextSelector: this._generateSelector(nextPage.element),
                currentPage,
                totalPages: maxPage,
              };
            }

            // Look for explicit next button within this nav
            const nextBtn = this._findNextButton(nav);
            if (nextBtn) {
              return {
                confidence: 0.85,
                nextElement: nextBtn.element,
                nextSelector: nextBtn.selector,
                currentPage,
                totalPages: maxPage,
              };
            }
          }
        }
      }

      return null;
    }

    _findCurrentPage(nav, pageLinks) {
      for (const pl of pageLinks) {
        const el = pl.element;
        const classes = (el.className || '').toLowerCase();
        if (/active|current|selected|disabled/.test(classes)) return pl.page;
        if (el.getAttribute('aria-current') === 'page') return pl.page;
        // If it's a span instead of a link
        if (el.tagName === 'SPAN') return pl.page;
      }
      // Check for non-link page number
      const allText = nav.querySelectorAll('span, strong, b, em');
      for (const el of allText) {
        const text = (el.textContent || '').trim();
        if (/^\d+$/.test(text)) {
          const classes = (el.className || '').toLowerCase();
          if (/active|current|selected/.test(classes)) return parseInt(text);
        }
      }
      return 1;
    }

    /**
     * Detect URL-based pagination patterns.
     */
    _detectURLPattern(doc) {
      const url = doc.location.href;

      for (const pattern of PAGE_URL_PATTERNS) {
        const match = url.match(pattern);
        if (match) {
          const currentPage = parseInt(match[match.length - 1]) || 1;
          const paramName = match[1] || 'page';

          return {
            confidence: 0.85,
            pattern: url,
            currentPage,
            paramName,
            increment: paramName.match(/offset|start|skip|from/i) ? 10 : 1, // offset-based vs page-based
          };
        }
      }

      // Check canonical/next link tags
      const nextLink = doc.querySelector('link[rel="next"]');
      if (nextLink && nextLink.href) {
        return {
          confidence: 0.9,
          pattern: nextLink.href,
          currentPage: 1,
          paramName: 'auto',
          increment: 1,
        };
      }

      return null;
    }

    /**
     * Find "Load More" or "Show More" button.
     */
    _findLoadMoreButton(doc) {
      const candidates = [];

      const elements = doc.querySelectorAll('button, a, [role="button"], div[onclick], span[onclick]');

      for (const el of elements) {
        if (!el.offsetParent && el.offsetWidth === 0 && el.offsetHeight === 0) continue;

        const text = (el.textContent || '').trim().toLowerCase();
        const ariaLabel = (el.getAttribute('aria-label') || '').toLowerCase();
        const classes = (el.className || '').toLowerCase();

        let score = 0;

        for (const kw of LOAD_MORE_KEYWORDS) {
          if (text.includes(kw) || ariaLabel.includes(kw)) {
            score += 5;
            break;
          }
        }

        if (/load.?more|show.?more|see.?more|view.?more/.test(classes)) {
          score += 3;
        }

        // Position: should be below main content
        const rect = el.getBoundingClientRect();
        if (rect.top > doc.documentElement.clientHeight * 0.4) score += 1;

        if (score > 3) {
          candidates.push({
            element: el,
            selector: this._generateSelector(el),
            confidence: Math.min(score / 8, 0.9),
          });
        }
      }

      candidates.sort((a, b) => b.confidence - a.confidence);
      return candidates[0] || null;
    }

    /**
     * Detect infinite scroll behavior.
     */
    _detectInfiniteScroll(doc) {
      const signals = [];
      let confidence = 0;

      // Check for loading spinners at bottom
      const bottomElements = doc.querySelectorAll(
        '[class*="loading"], [class*="spinner"], [class*="loader"], ' +
        '[class*="infinite"], [class*="scroll-load"], [class*="lazy"]'
      );

      for (const el of bottomElements) {
        const rect = el.getBoundingClientRect();
        const pageHeight = doc.documentElement.scrollHeight;
        const viewportHeight = doc.documentElement.clientHeight;

        if (rect.top > viewportHeight * 0.8 || rect.top > pageHeight - viewportHeight) {
          confidence += 0.3;
          signals.push({ type: 'sentinel', element: el });
        }
      }

      // Check for intersection observer sentinels
      const sentinels = doc.querySelectorAll(
        '[data-sentinel], [data-infinite-scroll], [class*="sentinel"], ' +
        '[class*="intersect"], [class*="waypoint"]'
      );

      if (sentinels.length > 0) {
        confidence += 0.3;
        signals.push({ type: 'sentinel-element', element: sentinels[0] });
      }

      // Check if page is scrollable and content is much taller than viewport
      const scrollHeight = doc.documentElement.scrollHeight;
      const viewportHeight = doc.documentElement.clientHeight;
      if (scrollHeight > viewportHeight * 2) {
        confidence += 0.1;
      }

      // Check for "loading..." text at bottom
      const allText = doc.body.innerText || '';
      const lastChunk = allText.slice(-200).toLowerCase();
      if (/loading|fetching|getting more/.test(lastChunk)) {
        confidence += 0.2;
      }

      if (confidence > 0.2) {
        const sentinel = signals.find(s => s.element);
        return {
          confidence: Math.min(confidence, 0.85),
          scrollTarget: 'window',
          sentinelSelector: sentinel ? this._generateSelector(sentinel.element) : null,
        };
      }

      return null;
    }

    /**
     * Generate a CSS selector for an element (simplified version).
     */
    _generateSelector(el) {
      if (el.id && /^[a-zA-Z]/.test(el.id)) {
        return '#' + CSS.escape(el.id);
      }

      const parts = [];
      let current = el;
      let depth = 0;

      while (current && current !== document.body && depth < 5) {
        let sel = current.tagName.toLowerCase();

        if (current.id && /^[a-zA-Z]/.test(current.id)) {
          parts.unshift('#' + CSS.escape(current.id));
          break;
        }

        // Add meaningful classes
        const classes = Array.from(current.classList || [])
          .filter(c => c.length > 1 && !/^\d/.test(c))
          .slice(0, 2);

        if (classes.length > 0) {
          sel += classes.map(c => '.' + CSS.escape(c)).join('');
        } else {
          const parent = current.parentElement;
          if (parent) {
            const siblings = Array.from(parent.children).filter(c => c.tagName === current.tagName);
            if (siblings.length > 1) {
              const idx = siblings.indexOf(current) + 1;
              sel += `:nth-of-type(${idx})`;
            }
          }
        }

        parts.unshift(sel);
        current = current.parentElement;
        depth++;
      }

      return parts.join(' > ');
    }

    /**
     * Generate the next URL given a URL pattern and current page.
     */
    getNextURL(config) {
      const { pattern, currentPage, paramName, increment } = config;
      const nextPage = currentPage + increment;

      // Replace page parameter in URL
      for (const regex of PAGE_URL_PATTERNS) {
        if (regex.test(pattern)) {
          return pattern.replace(regex, (match, ...groups) => {
            const num = groups[groups.length - 2]; // Last capture group before index
            return match.replace(num, String(nextPage));
          });
        }
      }

      // Add page parameter
      const url = new URL(pattern);
      url.searchParams.set(paramName, String(nextPage));
      return url.toString();
    }
  }

  window.DataForge = window.DataForge || {};
  window.DataForge.PageSense = PageSense;
})();
