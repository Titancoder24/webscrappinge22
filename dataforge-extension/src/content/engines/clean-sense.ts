/**
 * CleanSense - Data Cleaning Pipeline
 *
 * A multi-stage data cleaning pipeline that transforms raw scraped values
 * into normalized, analysis-ready data. Each stage is idempotent and can
 * be applied independently or as part of the full pipeline.
 *
 * Pipeline stages:
 *   1. Trim whitespace & collapse internal whitespace
 *   2. Normalize Unicode (NFC normalization, smart quote replacement)
 *   3. Resolve relative URLs to absolute
 *   4. Decode HTML entities
 *   5. Strip invisible characters (zero-width, soft hyphens, etc.)
 *   6. Normalize prices to numeric strings
 *   7. Parse dates to ISO 8601
 *   8. Detect and flag duplicate rows (Levenshtein distance)
 *   9. Remove empty rows
 */

import type { DataType, Row } from '../../types/extraction';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Characters that are invisible or zero-width */
const INVISIBLE_CHARS = /[\u200B\u200C\u200D\u200E\u200F\uFEFF\u00AD\u2060\u2061\u2062\u2063\u2064\u034F\u061C\u180E\u2028\u2029\u202A-\u202E\u2066-\u2069]/g;

/** HTML entity map for the most common named entities */
const HTML_ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&apos;': "'",
  '&nbsp;': ' ',
  '&ndash;': '\u2013',
  '&mdash;': '\u2014',
  '&lsquo;': '\u2018',
  '&rsquo;': '\u2019',
  '&ldquo;': '\u201C',
  '&rdquo;': '\u201D',
  '&bull;': '\u2022',
  '&hellip;': '\u2026',
  '&trade;': '\u2122',
  '&copy;': '\u00A9',
  '&reg;': '\u00AE',
  '&deg;': '\u00B0',
  '&plusmn;': '\u00B1',
  '&times;': '\u00D7',
  '&divide;': '\u00F7',
  '&cent;': '\u00A2',
  '&pound;': '\u00A3',
  '&yen;': '\u00A5',
  '&euro;': '\u20AC',
};

/** Regex to match HTML numeric entities */
const RE_NUMERIC_ENTITY = /&#(\d+);/g;
const RE_HEX_ENTITY = /&#x([0-9a-fA-F]+);/g;
const RE_NAMED_ENTITY = /&([a-zA-Z]+);/g;

/** Month name to number mapping */
const MONTH_MAP: Record<string, number> = {
  jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3,
  apr: 4, april: 4, may: 5, jun: 6, june: 6,
  jul: 7, july: 7, aug: 8, august: 8, sep: 9, sept: 9, september: 9,
  oct: 10, october: 10, nov: 11, november: 11, dec: 12, december: 12,
};

/** Currency symbols to strip during price normalization */
const CURRENCY_SYMBOLS = /[£$€¥₹₩₽¢]/g;
const CURRENCY_CODES = /\s*(USD|EUR|GBP|JPY|INR|CAD|AUD|CHF|CNY|KRW|BRL|MXN|SEK|NOK|DKK|PLN|CZK|HUF|RUB|TRY|ZAR|SGD|HKD|NZD|THB|PHP|TWD|IDR|MYR|VND|ARS|CLP|COP|PEN|ILS)\s*/gi;

// ---------------------------------------------------------------------------
// Stage 1: Trim whitespace
// ---------------------------------------------------------------------------

function trimWhitespace(value: string): string {
  // Replace all forms of whitespace (including non-breaking) with a single space
  return value
    .replace(/[\s\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]+/g, ' ')
    .trim();
}

// ---------------------------------------------------------------------------
// Stage 2: Normalize Unicode
// ---------------------------------------------------------------------------

