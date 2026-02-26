/**
 * DataExtractor – Extract structured data from matched elements.
 *
 * Takes a CSS selector and field configurations, extracts text/attributes
 * from all matching elements, resolves relative URLs, and performs
 * post-extraction cleaning via the CleanSense engine.
 */

import type { DetectedField, Row } from '../types/extraction';
import { generatePrefixedId } from '../utils/id';
import { cleanValue as cleanSenseValue } from './engines/clean-sense';

export interface ExtractDataOptions {
  /** Base URL for resolving relative URLs (defaults to current page). */
  baseUrl?: string;
  /** Maximum number of items to extract (0 = unlimited). */
  limit?: number;
  /** Whether to run CleanSense post-processing. Default true. */
  clean?: boolean;
  /** Whether to deduplicate rows. Default true. */
  deduplicate?: boolean;
}

/**
 * Extract data from all elements matching `selector` using the given field configs.
 *
 * @param selector - CSS selector for the repeating item container
 * @param fields - Array of field definitions specifying what to extract from each item
 * @param options - Extraction options
 * @returns Array of Row objects
 */
export function extractData(
  selector: string,
  fields: DetectedField[],
  options: ExtractDataOptions = {},
): Row[] {
  const {
    baseUrl = window.location.href,
    limit = 0,
    clean = true,
    deduplicate = true,
  } = options;

  // Only extract enabled fields
  const enabledFields = fields.filter(f => f.enabled);
  if (enabledFields.length === 0) return [];

  let elements: NodeListOf<Element>;
  try {
    elements = document.querySelectorAll(selector);
  } catch {
    return [];
  }

  if (elements.length === 0) return [];

  const maxItems = limit > 0 ? Math.min(limit, elements.length) : elements.length;
  const rows: Row[] = [];
  const seenHashes = new Set<string>();

  for (let i = 0; i < maxItems; i++) {
    const el = elements[i];
    const data: Record<string, string | number | null> = {};

    for (const field of enabledFields) {
      const rawValue = extractFieldValue(el, field, baseUrl);
      data[field.name] = clean ? cleanValue(rawValue, field.dataType) : rawValue;
    }

    // Deduplication check
    if (deduplicate) {
      const hash = computeRowHash(data);
      if (seenHashes.has(hash)) continue;
      seenHashes.add(hash);
    }

    rows.push({
      id: generatePrefixedId('row'),
      data,
      sourceUrl: window.location.href,
      extractedAt: Date.now(),
    });
  }

  return rows;
}

/**
 * Extract a single field value from an item element.
 */
function extractFieldValue(
  itemEl: Element,
  field: DetectedField,
  baseUrl: string,
): string | number | null {
  // Find the target sub-element using the relative selector
  let target: Element | null = null;

  if (field.relativeSelector && field.relativeSelector !== ':scope') {
    try {
      target = itemEl.querySelector(field.relativeSelector);
    } catch {
      target = null;
    }
  }

  // Fall back to the item element itself
  if (!target) {
    target = itemEl;
  }

  // Extract based on data type
  switch (field.dataType) {
    case 'url':
      return extractUrl(target, baseUrl);

    case 'image':
      return extractImageUrl(target, baseUrl);

    case 'email':
      return extractEmail(target);

    case 'number':
      return extractNumber(target);

    case 'price':
      return extractPrice(target);

    case 'rating':
      return extractRating(target);

    case 'date':
      return extractDate(target);

    case 'phone':
      return extractPhone(target);

    case 'text':
    case 'location':
    default:
      return extractText(target);
  }
}

// ---------------------------------------------------------------------------
// Type-specific extractors
// ---------------------------------------------------------------------------

function extractText(el: Element): string | null {
  // Try textContent first
  const text = (el.textContent || '').trim();
  if (text) return text;

  // Fall back to common attributes
  const alt = el.getAttribute('alt');
  if (alt) return alt.trim();

  const title = el.getAttribute('title');
  if (title) return title.trim();

  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel) return ariaLabel.trim();

  const placeholder = el.getAttribute('placeholder');
  if (placeholder) return placeholder.trim();

  // Check value for input/select elements
  if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
    return el.value || null;
  }

  return null;
}

