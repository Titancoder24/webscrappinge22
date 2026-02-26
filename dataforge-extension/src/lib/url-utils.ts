/**
 * URL Utilities – URL manipulation functions for DataForge.
 *
 * Provides common URL operations needed throughout the extension:
 *  - URL resolution (relative to absolute)
 *  - Domain extraction
 *  - Internal link detection
 *  - Query parameter parsing and manipulation
 *  - URL pagination parameter incrementing
 *  - URL normalization to canonical form
 *
 * All functions are pure, stateless, and handle malformed input gracefully.
 *
 * Zero dependencies.
 */

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Resolve a relative URL against a base URL.
 *
 * @param base - The base URL (typically the current page URL)
 * @param relative - The relative URL to resolve
 * @returns Fully qualified absolute URL, or the original relative value if resolution fails
 */
export function resolveUrl(base: string, relative: string): string {
  if (!relative) return base || '';
  if (!base) return relative;

  // Already absolute
  if (
    relative.startsWith('http://') ||
    relative.startsWith('https://') ||
    relative.startsWith('//') ||
    relative.startsWith('data:') ||
    relative.startsWith('blob:')
  ) {
    // Protocol-relative URLs
    if (relative.startsWith('//')) {
      try {
        const baseUrl = new URL(base);
        return baseUrl.protocol + relative;
      } catch {
        return 'https:' + relative;
      }
    }
    return relative;
  }

  try {
    return new URL(relative, base).href;
  } catch {
    // Fallback: simple concatenation for edge cases
    if (relative.startsWith('/')) {
      try {
        const baseUrl = new URL(base);
        return baseUrl.origin + relative;
      } catch {
        return relative;
      }
    }
    return relative;
  }
}

/**
 * Extract the domain (hostname) from a URL.
 *
 * @param url - The URL to extract the domain from
 * @returns Domain string (e.g., "www.example.com"), or empty string if extraction fails
 */
