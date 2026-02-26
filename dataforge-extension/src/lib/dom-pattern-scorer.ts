/**
 * DOMPatternScorer – Scoring utilities used by PatternSense for DataForge.
 *
 * Extracted scoring functions for reuse across pattern detection, field
 * inference, and quality assessment. These functions evaluate DOM subtrees
 * on multiple dimensions to determine which elements are likely to be
 * meaningful data containers.
 *
 * Scoring dimensions:
 *  - Content diversity: how varied are the child element types/text?
 *  - Semantic bonus: does the element use semantic HTML or ARIA roles?
 *  - Visual prominence: size, position, and visibility of the element
 *
 * All functions accept DOM elements and return numeric scores in the
 * range [0, 1] unless otherwise noted.
 *
 * Zero dependencies.
 */

import type { DetectedPattern, PatternCategory } from '../types/extraction';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Tags that carry semantic meaning for content containers. */
const SEMANTIC_TAGS: Record<string, number> = {
  ARTICLE: 0.95,
  MAIN: 0.90,
  SECTION: 0.60,
  TABLE: 0.80,
  TBODY: 0.70,
  UL: 0.55,
  OL: 0.55,
  DL: 0.50,
  FIGURE: 0.45,
  DETAILS: 0.40,
  FIELDSET: 0.35,
};

/** ARIA roles that indicate data containers or list structures. */
const DATA_ROLES: Record<string, number> = {
  list: 0.70,
  listbox: 0.70,
  grid: 0.85,
  table: 0.85,
  treegrid: 0.80,
  tree: 0.65,
  feed: 0.75,
  directory: 0.60,
  tabpanel: 0.40,
  region: 0.30,
  group: 0.25,
};

/** Category keywords: map from class/attribute substrings to pattern categories. */
const CATEGORY_INDICATORS: Array<{ pattern: string; category: PatternCategory; weight: number }> = [
  { pattern: 'product', category: 'product', weight: 0.9 },
  { pattern: 'item', category: 'product', weight: 0.5 },
  { pattern: 'goods', category: 'product', weight: 0.7 },
  { pattern: 'listing', category: 'listing', weight: 0.8 },
  { pattern: 'result', category: 'listing', weight: 0.6 },
  { pattern: 'search-result', category: 'listing', weight: 0.9 },
  { pattern: 'review', category: 'review', weight: 0.9 },
  { pattern: 'comment', category: 'review', weight: 0.6 },
  { pattern: 'testimonial', category: 'review', weight: 0.8 },
  { pattern: 'rating', category: 'review', weight: 0.5 },
  { pattern: 'article', category: 'article', weight: 0.9 },
  { pattern: 'post', category: 'article', weight: 0.7 },
  { pattern: 'blog', category: 'article', weight: 0.7 },
  { pattern: 'story', category: 'article', weight: 0.6 },
  { pattern: 'news', category: 'article', weight: 0.7 },
  { pattern: 'card', category: 'card', weight: 0.7 },
  { pattern: 'tile', category: 'card', weight: 0.6 },
  { pattern: 'feed', category: 'feed-item', weight: 0.8 },
  { pattern: 'timeline', category: 'feed-item', weight: 0.6 },
  { pattern: 'row', category: 'table-row', weight: 0.5 },
  { pattern: 'table', category: 'table-row', weight: 0.6 },
  { pattern: 'grid', category: 'table-row', weight: 0.4 },
];

// ---------------------------------------------------------------------------
// Content Diversity
// ---------------------------------------------------------------------------

/**
 * Calculate the content diversity score for a set of sibling elements.
 *
 * A high diversity score means the children of these elements contain varied
 * content types (text, images, links, prices, etc.), which is a strong
 * indicator of data-rich list items.
 *
 * Factors considered:
 *  - Variety of distinct child tag types across items
 *  - Consistency of structure between sibling items
 *  - Presence of data-carrying elements (img, a, span, time, etc.)
 *  - Text content variation (items with different text = real data)
 *
 * @param elements - Array of sibling elements to evaluate (e.g., list items)
 * @returns Score in [0, 1] where 1 = highly diverse, data-rich content
 */
