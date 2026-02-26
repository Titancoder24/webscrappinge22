/**
 * PatternSense - DOM Pattern Detection Engine
 *
 * Walks the DOM tree efficiently using TreeWalker to find repeating element
 * patterns (product grids, review lists, search results, table rows, etc.).
 * Each candidate pattern is scored on multiple dimensions:
 *
 *   score = (itemCount x 2)
 *         + (structuralDepth x 1.5)
 *         + (contentDiversity x 3)
 *         + (visualArea / maxVisualArea x 4)
 *         + (semanticBonus x 2)
 *
 * The top 5 patterns are returned with detected fields for each.
 *
 * Handles shadow DOM and iframes for comprehensive page analysis.
 */

import type {
  DetectedPattern,
  DetectedField,
  PatternCategory,
} from '../../types/extraction';
import { generatePrefixedId } from '../../utils/id';
import { generateSelector, generateRelativeSelector } from './selector-forge';
import { buildDetectedField } from './type-sense';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Minimum children required to consider a parent as a pattern container */
const MIN_CHILDREN = 3;

/** Maximum number of patterns to return */
const MAX_PATTERNS = 5;

/** Maximum number of fields to detect per pattern */
const MAX_FIELDS = 15;

/** Maximum sample elements (HTML snippets) per pattern */
const MAX_SAMPLE_ELEMENTS = 3;

/** Maximum depth to traverse into shadow DOMs / iframes */
const MAX_SHADOW_DEPTH = 3;

/** Tags to skip when walking the DOM (never pattern containers) */
const SKIP_TAGS = new Set([
  'SCRIPT', 'STYLE', 'LINK', 'META', 'NOSCRIPT', 'TEMPLATE',
  'SVG', 'CANVAS', 'VIDEO', 'AUDIO', 'IFRAME', 'OBJECT', 'EMBED',
  'BR', 'HR', 'WBR', 'INPUT', 'TEXTAREA', 'SELECT', 'OPTION',
  'HEAD', 'TITLE',
]);

/** Tags that are never interesting as repeated items themselves */
const IGNORE_ITEM_TAGS = new Set([
  'SCRIPT', 'STYLE', 'LINK', 'META', 'NOSCRIPT', 'BR', 'HR', 'WBR',
  'HEAD', 'TITLE', 'COL', 'COLGROUP',
]);

/** Semantic class patterns that boost confidence */
const SEMANTIC_CLASS_PATTERNS = [
  /product/i, /card/i, /item/i, /listing/i, /result/i, /review/i,
  /post/i, /entry/i, /article/i, /story/i, /comment/i, /thread/i,
  /row/i, /tile/i, /grid-item/i, /feed-item/i, /search-result/i,
  /property/i, /hotel/i, /restaurant/i, /business/i, /repo/i,
];

/** Tags that signal semantic context */
const SEMANTIC_PARENT_TAGS = new Set(['MAIN', 'ARTICLE', 'SECTION']);

// ---------------------------------------------------------------------------
// Types (internal)
// ---------------------------------------------------------------------------

interface RawPattern {
  parent: Element;
  children: Element[];
  signature: string;
  depth: number;
}

interface ScoredPattern {
  raw: RawPattern;
  score: number;
  itemCount: number;
  structuralDepth: number;
  contentDiversity: number;
  visualArea: number;
  semanticBonus: number;
  category: PatternCategory;
}

// ---------------------------------------------------------------------------
// Signature generation
// ---------------------------------------------------------------------------

/**
 * Generate a structural signature for an element.
 * Combines tag name + sorted meaningful class names to identify
 * structurally identical siblings.
 */
function elementSignature(el: Element): string {
  const tag = el.tagName;
  const cls = el.className?.toString?.()?.trim() ?? '';

  if (!cls) return tag;

  // Filter to meaningful classes (skip Tailwind/Bootstrap utility classes)
  const meaningful = cls
    .split(/\s+/)
    .filter(c => c.length > 0 && !isUtilityClass(c))
    .sort()
    .join('.');

  return meaningful ? `${tag}.${meaningful}` : tag;
}