function normalizeUnicode(value: string): string {
  try {
    // NFC normalization: compose combining characters
    let normalized = value.normalize('NFC');

    // Replace smart quotes with standard quotes
    normalized = normalized
      .replace(/[\u2018\u2019\u201A\u201B]/g, "'")  // single quotes
      .replace(/[\u201C\u201D\u201E\u201F]/g, '"')  // double quotes
      .replace(/\u2026/g, '...')                      // ellipsis
      .replace(/[\u2013\u2014]/g, '-')                // en/em dash to hyphen
      .replace(/\u00A0/g, ' ');                       // non-breaking space

    return normalized;
  } catch {
    return value;
  }
}

// ---------------------------------------------------------------------------
// Stage 3: Resolve relative URLs
// ---------------------------------------------------------------------------

function resolveUrl(value: string, baseUrl: string): string {
  const trimmed = value.trim();

  // Skip if empty, not URL-like, or already absolute
  if (!trimmed) return trimmed;
  if (/^(https?:\/\/|data:|blob:|javascript:|mailto:|tel:)/i.test(trimmed)) return trimmed;

  // Only resolve if it looks like a path or relative URL
  if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../') || trimmed.startsWith('//')) {
    try {
      const resolved = new URL(trimmed, baseUrl);
      return resolved.href;
    } catch {
      return trimmed;
    }
  }

  return trimmed;
}

// ---------------------------------------------------------------------------
// Stage 4: Decode HTML entities
// ---------------------------------------------------------------------------

function decodeHtmlEntities(value: string): string {
  let result = value;

  // Named entities
  result = result.replace(RE_NAMED_ENTITY, (match) => {
    return HTML_ENTITIES[match] ?? match;
  });

  // Numeric entities (decimal)
  result = result.replace(RE_NUMERIC_ENTITY, (_match, code) => {
    try {
      const num = parseInt(code, 10);
      return num > 0 && num < 0x110000 ? String.fromCodePoint(num) : _match;
    } catch {
      return _match;
    }
  });

  // Numeric entities (hex)
  result = result.replace(RE_HEX_ENTITY, (_match, code) => {
    try {
      const num = parseInt(code, 16);
      return num > 0 && num < 0x110000 ? String.fromCodePoint(num) : _match;
    } catch {
      return _match;
    }
  });

  return result;
}

// ---------------------------------------------------------------------------
// Stage 5: Strip invisible characters
// ---------------------------------------------------------------------------

function stripInvisibleChars(value: string): string {
  return value.replace(INVISIBLE_CHARS, '');
}

// ---------------------------------------------------------------------------
// Stage 6: Normalize prices to numeric
// ---------------------------------------------------------------------------

function normalizePrice(value: string): string {
  const trimmed = value.trim();

  // Detect if this is even a price-like string
  if (!/[£$€¥₹₩₽¢]/.test(trimmed) && !/\d/.test(trimmed)) return trimmed;

  // Handle price ranges: keep as-is but normalize each part
  if (/[-\u2013\u2014]/.test(trimmed) && /\d.*[-\u2013\u2014].*\d/.test(trimmed)) {
    const parts = trimmed.split(/\s*[-\u2013\u2014]\s*/);
    if (parts.length === 2) {
      const left = normalizeSinglePrice(parts[0]);
      const right = normalizeSinglePrice(parts[1]);
      if (left && right) return `${left}-${right}`;
    }
  }

  return normalizeSinglePrice(trimmed) ?? trimmed;
}