export function calculateContentDiversity(elements: Element[]): number {
  if (!elements || elements.length === 0) return 0;
  if (elements.length === 1) return 0.3; // Single element = limited information

  const sampleSize = Math.min(elements.length, 10);
  const sample = elements.slice(0, sampleSize);

  // 1. Tag variety: how many distinct child tag types across all items
  const allChildTags = new Set<string>();
  const perItemTagSets: Set<string>[] = [];

  for (const el of sample) {
    const childTags = new Set<string>();
    const children = el.children;
    for (let i = 0; i < children.length; i++) {
      const tag = children[i].tagName;
      childTags.add(tag);
      allChildTags.add(tag);
    }
    // Also check deeper structure (1 level)
    const descendants = el.querySelectorAll('*');
    for (let i = 0; i < Math.min(descendants.length, 50); i++) {
      allChildTags.add(descendants[i].tagName);
    }
    perItemTagSets.push(childTags);
  }

  const tagVariety = Math.min(1, allChildTags.size / 8); // Normalize: 8+ tags = max

  // 2. Structural consistency: do items share the same child structure?
  let structuralSimilarity = 0;
  if (perItemTagSets.length >= 2) {
    let totalPairs = 0;
    let matchingPairs = 0;
    for (let i = 0; i < perItemTagSets.length - 1; i++) {
      for (let j = i + 1; j < perItemTagSets.length; j++) {
        totalPairs++;
        const union = new Set([...perItemTagSets[i], ...perItemTagSets[j]]);
        const intersection = new Set(
          [...perItemTagSets[i]].filter((t) => perItemTagSets[j].has(t)),
        );
        if (union.size > 0) {
          matchingPairs += intersection.size / union.size;
        }
      }
    }
    structuralSimilarity = totalPairs > 0 ? matchingPairs / totalPairs : 0;
  }

  // 3. Data-carrying element presence
  const dataElements = new Set(['IMG', 'A', 'TIME', 'SPAN', 'STRONG', 'EM', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'P']);
  let dataElementScore = 0;
  for (const tag of allChildTags) {
    if (dataElements.has(tag)) {
      dataElementScore += 0.1;
    }
  }
  dataElementScore = Math.min(1, dataElementScore);

  // 4. Text variation: items should have different text content
  const texts: string[] = [];
  for (const el of sample) {
    texts.push((el.textContent || '').trim().slice(0, 200));
  }
  const uniqueTexts = new Set(texts);
  const textVariation = uniqueTexts.size / texts.length;

  // Weighted combination
  const score =
    tagVariety * 0.25 +
    structuralSimilarity * 0.30 +
    dataElementScore * 0.20 +
    textVariation * 0.25;

  return Math.max(0, Math.min(1, score));
}

// ---------------------------------------------------------------------------
// Semantic Bonus
// ---------------------------------------------------------------------------

/**
 * Calculate the semantic bonus for a container element.
 *
 * Elements using semantic HTML tags, ARIA roles, or data-attributes
 * indicating their purpose receive a higher score. This helps prioritize
 * elements that developers intentionally structured for meaning.
 *
 * @param container - The container element to evaluate
 * @returns Score in [0, 1] where 1 = highly semantic
 */