export function extractDomain(url: string): string {
  if (!url) return '';

  try {
    // Handle protocol-relative URLs
    const normalized = url.startsWith('//') ? 'https:' + url : url;
    const parsed = new URL(normalized);
    return parsed.hostname;
  } catch {
    // Attempt to extract domain from malformed URLs
    const match = url.match(/^(?:https?:\/\/)?(?:www\.)?([^/?#:]+)/i);
    return match ? match[1] : '';
  }
}

/**
 * Check if a URL is an internal link relative to a base domain.
 *
 * @param url - The URL to check
 * @param baseDomain - The domain to compare against (e.g., "example.com")
 * @returns true if the URL points to the same domain or a subdomain
 */
export function isInternalLink(url: string, baseDomain: string): boolean {
  if (!url || !baseDomain) return false;

  // Fragment-only or relative paths are always internal
  if (url.startsWith('#') || url.startsWith('?')) return true;
  if (!url.includes('://') && !url.startsWith('//')) return true;

  // Skip non-HTTP protocols
  const lower = url.toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('mailto:') ||
    lower.startsWith('tel:') ||
    lower.startsWith('data:') ||
    lower.startsWith('blob:')
  ) {
    return false;
  }

  const urlDomain = extractDomain(url).toLowerCase();
  const base = baseDomain.toLowerCase().replace(/^www\./, '');

  if (!urlDomain) return true; // Relative URL

  const cleanUrlDomain = urlDomain.replace(/^www\./, '');

  // Exact match
  if (cleanUrlDomain === base) return true;

  // Subdomain match (urlDomain ends with .baseDomain)
  if (cleanUrlDomain.endsWith('.' + base)) return true;

  return false;
}

/**
 * Parse URL query parameters into a key-value record.
 *
 * @param url - The URL to parse query parameters from
 * @returns Record of parameter names to their values. If a parameter appears
 *          multiple times, the last value wins.
 */
export function parseUrlParams(url: string): Record<string, string> {
  if (!url) return {};

  try {
    const parsed = new URL(url, 'https://placeholder.invalid');
    const params: Record<string, string> = {};
    parsed.searchParams.forEach((value, key) => {
      params[key] = value;
    });
    return params;
  } catch {
    // Fallback: manual parsing
    const queryStart = url.indexOf('?');
    if (queryStart < 0) return {};

    let queryString = url.slice(queryStart + 1);
    // Remove fragment
    const hashIdx = queryString.indexOf('#');
    if (hashIdx >= 0) queryString = queryString.slice(0, hashIdx);

    const params: Record<string, string> = {};
    const pairs = queryString.split('&');

    for (const pair of pairs) {
      if (!pair) continue;
      const eqIdx = pair.indexOf('=');
      if (eqIdx < 0) {
        params[decodeURIComponent(pair)] = '';
      } else {
        const key = decodeURIComponent(pair.slice(0, eqIdx));
        const value = decodeURIComponent(pair.slice(eqIdx + 1));
        params[key] = value;
      }
    }

    return params;
  }
}

/**
 * Increment a numeric URL query parameter.
 * Used for URL-based pagination (e.g., ?page=1 → ?page=2).
 *
 * @param url - The URL to modify
 * @param param - The query parameter name to increment
 * @param increment - The amount to add (default: 1)
 * @returns Modified URL with the incremented parameter.
 *          If the parameter doesn't exist, it is added with the increment value.
 *          If the parameter is not numeric, the original URL is returned.
 */
export function incrementUrlParam(
  url: string,
  param: string,
  increment: number = 1,
): string {
  if (!url || !param) return url;

  try {
    const parsed = new URL(url);
    const currentValue = parsed.searchParams.get(param);

    if (currentValue === null) {
      // Parameter doesn't exist – add it
      parsed.searchParams.set(param, String(increment));
    } else {
      const num = parseInt(currentValue, 10);
      if (isNaN(num)) {
        // Not numeric – return unchanged
        return url;
      }
      parsed.searchParams.set(param, String(num + increment));
    }

    return parsed.href;
  } catch {
    // Fallback: regex-based replacement
    const regex = new RegExp(`([?&])${escapeRegExp(param)}=(-?\\d+)`, 'i');
    const match = url.match(regex);

    if (match) {
      const currentNum = parseInt(match[2], 10);
      const newValue = currentNum + increment;
      return url.replace(regex, `$1${param}=${newValue}`);
    }

    // Add parameter
    const separator = url.includes('?') ? '&' : '?';
    return url + separator + encodeURIComponent(param) + '=' + increment;
  }
}

/**
 * Normalize a URL to a canonical form for comparison and deduplication.
 *
 * Normalization steps:
 *  1. Lowercase scheme and hostname
 *  2. Remove default ports (80 for HTTP, 443 for HTTPS)
 *  3. Remove trailing slash on path (except root "/")
 *  4. Sort query parameters alphabetically
 *  5. Remove fragment/hash
 *  6. Decode unreserved percent-encoded characters
 *  7. Remove common tracking parameters (utm_*, fbclid, gclid, etc.)
 *
 * @param url - The URL to normalize
 * @returns Normalized URL string, or the original if parsing fails
 */
export function normalizeUrl(url: string): string {
  if (!url) return '';

  try {
    const parsed = new URL(url);

    // Remove fragment
    parsed.hash = '';

    // Remove default ports
    if (
      (parsed.protocol === 'http:' && parsed.port === '80') ||
      (parsed.protocol === 'https:' && parsed.port === '443')
    ) {
      parsed.port = '';
    }

    // Remove common tracking parameters
    const trackingParams = new Set([
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'utm_id', 'utm_cid',
      'fbclid', 'gclid', 'gclsrc', 'dclid', 'msclkid',
      'mc_eid', 'mc_cid',
      '_ga', '_gl', '_hsenc', '_hsmi',
      'ref', 'ref_', 'source',
    ]);

    for (const param of Array.from(parsed.searchParams.keys())) {
      if (trackingParams.has(param.toLowerCase())) {
        parsed.searchParams.delete(param);
      }
    }

    // Sort remaining query parameters
    parsed.searchParams.sort();

    // Build the normalized URL
    let normalized = parsed.href;

    // Remove trailing slash (except for root path)
    if (parsed.pathname !== '/' && normalized.endsWith('/')) {
      normalized = normalized.slice(0, -1);
    }

    return normalized;
  } catch {
    // If URL parsing fails, do basic normalization
    return url.trim().toLowerCase().replace(/\/$/, '') || url;
  }
}

/**
 * Extract the path from a URL (without query string or fragment).
 *
 * @param url - The URL to extract the path from
 * @returns Path string (e.g., "/products/item-1"), or empty string if extraction fails
 */
export function extractPath(url: string): string {
  if (!url) return '';
  try {
    return new URL(url).pathname;
  } catch {
    const match = url.match(/^[^?#]*/);
    return match ? match[0] : '';
  }
}

/**
 * Check if a URL string is a valid, well-formed URL.
 *
 * @param url - The string to validate
 * @returns true if the string is a valid HTTP(S) URL
 */
export function isValidUrl(url: string): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Join a base URL path with additional path segments.
 *
 * @param base - The base URL
 * @param segments - Path segments to append
 * @returns Combined URL string
 */
export function joinUrl(base: string, ...segments: string[]): string {
  if (!base) return segments.join('/');

  try {
    const url = new URL(base);
    let path = url.pathname;

    for (const segment of segments) {
      if (!segment) continue;
      // Ensure single slash between segments
      if (!path.endsWith('/')) path += '/';
      path += segment.startsWith('/') ? segment.slice(1) : segment;
    }

    url.pathname = path;
    return url.href;
  } catch {
    // Fallback: simple concatenation
    let result = base;
    for (const segment of segments) {
      if (!segment) continue;
      if (!result.endsWith('/')) result += '/';
      result += segment.startsWith('/') ? segment.slice(1) : segment;
    }
    return result;
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Escape special regex characters in a string. */
function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
