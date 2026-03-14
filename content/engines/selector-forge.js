/**
 * SelectorForge™ — Optimal CSS Selector Generation Engine
 * Given a target element and its siblings, generates the most stable, readable CSS selector.
 * Multiple strategies scored by specificity × stability × readability.
 * No ML. Just combinatorial optimization.
 */
(function () {
  'use strict';

  const UTILITY_CLASS_PATTERN = /^(mt-|mb-|ml-|mr-|mx-|my-|pt-|pb-|pl-|pr-|px-|py-|p-|m-|w-|h-|min-|max-|flex|grid|col-|row-|gap-|space-|text-|font-|bg-|border-|rounded-|shadow-|opacity-|z-|absolute|relative|fixed|sticky|block|inline|hidden|overflow-|cursor-|transition-|duration-|ease-|animate-|transform|scale-|rotate-|translate-|skew-|origin-|object-|align-|justify-|items-|self-|order-|float-|clear-|sr-only|not-sr-only|container$|sm:|md:|lg:|xl:|2xl:|hover:|focus:|active:|disabled:|group-|peer-|dark:|ring-|outline-|placeholder-|decoration-)/;

  class SelectorForge {
    /**
     * Generate the best CSS selector for a target element.
     * @param {Element} el - Target element
     * @param {Element} root - Root scope (default document.body)
     * @returns {Object} { selector, matchCount, score, strategy }
     */
    generate(el, root = document.body) {
      const strategies = [
        this._tryDataAttributes(el, root),
        this._trySemanticClasses(el, root),
        this._tryAriaAndRole(el, root),
        this._tryIdPath(el, root),
        this._tryStructuralPath(el, root),
        this._tryNthChild(el, root),
      ].filter(Boolean);

      if (strategies.length === 0) {
        // Absolute fallback
        return {
          selector: this._generateFallbackSelector(el),
          matchCount: 1,
          score: 0.1,
          strategy: 'fallback',
          specificity: 0.1,
          stability: 0.1,
          readability: 0.1,
        };
      }

      // Score each strategy
      strategies.sort((a, b) => b.score - a.score);
      return strategies[0];
    }

    /**
     * Generate a selector that matches ALL siblings of the same pattern.
     * Used for list extraction.
     * @param {Element[]} elements - Sample elements from the group
     * @param {Element} parent - Common parent
     * @returns {Object} { selector, matchCount, score, strategy }
     */
    generateForGroup(elements, parent) {
      if (elements.length === 0) return null;

      const sample = elements[0];
      const strategies = [];

      // Strategy 1: Common data attributes
      const commonDataAttrs = this._findCommonDataAttributes(elements);
      for (const attr of commonDataAttrs) {
        const parentSel = this._getShortPath(parent);
        const sel = `${parentSel} > [${attr}]`;
        const count = this._testSelector(sel);
        if (count >= elements.length) {
          strategies.push({
            selector: sel,
            matchCount: count,
            score: 0.9,
            strategy: 'data-attribute',
            specificity: 0.9,
            stability: 0.95,
            readability: 0.8,
          });
        }
      }

      // Strategy 2: Common semantic classes
      const commonClasses = this._findCommonSemanticClasses(elements);
      if (commonClasses.length > 0) {
        const tag = sample.tagName.toLowerCase();
        const parentSel = this._getShortPath(parent);
        const classSel = commonClasses.map(c => '.' + CSS.escape(c)).join('');
        const sel = `${parentSel} > ${tag}${classSel}`;
        const count = this._testSelector(sel);
        if (count >= elements.length * 0.8) {
          strategies.push({
            selector: sel,
            matchCount: count,
            score: 0.85,
            strategy: 'semantic-class',
            specificity: 0.85,
            stability: 0.8,
            readability: 0.9,
          });
        }
      }

      // Strategy 3: Tag within parent
      const tag = sample.tagName.toLowerCase();
      const parentSel = this._getShortPath(parent);
      const tagSel = `${parentSel} > ${tag}`;
      const tagCount = this._testSelector(tagSel);
      if (tagCount >= elements.length * 0.8 && tagCount <= elements.length * 1.5) {
        strategies.push({
          selector: tagSel,
          matchCount: tagCount,
          score: 0.7,
          strategy: 'tag-only',
          specificity: 0.6,
          stability: 0.7,
          readability: 0.95,
        });
      }

      // Strategy 4: Direct children wildcard
      const wildcardSel = `${parentSel} > *`;
      const wildcardCount = this._testSelector(wildcardSel);
      strategies.push({
        selector: wildcardSel,
        matchCount: wildcardCount,
        score: 0.5,
        strategy: 'wildcard',
        specificity: 0.4,
        stability: 0.6,
        readability: 0.95,
      });

      strategies.sort((a, b) => b.score - a.score);
      return strategies[0] || null;
    }

    /**
     * Generate a relative selector for a sub-element within a list item.
     * Used for column mapping.
     * @param {Element} target - Sub-element to select
     * @param {Element} itemRoot - Root of the list item
     * @returns {Object} { selector, matchCount, attribute }
     */
    generateRelative(target, itemRoot) {
      // Try meaningful attributes first
      if (target.tagName === 'A' && target.href) {
        const rel = this._relativePathTo(target, itemRoot);
        return { selector: rel || 'a', attribute: 'href' };
      }
      if (target.tagName === 'IMG') {
        const rel = this._relativePathTo(target, itemRoot);
        return { selector: rel || 'img', attribute: 'src' };
      }

      // Try class-based relative selector
      const semClasses = this._getSemanticClasses(target);
      if (semClasses.length > 0) {
        const tag = target.tagName.toLowerCase();
        const classSel = semClasses.map(c => '.' + CSS.escape(c)).join('');
        const sel = `${tag}${classSel}`;
        // Test this within all items
        return { selector: sel, attribute: 'textContent' };
      }

      // Structural relative path
      const rel = this._relativePathTo(target, itemRoot);
      if (rel) return { selector: rel, attribute: target.tagName === 'IMG' ? 'src' : 'textContent' };

      return { selector: target.tagName.toLowerCase(), attribute: 'textContent' };
    }

    /**
     * Build a visual breadcrumb path for a selector.
     * e.g., "body > main > div.products > div.card"
     */
    toBreadcrumb(selector) {
      const parts = selector.split(/\s*>\s*|\s+/).filter(Boolean);
      return parts.map(part => {
        // Parse tag, id, classes from selector part
        const match = part.match(/^([a-z0-9]+)?(?:#([a-z0-9_-]+))?(?:\.([\w.-]+(?:\.[a-z0-9_-]+)*))?(?::.*)?$/i);
        if (match) {
          return {
            tag: match[1] || '*',
            id: match[2] || null,
            classes: match[3] ? match[3].split('.').filter(Boolean) : [],
            raw: part,
          };
        }
        return { tag: part, id: null, classes: [], raw: part };
      });
    }

    // ========== STRATEGIES ==========

    _tryDataAttributes(el, root) {
      const attrs = ['data-testid', 'data-id', 'data-item-id', 'data-product-id',
                     'data-key', 'data-type', 'data-name', 'data-index'];

      for (const attr of attrs) {
        if (el.hasAttribute(attr)) {
          const sel = `[${attr}="${CSS.escape(el.getAttribute(attr))}"]`;
          const count = this._testSelector(sel, root);
          if (count === 1) {
            return {
              selector: sel,
              matchCount: count,
              score: this._calcScore(1.0, 0.9, 0.7),
              strategy: 'data-attribute',
              specificity: 1.0,
              stability: 0.9,
              readability: 0.7,
            };
          }
        }
      }
      return null;
    }

    _trySemanticClasses(el, root) {
      const classes = this._getSemanticClasses(el);
      if (classes.length === 0) return null;

      const tag = el.tagName.toLowerCase();

      // Try with all semantic classes
      const classSel = classes.map(c => '.' + CSS.escape(c)).join('');
      const sel = `${tag}${classSel}`;
      const count = this._testSelector(sel, root);

      if (count >= 1 && count <= 3) {
        return {
          selector: sel,
          matchCount: count,
          score: this._calcScore(count === 1 ? 0.95 : 0.7, 0.85, 0.9),
          strategy: 'semantic-class',
          specificity: count === 1 ? 0.95 : 0.7,
          stability: 0.85,
          readability: 0.9,
        };
      }
      return null;
    }

    _tryAriaAndRole(el, root) {
      const role = el.getAttribute('role');
      const label = el.getAttribute('aria-label');

      if (label) {
        const sel = `[aria-label="${CSS.escape(label)}"]`;
        const count = this._testSelector(sel, root);
        if (count === 1) {
          return {
            selector: sel,
            matchCount: 1,
            score: this._calcScore(1.0, 0.8, 0.6),
            strategy: 'aria',
            specificity: 1.0,
            stability: 0.8,
            readability: 0.6,
          };
        }
      }

      if (role) {
        const tag = el.tagName.toLowerCase();
        const sel = `${tag}[role="${role}"]`;
        const count = this._testSelector(sel, root);
        if (count >= 1 && count <= 5) {
          return {
            selector: sel,
            matchCount: count,
            score: this._calcScore(count === 1 ? 0.9 : 0.5, 0.85, 0.7),
            strategy: 'role',
            specificity: count === 1 ? 0.9 : 0.5,
            stability: 0.85,
            readability: 0.7,
          };
        }
      }
      return null;
    }

    _tryIdPath(el, root) {
      // Walk up to find nearest ID
      let current = el;
      const path = [];
      let depth = 0;

      while (current && current !== root && depth < 6) {
        if (current.id && /^[a-zA-Z]/.test(current.id) && !/^:/.test(current.id)) {
          path.unshift('#' + CSS.escape(current.id));
          break;
        }
        if (current !== el) {
          const tag = current.tagName.toLowerCase();
          const classes = this._getSemanticClasses(current);
          path.unshift(classes.length > 0 ? `${tag}.${classes.map(c => CSS.escape(c)).join('.')}` : tag);
        } else {
          const tag = current.tagName.toLowerCase();
          const classes = this._getSemanticClasses(current);
          path.unshift(classes.length > 0 ? `${tag}.${classes.map(c => CSS.escape(c)).join('.')}` : tag);
        }
        current = current.parentElement;
        depth++;
      }

      if (path.length > 0 && path[0].startsWith('#')) {
        const sel = path.join(' > ');
        const count = this._testSelector(sel, root);
        if (count >= 1) {
          return {
            selector: sel,
            matchCount: count,
            score: this._calcScore(count === 1 ? 0.95 : 0.6, 0.9, 0.75),
            strategy: 'id-path',
            specificity: count === 1 ? 0.95 : 0.6,
            stability: 0.9,
            readability: 0.75,
          };
        }
      }
      return null;
    }

    _tryStructuralPath(el, root) {
      const path = [];
      let current = el;
      let depth = 0;

      while (current && current !== root && current !== document.body && depth < 5) {
        const tag = current.tagName.toLowerCase();
        const classes = this._getSemanticClasses(current);

        if (classes.length > 0) {
          path.unshift(`${tag}.${classes.map(c => CSS.escape(c)).join('.')}`);
        } else {
          path.unshift(tag);
        }
        current = current.parentElement;
        depth++;
      }

      if (path.length > 0) {
        const sel = path.join(' > ');
        const count = this._testSelector(sel, root);
        if (count >= 1 && count <= 10) {
          return {
            selector: sel,
            matchCount: count,
            score: this._calcScore(count === 1 ? 0.8 : 0.4, 0.6, 0.85),
            strategy: 'structural',
            specificity: count === 1 ? 0.8 : 0.4,
            stability: 0.6,
            readability: 0.85,
          };
        }
      }
      return null;
    }

    _tryNthChild(el, root) {
      const path = [];
      let current = el;
      let depth = 0;

      while (current && current !== root && current !== document.body && depth < 5) {
        const tag = current.tagName.toLowerCase();
        const parent = current.parentElement;

        if (parent) {
          const siblings = Array.from(parent.children).filter(c => c.tagName === current.tagName);
          if (siblings.length > 1) {
            const idx = siblings.indexOf(current) + 1;
            path.unshift(`${tag}:nth-of-type(${idx})`);
          } else {
            path.unshift(tag);
          }
        } else {
          path.unshift(tag);
        }

        current = parent;
        depth++;
      }

      if (path.length > 0) {
        const sel = path.join(' > ');
        const count = this._testSelector(sel, root);
        return {
          selector: sel,
          matchCount: count,
          score: this._calcScore(count === 1 ? 0.7 : 0.3, 0.4, 0.5),
          strategy: 'nth-child',
          specificity: count === 1 ? 0.7 : 0.3,
          stability: 0.4,
          readability: 0.5,
        };
      }
      return null;
    }

    // ========== HELPERS ==========

    _calcScore(specificity, stability, readability) {
      return (specificity * 0.4) + (stability * 0.35) + (readability * 0.25);
    }

    _testSelector(selector, root) {
      try {
        return (root || document).querySelectorAll(selector).length;
      } catch (e) {
        return 0;
      }
    }

    _getSemanticClasses(el) {
      if (!el.classList || el.classList.length === 0) return [];
      return Array.from(el.classList)
        .filter(c => !UTILITY_CLASS_PATTERN.test(c) && c.length > 1 && !/^\d/.test(c))
        .slice(0, 3);
    }

    _findCommonDataAttributes(elements) {
      if (elements.length === 0) return [];
      const first = elements[0];
      const common = [];

      for (const attr of first.attributes) {
        if (attr.name.startsWith('data-') && attr.name !== 'data-reactroot') {
          const allHave = elements.every(el => el.hasAttribute(attr.name));
          if (allHave) common.push(attr.name);
        }
      }
      return common;
    }

    _findCommonSemanticClasses(elements) {
      if (elements.length === 0) return [];
      const firstClasses = this._getSemanticClasses(elements[0]);
      return firstClasses.filter(cls =>
        elements.every(el => el.classList.contains(cls))
      );
    }

    _getShortPath(el) {
      if (el.id && /^[a-zA-Z]/.test(el.id)) return '#' + CSS.escape(el.id);

      const parts = [];
      let current = el;
      let depth = 0;

      while (current && current !== document.body && depth < 4) {
        if (current.id && /^[a-zA-Z]/.test(current.id)) {
          parts.unshift('#' + CSS.escape(current.id));
          break;
        }
        const tag = current.tagName.toLowerCase();
        const classes = this._getSemanticClasses(current);
        parts.unshift(classes.length > 0 ? `${tag}.${classes.map(c => CSS.escape(c)).join('.')}` : tag);
        current = current.parentElement;
        depth++;
      }

      return parts.join(' > ');
    }

    _relativePathTo(target, root) {
      const parts = [];
      let current = target;
      let depth = 0;

      while (current && current !== root && depth < 5) {
        const tag = current.tagName.toLowerCase();
        const classes = this._getSemanticClasses(current);

        if (classes.length > 0) {
          parts.unshift(`${tag}.${classes.map(c => CSS.escape(c)).join('.')}`);
        } else {
          const parent = current.parentElement;
          if (parent && parent !== root) {
            const siblings = Array.from(parent.children).filter(c => c.tagName === current.tagName);
            if (siblings.length > 1) {
              const idx = siblings.indexOf(current) + 1;
              parts.unshift(`${tag}:nth-of-type(${idx})`);
            } else {
              parts.unshift(tag);
            }
          } else {
            parts.unshift(tag);
          }
        }

        current = current.parentElement;
        depth++;
      }

      return parts.length > 0 ? parts.join(' > ') : null;
    }

    _generateFallbackSelector(el) {
      const path = [];
      let current = el;
      let depth = 0;

      while (current && current !== document.body && depth < 6) {
        const tag = current.tagName.toLowerCase();
        const parent = current.parentElement;
        if (parent) {
          const idx = Array.from(parent.children).indexOf(current) + 1;
          path.unshift(`${tag}:nth-child(${idx})`);
        } else {
          path.unshift(tag);
        }
        current = parent;
        depth++;
      }

      return path.join(' > ');
    }
  }

  window.DataForge = window.DataForge || {};
  window.DataForge.SelectorForge = SelectorForge;
})();