function extractUrl(el: Element, baseUrl: string): string | null {
  // Check href on anchors
  const href = el.getAttribute('href');
  if (href) return resolveUrl(href, baseUrl);

  // Check data-href or data-url
  const dataHref = el.getAttribute('data-href') || el.getAttribute('data-url');
  if (dataHref) return resolveUrl(dataHref, baseUrl);

  // Look for a child anchor
  const anchor = el.querySelector('a[href]');
  if (anchor) {
    const anchorHref = anchor.getAttribute('href');
    if (anchorHref) return resolveUrl(anchorHref, baseUrl);
  }

  // Extract URL from text content
  const text = (el.textContent || '').trim();
  const urlMatch = text.match(/https?:\/\/[^\s<>"']+/);
  if (urlMatch) return urlMatch[0];

  return null;
}

function extractImageUrl(el: Element, baseUrl: string): string | null {
  // Direct img src
  if (el.tagName === 'IMG') {
    const src = el.getAttribute('src') || el.getAttribute('data-src') || el.getAttribute('data-lazy-src');
    if (src) return resolveUrl(src, baseUrl);
  }

  // srcset – pick the largest
  const srcset = el.getAttribute('srcset');
  if (srcset) {
    const bestSrc = parseSrcsetBest(srcset);
    if (bestSrc) return resolveUrl(bestSrc, baseUrl);
  }

  // Check child img
  const img = el.querySelector('img');
  if (img) {
    const src = img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
    if (src) return resolveUrl(src, baseUrl);

    const imgSrcset = img.getAttribute('srcset');
    if (imgSrcset) {
      const bestSrc = parseSrcsetBest(imgSrcset);
      if (bestSrc) return resolveUrl(bestSrc, baseUrl);
    }
  }

  // Check background-image via style attribute
  const bgImage = extractBackgroundImage(el);
  if (bgImage) return resolveUrl(bgImage, baseUrl);

  // Check picture > source
  const picture = el.tagName === 'PICTURE' ? el : el.querySelector('picture');
  if (picture) {
    const source = picture.querySelector('source[srcset]');
    if (source) {
      const sourceSrcset = source.getAttribute('srcset');
      if (sourceSrcset) {
        const bestSrc = parseSrcsetBest(sourceSrcset);
        if (bestSrc) return resolveUrl(bestSrc, baseUrl);
      }
    }
  }

  return null;
}

function extractEmail(el: Element): string | null {
  // Check mailto: links
  const href = el.getAttribute('href');
  if (href && href.startsWith('mailto:')) {
    return href.replace('mailto:', '').split('?')[0].trim();
  }

  // Check child mailto links
  const mailtoLink = el.querySelector('a[href^="mailto:"]');
  if (mailtoLink) {
    const mailHref = mailtoLink.getAttribute('href');
    if (mailHref) return mailHref.replace('mailto:', '').split('?')[0].trim();
  }

  // Extract email from text content
  const text = (el.textContent || '').trim();
  const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  return emailMatch ? emailMatch[0] : null;
}

function extractNumber(el: Element): number | null {
  const text = (el.textContent || '').trim();
  // Remove commas and spaces, then parse
  const cleaned = text.replace(/[,\s]/g, '');
  const match = cleaned.match(/-?[\d.]+/);
  if (match) {
    const num = parseFloat(match[0]);
    return Number.isFinite(num) ? num : null;
  }
  return null;
}

function extractPrice(el: Element): string | null {
  const text = (el.textContent || '').trim();
  // Match common price patterns: $12.99, EUR 10, 1,234.56, etc.
  const priceMatch = text.match(/[£$€¥₹]?\s*[\d,]+\.?\d{0,2}\s*[£$€¥₹]?/);
  if (priceMatch) {
    return priceMatch[0].trim();
  }
  return text || null;
}

function extractRating(el: Element): string | null {
  // Check aria-label for rating info
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel && /\d/.test(ariaLabel)) {
    return ariaLabel.trim();
  }

  // Check data-rating attribute
  const dataRating = el.getAttribute('data-rating') || el.getAttribute('data-score');
  if (dataRating) return dataRating;

  // Check for filled star icons
  const stars = el.querySelectorAll('[class*="star"][class*="fill"], [class*="star"][class*="active"], [aria-label*="star"]');
  if (stars.length > 0) {
    return `${stars.length}/5`;
  }

  // Check width-based ratings (e.g., star rating containers)
  const inner = el.querySelector('[style*="width"]');
  if (inner) {
    const style = inner.getAttribute('style') || '';
    const widthMatch = style.match(/width:\s*([\d.]+)%/);
    if (widthMatch) {
      const percentage = parseFloat(widthMatch[1]);
      const rating = (percentage / 20).toFixed(1);
      return `${rating}/5`;
    }
  }

  // Fall back to text
  const text = (el.textContent || '').trim();
  const ratingMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:\/\s*\d+|out of \d+|stars?)?/i);
  return ratingMatch ? ratingMatch[0] : null;
}