function normalizeSinglePrice(value: string): string | null {
  // Remove currency symbols and codes
  let cleaned = value
    .replace(CURRENCY_SYMBOLS, '')
    .replace(CURRENCY_CODES, '')
    .trim();

  if (!cleaned) return null;

  // Handle European format: 1.234,56 -> 1234.56
  // vs American format: 1,234.56 -> 1234.56
  // Heuristic: if last separator is comma and has 2 digits after, it's European
  const lastComma = cleaned.lastIndexOf(',');
  const lastDot = cleaned.lastIndexOf('.');

  if (lastComma > lastDot && lastComma === cleaned.length - 3) {
    // European: 1.234,56 -> remove dots, replace comma with dot
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
  } else if (lastDot > lastComma) {
    // American: 1,234.56 -> remove commas
    cleaned = cleaned.replace(/,/g, '');
  } else if (lastComma > -1 && lastDot === -1) {
    // Only commas: check if it's a thousand separator or decimal
    const afterComma = cleaned.substring(lastComma + 1);
    if (afterComma.length === 2) {
      // Likely European decimal: 1234,56
      cleaned = cleaned.replace(',', '.');
    } else {
      // Likely thousand separator: 1,234
      cleaned = cleaned.replace(/,/g, '');
    }
  }

  // Remove any remaining non-numeric chars except dot and minus
  cleaned = cleaned.replace(/[^\d.\-]/g, '');

  // Validate it's a number
  const num = parseFloat(cleaned);
  if (isNaN(num)) return null;

  // Format: up to 2 decimal places, no trailing zeros for whole numbers
  return num % 1 === 0 ? num.toString() : num.toFixed(2);
}

// ---------------------------------------------------------------------------
// Stage 7: Parse dates to ISO 8601
// ---------------------------------------------------------------------------

function parseDate(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;

  try {
    // Already ISO
    if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?/.test(trimmed)) {
      return trimmed;
    }

    // "Month DD, YYYY" or "Month DD YYYY"
    const longMatch = trimmed.match(
      /^(\w+)\s+(\d{1,2})(?:\s*,?\s*(\d{4}))?\s*$/i
    );
    if (longMatch) {
      const month = MONTH_MAP[longMatch[1].toLowerCase()];
      if (month) {
        const day = parseInt(longMatch[2], 10);
        const year = longMatch[3] ? parseInt(longMatch[3], 10) : new Date().getFullYear();
        if (day >= 1 && day <= 31) {
          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }
    }

    // "DD Month YYYY"
    const dmyLongMatch = trimmed.match(
      /^(\d{1,2})\s+(\w+)\s+(\d{4})\s*$/i
    );
    if (dmyLongMatch) {
      const month = MONTH_MAP[dmyLongMatch[2].toLowerCase()];
      if (month) {
        const day = parseInt(dmyLongMatch[1], 10);
        const year = parseInt(dmyLongMatch[3], 10);
        if (day >= 1 && day <= 31) {
          return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        }
      }
    }

    // "Month YYYY" (no day)
    const monthYearMatch = trimmed.match(/^(\w+)\s+(\d{4})\s*$/i);
    if (monthYearMatch) {
      const month = MONTH_MAP[monthYearMatch[1].toLowerCase()];
      if (month) {
        const year = parseInt(monthYearMatch[2], 10);
        return `${year}-${String(month).padStart(2, '0')}-01`;
      }
    }

    // MM/DD/YYYY or M/D/YY
    const usMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
    if (usMatch) {
      const month = parseInt(usMatch[1], 10);
      const day = parseInt(usMatch[2], 10);
      let year = parseInt(usMatch[3], 10);
      if (year < 100) year += year < 50 ? 2000 : 1900;
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }

    // DD-MM-YYYY or DD.MM.YYYY (European)
    const euMatch = trimmed.match(/^(\d{1,2})[-.](\d{1,2})[-.](\d{2,4})$/);
    if (euMatch) {
      const day = parseInt(euMatch[1], 10);
      const month = parseInt(euMatch[2], 10);
      let year = parseInt(euMatch[3], 10);
      if (year < 100) year += year < 50 ? 2000 : 1900;
      if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }

    // Relative dates - return ISO of computed date
    const relativeResult = parseRelativeDate(trimmed);
    if (relativeResult) return relativeResult;

  } catch {
    // If parsing fails, return original
  }

  return trimmed;
}

