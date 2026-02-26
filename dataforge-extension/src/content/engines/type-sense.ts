/**
 * TypeSense - Field Type Classification Engine
 *
 * Analyzes extracted text values and their source elements to determine
 * the semantic data type and suggest meaningful column names.
 *
 * Uses a weighted heuristic system: each rule returns a confidence score,
 * and the highest-confidence classification wins. Element context (tag,
 * attributes, position) serves as a secondary signal that can boost or
 * override pure text-based classification.
 */

import type { DataType, DetectedField } from '../../types/extraction';
import { generatePrefixedId } from '../../utils/id';

// ---------------------------------------------------------------------------
// Regex Library - compiled once, reused across calls
// ---------------------------------------------------------------------------

const RE_PRICE = /^[\s]*[£$€¥₹₩₽][\s]*[\d,.]+[\s]*$|^[\s]*[\d,.]+[\s]*[£$€¥₹₩₽][\s]*$|^[\s]*[\d,.]+\s*(USD|EUR|GBP|JPY|INR|CAD|AUD|CHF|CNY|KRW)[\s]*$/i;
const RE_PRICE_RANGE = /^[\s]*[£$€¥₹₩₽]?[\s]*[\d,.]+\s*[-–—to]+\s*[£$€¥₹₩₽]?[\s]*[\d,.]+[\s]*$/i;
const RE_EMAIL = /^[\s]*[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+[\s]*$/;
const RE_URL = /^[\s]*(https?:\/\/[^\s]+|www\.[^\s]+)[\s]*$/i;
const RE_PHONE = /^[\s]*[+]?[\d\s()./-]{7,20}[\s]*$/;
const RE_PHONE_STRICT = /^[\s]*(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}[\s]*$|^[\s]*\+?[0-9]{1,4}[-.\s]?[0-9]{2,4}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4}[\s]*$/;
const RE_RATING_NUMERIC = /^[\s]*([0-5](?:\.\d{1,2})?)\s*(?:\/\s*5|out\s+of\s+5|stars?)?[\s]*$/i;
const RE_RATING_STARS = /^[★☆⭐✩✪✫✬✭✮✯]+$/;
const RE_RATING_TEXT = /^\s*\d(?:\.\d)?\s*(?:\/\s*(?:5|10))\s*$/;
const RE_DATE_ISO = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2})?/;
const RE_DATE_US = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/;
const RE_DATE_EU = /^\d{1,2}[-./]\d{1,2}[-./]\d{2,4}$/;
const RE_DATE_LONG = /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:\s*,?\s*\d{2,4})?/i;
const RE_DATE_RELATIVE = /^\s*(?:\d+\s+(?:second|minute|hour|day|week|month|year)s?\s+ago|yesterday|today|just\s+now|last\s+\w+)\s*$/i;
const RE_TIME_AGO = /^\s*\d+[smhdwMy]\s*(?:ago)?\s*$/;
const RE_NUMBER = /^[\s]*[-+]?[\d,]+(?:\.\d+)?[\s]*$/;
const RE_PERCENTAGE = /^[\s]*[-+]?[\d,.]+\s*%[\s]*$/;
const RE_ZIPCODE = /^\s*\d{5}(?:-\d{4})?\s*$/;
const RE_STATE_ABBR = /^\s*[A-Z]{2}\s*$/;
const RE_LOCATION = /^[\s]*(?:[\w\s.'-]+,\s*){1,3}[\w\s.'-]+[\s]*$/;
const RE_LOCATION_WITH_ZIP = /(?:\d{5}(?:-\d{4})?|\b[A-Z]{2}\b.*\d{5})/;
const RE_IMAGE_URL = /\.(jpe?g|png|gif|webp|svg|avif|bmp|ico)(?:\?.*)?$/i;

// ---------------------------------------------------------------------------
// Classification rule: a function returning 0-1 confidence for a given type
// ---------------------------------------------------------------------------

interface ClassificationRule {
  type: DataType;
  suggestedName: string;
  /** Test a single value, return confidence 0-1 */
  testValue(value: string): number;
  /** Optional: test against element context for bonus confidence */
  testElement?(el: Element): number;
}

const RULES: ClassificationRule[] = [
  // ---- Price ----
  {
    type: 'price',
    suggestedName: 'Price',
    testValue(v: string): number {
      const trimmed = v.trim();
      if (!trimmed) return 0;
      if (RE_PRICE.test(trimmed)) return 0.95;
      if (RE_PRICE_RANGE.test(trimmed)) return 0.85;
      // Partial: contains currency symbol anywhere
      if (/[£$€¥₹₩₽]/.test(trimmed) && /\d/.test(trimmed)) return 0.75;
      return 0;
    },
    testElement(el: Element): number {
      const cls = el.className?.toString?.() ?? '';
      const itemprop = el.getAttribute('itemprop') ?? '';
      if (/price|cost|amount|sale/i.test(cls + itemprop)) return 0.3;
      if (el.hasAttribute('data-price') || el.hasAttribute('data-amount')) return 0.4;
      return 0;
    },
  },

  // ---- Email ----
  {
    type: 'email',
    suggestedName: 'Email',
    testValue(v: string): number {
      return RE_EMAIL.test(v.trim()) ? 0.98 : 0;
    },
    testElement(el: Element): number {
      if (el.tagName === 'A' && el.getAttribute('href')?.startsWith('mailto:')) return 0.5;
      const type = el.getAttribute('type');
      if (type === 'email') return 0.4;
      return 0;
    },
  },

  // ---- URL ----
  {
    type: 'url',
    suggestedName: 'URL',
    testValue(v: string): number {
      const trimmed = v.trim();
      if (RE_URL.test(trimmed)) return 0.95;
      if (RE_IMAGE_URL.test(trimmed)) return 0.85;
      return 0;
    },
    testElement(el: Element): number {
      if (el.tagName === 'A' && el.hasAttribute('href')) return 0.5;
      if (el.tagName === 'IMG' && el.hasAttribute('src')) return 0.4;
      return 0;
    },
  },

  // ---- Image ----
  {
    type: 'image',
    suggestedName: 'Image',
    testValue(v: string): number {
      if (RE_IMAGE_URL.test(v.trim())) return 0.90;
      return 0;
    },
    testElement(el: Element): number {
      if (el.tagName === 'IMG') return 0.8;
      if (el.tagName === 'PICTURE') return 0.7;
      const bg = (el as HTMLElement).style?.backgroundImage ?? '';
      if (bg && bg !== 'none' && /url\(/.test(bg)) return 0.6;
      const role = el.getAttribute('role');
      if (role === 'img') return 0.5;
      return 0;
    },
  },

  // ---- Rating ----
  {
    type: 'rating',
    suggestedName: 'Rating',
    testValue(v: string): number {
      const trimmed = v.trim();
      if (RE_RATING_STARS.test(trimmed)) return 0.95;
      if (RE_RATING_NUMERIC.test(trimmed)) return 0.90;
      if (RE_RATING_TEXT.test(trimmed)) return 0.85;
      return 0;
    },
    testElement(el: Element): number {
      const cls = el.className?.toString?.() ?? '';
      const itemprop = el.getAttribute('itemprop') ?? '';
      const ariaLabel = el.getAttribute('aria-label') ?? '';
      if (/rating|stars?|review-score/i.test(cls + itemprop + ariaLabel)) return 0.4;
      if (el.getAttribute('data-rating') || el.getAttribute('data-score')) return 0.5;
      return 0;
    },
  },

  // ---- Date ----
  {
    type: 'date',
    suggestedName: 'Date',
    testValue(v: string): number {
      const trimmed = v.trim();
      if (RE_DATE_ISO.test(trimmed)) return 0.98;
      if (RE_DATE_LONG.test(trimmed)) return 0.90;
      if (RE_DATE_US.test(trimmed)) return 0.80;
      if (RE_DATE_EU.test(trimmed)) return 0.75;
      if (RE_DATE_RELATIVE.test(trimmed)) return 0.85;
      if (RE_TIME_AGO.test(trimmed)) return 0.80;
      return 0;
    },
    testElement(el: Element): number {
      if (el.tagName === 'TIME') return 0.6;
      if (el.hasAttribute('datetime')) return 0.5;
      const itemprop = el.getAttribute('itemprop') ?? '';
      if (/date|time|published|created|updated/i.test(itemprop)) return 0.4;
      return 0;
    },
  },

  // ---- Phone ----
  {
    type: 'phone',
    suggestedName: 'Phone',
    testValue(v: string): number {
      const trimmed = v.trim();
      if (RE_PHONE_STRICT.test(trimmed)) return 0.92;
      if (RE_PHONE.test(trimmed) && trimmed.replace(/\D/g, '').length >= 7) return 0.70;
      return 0;
    },
    testElement(el: Element): number {
      if (el.tagName === 'A' && el.getAttribute('href')?.startsWith('tel:')) return 0.6;
      const itemprop = el.getAttribute('itemprop') ?? '';
      if (/telephone|phone|fax/i.test(itemprop)) return 0.4;
      return 0;
    },
  },

  // ---- Location ----
  {
    type: 'location',
    suggestedName: 'Location',
    testValue(v: string): number {
      const trimmed = v.trim();
      if (RE_LOCATION_WITH_ZIP.test(trimmed) && trimmed.includes(',')) return 0.85;
      if (RE_ZIPCODE.test(trimmed)) return 0.50; // just a zip
      // "City, ST" pattern
      if (/^[A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s*[A-Z]{2}$/.test(trimmed)) return 0.80;
      // Broader location: has comma separators, no numbers heavy
      if (RE_LOCATION.test(trimmed) && trimmed.includes(',') && !/\d{4,}/.test(trimmed)) return 0.50;
      return 0;
    },
    testElement(el: Element): number {
      const itemprop = el.getAttribute('itemprop') ?? '';
      const cls = el.className?.toString?.() ?? '';
      if (/address|location|locality|region|geo/i.test(itemprop + cls)) return 0.4;
      if (el.tagName === 'ADDRESS') return 0.5;
      return 0;
    },
  },

  // ---- Number ----
  {
    type: 'number',
    suggestedName: 'Number',
    testValue(v: string): number {
      const trimmed = v.trim();
      if (RE_PERCENTAGE.test(trimmed)) return 0.85;
      if (RE_NUMBER.test(trimmed)) return 0.70;
      return 0;
    },
    testElement(el: Element): number {
      const type = el.getAttribute('type');
      if (type === 'number') return 0.3;
      return 0;
    },
  },

  // ---- Text (fallback, always matches but with low confidence) ----
  {
    type: 'text',
    suggestedName: 'Text',
    testValue(_v: string): number {
      return 0.10; // fallback
    },
  },
];

// ---------------------------------------------------------------------------
// Contextual name inference from element attributes/position
// ---------------------------------------------------------------------------

/** Map of itemprop values to friendly names */
const ITEMPROP_NAMES: Record<string, string> = {
  name: 'Name',
  headline: 'Title',
  description: 'Description',
  price: 'Price',
  priceCurrency: 'Currency',
  ratingValue: 'Rating',
  reviewCount: 'Review Count',
  author: 'Author',
  datePublished: 'Published Date',
  dateCreated: 'Created Date',
  dateModified: 'Modified Date',
  image: 'Image',
  url: 'URL',
  telephone: 'Phone',
  email: 'Email',
  address: 'Address',
  addressLocality: 'City',
  addressRegion: 'State',
  postalCode: 'ZIP Code',
  brand: 'Brand',
  sku: 'SKU',
  availability: 'Availability',
  category: 'Category',
  color: 'Color',
  size: 'Size',
};

/** Infer a meaningful name from element context */
function inferNameFromElement(el: Element | undefined): string | null {
  if (!el) return null;

  try {
    // 1. itemprop is the most reliable semantic signal
    const itemprop = el.getAttribute('itemprop');
    if (itemprop && ITEMPROP_NAMES[itemprop]) return ITEMPROP_NAMES[itemprop];
    if (itemprop) return capitalize(itemprop);

    // 2. aria-label / title
    const ariaLabel = el.getAttribute('aria-label');
    if (ariaLabel && ariaLabel.length < 30) return capitalize(ariaLabel);

    // 3. data-field / data-col / data-name attributes
    for (const attr of ['data-field', 'data-col', 'data-name', 'data-label', 'data-column']) {
      const val = el.getAttribute(attr);
      if (val && val.length < 30) return capitalize(val);
    }

    // 4. Meaningful class names (skip utility classes)
    const cls = el.className?.toString?.() ?? '';
    if (cls) {
      const meaningful = extractMeaningfulClassName(cls);
      if (meaningful) return capitalize(meaningful);
    }

    // 5. Heading tag = Title
    if (/^H[1-6]$/.test(el.tagName)) return 'Title';

    // 6. img = Image
    if (el.tagName === 'IMG') return 'Image';

    // 7. a = Link
    if (el.tagName === 'A' && el.hasAttribute('href')) return 'Link';

    // 8. time = Date
    if (el.tagName === 'TIME') return 'Date';

    // 9. address = Address
    if (el.tagName === 'ADDRESS') return 'Address';
  } catch {
    // Element access can fail in edge cases (detached nodes, cross-origin)
  }

  return null;
}

/** Extract a semantically meaningful class name, skipping utility classes */
function extractMeaningfulClassName(classStr: string): string | null {
  const UTILITY_PREFIXES = [
    'mt-', 'mb-', 'ml-', 'mr-', 'mx-', 'my-', 'pt-', 'pb-', 'pl-', 'pr-', 'px-', 'py-',
    'p-', 'm-', 'w-', 'h-', 'min-', 'max-', 'text-', 'bg-', 'border-', 'rounded-',
    'flex', 'grid', 'col-', 'row-', 'gap-', 'space-', 'justify-', 'items-', 'self-',
    'font-', 'leading-', 'tracking-', 'opacity-', 'shadow-', 'ring-', 'transition-',
    'transform', 'translate-', 'rotate-', 'scale-', 'animate-', 'duration-',
    'overflow-', 'z-', 'inset-', 'top-', 'right-', 'bottom-', 'left-',
    'sr-only', 'not-sr-only', 'block', 'inline', 'hidden', 'visible',
    'container', 'relative', 'absolute', 'fixed', 'sticky',
    'd-', 'ms-', 'me-', 'ps-', 'pe-', // Bootstrap 5
  ];

  const classes = classStr.split(/\s+/).filter(Boolean);
  for (const cls of classes) {
    const lower = cls.toLowerCase();
    // Skip utility classes
    const isUtility = UTILITY_PREFIXES.some(prefix => lower.startsWith(prefix)) ||
      /^[a-z]-\d/.test(lower) || // e.g., "p-4", "m-2"
      lower.length <= 2;
    if (isUtility) continue;

    // Skip BEM modifier-only or state classes
    if (/^(is-|has-|js-|__|--)/.test(lower)) continue;

    // Clean BEM: extract the block or element name
    const bemClean = cls.replace(/--[\w-]+$/, '').replace(/__[\w-]+$/, '');

    // Must be meaningful (3+ chars, not a color/size token)
    if (bemClean.length >= 3 && !/^(sm|md|lg|xl|xs|xxl|2xl|3xl)$/.test(bemClean.toLowerCase())) {
      return bemClean.replace(/[-_]+/g, ' ').trim();
    }
  }

  return null;
}

/** Capitalize first letter of each word */
function capitalize(str: string): string {
  return str
    .replace(/[-_]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2') // camelCase split
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ')
    .trim();
}

// ---------------------------------------------------------------------------
// Title / Description heuristic
// ---------------------------------------------------------------------------

function isLikelyTitle(values: string[], el?: Element): number {
  if (!values.length) return 0;
  let score = 0;

  // Element is a heading tag
  if (el && /^H[1-6]$/.test(el.tagName)) score += 0.5;

  // Element has title-related itemprop
  const itemprop = el?.getAttribute('itemprop') ?? '';
  if (/name|headline|title/i.test(itemprop)) score += 0.4;

  // Short text: 3-120 chars on average
  const avgLen = values.reduce((sum, v) => sum + v.trim().length, 0) / values.length;
  if (avgLen >= 3 && avgLen <= 120) score += 0.3;
  else score *= 0.5;

  // Not all identical
  const unique = new Set(values.map(v => v.trim().toLowerCase()));
  if (unique.size > 1 || values.length === 1) score += 0.1;

  return Math.min(score, 1.0);
}

function isLikelyDescription(values: string[], el?: Element): number {
  if (!values.length) return 0;
  let score = 0;

  const itemprop = el?.getAttribute('itemprop') ?? '';
  if (/description|summary|abstract|body/i.test(itemprop)) score += 0.4;

  // Long text: 50+ chars on average
  const avgLen = values.reduce((sum, v) => sum + v.trim().length, 0) / values.length;
  if (avgLen > 100) score += 0.4;
  else if (avgLen > 50) score += 0.2;
  else score *= 0.3;

  // Check for paragraph tag
  if (el?.tagName === 'P') score += 0.2;

  return Math.min(score, 1.0);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface FieldClassification {
  dataType: DataType;
  suggestedName: string;
  confidence: number;
}

/**
 * Classify an array of extracted string values into a semantic data type.
 *
 * @param values - Array of sample string values from the same field
 * @param element - Optional source DOM element for contextual hints
 * @returns Classification result with type, suggested name, and confidence
 */
export function classifyField(
  values: string[],
  element?: Element,
): FieldClassification {
  // Filter out empty/null values for analysis, but remember original count
  const cleanValues = values
    .filter(v => v != null)
    .map(v => String(v).trim())
    .filter(v => v.length > 0);

  if (cleanValues.length === 0) {
    return { dataType: 'text', suggestedName: 'Text', confidence: 0.1 };
  }

  // ---- Run all rules against all values ----
  const typeScores = new Map<DataType, { totalValue: number; totalElement: number; rule: ClassificationRule }>();

  for (const rule of RULES) {
    let valueScoreSum = 0;
    let matchCount = 0;

    for (const val of cleanValues) {
      const score = rule.testValue(val);
      if (score > 0) {
        valueScoreSum += score;
        matchCount++;
      }
    }

    // Require at least 40% of values to match (unless we have very few samples)
    const matchRatio = matchCount / cleanValues.length;
    if (matchRatio < 0.4 && cleanValues.length > 2 && rule.type !== 'text') continue;

    const avgValueScore = matchCount > 0 ? valueScoreSum / cleanValues.length : 0;

    // Element bonus
    let elementScore = 0;
    if (element && rule.testElement) {
      try {
        elementScore = rule.testElement(element);
      } catch {
        // Ignore element access errors
      }
    }

    const existing = typeScores.get(rule.type);
    const combined = avgValueScore + elementScore;
    if (!existing || combined > existing.totalValue + existing.totalElement) {
      typeScores.set(rule.type, {
        totalValue: avgValueScore,
        totalElement: elementScore,
        rule,
      });
    }
  }

  // ---- Special heuristics for Title and Description ----
  const titleScore = isLikelyTitle(cleanValues, element);
  const descScore = isLikelyDescription(cleanValues, element);

  // ---- Pick the winner ----
  let bestType: DataType = 'text';
  let bestScore = 0;
  let bestRule: ClassificationRule | null = null;

  for (const [type, data] of typeScores) {
    const combined = data.totalValue * 0.7 + data.totalElement * 0.3;
    if (combined > bestScore) {
      bestScore = combined;
      bestType = type;
      bestRule = data.rule;
    }
  }

  // Title/Description can override generic 'text' if strong enough
  if (bestType === 'text' || bestScore < 0.4) {
    if (titleScore > 0.5 && titleScore > descScore) {
      bestType = 'text';
      bestScore = titleScore;
      const name = inferNameFromElement(element) ?? 'Title';
      return {
        dataType: bestType,
        suggestedName: name,
        confidence: Math.min(bestScore, 1.0),
      };
    }
    if (descScore > 0.5) {
      bestType = 'text';
      bestScore = descScore;
      const name = inferNameFromElement(element) ?? 'Description';
      return {
        dataType: bestType,
        suggestedName: name,
        confidence: Math.min(bestScore, 1.0),
      };
    }
  }

  // ---- Determine suggested name ----
  let suggestedName = bestRule?.suggestedName ?? 'Text';

  // Element context can provide a more specific name
  const elementName = inferNameFromElement(element);
  if (elementName) {
    suggestedName = elementName;
  }

  return {
    dataType: bestType,
    suggestedName,
    confidence: Math.min(bestScore, 1.0),
  };
}

/**
 * Build a DetectedField from sample values and an element.
 * Convenience wrapper used by PatternSense.
 */
export function buildDetectedField(
  relativeSelector: string,
  sampleValues: string[],
  element?: Element,
): DetectedField {
  const classification = classifyField(sampleValues, element);

  return {
    id: generatePrefixedId('fld'),
    name: classification.suggestedName,
    relativeSelector,
    sampleValues: sampleValues.slice(0, 5),
    dataType: classification.dataType,
    confidence: classification.confidence,
    enabled: true,
  };
}