/** Quick utility class check (mirrors selector-forge but lighter) */
function isUtilityClass(cls: string): boolean {
  const lower = cls.toLowerCase();
  // Prefixed utilities
  if (/^(mt-|mb-|ml-|mr-|mx-|my-|pt-|pb-|pl-|pr-|px-|py-|p-|m-|w-|h-|text-|bg-|border-|rounded-|flex-|grid-|col-|row-|gap-|space-|justify-|items-|self-|font-|leading-|tracking-|opacity-|shadow-|ring-|overflow-|z-|inset-|top-|right-|bottom-|left-|translate-|rotate-|scale-|transition-|duration-|animate-|cursor-|d-|ms-|me-|ps-|pe-|min-|max-)/.test(lower)) return true;
  // Exact match utilities
  if (/^(flex|grid|block|inline|hidden|visible|invisible|static|relative|absolute|fixed|sticky|container|clearfix|sr-only)$/.test(lower)) return true;
  // Very short or numeric-heavy
  if (lower.length <= 2 || /^[a-z]{1,3}-\d/.test(lower)) return true;
  // Tailwind arbitrary values
  if (/^-?[a-z]+-\[/.test(lower)) return true;
  return false;
}

// ---------------------------------------------------------------------------
// DOM Walking
// ---------------------------------------------------------------------------

/**
 * Walk the DOM tree and collect candidate patterns.
 * A candidate pattern is any element with MIN_CHILDREN+ children
 * that share the same tag+className signature.
 */
function collectCandidates(root: Document | Element, depth: number = 0): RawPattern[] {
  const candidates: RawPattern[] = [];

  if (depth > MAX_SHADOW_DEPTH) return candidates;

  try {
    const doc = root instanceof Document ? root : root.ownerDocument;
    if (!doc) return candidates;

    const treeRoot = root instanceof Document ? root.body ?? root.documentElement : root;
    if (!treeRoot) return candidates;

    // Use TreeWalker for efficient DOM traversal
    const walker = doc.createTreeWalker(
      treeRoot,
      NodeFilter.SHOW_ELEMENT,
      {
        acceptNode(node: Node): number {
          const el = node as Element;
          if (SKIP_TAGS.has(el.tagName)) return NodeFilter.FILTER_REJECT;
          return NodeFilter.FILTER_ACCEPT;
        },
      },
    );

    let node: Node | null = walker.currentNode;
    const visited = new WeakSet<Element>();

    while (node) {
      const el = node as Element;

      if (!visited.has(el) && el.children && el.children.length >= MIN_CHILDREN) {
        visited.add(el);

        // Group children by signature
        const groups = new Map<string, Element[]>();

        for (let i = 0; i < el.children.length; i++) {
          const child = el.children[i];
          if (IGNORE_ITEM_TAGS.has(child.tagName)) continue;
          if (!isVisible(child)) continue;

          const sig = elementSignature(child);
          const group = groups.get(sig);
          if (group) {
            group.push(child);
          } else {
            groups.set(sig, [child]);
          }
        }

        // Any group with MIN_CHILDREN+ items is a candidate pattern
        for (const [signature, children] of groups) {
          if (children.length >= MIN_CHILDREN) {
            candidates.push({
              parent: el,
              children,
              signature,
              depth: getDepthFromBody(el),
            });
          }
        }
      }

      // Also traverse into shadow DOMs
      if (el.shadowRoot) {
        const shadowCandidates = collectCandidates(el.shadowRoot as unknown as Document, depth + 1);
        candidates.push(...shadowCandidates);
      }

      node = walker.nextNode();
    }

    // Traverse accessible iframes (same-origin)
    if (root instanceof Document) {
      const iframes = root.querySelectorAll('iframe');
      for (let i = 0; i < iframes.length; i++) {
        try {
          const iframeDoc = (iframes[i] as HTMLIFrameElement).contentDocument;
          if (iframeDoc) {
            const iframeCandidates = collectCandidates(iframeDoc, depth + 1);
            candidates.push(...iframeCandidates);
          }
        } catch {
          // Cross-origin iframe, skip
        }
      }
    }
  } catch {
    // DOM traversal error
  }

  return candidates;
}

// ---------------------------------------------------------------------------
// Visibility check
// ---------------------------------------------------------------------------

function isVisible(el: Element): boolean {
  try {
    const htmlEl = el as HTMLElement;
    // Quick checks first (avoid expensive getComputedStyle)
    if (el.hasAttribute('hidden')) return false;
    if (el.getAttribute('aria-hidden') === 'true') return false;

    // Check inline style
    const style = htmlEl.style;
    if (style) {
      if (style.display === 'none') return false;
      if (style.visibility === 'hidden') return false;
      if (style.opacity === '0') return false;
    }

    // Only do offsetParent check for elements that might be hidden
    // (skip for fixed/sticky positioned elements)
    if (htmlEl.offsetWidth === 0 && htmlEl.offsetHeight === 0) {
      // Could be hidden via CSS
      const computed = window.getComputedStyle(el);
      if (computed.display === 'none' || computed.visibility === 'hidden') return false;
      if (computed.position !== 'fixed' && computed.position !== 'sticky') {
        if (htmlEl.offsetParent === null) return false;
      }
    }

    return true;
  } catch {
    return true; // Assume visible if we can't check
  }
}

// ---------------------------------------------------------------------------
// Scoring
// ---------------------------------------------------------------------------

function getDepthFromBody(el: Element): number {
  let depth = 0;
  let current: Element | null = el;
  while (current && current.tagName !== 'BODY' && current.tagName !== 'HTML') {
    depth++;
    current = current.parentElement;
  }
  return depth;
}

/** Calculate content diversity: ratio of unique text content among items */
function calcContentDiversity(children: Element[]): number {
  if (children.length === 0) return 0;

  const texts = children.map(child => {
    try {
      // Use first 200 chars of text content for comparison
      return (child.textContent ?? '').trim().substring(0, 200).toLowerCase();
    } catch {
      return '';
    }
  });

  const nonEmpty = texts.filter(t => t.length > 0);
  if (nonEmpty.length === 0) return 0;

  const uniqueTexts = new Set(nonEmpty);
  return uniqueTexts.size / nonEmpty.length;
}

/** Calculate visual area of the pattern's bounding region */
function calcVisualArea(children: Element[]): { area: number; rect: { top: number; left: number; width: number; height: number } } {
  let minTop = Infinity, minLeft = Infinity;
  let maxBottom = -Infinity, maxRight = -Infinity;

  for (const child of children) {
    try {
      const rect = child.getBoundingClientRect();
      if (rect.width === 0 && rect.height === 0) continue;
      minTop = Math.min(minTop, rect.top);
      minLeft = Math.min(minLeft, rect.left);
      maxBottom = Math.max(maxBottom, rect.bottom);
      maxRight = Math.max(maxRight, rect.right);
    } catch {
      continue;
    }
  }

  if (minTop === Infinity) {
    return { area: 0, rect: { top: 0, left: 0, width: 0, height: 0 } };
  }

  const width = maxRight - minLeft;
  const height = maxBottom - minTop;

  return {
    area: Math.max(0, width * height),
    rect: {
      top: minTop + (window.scrollY || 0),
      left: minLeft + (window.scrollX || 0),
      width: Math.max(0, width),
      height: Math.max(0, height),
    },
  };
}

/** Calculate semantic bonus for a pattern */
function calcSemanticBonus(parent: Element, children: Element[]): number {
  let bonus = 0;

  // Check children attributes
  const sampleChild = children[0];
  if (sampleChild) {
    // role="listitem" or similar
    const role = sampleChild.getAttribute('role');
    if (role === 'listitem' || role === 'article' || role === 'row' || role === 'option') {
      bonus += 1;
    }

    // Semantic class patterns
    const childCls = sampleChild.className?.toString?.() ?? '';
    for (const pattern of SEMANTIC_CLASS_PATTERNS) {
      if (pattern.test(childCls)) {
        bonus += 1;
        break;
      }
    }

    // data-* attributes that suggest items
    if (
      sampleChild.hasAttribute('data-id') ||
      sampleChild.hasAttribute('data-item-id') ||
      sampleChild.hasAttribute('data-product-id') ||
      sampleChild.hasAttribute('data-testid') ||
      sampleChild.hasAttribute('data-asin') ||
      sampleChild.hasAttribute('itemscope')
    ) {
      bonus += 0.5;
    }
  }

  // Parent semantic context
  const parentCls = parent.className?.toString?.() ?? '';
  for (const pattern of SEMANTIC_CLASS_PATTERNS) {
    if (pattern.test(parentCls)) {
      bonus += 0.5;
      break;
    }
  }

  // Parent role
  const parentRole = parent.getAttribute('role');
  if (parentRole === 'list' || parentRole === 'grid' || parentRole === 'feed' || parentRole === 'table') {
    bonus += 1;
  }

  // Parent tag
  if (parent.tagName === 'UL' || parent.tagName === 'OL') {
    bonus += 0.5;
  }
  if (parent.tagName === 'TBODY') {
    bonus += 1;
  }

  // Inside <main>, <article>, or <section>
  let ancestor: Element | null = parent;
  let depth = 0;
  while (ancestor && depth < 10) {
    if (SEMANTIC_PARENT_TAGS.has(ancestor.tagName)) {
      bonus += 1;
      break;
    }
    ancestor = ancestor.parentElement;
    depth++;
  }

  return bonus;
}

/** Determine the pattern category based on context clues */
function determineCategory(parent: Element, children: Element[]): PatternCategory {
  const parentCls = (parent.className?.toString?.() ?? '').toLowerCase();
  const childCls = children[0] ? (children[0].className?.toString?.() ?? '').toLowerCase() : '';
  const combined = parentCls + ' ' + childCls;
  const childTag = children[0]?.tagName ?? '';
  const parentTag = parent.tagName;

  // Table rows
  if (parentTag === 'TBODY' || parentTag === 'TABLE' || childTag === 'TR') {
    return 'table-row';
  }

  // Specific categories from class names
  if (/product|shop|store|merchandise/i.test(combined)) return 'product';
  if (/review|testimonial|feedback/i.test(combined)) return 'review';
  if (/listing|search.?result|results?-item/i.test(combined)) return 'listing';
  if (/article|blog|news|story|headline/i.test(combined)) return 'article';
  if (/card/i.test(combined)) return 'card';
  if (/feed|stream|timeline|post/i.test(combined)) return 'feed-item';

  // Check itemprop/itemtype for schema.org hints
  const itemType = children[0]?.getAttribute('itemtype') ?? '';
  if (/Product/i.test(itemType)) return 'product';
  if (/Review/i.test(itemType)) return 'review';
  if (/Article|BlogPosting|NewsArticle/i.test(itemType)) return 'article';
  if (/ListItem/i.test(itemType)) return 'listing';

  return 'generic';
}

/** Score a raw pattern candidate */
function scorePattern(raw: RawPattern, maxVisualArea: number): ScoredPattern {
  const itemCount = raw.children.length;
  const structuralDepth = raw.depth;
  const contentDiversity = calcContentDiversity(raw.children);
  const { area: visualArea } = calcVisualArea(raw.children);
  const semanticBonus = calcSemanticBonus(raw.parent, raw.children);

  const normalizedVisualArea = maxVisualArea > 0 ? visualArea / maxVisualArea : 0;

  const score =
    (itemCount * 2) +
    (structuralDepth * 1.5) +
    (contentDiversity * 3) +
    (normalizedVisualArea * 4) +
    (semanticBonus * 2);

  const category = determineCategory(raw.parent, raw.children);

  return {
    raw,
    score,
    itemCount,
    structuralDepth,
    contentDiversity,
    visualArea,
    semanticBonus,
    category,
  };
}

// ---------------------------------------------------------------------------
// Deduplication
// ---------------------------------------------------------------------------

/**
 * Remove nested duplicates: if pattern A's parent contains pattern B's parent,
 * keep A unless B has a higher score.
 */
function deduplicateNested(patterns: ScoredPattern[]): ScoredPattern[] {
  const toRemove = new Set<number>();

  for (let i = 0; i < patterns.length; i++) {
    if (toRemove.has(i)) continue;

    for (let j = i + 1; j < patterns.length; j++) {
      if (toRemove.has(j)) continue;

      const parentI = patterns[i].raw.parent;
      const parentJ = patterns[j].raw.parent;

      let iContainsJ = false;
      let jContainsI = false;

      try {
        iContainsJ = parentI.contains(parentJ);
        jContainsI = parentJ.contains(parentI);
      } catch {
        continue;
      }

      if (iContainsJ && jContainsI) {
        // Same element (shouldn't happen with different signatures, but handle it)
        if (patterns[i].score >= patterns[j].score) {
          toRemove.add(j);
        } else {
          toRemove.add(i);
        }
      } else if (iContainsJ) {
        // I contains J: keep I (outer) unless J scores significantly higher
        if (patterns[j].score > patterns[i].score * 1.2) {
          toRemove.add(i);
        } else {
          toRemove.add(j);
        }
      } else if (jContainsI) {
        // J contains I: keep J (outer) unless I scores significantly higher
        if (patterns[i].score > patterns[j].score * 1.2) {
          toRemove.add(j);
        } else {
          toRemove.add(i);
        }
      }
    }
  }

  return patterns.filter((_, i) => !toRemove.has(i));
}

// ---------------------------------------------------------------------------
// Field Detection
// ---------------------------------------------------------------------------

/**
 * Detect fields within a pattern's children.
 * Looks at the internal structure of each item and identifies sub-elements
 * that could be data fields (titles, prices, images, links, etc.).
 */
function detectFields(children: Element[], parent: Element): DetectedField[] {
  if (children.length === 0) return [];

  const fields: DetectedField[] = [];
  const seenSelectors = new Set<string>();

  // Analyze the first few items to find consistent sub-elements
  const sampleItems = children.slice(0, Math.min(5, children.length));
  const firstItem = sampleItems[0];
  if (!firstItem) return [];

  // Collect all interesting descendant elements from the first item
  const candidateElements = collectFieldCandidates(firstItem);

  for (const candidate of candidateElements) {
    if (fields.length >= MAX_FIELDS) break;

    try {
      // Generate a relative selector from the item container to this element
      const relSelector = generateRelativeSelector(candidate, firstItem);
      if (!relSelector || seenSelectors.has(relSelector)) continue;

      // Validate: does this selector work across multiple items?
      const sampleValues: string[] = [];
      let matchedItems = 0;

      for (const item of sampleItems) {
        try {
          const match = relSelector ? item.querySelector(relSelector) : item;
          if (match) {
            matchedItems++;
            const value = extractFieldValue(match);
            if (value) sampleValues.push(value);
          }
        } catch {
          continue;
        }
      }

      // Require at least 50% of sample items to have this field
      if (matchedItems < sampleItems.length * 0.5) continue;
      if (sampleValues.length === 0) continue;

      seenSelectors.add(relSelector);

      // Build the field using TypeSense
      const field = buildDetectedField(relSelector, sampleValues, candidate);
      fields.push(field);
    } catch {
      continue;
    }
  }

  return fields;
}

/** Collect candidate elements that might be data fields within an item */
function collectFieldCandidates(item: Element): Element[] {
  const candidates: Element[] = [];
  const visited = new WeakSet<Element>();

  // Priority elements: headings, links, images, time, price-like
  const prioritySelectors = [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',  // Titles
    'img',                                    // Images
    'a[href]',                                // Links
    'time',                                   // Dates
    '[itemprop]',                             // Schema.org fields
    '[data-price]', '[data-rating]',          // Explicit data
    'address',                                // Locations
    'span', 'p', 'div',                       // Text containers
  ];

  for (const selector of prioritySelectors) {
    try {
      const matches = item.querySelectorAll(selector);
      for (let i = 0; i < matches.length; i++) {
        const el = matches[i];
        if (visited.has(el)) continue;
        if (SKIP_TAGS.has(el.tagName)) continue;

        visited.add(el);
        candidates.push(el);
      }
    } catch {
      continue;
    }
  }

  // Also add the item itself if it has direct text
  if (item.childNodes.length > 0) {
    const directText = getDirectTextContent(item);
    if (directText.trim().length > 0 && !visited.has(item)) {
      candidates.push(item);
    }
  }

  // Filter to elements that actually contain meaningful content
  return candidates.filter(el => {
    try {
      const value = extractFieldValue(el);
      return value !== null && value.trim().length > 0;
    } catch {
      return false;
    }
  }).slice(0, 30); // Cap at 30 to avoid excessive processing
}

/** Extract the meaningful value from a field element */
function extractFieldValue(el: Element): string | null {
  try {
    const tag = el.tagName;

    // Image: return src
    if (tag === 'IMG') {
      return (el as HTMLImageElement).src ||
             el.getAttribute('data-src') ||
             el.getAttribute('data-lazy-src') ||
             el.getAttribute('srcset')?.split(',')[0]?.trim()?.split(/\s+/)[0] ||
             null;
    }

    // Link: return href for URL fields
    if (tag === 'A') {
      // Return text content (the link text is usually more useful than the URL)
      const text = (el.textContent ?? '').trim();
      if (text.length > 0 && text.length < 500) return text;
      return (el as HTMLAnchorElement).href || null;
    }

    // Time: return datetime attribute
    if (tag === 'TIME') {
      return el.getAttribute('datetime') || (el.textContent ?? '').trim() || null;
    }

    // Input/select: return value
    if (tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') {
      return (el as HTMLInputElement).value || null;
    }

    // Generic: return text content
    const text = (el.textContent ?? '').trim();
    if (text.length > 0 && text.length < 2000) return text;

    return null;
  } catch {
    return null;
  }
}

/** Get only the direct text content of an element (not children's text) */
function getDirectTextContent(el: Element): string {
  let text = '';
  for (let i = 0; i < el.childNodes.length; i++) {
    const node = el.childNodes[i];
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent ?? '';
    }
  }
  return text;
}

