/**
 * SelectorForge - CSS Selector Generation Engine
 *
 * Generates optimal, stable CSS selectors for DOM elements using a
 * multi-strategy approach. Each strategy produces a selector candidate
 * scored on three dimensions:
 *
 *   - Specificity (0-1): How uniquely does it target the element?
 *   - Stability (0-1): How likely is it to survive DOM changes?
 *   - Readability (0-1): How understandable is it to a human?
 *
 * Strategies (ranked by quality):
 *   1. data-attribute  - [data-testid="..."], [data-id="..."]
 *   2. semantic-class  - .product-card, .review-item (skip utility classes)
 *   3. aria-role       - [role="listitem"], [aria-label="..."]
 *   4. structural-path - main > section > div.list > div
 *   5. nth-child       - .container > div:nth-child(3) > span
 */

import type { SelectorResult, SelectorPath, SelectorSegment } from '../../types/selector';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Utility class prefixes to skip (Tailwind, Bootstrap, common CSS frameworks) */
const UTILITY_PREFIXES = new Set([
  'mt-', 'mb-', 'ml-', 'mr-', 'mx-', 'my-', 'ms-', 'me-',
  'pt-', 'pb-', 'pl-', 'pr-', 'px-', 'py-', 'ps-', 'pe-',
  'p-', 'm-', 'w-', 'h-', 'min-w-', 'min-h-', 'max-w-', 'max-h-',
  'text-', 'bg-', 'border-', 'rounded-', 'shadow-', 'ring-',
  'font-', 'leading-', 'tracking-', 'opacity-',
  'flex-', 'grid-', 'col-', 'row-', 'gap-', 'space-',
  'justify-', 'items-', 'self-', 'place-', 'content-',
  'overflow-', 'z-', 'inset-', 'top-', 'right-', 'bottom-', 'left-',
  'translate-', 'rotate-', 'scale-', 'skew-',
  'transition-', 'duration-', 'ease-', 'delay-', 'animate-',
  'cursor-', 'pointer-events-', 'select-', 'resize-',
  'fill-', 'stroke-', 'decoration-', 'underline-', 'list-',
  'aspect-', 'break-', 'order-', 'grow-', 'shrink-', 'basis-',
  'snap-', 'scroll-', 'touch-', 'will-change-', 'accent-',
  // Bootstrap
  'd-', 'align-', 'float-', 'position-', 'visible-', 'invisible',
  'clearfix', 'g-', 'gx-', 'gy-',
]);

/** Single-word utility classes (exact matches) */
const UTILITY_EXACT = new Set([
  'flex', 'grid', 'block', 'inline', 'inline-block', 'inline-flex', 'inline-grid',
  'hidden', 'visible', 'invisible', 'collapse',
  'static', 'relative', 'absolute', 'fixed', 'sticky',
  'container', 'mx-auto', 'clearfix',
  'row', 'col', 'table', 'sr-only', 'not-sr-only',
  'truncate', 'antialiased', 'subpixel-antialiased',
  'italic', 'not-italic', 'uppercase', 'lowercase', 'capitalize', 'normal-case',
  'underline', 'overline', 'line-through', 'no-underline',
  'break-normal', 'break-words', 'break-all',
  'whitespace-normal', 'whitespace-nowrap', 'whitespace-pre',
  'object-contain', 'object-cover', 'object-fill',
]);

/** Data attributes commonly used for testing / identification */
const DATA_ID_ATTRS = [
  'data-testid', 'data-test-id', 'data-cy', 'data-qa',
  'data-id', 'data-item-id', 'data-product-id', 'data-component',
  'data-automation-id', 'data-e2e', 'data-name', 'data-type',
  'data-hook', 'data-tracking', 'data-asin', // Amazon
];

// ---------------------------------------------------------------------------
// Utility Functions
// ---------------------------------------------------------------------------

