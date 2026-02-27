/**
 * PatternSense™ — DOM Pattern Detection Engine
 * Scans the DOM tree to find repeating data structures.
 * Uses heuristic scoring: itemCount × structuralDepth × contentDiversity × visualArea × semanticSignals.
 * No ML. Just smart tree traversal and scoring.
 */
(function () {
  'use strict';

  const SEMANTIC_KEYWORDS = [
    'product', 'card', 'item', 'listing', 'result', 'review', 'post',
    'article', 'entry', 'row', 'record', 'feed', 'tile', 'block',
    'grid-item', 'list-item', 'gallery', 'search-result', 'offer',
    'deal', 'property', 'job', 'event', 'comment', 'reply', 'thread',
    'story', 'news', 'blog', 'recipe', 'course', 'book', 'movie',
  ];

  const CONTAINER_KEYWORDS = [
    'list', 'grid', 'results', 'feed', 'gallery', 'container',
    'wrapper', 'collection', 'items', 'products', 'cards', 'posts',
    'reviews', 'listings', 'entries', 'table-body', 'tbody',
  ];

  const SKIP_TAGS = new Set([
    'SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'CANVAS', 'VIDEO', 'AUDIO',
    'IFRAME', 'OBJECT', 'EMBED', 'HEAD', 'META', 'LINK', 'BR', 'HR',
    'INPUT', 'SELECT', 'TEXTAREA', 'BUTTON', 'LABEL',
  ]);

  const NAV_SKIP_TAGS = new Set(['NAV', 'HEADER', 'FOOTER']);

  class PatternSense {
    constructor() {
      this.cache = new Map();
      this.lastScanTime = 0;
    }

    /**
     * Scan the page DOM and return detected repeating patterns.
     * @param {Document} doc
     * @param {Object} options
     * @returns {Array} Ranked patterns
     */
    scan(doc = document, options = {}) {
      const startTime = performance.now();
      const candidates = [];
      const minChildren = options.minChildren || 3;
      const maxResults = options.maxResults || 8;

      // Walk the DOM using TreeWalker for performance
      const walker = doc.createTreeWalker(
        doc.body || doc.documentElement,
        NodeFilter.SHOW_ELEMENT,
        {
          acceptNode: (node) => {
            if (SKIP_TAGS.has(node.tagName)) return NodeFilter.FILTER_REJECT;
            if (node.offsetWidth === 0 && node.offsetHeight === 0) return NodeFilter.FILTER_SKIP;
            return NodeFilter.FILTER_ACCEPT;
          },
        }
      );

      const visited = new Set();

      let node = walker.currentNode;
      while (node) {
        if (!visited.has(node) && node.children && node.children.length >= minChildren) {
          const groups = this._groupChildren(node);
          for (const group of groups) {
            if (group.elements.length >= minChildren) {
              const candidate = this._evaluateGroup(node, group, doc);
              if (candidate && candidate.confidence > 0.15) {
                candidates.push(candidate);
              }
            }
          }
          visited.add(node);
        }
        node = walker.nextNode();
      }

      // Also check tables
      const tables = doc.querySelectorAll('table');
      for (const table of tables) {
        const tbody = table.querySelector('tbody') || table;
        const rows = tbody.querySelectorAll('tr');
        if (rows.length >= minChildren) {
          const candidate = this._evaluateTableRows(table, rows, doc);
          if (candidate && candidate.confidence > 0.1) {
            candidates.push(candidate);
          }
        }
      }

      // Deduplicate (remove nested patterns)
      const deduped = this._deduplicatePatterns(candidates);

      // Sort by score descending
      deduped.sort((a, b) => b.score - a.score);

      this.lastScanTime = performance.now() - startTime;

      return deduped.slice(0, maxResults);
    }

    /**
     * Group children of a parent by their structural signature (tag + class pattern).
     */
    _groupChildren(parent) {
      const groups = new Map();

      for (const child of parent.children) {
        if (SKIP_TAGS.has(child.tagName)) continue;
        if (child.offsetWidth === 0 && child.offsetHeight === 0) continue;

        const sig = this._getSignature(child);
        if (!groups.has(sig)) {
          groups.set(sig, { signature: sig, elements: [] });
        }
        groups.get(sig).elements.push(child);
      }

      return Array.from(groups.values());
    }

    /**
     * Generate a structural signature for an element.
     * Includes tag name and filtered class names (excluding utility classes).
     */
    _getSignature(el) {
      const tag = el.tagName;
      const classes = this._getSemanticClasses(el);
      const childStructure = this._getChildStructureFingerprint(el);
      return `${tag}[${classes.join('.')}]{${childStructure}}`;
    }

    /**
     * Get non-utility class names (skip Tailwind/Bootstrap utility classes).
     */
    _getSemanticClasses(el) {
      if (!el.classList || el.classList.length === 0) return [];

      const utilityPatterns = /^(mt-|mb-|ml-|mr-|mx-|my-|pt-|pb-|pl-|pr-|px-|py-|p-|m-|w-|h-|min-|max-|flex|grid|col-|row-|gap-|space-|text-|font-|bg-|border-|rounded-|shadow-|opacity-|z-|absolute|relative|fixed|sticky|block|inline|hidden|overflow-|cursor-|transition-|duration-|ease-|animate-|transform|scale-|rotate-|translate-|skew-|origin-|object-|align-|justify-|items-|self-|order-|float-|clear-|sr-only|not-sr-only|container|sm:|md:|lg:|xl:|2xl:|hover:|focus:|active:|disabled:|group-|peer-|dark:|ring-|outline-|placeholder-|decoration-|underline|line-through|no-underline|uppercase|lowercase|capitalize|normal-case|truncate|break-|tracking-|leading-|list-|whitespace-|tabular|ordinal|slashed|lining|oldstyle|proportional|diagonal|stacked|indent-|align-|vertical-|table-|caption-|webkit-|moz-|ms-)/;

      return Array.from(el.classList).filter(c => !utilityPatterns.test(c) && c.length > 1).slice(0, 3);
    }

    /**
     * Get a fingerprint of child element structure (tags only, first 8 children).
     */
    _getChildStructureFingerprint(el) {
      const children = Array.from(el.children).slice(0, 8);
      return children.map(c => c.tagName).join(',');
    }

    /**
     * Evaluate a group of similar elements and create a candidate pattern.
     */
    _evaluateGroup(parent, group, doc) {
      const elements = group.elements;
      if (elements.length < 3) return null;

      // Check if parent is in nav/header/footer (usually not data)
      if (this._isInNavigation(parent)) return null;

      const itemCount = elements.length;
      const structuralDepth = this._getAverageDepth(elements);
      const contentDiversity = this._getContentDiversity(elements);
      const visualArea = this._getVisualArea(elements);
      const maxVisualArea = (doc.documentElement.clientWidth || 1200) * (doc.documentElement.clientHeight || 800);
      const semanticScore = this._getSemanticScore(parent, elements);
      const contentRichness = this._getContentRichness(elements);

      // Main scoring formula
      const score =
        (itemCount * 2) +
        (structuralDepth * 1.5) +
        (contentDiversity * 3) +
        ((visualArea / maxVisualArea) * 4) +
        (semanticScore * 2) +
        (contentRichness * 2.5);

      // Confidence is normalized score (0-1)
      const maxPossibleScore = 100;
      const confidence = Math.min(score / maxPossibleScore, 1);

      // Generate a CSS selector for this group
      const selector = this._generateGroupSelector(parent, elements[0]);
      if (!selector) return null;

      // Determine category
      const category = this._categorize(parent, elements, semanticScore);

      // Get bounding rect of all elements
      const boundingRect = this._getCombinedBoundingRect(elements);

      return {
        id: 'pattern_' + Math.random().toString(36).substr(2, 9),
        selector,
        parentSelector: this._generateParentSelector(parent),
        itemCount,
        sampleElements: elements.slice(0, 3),
        allElements: elements,
        confidence,
        score,
        category,
        fields: [], // Will be populated by TypeSense
        boundingRect,
        visualArea,
        metrics: {
          structuralDepth,
          contentDiversity,
          semanticScore,
          contentRichness,
        },
      };
    }

    /**
     * Evaluate table rows as a pattern.
     */
    _evaluateTableRows(table, rows, doc) {
      const elements = Array.from(rows);
      const itemCount = elements.length;

      // Skip header rows
      const headerRow = table.querySelector('thead tr');
      const dataRows = headerRow
        ? elements.filter(r => !r.closest('thead'))
        : elements;

      if (dataRows.length < 3) return null;

      const visualArea = this._getVisualArea(dataRows);
      const maxVisualArea = (doc.documentElement.clientWidth || 1200) * (doc.documentElement.clientHeight || 800);
      const contentDiversity = this._getContentDiversity(dataRows);

      const score = (dataRows.length * 3) + (contentDiversity * 4) + ((visualArea / maxVisualArea) * 5) + 10; // bonus for being a table

      const selector = this._generateTableRowSelector(table);

      return {
        id: 'pattern_' + Math.random().toString(36).substr(2, 9),
        selector,
        parentSelector: this._getCssPath(table),
        itemCount: dataRows.length,
        sampleElements: dataRows.slice(0, 3),
        allElements: dataRows,
        confidence: Math.min(score / 80, 1),
        score,
        category: 'table-row',
        fields: [],
        boundingRect: this._getCombinedBoundingRect(dataRows),
        visualArea,
        metrics: {
          structuralDepth: 2,
          contentDiversity,
          semanticScore: 5,
          contentRichness: 1,
        },
      };
    }

    /**
     * Check if an element is inside navigation, header, or footer.
     */
    _isInNavigation(el) {
      let current = el;
      while (current && current !== document.body) {
        if (NAV_SKIP_TAGS.has(current.tagName)) return true;
        if (current.getAttribute('role') === 'navigation') return true;
        const cls = (current.className || '').toLowerCase();
        if (/\b(nav|navbar|menu|footer|header|sidebar|breadcrumb)\b/.test(cls)) return true;
        current = current.parentElement;
      }
      return false;
    }

    /**
     * Get average depth of child elements within each item.
     */
    _getAverageDepth(elements) {
      let totalDepth = 0;
      const sample = elements.slice(0, 5);
      for (const el of sample) {
        totalDepth += this._getMaxDepth(el, 0);
      }
      return totalDepth / sample.length;
    }

    _getMaxDepth(el, current) {
      if (current > 10) return current; // cap recursion
      let max = current;
      for (const child of el.children) {
        if (SKIP_TAGS.has(child.tagName)) continue;
        max = Math.max(max, this._getMaxDepth(child, current + 1));
      }
      return max;
    }

    /**
     * Measure content diversity: ratio of unique text content.
     * High diversity = real data. Low diversity = repeated template/nav.
     */
    _getContentDiversity(elements) {
      const texts = new Set();
      const sample = elements.slice(0, 20);
      for (const el of sample) {
        const text = (el.textContent || '').trim().substring(0, 100);
        if (text.length > 0) texts.add(text);
      }
      return sample.length > 0 ? texts.size / sample.length : 0;
    }

    /**
     * Total visual area of elements.
     */
    _getVisualArea(elements) {
      let totalArea = 0;
      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        totalArea += rect.width * rect.height;
      }
      return totalArea;
    }

    /**
     * Semantic scoring based on class names, roles, and DOM context.
     */
    _getSemanticScore(parent, elements) {
      let score = 0;

      // Check parent classes/attributes
      const parentClasses = (parent.className || '').toLowerCase();
      const parentId = (parent.id || '').toLowerCase();

      for (const kw of CONTAINER_KEYWORDS) {
        if (parentClasses.includes(kw) || parentId.includes(kw)) {
          score += 2;
          break;
        }
      }

      // Check element classes
      const sampleEl = elements[0];
      const elClasses = (sampleEl.className || '').toLowerCase();
      for (const kw of SEMANTIC_KEYWORDS) {
        if (elClasses.includes(kw)) {
          score += 2;
          break;
        }
      }

      // Check ARIA roles
      if (sampleEl.getAttribute('role') === 'listitem') score += 2;
      if (parent.getAttribute('role') === 'list') score += 2;
      if (parent.tagName === 'UL' || parent.tagName === 'OL') score += 1;

      // Check if inside <main> or <article>
      if (parent.closest('main') || parent.closest('article')) score += 1;

      // Data attributes suggesting list items
      if (sampleEl.hasAttribute('data-id') || sampleEl.hasAttribute('data-item-id') ||
          sampleEl.hasAttribute('data-product-id') || sampleEl.hasAttribute('data-index')) {
        score += 2;
      }

      return score;
    }

    /**
     * Content richness: average number of distinct sub-elements (links, images, text nodes).
     */
    _getContentRichness(elements) {
      const sample = elements.slice(0, 5);
      let totalScore = 0;

      for (const el of sample) {
        let richness = 0;
        if (el.querySelector('a[href]')) richness += 1;
        if (el.querySelector('img')) richness += 1;
        if (el.querySelector('h1,h2,h3,h4,h5,h6')) richness += 1;
        if (el.querySelector('p')) richness += 0.5;
        if (el.querySelector('span,div')) richness += 0.3;
        if (el.querySelector('[class*="price"],[class*="cost"],[class*="amount"]')) richness += 1;
        if (el.querySelector('[class*="rating"],[class*="star"],[class*="score"]')) richness += 0.5;
        if (el.querySelector('time,[datetime]')) richness += 0.5;
        totalScore += richness;
      }

      return sample.length > 0 ? totalScore / sample.length : 0;
    }

    /**
     * Generate CSS selector for a group of siblings.
     */
    _generateGroupSelector(parent, sampleChild) {
      // Try data-attribute based selector
      const dataAttrs = ['data-testid', 'data-id', 'data-item', 'data-product', 'data-type'];
      for (const attr of dataAttrs) {
        if (sampleChild.hasAttribute(attr)) {
          const val = sampleChild.getAttribute(attr);
          const parentSel = this._getCssPath(parent);
          return `${parentSel} > [${attr}]`;
        }
      }

      // Try semantic class + tag
      const tag = sampleChild.tagName.toLowerCase();
      const semClasses = this._getSemanticClasses(sampleChild);
      const parentSel = this._getCssPath(parent);

      if (semClasses.length > 0) {
        const classSelector = semClasses.map(c => '.' + CSS.escape(c)).join('');
        const testSelector = `${parentSel} > ${tag}${classSelector}`;
        try {
          const matches = document.querySelectorAll(testSelector);
          if (matches.length > 0) return testSelector;
        } catch (e) { /* invalid selector */ }
      }

      // Try tag only within parent
      const tagOnlySel = `${parentSel} > ${tag}`;
      try {
        const matches = document.querySelectorAll(tagOnlySel);
        if (matches.length >= 3) return tagOnlySel;
      } catch (e) { /* invalid selector */ }

      return parentSel + ' > *';
    }

    _generateTableRowSelector(table) {
      const parentSel = this._getCssPath(table);
      const hasTbody = table.querySelector('tbody');
      return hasTbody ? `${parentSel} tbody tr` : `${parentSel} tr`;
    }

    _generateParentSelector(el) {
      return this._getCssPath(el);
    }

    /**
     * Generate a reasonably short CSS path for an element.
     */
    _getCssPath(el) {
      const parts = [];
      let current = el;
      let depth = 0;

      while (current && current !== document.body && current !== document.documentElement && depth < 5) {
        let selector = current.tagName.toLowerCase();

        if (current.id && /^[a-zA-Z]/.test(current.id)) {
          selector = '#' + CSS.escape(current.id);
          parts.unshift(selector);
          break;
        }

        const semClasses = this._getSemanticClasses(current);
        if (semClasses.length > 0) {
          selector += semClasses.map(c => '.' + CSS.escape(c)).join('');
        } else {
          // Use nth-child if no classes
          const parent = current.parentElement;
          if (parent) {
            const siblings = Array.from(parent.children).filter(c => c.tagName === current.tagName);
            if (siblings.length > 1) {
              const index = siblings.indexOf(current) + 1;
              selector += `:nth-of-type(${index})`;
            }
          }
        }

        parts.unshift(selector);
        current = current.parentElement;
        depth++;
      }

      return parts.join(' > ');
    }

    /**
     * Get combined bounding rect of multiple elements.
     */
    _getCombinedBoundingRect(elements) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const el of elements) {
        const rect = el.getBoundingClientRect();
        minX = Math.min(minX, rect.left);
        minY = Math.min(minY, rect.top);
        maxX = Math.max(maxX, rect.right);
        maxY = Math.max(maxY, rect.bottom);
      }
      return { left: minX, top: minY, right: maxX, bottom: maxY, width: maxX - minX, height: maxY - minY };
    }

    /**
     * Categorize the pattern type.
     */
    _categorize(parent, elements, semanticScore) {
      const parentClasses = (parent.className || '' + ' ' + parent.id || '').toLowerCase();
      const elClasses = (elements[0].className || '').toLowerCase();
      const combined = parentClasses + ' ' + elClasses;

      if (/product|shop|store|price|buy/.test(combined)) return 'product';
      if (/review|rating|comment|feedback/.test(combined)) return 'review';
      if (/article|post|blog|news|story/.test(combined)) return 'article';
      if (/listing|property|job|offer/.test(combined)) return 'listing';
      if (parent.tagName === 'TABLE' || parent.tagName === 'TBODY') return 'table-row';
      if (/feed|timeline|stream/.test(combined)) return 'feed-item';
      if (/card|tile/.test(combined)) return 'card';
      if (elements[0].tagName === 'LI' || parent.tagName === 'UL' || parent.tagName === 'OL') return 'listing';
      return 'generic';
    }

    /**
     * Remove nested/overlapping patterns. Keep the higher-scoring one.
     */
    _deduplicatePatterns(patterns) {
      const result = [];
      const used = new Set();

      for (let i = 0; i < patterns.length; i++) {
        if (used.has(i)) continue;

        let best = patterns[i];
        let bestIdx = i;

        for (let j = i + 1; j < patterns.length; j++) {
          if (used.has(j)) continue;

          // Check if patterns overlap (one contains the other)
          if (this._patternsOverlap(patterns[i], patterns[j])) {
            if (patterns[j].score > best.score) {
              used.add(bestIdx);
              best = patterns[j];
              bestIdx = j;
            } else {
              used.add(j);
            }
          }
        }

        result.push(best);
        used.add(bestIdx);
      }

      return result;
    }

    _patternsOverlap(a, b) {
      // Check if elements of one pattern contain elements of another
      const aSet = new Set(a.allElements || a.sampleElements);
      const bSet = new Set(b.allElements || b.sampleElements);

      for (const el of aSet) {
        for (const bel of bSet) {
          if (el.contains(bel) || bel.contains(el)) return true;
        }
      }
      return false;
    }

    /**
     * Quick scan: find the single most likely data pattern on the page.
     * Used for Quick Extract feature.
     */
    quickScan(doc = document) {
      const patterns = this.scan(doc, { minChildren: 3, maxResults: 1 });
      return patterns[0] || null;
    }

    /**
     * Scan around a specific element (used when user hovers).
     * Returns patterns that include or are near the target element.
     */
    scanAroundElement(el, doc = document) {
      const patterns = [];

      // Check the element's parent
      let current = el;
      for (let i = 0; i < 5 && current && current !== doc.body; i++) {
        const parent = current.parentElement;
        if (parent && parent.children.length >= 3) {
          const groups = this._groupChildren(parent);
          for (const group of groups) {
            if (group.elements.includes(current) && group.elements.length >= 3) {
              const candidate = this._evaluateGroup(parent, group, doc);
              if (candidate && candidate.confidence > 0.1) {
                patterns.push(candidate);
              }
            }
          }
        }
        current = parent;
      }

      patterns.sort((a, b) => b.score - a.score);
      return patterns.slice(0, 3);
    }
  }

  // Register globally
  window.DataForge = window.DataForge || {};
  window.DataForge.PatternSense = PatternSense;
})();