function parseRelativeDate(value: string): string | null {
  const now = new Date();
  const lower = value.toLowerCase().trim();

  if (lower === 'today' || lower === 'just now') {
    return toISODate(now);
  }
  if (lower === 'yesterday') {
    now.setDate(now.getDate() - 1);
    return toISODate(now);
  }

  // "X hours/days/weeks/months/years ago"
  const agoMatch = lower.match(/^(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago$/);
  if (agoMatch) {
    const amount = parseInt(agoMatch[1], 10);
    const unit = agoMatch[2];
    return toISODate(subtractTime(now, amount, unit));
  }

  // Compact format: "3d ago", "2h ago", "5m", "1y"
  const compactMatch = lower.match(/^(\d+)([smhdwMy])\s*(?:ago)?$/);
  if (compactMatch) {
    const amount = parseInt(compactMatch[1], 10);
    const unitMap: Record<string, string> = {
      s: 'second', m: 'minute', h: 'hour', d: 'day', w: 'week', M: 'month', y: 'year',
    };
    // Re-check with original (case-sensitive for M vs m)
    const originalCompact = value.trim().match(/^(\d+)([smhdwMy])\s*(?:ago)?$/);
    const unitChar = originalCompact ? originalCompact[2] : compactMatch[2];
    const unit = unitMap[unitChar];
    if (unit) {
      return toISODate(subtractTime(now, amount, unit));
    }
  }

  // "last week/month/year"
  const lastMatch = lower.match(/^last\s+(week|month|year)$/);
  if (lastMatch) {
    const unit = lastMatch[1];
    return toISODate(subtractTime(now, 1, unit));
  }

  return null;
}

function subtractTime(date: Date, amount: number, unit: string): Date {
  const d = new Date(date);
  switch (unit) {
    case 'second': d.setSeconds(d.getSeconds() - amount); break;
    case 'minute': d.setMinutes(d.getMinutes() - amount); break;
    case 'hour': d.setHours(d.getHours() - amount); break;
    case 'day': d.setDate(d.getDate() - amount); break;
    case 'week': d.setDate(d.getDate() - amount * 7); break;
    case 'month': d.setMonth(d.getMonth() - amount); break;
    case 'year': d.setFullYear(d.getFullYear() - amount); break;
  }
  return d;
}

function toISODate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// ---------------------------------------------------------------------------
// Stage 8: Duplicate detection (Levenshtein distance)
// ---------------------------------------------------------------------------

/**
 * Compute Levenshtein distance between two strings.
 * Uses an optimized single-row DP algorithm to minimize memory.
 */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Ensure a is the shorter string for memory optimization
  if (a.length > b.length) {
    const temp = a;
    a = b;
    b = temp;
  }

  const aLen = a.length;
  const bLen = b.length;

  // Bail out early for very long strings (avoid O(n*m) for huge data)
  if (aLen > 500 || bLen > 500) {
    // Quick check: if lengths differ greatly, they're different
    if (Math.abs(aLen - bLen) > Math.max(aLen, bLen) * 0.3) return Math.max(aLen, bLen);
    // Fall through to full computation for reasonable sizes
  }

  const row = new Array(aLen + 1);
  for (let i = 0; i <= aLen; i++) row[i] = i;

  for (let j = 1; j <= bLen; j++) {
    let prev = row[0];
    row[0] = j;
    for (let i = 1; i <= aLen; i++) {
      const current = row[i];
      if (a[i - 1] === b[j - 1]) {
        row[i] = prev;
      } else {
        row[i] = 1 + Math.min(prev, row[i], row[i - 1]);
      }
      prev = current;
    }
  }

  return row[aLen];
}

/**
 * Create a fingerprint string from a row's values for deduplication.
 */
function rowFingerprint(row: Row): string {
  return Object.entries(row.data)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => String(v ?? '').trim().toLowerCase())
    .join('|');
}