export function calculateSemanticBonus(container: Element): number {
  if (!container) return 0;

  let score = 0;

  // 1. Semantic tag bonus
  const tag = container.tagName;
  if (tag in SEMANTIC_TAGS) {
    score += SEMANTIC_TAGS[tag];
  }

  // 2. ARIA role bonus
  const role = container.getAttribute('role');
  if (role && role in DATA_ROLES) {
    score += DATA_ROLES[role];
  }

  // 3. Itemscope/itemtype (Schema.org microdata)
  if (container.hasAttribute('itemscope')) {
    score += 0.3;
    const itemType = container.getAttribute('itemtype') || '';
    if (itemType.includes('schema.org')) {
      score += 0.2;
    }
  }

  // 4. Data attributes suggesting purpose
  const attrs = container.attributes;
  for (let i = 0; i < attrs.length; i++) {
    const name = attrs[i].name.toLowerCase();
    if (name.startsWith('data-') && /list|items|results|products|collection/i.test(name)) {
      score += 0.15;
      break;
    }
  }

  // 5. Children use list items
  const children = container.children;
  let hasListItems = false;
  for (let i = 0; i < Math.min(children.length, 5); i++) {
    const childTag = children[i].tagName;
    if (childTag === 'LI' || childTag === 'TR' || childTag === 'DT' || childTag === 'DD') {
      hasListItems = true;
      break;
    }
    // Check for itemscope on children
    if (children[i].hasAttribute('itemscope')) {
      score += 0.1;
      break;
    }
  }
  if (hasListItems) score += 0.2;

  // Normalize to [0, 1]
  return Math.max(0, Math.min(1, score));
}

// ---------------------------------------------------------------------------
// Visual Prominence
// ---------------------------------------------------------------------------

/**
 * Calculate the visual prominence of an element.
 *
 * Visually prominent elements (large, central, above the fold) are more
 * likely to be the main data containers on a page. This score considers:
 *  - Absolute size (width x height)
 *  - Viewport coverage ratio
 *  - Position relative to viewport (above fold = bonus)
 *  - Visibility (display, opacity, etc.)
 *
 * @param element - The element to evaluate
 * @returns Score in [0, 1] where 1 = maximally prominent
 */
export function calculateVisualProminence(element: Element): number {
  if (!element) return 0;

  let rect: DOMRect;
  try {
    rect = element.getBoundingClientRect();
  } catch {
    return 0;
  }

  // Zero-size elements are not visually prominent
  if (rect.width === 0 || rect.height === 0) return 0;

  // Check computed visibility
  try {
    const style = getComputedStyle(element);
    if (style.display === 'none') return 0;
    if (style.visibility === 'hidden') return 0;
    if (parseFloat(style.opacity) < 0.1) return 0;
  } catch {
    // Cannot compute style – assume visible
  }

  const viewportWidth = window.innerWidth || document.documentElement.clientWidth || 1;
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 1;
  const viewportArea = viewportWidth * viewportHeight;

  // 1. Size score: element area relative to viewport
  const elementArea = rect.width * rect.height;
  const areaRatio = elementArea / viewportArea;
  // Sweet spot: elements covering 20-80% of viewport are most likely main content
  let sizeScore: number;
  if (areaRatio < 0.01) {
    sizeScore = areaRatio * 10; // Very small: linear ramp
  } else if (areaRatio < 0.2) {
    sizeScore = 0.1 + (areaRatio - 0.01) * 4; // Moderate: steeper ramp
  } else if (areaRatio <= 0.8) {
    sizeScore = 0.85 + (areaRatio - 0.2) * 0.25; // Sweet spot
  } else {
    sizeScore = 0.9; // Very large: slight penalty (might be a wrapper)
  }

  // 2. Width score: how much horizontal space does it use?
  const widthRatio = rect.width / viewportWidth;
  let widthScore: number;
  if (widthRatio > 0.5) {
    widthScore = 0.8 + widthRatio * 0.2; // Wide elements are prominent
  } else if (widthRatio > 0.2) {
    widthScore = 0.5 + widthRatio;
  } else {
    widthScore = widthRatio * 2.5;
  }

  // 3. Position score: above the fold is better
  let positionScore: number;
  if (rect.top < 0) {
    // Partially scrolled out of view (top)
    positionScore = 0.5;
  } else if (rect.top < viewportHeight * 0.5) {
    // Above the fold
    positionScore = 1.0 - (rect.top / (viewportHeight * 0.5)) * 0.3;
  } else if (rect.top < viewportHeight) {
    // Below fold but in viewport
    positionScore = 0.5;
  } else {
    // Off-screen
    positionScore = 0.2;
  }

  // 4. Center alignment bonus: elements near the horizontal center
  const elementCenter = rect.left + rect.width / 2;
  const viewportCenter = viewportWidth / 2;
  const centerOffset = Math.abs(elementCenter - viewportCenter) / (viewportWidth / 2);
  const centerScore = 1 - centerOffset * 0.3;

  // Weighted combination
  const score =
    sizeScore * 0.35 +
    widthScore * 0.25 +
    positionScore * 0.25 +
    centerScore * 0.15;

  return Math.max(0, Math.min(1, score));
}