/** Check if a class name is a utility/framework class */
function isUtilityClass(cls: string): boolean {
  const lower = cls.toLowerCase();
  if (UTILITY_EXACT.has(lower)) return true;
  for (const prefix of UTILITY_PREFIXES) {
    if (lower.startsWith(prefix)) return true;
  }
  // Numeric-heavy classes are usually utility: "p-4", "mt-2", "w-1/2"
  if (/^[a-z]{1,3}-\d/.test(lower)) return true;
  if (/^-?[a-z]+-\[/.test(lower)) return true; // Tailwind arbitrary: "w-[300px]"
  // Single character
  if (lower.length <= 1) return true;
  return false;
}

/** Filter classes to only semantic/meaningful ones */
function getSemanticClasses(el: Element): string[] {
  const classList = el.className?.toString?.()?.trim();
  if (!classList) return [];

  return classList
    .split(/\s+/)
    .filter(cls => cls.length > 0 && !isUtilityClass(cls));
}

/** Escape a CSS selector value */
function cssEscape(value: string): string {
  try {
    return CSS.escape(value);
  } catch {
    // Fallback: manual escaping
    return value.replace(/([^\w-])/g, '\\$1');
  }
}

/** Count how many elements match a selector in a root */
function countMatches(selector: string, root: Element | Document): number {
  try {
    return root.querySelectorAll(selector).length;
  } catch {
    return 0;
  }
}

/** Check if element matches selector */
function elementMatches(el: Element, selector: string): boolean {
  try {
    return el.matches(selector);
  } catch {
    return false;
  }
}

/** Get nth-child index of element among its siblings */
function getNthChildIndex(el: Element): number {
  let index = 1;
  let sibling = el.previousElementSibling;
  while (sibling) {
    index++;
    sibling = sibling.previousElementSibling;
  }
  return index;
}

/** Get nth-of-type index of element among siblings of the same tag */
function getNthOfTypeIndex(el: Element): number {
  let index = 1;
  let sibling = el.previousElementSibling;
  while (sibling) {
    if (sibling.tagName === el.tagName) index++;
    sibling = sibling.previousElementSibling;
  }
  return index;
}

/** Count siblings of the same tag */
function countSameTagSiblings(el: Element): number {
  const parent = el.parentElement;
  if (!parent) return 1;
  let count = 0;
  for (let i = 0; i < parent.children.length; i++) {
    if (parent.children[i].tagName === el.tagName) count++;
  }
  return count;
}

/** Get the owning document root for selector queries */
function getQueryRoot(el: Element, root?: Element): Element | Document {
  if (root) return root;
  return el.ownerDocument ?? document;
}

// ---------------------------------------------------------------------------
// Strategy 1: Data Attributes
// ---------------------------------------------------------------------------

function strategyDataAttribute(
  el: Element,
  root: Element | Document,
): SelectorResult | null {
  for (const attr of DATA_ID_ATTRS) {
    const value = el.getAttribute(attr);
    if (!value || value.length > 100) continue;

    const selector = `[${attr}="${cssEscape(value)}"]`;
    const matchCount = countMatches(selector, root);

    if (matchCount >= 1 && elementMatches(el, selector)) {
      return {
        selector,
        specificity: matchCount === 1 ? 1.0 : 0.7,
        stability: 0.95,     // data-attributes rarely change
        readability: 0.85,
        totalScore: 0,       // computed below
        strategy: 'data-attribute',
        matchCount,
      };
    }
  }

  // Also check for any data-* attribute that looks like an ID
  const attrs = el.attributes;
  for (let i = 0; i < attrs.length; i++) {
    const attr = attrs[i];
    if (!attr.name.startsWith('data-')) continue;
    if (DATA_ID_ATTRS.includes(attr.name)) continue; // already tried
    if (!attr.value || attr.value.length > 80) continue;

    // Only use data-attrs that look like identifiers
    if (/id|key|name|type|kind|slug/i.test(attr.name)) {
      const selector = `[${attr.name}="${cssEscape(attr.value)}"]`;
      const matchCount = countMatches(selector, root);

      if (matchCount >= 1 && matchCount <= 3 && elementMatches(el, selector)) {
        return {
          selector,
          specificity: matchCount === 1 ? 0.95 : 0.6,
          stability: 0.85,
          readability: 0.75,
          totalScore: 0,
          strategy: 'data-attribute',
          matchCount,
        };
      }
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Strategy 2: Semantic Class
// ---------------------------------------------------------------------------

function strategySemanticClass(
  el: Element,
  root: Element | Document,
): SelectorResult | null {
  const semanticClasses = getSemanticClasses(el);
  if (semanticClasses.length === 0) return null;

  const tag = el.tagName.toLowerCase();

  // Try single class first (simplest selector)
  let bestResult: SelectorResult | null = null;
  let bestScore = -1;

  for (const cls of semanticClasses) {
    // Skip very generic classes
    if (/^(wrapper|inner|outer|content|main|section|component|module)$/i.test(cls)) continue;

    // Try with tag
    const selectorWithTag = `${tag}.${cssEscape(cls)}`;
    const matchCountWithTag = countMatches(selectorWithTag, root);

    if (matchCountWithTag >= 1 && elementMatches(el, selectorWithTag)) {
      const specificity = matchCountWithTag === 1 ? 1.0 : Math.max(0.3, 1.0 - matchCountWithTag * 0.05);
      const stability = 0.80;
      const readability = 0.90;
      const score = specificity * stability * readability;

      if (score > bestScore) {
        bestScore = score;
        bestResult = {
          selector: selectorWithTag,
          specificity,
          stability,
          readability,
          totalScore: 0,
          strategy: 'semantic-class',
          matchCount: matchCountWithTag,
        };
      }
    }

    // Try without tag (more stable across redesigns)
    const selectorClassOnly = `.${cssEscape(cls)}`;
    const matchCountClassOnly = countMatches(selectorClassOnly, root);

    if (matchCountClassOnly >= 1 && elementMatches(el, selectorClassOnly)) {
      const specificity = matchCountClassOnly === 1 ? 1.0 : Math.max(0.3, 1.0 - matchCountClassOnly * 0.05);
      const stability = 0.85; // slightly more stable than with tag
      const readability = 0.85;
      const score = specificity * stability * readability;

      if (score > bestScore) {
        bestScore = score;
        bestResult = {
          selector: selectorClassOnly,
          specificity,
          stability,
          readability,
          totalScore: 0,
          strategy: 'semantic-class',
          matchCount: matchCountClassOnly,
        };
      }
    }
  }

  // Try combining 2 classes for better specificity
  if (semanticClasses.length >= 2 && (!bestResult || bestResult.specificity < 0.8)) {
    for (let i = 0; i < Math.min(semanticClasses.length, 4); i++) {
      for (let j = i + 1; j < Math.min(semanticClasses.length, 5); j++) {
        const combined = `.${cssEscape(semanticClasses[i])}.${cssEscape(semanticClasses[j])}`;
        const matchCount = countMatches(combined, root);

        if (matchCount >= 1 && elementMatches(el, combined)) {
          const specificity = matchCount === 1 ? 1.0 : Math.max(0.4, 1.0 - matchCount * 0.04);
          const stability = 0.75; // two classes = less stable
          const readability = 0.70;
          const score = specificity * stability * readability;

          if (score > bestScore) {
            bestScore = score;
            bestResult = {
              selector: combined,
              specificity,
              stability,
              readability,
              totalScore: 0,
              strategy: 'semantic-class',
              matchCount,
            };
          }
        }
      }
    }
  }

  return bestResult;
}

// ---------------------------------------------------------------------------
// Strategy 3: ARIA Role
// ---------------------------------------------------------------------------

function strategyAriaRole(
  el: Element,
  root: Element | Document,
): SelectorResult | null {
  const role = el.getAttribute('role');
  const ariaLabel = el.getAttribute('aria-label');
  const tag = el.tagName.toLowerCase();

  let bestResult: SelectorResult | null = null;
  let bestScore = -1;

  // Try role
  if (role) {
    const selector = `[role="${cssEscape(role)}"]`;
    const matchCount = countMatches(selector, root);

    if (matchCount >= 1 && elementMatches(el, selector)) {
      const specificity = matchCount === 1 ? 1.0 : Math.max(0.2, 1.0 - matchCount * 0.03);
      const stability = 0.90;
      const readability = 0.80;
      const score = specificity * stability * readability;

      if (score > bestScore) {
        bestScore = score;
        bestResult = {
          selector,
          specificity,
          stability,
          readability,
          totalScore: 0,
          strategy: 'aria-role',
          matchCount,
        };
      }
    }

    // Role + tag
    const withTag = `${tag}[role="${cssEscape(role)}"]`;
    const matchCountTag = countMatches(withTag, root);
    if (matchCountTag >= 1 && matchCountTag < matchCount && elementMatches(el, withTag)) {
      const specificity = matchCountTag === 1 ? 1.0 : Math.max(0.3, 1.0 - matchCountTag * 0.04);
      const stability = 0.85;
      const readability = 0.75;
      const score = specificity * stability * readability;

      if (score > bestScore) {
        bestScore = score;
        bestResult = {
          selector: withTag,
          specificity,
          stability,
          readability,
          totalScore: 0,
          strategy: 'aria-role',
          matchCount: matchCountTag,
        };
      }
    }
  }

  // Try aria-label (only if short and meaningful)
  if (ariaLabel && ariaLabel.length <= 50) {
    const selector = `[aria-label="${cssEscape(ariaLabel)}"]`;
    const matchCount = countMatches(selector, root);

    if (matchCount >= 1 && matchCount <= 5 && elementMatches(el, selector)) {
      const specificity = matchCount === 1 ? 1.0 : Math.max(0.5, 1.0 - matchCount * 0.1);
      const stability = 0.70; // labels can change with i18n
      const readability = 0.85;
      const score = specificity * stability * readability;

      if (score > bestScore) {
        bestScore = score;
        bestResult = {
          selector,
          specificity,
          stability,
          readability,
          totalScore: 0,
          strategy: 'aria-role',
          matchCount,
        };
      }
    }
  }

  return bestResult;
}

// ---------------------------------------------------------------------------
// Strategy 4: Structural Path
// ---------------------------------------------------------------------------

function strategyStructuralPath(
  el: Element,
  root: Element | Document,
): SelectorResult | null {
  // Build path from element up to root (or document), using semantic class names
  const segments: string[] = [];
  let current: Element | null = el;
  let depth = 0;
  const maxDepth = 6;

  const rootElement = root instanceof Element ? root : root.documentElement;

  while (current && current !== rootElement && depth < maxDepth) {
    const tag = current.tagName.toLowerCase();

    // Skip html/body
    if (tag === 'html' || tag === 'body') break;

    const id = current.id;
    if (id && !isGeneratedId(id)) {
      segments.unshift(`#${cssEscape(id)}`);
      break; // IDs are unique, no need to go higher
    }

    const semanticClasses = getSemanticClasses(current);
    if (semanticClasses.length > 0) {
      // Pick the most meaningful class (longest non-utility)
      const bestClass = semanticClasses
        .sort((a, b) => b.length - a.length)
        .find(cls => cls.length >= 3);

      if (bestClass) {
        segments.unshift(`${tag}.${cssEscape(bestClass)}`);
      } else {
        segments.unshift(tag);
      }
    } else {
      segments.unshift(tag);
    }

    current = current.parentElement;
    depth++;
  }

  if (segments.length === 0) return null;

  // Build selector with " > " combinator
  const selector = segments.join(' > ');
  const matchCount = countMatches(selector, root);

  if (matchCount === 0 || !elementMatches(el, selector)) return null;

  const specificity = matchCount === 1 ? 1.0 : Math.max(0.2, 1.0 - matchCount * 0.02);
  const stability = Math.max(0.3, 0.7 - depth * 0.05); // deeper = less stable
  const readability = Math.max(0.3, 0.8 - segments.length * 0.08);

  return {
    selector,
    specificity,
    stability,
    readability,
    totalScore: 0,
    strategy: 'structural-path',
    matchCount,
  };
}

// ---------------------------------------------------------------------------
// Strategy 5: nth-child
// ---------------------------------------------------------------------------

function strategyNthChild(
  el: Element,
  root: Element | Document,
): SelectorResult | null {
  // Build a precise path using nth-child or nth-of-type
  const segments: string[] = [];
  let current: Element | null = el;
  let depth = 0;
  const maxDepth = 5;

  const rootElement = root instanceof Element ? root : root.documentElement;

  while (current && current !== rootElement && depth < maxDepth) {
    const tag = current.tagName.toLowerCase();
    if (tag === 'html' || tag === 'body') break;

    const id = current.id;
    if (id && !isGeneratedId(id)) {
      segments.unshift(`#${cssEscape(id)}`);
      break;
    }

    const sameTagCount = countSameTagSiblings(current);

    if (sameTagCount > 1) {
      const nthIndex = getNthOfTypeIndex(current);
      segments.unshift(`${tag}:nth-of-type(${nthIndex})`);
    } else {
      const nthIndex = getNthChildIndex(current);
      const parent = current.parentElement;
      if (parent && parent.children.length > 1) {
        segments.unshift(`${tag}:nth-child(${nthIndex})`);
      } else {
        segments.unshift(tag);
      }
    }

    current = current.parentElement;
    depth++;
  }

  if (segments.length === 0) return null;

  const selector = segments.join(' > ');
  const matchCount = countMatches(selector, root);

  if (matchCount === 0 || !elementMatches(el, selector)) return null;

  return {
    selector,
    specificity: matchCount === 1 ? 1.0 : 0.5,
    stability: 0.40, // nth-child breaks easily with DOM changes
    readability: 0.40,
    totalScore: 0,
    strategy: 'nth-child',
    matchCount,
  };
}

// ---------------------------------------------------------------------------
// ID Heuristic
// ---------------------------------------------------------------------------

/** Detect auto-generated IDs that are unstable (React, Angular, etc.) */
function isGeneratedId(id: string): boolean {
  if (!id) return true;
  // React/Next.js: __next, __gatsby
  if (id.startsWith('__')) return true;
  // Random hashes: "a1b2c3d4", ":r0:", ":R1:"
  if (/^[a-f0-9]{8,}$/i.test(id)) return true;
  if (/^:[rR]\d+:/.test(id)) return true;
  // UUID-like
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(id)) return true;
  // Numeric-only
  if (/^\d+$/.test(id)) return true;
  // Single random chars
  if (id.length <= 2 && /^[a-z]/.test(id)) return true;
  // Radix UI / headless UI: "radix-:r0:"
  if (/^radix-/.test(id) || /^headlessui-/.test(id)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate the optimal CSS selector for a given element.
 *
 * Runs all 5 strategies, scores each result, and returns the best one.
 * If `root` is provided, selectors are tested against that subtree;
 * otherwise the full document is used.
 *
 * @param el - The target element
 * @param root - Optional root element to scope selector queries
 * @returns The best selector result
 */
export function generateSelector(el: Element, root?: Element): SelectorResult {
  const queryRoot = getQueryRoot(el, root);

  // First check: element has a stable, non-generated ID
  const id = el.id;
  if (id && !isGeneratedId(id)) {
    const selector = `#${cssEscape(id)}`;
    const matchCount = countMatches(selector, queryRoot);

    if (matchCount === 1) {
      return {
        selector,
        specificity: 1.0,
        stability: 0.90,
        readability: 0.95,
        totalScore: 1.0 * 0.90 * 0.95,
        strategy: 'data-attribute', // ID is most like a data-attribute in nature
        matchCount: 1,
      };
    }
  }

  // Run all strategies
  const candidates: SelectorResult[] = [];

  const strategies = [
    strategyDataAttribute,
    strategySemanticClass,
    strategyAriaRole,
    strategyStructuralPath,
    strategyNthChild,
  ];

  for (const strategy of strategies) {
    try {
      const result = strategy(el, queryRoot);
      if (result) {
        result.totalScore = result.specificity * result.stability * result.readability;
        candidates.push(result);
      }
    } catch {
      // Strategy failed; skip it
    }
  }

  if (candidates.length === 0) {
    // Ultimate fallback: tag + nth-child from parent
    const tag = el.tagName.toLowerCase();
    const nthIndex = getNthChildIndex(el);
    const parent = el.parentElement;

    if (parent) {
      const parentTag = parent.tagName.toLowerCase();
      const fallback = `${parentTag} > ${tag}:nth-child(${nthIndex})`;
      return {
        selector: fallback,
        specificity: 0.5,
        stability: 0.2,
        readability: 0.3,
        totalScore: 0.03,
        strategy: 'nth-child',
        matchCount: countMatches(fallback, queryRoot),
      };
    }

    return {
      selector: tag,
      specificity: 0.1,
      stability: 0.3,
      readability: 0.5,
      totalScore: 0.015,
      strategy: 'structural-path',
      matchCount: countMatches(tag, queryRoot),
    };
  }

  // Sort by total score descending
  candidates.sort((a, b) => b.totalScore - a.totalScore);

  return candidates[0];
}

/**
 * Generate a visual breadcrumb path from body to the element.
 * Produces human-readable segments like: body > main > div.products > div.card
 *
 * @param el - The target element
 * @returns A SelectorPath with visual breadcrumb segments
 */
export function generateSelectorPath(el: Element): SelectorPath {
  const segments: SelectorSegment[] = [];
  let current: Element | null = el;
  const maxDepth = 10;

  while (current && segments.length < maxDepth) {
    const tag = current.tagName.toLowerCase();

    // Build segment
    const semanticClasses = getSemanticClasses(current);
    const id = current.id && !isGeneratedId(current.id) ? current.id : undefined;
    const nthIndex = getNthChildIndex(current);

    let segmentSelector = tag;
    if (id) {
      segmentSelector = `${tag}#${cssEscape(id)}`;
    } else if (semanticClasses.length > 0) {
      // Use up to 2 most meaningful classes
      const topClasses = semanticClasses
        .filter(c => c.length >= 3)
        .slice(0, 2);
      if (topClasses.length > 0) {
        segmentSelector = `${tag}.${topClasses.map(c => cssEscape(c)).join('.')}`;
      }
    }

    segments.unshift({
      tag,
      classes: semanticClasses.slice(0, 3),
      id,
      index: nthIndex,
      selector: segmentSelector,
    });

    if (tag === 'body' || tag === 'html') break;
    current = current.parentElement;
  }

  // Ensure path starts with body
  if (segments.length > 0 && segments[0].tag !== 'body' && segments[0].tag !== 'html') {
    segments.unshift({
      tag: 'body',
      classes: [],
      index: 1,
      selector: 'body',
    });
  }

  const fullSelector = segments.map(s => s.selector).join(' > ');

  return {
    segments,
    fullSelector,
  };
}

/**
 * Test a CSS selector against a root element or document.
 *
 * @param selector - The CSS selector string to test
 * @param root - Optional root element to scope the query
 * @returns Match count and matching elements
 */
export function testSelector(
  selector: string,
  root?: Element,
): { matchCount: number; elements: Element[] } {
  try {
    const queryRoot: Element | Document = root ?? document;
    const elements = Array.from(queryRoot.querySelectorAll(selector));
    return {
      matchCount: elements.length,
      elements,
    };
  } catch {
    return {
      matchCount: 0,
      elements: [],
    };
  }
}

/**
 * Generate a relative selector from a parent pattern element to a child field element.
 * Used by PatternSense to create field selectors relative to a list item.
 *
 * @param child - The field element inside the pattern item
 * @param parent - The pattern item container element
 * @returns A CSS selector string relative to the parent
 */
export function generateRelativeSelector(child: Element, parent: Element): string {
  // If child IS the parent, return empty (self)
  if (child === parent) return '';

  // Strategy 1: Try semantic class on the child directly
  const semanticClasses = getSemanticClasses(child);
  const tag = child.tagName.toLowerCase();

  for (const cls of semanticClasses) {
    const selector = `.${cssEscape(cls)}`;
    try {
      const matches = parent.querySelectorAll(selector);
      if (matches.length === 1 && matches[0] === child) return selector;
    } catch {
      continue;
    }
  }

  // Strategy 2: tag + semantic class
  for (const cls of semanticClasses) {
    const selector = `${tag}.${cssEscape(cls)}`;
    try {
      const matches = parent.querySelectorAll(selector);
      if (matches.length === 1 && matches[0] === child) return selector;
    } catch {
      continue;
    }
  }

  // Strategy 3: data-attributes on child
  for (const attr of DATA_ID_ATTRS) {
    const value = child.getAttribute(attr);
    if (value) {
      const selector = `[${attr}="${cssEscape(value)}"]`;
      try {
        const matches = parent.querySelectorAll(selector);
        if (matches.length === 1 && matches[0] === child) return selector;
      } catch {
        continue;
      }
    }
  }

  // Strategy 4: Tag-only (if unique by tag within parent)
  try {
    const tagMatches = parent.querySelectorAll(tag);
    if (tagMatches.length === 1 && tagMatches[0] === child) return tag;
  } catch {
    // continue
  }

  // Strategy 5: Heading tags are often unique by specificity (h1 vs h2, etc.)
  if (/^h[1-6]$/.test(tag)) {
    return tag;
  }

  // Strategy 6: Build a short relative path
  const pathParts: string[] = [];
  let current: Element | null = child;
  let depth = 0;

  while (current && current !== parent && depth < 4) {
    const currentTag = current.tagName.toLowerCase();
    const currentClasses = getSemanticClasses(current);

    if (currentClasses.length > 0) {
      pathParts.unshift(`${currentTag}.${cssEscape(currentClasses[0])}`);
    } else {
      const nthIndex = getNthOfTypeIndex(current);
      const sameTagCount = countSameTagSiblings(current);
      if (sameTagCount > 1) {
        pathParts.unshift(`${currentTag}:nth-of-type(${nthIndex})`);
      } else {
        pathParts.unshift(currentTag);
      }
    }

    current = current.parentElement;
    depth++;
  }

  return pathParts.join(' > ');
}