// ---------------------------------------------------------------------------
// Pattern Building
// ---------------------------------------------------------------------------

/** Build a DetectedPattern from a scored candidate */
function buildPattern(scored: ScoredPattern): DetectedPattern | null {
  try {
    const { raw, score, itemCount, category } = scored;
    const { parent, children } = raw;

    // Generate a CSS selector for the item children
    // We need a selector that matches all children of this pattern
    const selectorResult = generateSelector(children[0], parent);

    // Verify the selector matches the expected number of items
    let finalSelector = selectorResult.selector;
    try {
      const doc = parent.ownerDocument;
      if (doc) {
        const matches = doc.querySelectorAll(finalSelector);
        // If the selector matches way too many elements, scope it to the parent
        if (matches.length > itemCount * 3) {
          const parentSelector = generateSelector(parent);
          finalSelector = `${parentSelector.selector} > ${finalSelector}`;
          // Verify again
          const scopedMatches = doc.querySelectorAll(finalSelector);
          if (scopedMatches.length === 0 || scopedMatches.length > itemCount * 3) {
            // Use direct child combinator from parent with child tag
            const tag = children[0].tagName.toLowerCase();
            const parentSel = parentSelector.selector;
            finalSelector = `${parentSel} > ${tag}`;
          }
        }
      }
    } catch {
      // Keep the original selector
    }

    // Sample elements (HTML snippets)
    const sampleElements: string[] = [];
    for (let i = 0; i < Math.min(MAX_SAMPLE_ELEMENTS, children.length); i++) {
      try {
        const html = children[i].outerHTML;
        // Truncate long HTML
        sampleElements.push(html.length > 500 ? html.substring(0, 500) + '...' : html);
      } catch {
        continue;
      }
    }

    // Visual area and bounding rect
    const { area: visualArea, rect: boundingRect } = calcVisualArea(children);

    // Detect fields
    const fields = detectFields(children, parent);

    // Confidence: normalize score to 0-1 range
    // A very good pattern scores ~30+; poor ones score ~10
    const confidence = Math.min(1.0, Math.max(0.1, score / 40));

    return {
      id: generatePrefixedId('pat'),
      selector: finalSelector,
      itemCount,
      sampleElements,
      confidence,
      category,
      fields,
      boundingRect,
      visualArea,
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Detect repeating DOM patterns in a document.
 *
 * Walks the entire DOM tree (including shadow DOMs and same-origin iframes),
 * identifies groups of sibling elements with shared structure, scores them
 * on multiple dimensions, deduplicates nested patterns, and returns the
 * top 5 results with detected fields.
 *
 * @param doc - The Document to analyze
 * @returns Array of DetectedPattern objects, sorted by score (highest first)
 */
export function detectPatterns(doc: Document): DetectedPattern[] {
  try {
    // Step 1: Collect all candidate patterns from the DOM
    const candidates = collectCandidates(doc);

    if (candidates.length === 0) return [];

    // Step 2: Calculate max visual area for normalization
    let maxVisualArea = 0;
    for (const candidate of candidates) {
      try {
        const { area } = calcVisualArea(candidate.children);
        if (area > maxVisualArea) maxVisualArea = area;
      } catch {
        continue;
      }
    }
    // Fallback: use viewport area if no candidates have visual area
    if (maxVisualArea === 0) {
      maxVisualArea = (window.innerWidth || 1280) * (window.innerHeight || 800);
    }

    // Step 3: Score all candidates
    const scored: ScoredPattern[] = [];
    for (const candidate of candidates) {
      try {
        scored.push(scorePattern(candidate, maxVisualArea));
      } catch {
        continue;
      }
    }

    if (scored.length === 0) return [];

    // Step 4: Sort by score (descending) for deduplication
    scored.sort((a, b) => b.score - a.score);

    // Step 5: Deduplicate nested patterns
    const deduped = deduplicateNested(scored);

    // Step 6: Take top N and build full patterns
    const topPatterns = deduped.slice(0, MAX_PATTERNS);
    const results: DetectedPattern[] = [];

    for (const pattern of topPatterns) {
      const built = buildPattern(pattern);
      if (built) {
        results.push(built);
      }
    }

    // Step 7: Final sort by confidence
    results.sort((a, b) => b.confidence - a.confidence);

    return results;
  } catch {
    // If the entire detection process fails, return empty
    return [];
  }
}