// ---------------------------------------------------------------------------
// Pattern Category Detection
// ---------------------------------------------------------------------------

/**
 * Infer the pattern category from a container element's attributes and content.
 *
 * Examines class names, IDs, data attributes, and child element patterns
 * to determine what kind of data the container holds.
 *
 * @param container - The container element
 * @param children - The repeating child elements
 * @returns The most likely PatternCategory with a confidence score
 */
export function inferPatternCategory(
  container: Element,
  children: Element[],
): { category: PatternCategory; confidence: number } {
  const scores: Partial<Record<PatternCategory, number>> = {};

  // Build an identifier string from the container and its first few children
  const containerIdent = getElementIdentString(container);
  const childIdents = children
    .slice(0, 3)
    .map((c) => getElementIdentString(c))
    .join(' ');
  const fullIdent = (containerIdent + ' ' + childIdents).toLowerCase();

  // Match against category indicators
  for (const indicator of CATEGORY_INDICATORS) {
    if (fullIdent.includes(indicator.pattern)) {
      const cat = indicator.category;
      scores[cat] = (scores[cat] || 0) + indicator.weight;
    }
  }

  // Heuristic checks based on child structure
  if (children.length > 0) {
    const sample = children[0];

    // Check for price indicators (product/listing)
    const hasPrice = sample.querySelector('[class*="price"], [data-price], .price, .cost, .amount');
    if (hasPrice) {
      scores['product'] = (scores['product'] || 0) + 0.5;
    }

    // Check for star ratings (review)
    const hasRating = sample.querySelector('[class*="star"], [class*="rating"], [data-rating], .stars');
    if (hasRating) {
      scores['review'] = (scores['review'] || 0) + 0.5;
    }

    // Check for images (card/product)
    const hasImage = sample.querySelector('img, picture, [class*="image"], [class*="photo"]');
    if (hasImage) {
      scores['card'] = (scores['card'] || 0) + 0.2;
    }

    // Check for timestamps (article/feed)
    const hasTime = sample.querySelector('time, [class*="date"], [class*="time"], [datetime]');
    if (hasTime) {
      scores['article'] = (scores['article'] || 0) + 0.3;
      scores['feed-item'] = (scores['feed-item'] || 0) + 0.2;
    }

    // Check for links (listing)
    const linkCount = sample.querySelectorAll('a').length;
    if (linkCount >= 2) {
      scores['listing'] = (scores['listing'] || 0) + 0.2;
    }
  }

  // Table-specific: TR children inside TBODY/TABLE
  const containerTag = container.tagName;
  if (containerTag === 'TABLE' || containerTag === 'TBODY' || containerTag === 'THEAD') {
    scores['table-row'] = (scores['table-row'] || 0) + 1.0;
  }

  // Find the highest-scoring category
  let bestCategory: PatternCategory = 'generic';
  let bestScore = 0;

  for (const [cat, catScore] of Object.entries(scores) as Array<[PatternCategory, number]>) {
    if (catScore > bestScore) {
      bestScore = catScore;
      bestCategory = cat;
    }
  }

  // Normalize confidence to [0, 1]
  const confidence = Math.max(0, Math.min(1, bestScore / 2));

  return { category: bestCategory, confidence };
}