function extractDate(el: Element): string | null {
  // Check time element's datetime attribute
  if (el.tagName === 'TIME') {
    const datetime = el.getAttribute('datetime');
    if (datetime) return datetime;
  }

  const timeEl = el.querySelector('time[datetime]');
  if (timeEl) {
    const datetime = timeEl.getAttribute('datetime');
    if (datetime) return datetime;
  }

  // Check data-date or data-timestamp
  const dataDate = el.getAttribute('data-date') || el.getAttribute('data-timestamp');
  if (dataDate) return dataDate;

  // Fall back to text
  return (el.textContent || '').trim() || null;
}

function extractPhone(el: Element): string | null {
  // Check tel: links
  const href = el.getAttribute('href');
  if (href && href.startsWith('tel:')) {
    return href.replace('tel:', '').trim();
  }

  const telLink = el.querySelector('a[href^="tel:"]');
  if (telLink) {
    const telHref = telLink.getAttribute('href');
    if (telHref) return telHref.replace('tel:', '').trim();
  }

  // Extract phone from text
  const text = (el.textContent || '').trim();
  const phoneMatch = text.match(/[+]?[\d\s()-]{7,}/);
  return phoneMatch ? phoneMatch[0].trim() : null;
}

// ---------------------------------------------------------------------------
// CleanSense integration – post-extraction cleaning
// ---------------------------------------------------------------------------

function cleanValue(value: string | number | null, dataType: string): string | number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;

  try {
    // Delegate to the CleanSense engine for thorough, type-aware cleaning
    const cleaned = cleanSenseValue(
      value,
      dataType as import('../types/extraction').DataType,
      window.location.href,
    );
    return cleaned || null;
  } catch {
    // Fallback: basic cleaning if CleanSense fails
    let cleaned = value;
    cleaned = cleaned.replace(/[\u200B\u200C\u200D\uFEFF\u00AD]/g, '');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();
    return cleaned || null;
  }
}

// ---------------------------------------------------------------------------
// URL resolution
// ---------------------------------------------------------------------------

function resolveUrl(url: string, baseUrl: string): string {
  if (!url) return '';

  // Already absolute
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }

  // Protocol-relative
  if (url.startsWith('//')) {
    try {
      const base = new URL(baseUrl);
      return `${base.protocol}${url}`;
    } catch {
      return `https:${url}`;
    }
  }

  // Relative URL – resolve against base
  try {
    return new URL(url, baseUrl).href;
  } catch {
    return url;
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse a srcset attribute and return the URL of the largest image.
 */
function parseSrcsetBest(srcset: string): string | null {
  const entries = srcset.split(',').map(s => s.trim()).filter(Boolean);
  let bestUrl = '';
  let bestSize = 0;

  for (const entry of entries) {
    const parts = entry.split(/\s+/);
    const url = parts[0];
    const descriptor = parts[1] || '1x';

    let size = 1;
    if (descriptor.endsWith('w')) {
      size = parseInt(descriptor, 10) || 1;
    } else if (descriptor.endsWith('x')) {
      size = (parseFloat(descriptor) || 1) * 1000; // Weight x descriptors higher
    }

    if (size > bestSize) {
      bestSize = size;
      bestUrl = url;
    }
  }

  return bestUrl || null;
}

/**
 * Extract a background-image URL from an element's inline or computed style.
 */
function extractBackgroundImage(el: Element): string | null {
  // Check inline style first
  const inlineStyle = el.getAttribute('style') || '';
  const inlineMatch = inlineStyle.match(/background-image\s*:\s*url\(["']?([^"')]+)["']?\)/);
  if (inlineMatch) return inlineMatch[1];

  // Check computed style
  try {
    const computed = getComputedStyle(el);
    const bgImage = computed.backgroundImage;
    if (bgImage && bgImage !== 'none') {
      const match = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
      if (match) return match[1];
    }
  } catch {
    // getComputedStyle can fail on detached elements
  }

  return null;
}

/**
 * Compute a simple hash for a row's data to detect duplicates.
 */
function computeRowHash(data: Record<string, string | number | null>): string {
  const keys = Object.keys(data).sort();
  const parts: string[] = [];
  for (const key of keys) {
    const val = data[key];
    parts.push(`${key}=${val === null ? '' : String(val)}`);
  }
  return parts.join('|');
}