/**
 * Detect near-duplicate rows using Levenshtein similarity.
 * Returns indices of duplicate rows (keeping the first occurrence).
 */
function detectDuplicateIndices(rows: Row[], threshold: number = 0.9): Set<number> {
  const duplicateIndices = new Set<number>();
  const fingerprints: string[] = rows.map(rowFingerprint);

  // For large datasets, use exact-match dedup first
  const exactSeen = new Map<string, number>();
  for (let i = 0; i < fingerprints.length; i++) {
    const fp = fingerprints[i];
    if (exactSeen.has(fp)) {
      duplicateIndices.add(i);
    } else {
      exactSeen.set(fp, i);
    }
  }

  // Fuzzy dedup only for reasonable sizes (O(n^2) is expensive)
  const uniqueIndices = [...exactSeen.values()].sort((a, b) => a - b);
  if (uniqueIndices.length <= 1000) {
    for (let i = 0; i < uniqueIndices.length; i++) {
      if (duplicateIndices.has(uniqueIndices[i])) continue;
      const fpI = fingerprints[uniqueIndices[i]];
      if (!fpI) continue;

      for (let j = i + 1; j < uniqueIndices.length; j++) {
        if (duplicateIndices.has(uniqueIndices[j])) continue;
        const fpJ = fingerprints[uniqueIndices[j]];
        if (!fpJ) continue;

        const maxLen = Math.max(fpI.length, fpJ.length);
        if (maxLen === 0) continue;

        // Quick length check: if lengths differ too much, skip expensive computation
        if (Math.abs(fpI.length - fpJ.length) / maxLen > (1 - threshold)) continue;

        const dist = levenshtein(fpI, fpJ);
        const similarity = 1 - dist / maxLen;

        if (similarity >= threshold) {
          duplicateIndices.add(uniqueIndices[j]);
        }
      }
    }
  }

  return duplicateIndices;
}

// ---------------------------------------------------------------------------
// Stage 9: Remove empty rows
// ---------------------------------------------------------------------------

function isEmptyRow(row: Row): boolean {
  for (const value of Object.values(row.data)) {
    if (value == null) continue;
    const str = String(value).trim();
    if (str.length > 0 && str !== 'null' && str !== 'undefined' && str !== 'N/A' && str !== '-') {
      return false;
    }
  }
  return true;
}

// ---------------------------------------------------------------------------
// Type-aware cleaning dispatch
// ---------------------------------------------------------------------------