// ---------------------------------------------------------------------------
// Composite Pattern Score
// ---------------------------------------------------------------------------

/**
 * Calculate a composite quality score for a detected pattern.
 *
 * Combines content diversity, semantic bonus, visual prominence, and
 * item count into a single quality score used to rank patterns.
 *
 * @param pattern - The detected pattern to score
 * @param container - The container element
 * @param items - The repeating child elements
 * @returns Score in [0, 1] where 1 = highest quality pattern
 */
export function calculatePatternScore(
  pattern: DetectedPattern,
  container: Element,
  items: Element[],
): number {
  const diversity = calculateContentDiversity(items);
  const semantic = calculateSemanticBonus(container);
  const prominence = calculateVisualProminence(container);

  // Item count factor: more items = higher confidence (with diminishing returns)
  const itemCount = items.length;
  let itemCountFactor: number;
  if (itemCount < 2) {
    itemCountFactor = 0.1;
  } else if (itemCount <= 5) {
    itemCountFactor = 0.3 + (itemCount - 2) * 0.1;
  } else if (itemCount <= 20) {
    itemCountFactor = 0.6 + (itemCount - 5) * 0.02;
  } else {
    itemCountFactor = 0.9 + Math.min(0.1, (itemCount - 20) * 0.001);
  }

  // Existing confidence from pattern detection
  const existingConfidence = pattern.confidence;

  // Weighted combination
  const score =
    diversity * 0.25 +
    semantic * 0.15 +
    prominence * 0.15 +
    itemCountFactor * 0.20 +
    existingConfidence * 0.25;

  return Math.max(0, Math.min(1, score));
}

// ---------------------------------------------------------------------------
// Link Density
// ---------------------------------------------------------------------------

/**
 * Calculate the link density of an element.
 *
 * Link density is the ratio of text inside <a> tags to total text content.
 * High link density (> 0.5) usually indicates navigation, not content.
 *
 * @param element - The element to analyze
 * @returns Link density ratio in [0, 1]
 */
export function calculateLinkDensity(element: Element): number {
  const totalText = (element.textContent || '').trim();
  if (totalText.length === 0) return 0;

  const links = element.querySelectorAll('a');
  let linkTextLength = 0;
  for (let i = 0; i < links.length; i++) {
    linkTextLength += (links[i].textContent || '').trim().length;
  }

  return linkTextLength / totalText.length;
}

// ---------------------------------------------------------------------------
// Text Density
// ---------------------------------------------------------------------------

/**
 * Calculate the text density (text-to-HTML ratio) of an element.
 *
 * High text density indicates content-rich elements.
 * Low text density indicates heavily decorated or empty containers.
 *
 * @param element - The element to analyze
 * @returns Text density ratio in [0, 1], clamped
 */
export function calculateTextDensity(element: Element): number {
  const textLength = (element.textContent || '').trim().length;
  const htmlLength = element.innerHTML.length;

  if (htmlLength === 0) return 0;

  // Text density: ratio of text to HTML (clamped to 1)
  return Math.min(1, textLength / htmlLength);
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Build an identifier string from an element's tag, id, classes, and data-* attributes.
 */
function getElementIdentString(el: Element): string {
  const parts: string[] = [el.tagName.toLowerCase()];

  if (el.id) parts.push(el.id);

  const className = el.className;
  if (className && typeof className === 'string') {
    parts.push(className);
  }

  // Check data-* attributes
  const attrs = el.attributes;
  for (let i = 0; i < attrs.length; i++) {
    if (attrs[i].name.startsWith('data-')) {
      parts.push(attrs[i].name);
      if (attrs[i].value.length < 50) {
        parts.push(attrs[i].value);
      }
    }
  }

  return parts.join(' ');
}