const TYPE_CLEANERS: Record<DataType, (value: string, baseUrl: string) => string> = {
  text: (v, _baseUrl) => v,
  number: (v, _baseUrl) => {
    // Remove any non-numeric formatting
    const cleaned = v.replace(/[^\d.\-+eE]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? v : num.toString();
  },
  price: (v, _baseUrl) => normalizePrice(v),
  url: (v, baseUrl) => resolveUrl(v, baseUrl),
  image: (v, baseUrl) => resolveUrl(v, baseUrl),
  email: (v, _baseUrl) => v.toLowerCase().trim(),
  date: (v, _baseUrl) => parseDate(v),
  rating: (v, _baseUrl) => {
    // Normalize star characters to numeric
    const trimmed = v.trim();
    if (/^[★⭐✮✯]+[☆✩✪✫✬✭]*$/.test(trimmed)) {
      const filled = (trimmed.match(/[★⭐✮✯]/g) ?? []).length;
      return filled.toString();
    }
    // Extract numeric rating
    const numMatch = trimmed.match(/([\d.]+)\s*(?:\/\s*(\d+))?/);
    if (numMatch) {
      const value = parseFloat(numMatch[1]);
      const max = numMatch[2] ? parseFloat(numMatch[2]) : 0;
      if (max === 10) return (value / 2).toFixed(1); // normalize to /5
      return value.toString();
    }
    return trimmed;
  },
  phone: (v, _baseUrl) => {
    // Normalize phone to digits with leading + if international
    const trimmed = v.trim();
    const hasPlus = trimmed.startsWith('+');
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length >= 10) {
      // Format as: +1 (234) 567-8901 for US numbers
      if (digits.length === 10) {
        return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
      }
      if (digits.length === 11 && digits.startsWith('1')) {
        return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
      }
      return hasPlus ? `+${digits}` : digits;
    }
    return trimmed;
  },
  location: (v, _baseUrl) => v.trim(),
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Clean a single value based on its data type.
 *
 * @param value - The raw value to clean
 * @param type - The semantic data type
 * @param baseUrl - Base URL for resolving relative URLs (optional)
 * @returns The cleaned value
 */
export function cleanValue(value: string, type: DataType, baseUrl?: string): string {
  if (value == null) return '';

  let cleaned = String(value);

  try {
    // Universal stages (always applied)
    cleaned = trimWhitespace(cleaned);
    cleaned = normalizeUnicode(cleaned);
    cleaned = decodeHtmlEntities(cleaned);
    cleaned = stripInvisibleChars(cleaned);

    // Type-specific cleaning
    const cleaner = TYPE_CLEANERS[type];
    if (cleaner) {
      cleaned = cleaner(cleaned, baseUrl ?? '');
    }

    // Final trim
    cleaned = cleaned.trim();
  } catch {
    // If any stage fails, return what we have so far
    cleaned = cleaned.trim();
  }

  return cleaned;
}

/**
 * Clean an entire dataset through the full pipeline.
 *
 * @param rows - Array of data rows to clean
 * @param baseUrl - Base URL of the source page for resolving relative URLs
 * @returns Cleaned and deduplicated array of rows
 */
export function cleanData(rows: Row[], baseUrl: string): Row[] {
  if (!rows || rows.length === 0) return [];

  try {
    // ---- Phase 1: Clean individual values ----
    const cleanedRows: Row[] = rows.map(row => {
      const cleanedData: Record<string, string | number | null> = {};

      for (const [key, value] of Object.entries(row.data)) {
        if (value == null) {
          cleanedData[key] = null;
          continue;
        }

        const strValue = String(value);

        // Infer type from key name for better cleaning
        const inferredType = inferTypeFromKey(key);

        const cleaned = cleanValue(strValue, inferredType, baseUrl);
        cleanedData[key] = cleaned;
      }

      return {
        ...row,
        data: cleanedData,
      };
    });

    // ---- Phase 2: Remove empty rows ----
    const nonEmptyRows = cleanedRows.filter(row => !isEmptyRow(row));

    // ---- Phase 3: Deduplicate ----
    const duplicateIndices = detectDuplicateIndices(nonEmptyRows);
    const deduplicatedRows = nonEmptyRows.filter((_, i) => !duplicateIndices.has(i));

    return deduplicatedRows;

  } catch {
    // If the pipeline fails catastrophically, return the original rows
    return rows;
  }
}

/**
 * Infer a DataType from a column/field name.
 * Used as a fallback when no explicit type is provided.
 */
function inferTypeFromKey(key: string): DataType {
  const lower = key.toLowerCase();

  if (/price|cost|amount|total|subtotal|fee|salary|revenue/.test(lower)) return 'price';
  if (/email|e-mail/.test(lower)) return 'email';
  if (/url|link|href|website|site/.test(lower)) return 'url';
  if (/image|img|photo|picture|thumbnail|avatar|logo|icon/.test(lower)) return 'image';
  if (/date|time|published|created|updated|posted|timestamp|when/.test(lower)) return 'date';
  if (/rating|score|stars|review/.test(lower)) return 'rating';
  if (/phone|tel|fax|mobile|cell/.test(lower)) return 'phone';
  if (/location|address|city|state|country|zip|postal|region|area/.test(lower)) return 'location';
  if (/count|number|quantity|qty|total|amount|age|year|size/.test(lower)) return 'number';

  return 'text';
}
