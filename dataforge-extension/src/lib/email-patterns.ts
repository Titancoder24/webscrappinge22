/**
 * EmailPatterns – Email detection and validation for DataForge.
 *
 * Detects email addresses from multiple sources:
 *  - Standard email regex matching in text content
 *  - mailto: link extraction
 *  - Obfuscated emails: "[at]", "(at)", HTML entity encoded
 *  - JavaScript-rendered emails (already in the DOM by execution time)
 *
 * Features:
 *  - Format validation with common typo detection
 *  - Domain grouping
 *  - Deduplication
 *
 * Zero dependencies.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Result of email detection on a page. */
export interface EmailResult {
  /** The normalized email address. */
  email: string;
  /** How the email was detected. */
  source: 'text' | 'mailto' | 'obfuscated' | 'meta';
  /** The DOM element where the email was found (if applicable). */
  element: Element | null;
  /** The anchor text if found inside a link. */
  linkText: string;
  /** The domain part of the email. */
  domain: string;
  /** Whether the email passes format validation. */
  isValid: boolean;
  /** Context text surrounding the email (up to 100 chars). */
  context: string;
}

/** Validation result with details. */
export interface EmailValidation {
  isValid: boolean;
  /** Detected issues (empty if valid). */
  issues: string[];
  /** Suggested correction (if a common typo was detected). */
  suggestion: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * RFC 5322-based email regex (simplified for practical use).
 * Matches: local-part@domain where:
 *  - local-part: word chars, dots, hyphens, plus signs
 *  - domain: word chars, dots, hyphens; TLD at least 2 chars
 */
const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;

/**
 * Patterns for obfuscated email representations.
 */
const OBFUSCATION_PATTERNS: Array<{ pattern: RegExp; replacer: (match: string) => string }> = [
  // name [at] domain [dot] com
  {
    pattern: /[a-zA-Z0-9._%+\-]+\s*\[\s*at\s*\]\s*[a-zA-Z0-9.\-]+\s*\[\s*dot\s*\]\s*[a-zA-Z]{2,}/gi,
    replacer: (m) => m.replace(/\s*\[\s*at\s*\]\s*/gi, '@').replace(/\s*\[\s*dot\s*\]\s*/gi, '.'),
  },
  // name (at) domain (dot) com
  {
    pattern: /[a-zA-Z0-9._%+\-]+\s*\(\s*at\s*\)\s*[a-zA-Z0-9.\-]+\s*\(\s*dot\s*\)\s*[a-zA-Z]{2,}/gi,
    replacer: (m) => m.replace(/\s*\(\s*at\s*\)\s*/gi, '@').replace(/\s*\(\s*dot\s*\)\s*/gi, '.'),
  },
  // name {at} domain {dot} com
  {
    pattern: /[a-zA-Z0-9._%+\-]+\s*\{\s*at\s*\}\s*[a-zA-Z0-9.\-]+\s*\{\s*dot\s*\}\s*[a-zA-Z]{2,}/gi,
    replacer: (m) => m.replace(/\s*\{\s*at\s*\}\s*/gi, '@').replace(/\s*\{\s*dot\s*\}\s*/gi, '.'),
  },
  // name AT domain DOT com (all caps)
  {
    pattern: /[a-zA-Z0-9._%+\-]+\s+AT\s+[a-zA-Z0-9.\-]+\s+DOT\s+[a-zA-Z]{2,}/g,
    replacer: (m) => m.replace(/\s+AT\s+/g, '@').replace(/\s+DOT\s+/g, '.'),
  },
  // name-at-domain-dot-com (hyphenated)
  {
    pattern: /[a-zA-Z0-9._%+]+\-at\-[a-zA-Z0-9.\-]+-dot-[a-zA-Z]{2,}/gi,
    replacer: (m) => m.replace(/-at-/gi, '@').replace(/-dot-/gi, '.'),
  },
];

/** Common email domain typos and their corrections. */
const DOMAIN_TYPOS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'hotmal.com': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'hotmaill.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outllook.com': 'outlook.com',
  'outlook.con': 'outlook.com',
  'yahooo.com': 'yahoo.com',
  'yaho.com': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'yahho.com': 'yahoo.com',
  'yhaoo.com': 'yahoo.com',
  'protonmal.com': 'protonmail.com',
  'protonmail.con': 'protonmail.com',
  'iclould.com': 'icloud.com',
  'icoud.com': 'icloud.com',
  'icloud.con': 'icloud.com',
};

/** Known invalid or placeholder domains. */
const INVALID_DOMAINS = new Set([
  'example.com', 'example.org', 'example.net',
  'test.com', 'test.org',
  'domain.com', 'email.com',
  'your-domain.com', 'yourdomain.com',
  'company.com', 'yourcompany.com',
  'sentry.io', // Common in error tracking, not real emails
]);

/** Image/file-related TLDs that are unlikely to be email domains. */
const FILE_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'bmp', 'ico',
  'css', 'js', 'ts', 'html', 'xml', 'json', 'woff', 'woff2',
  'ttf', 'eot', 'map', 'min',
]);

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Normalize an email address: lowercase, trim whitespace.
 */
function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Extract the domain part from an email address.
 */
function extractEmailDomain(email: string): string {
  const atIndex = email.lastIndexOf('@');
  return atIndex >= 0 ? email.slice(atIndex + 1) : '';
}

/**
 * Check if a string that matched the email regex is likely a false positive.
 */
function isLikelyFalsePositive(email: string): boolean {
  const domain = extractEmailDomain(email);
  const tld = domain.split('.').pop() || '';

  // Reject file extension-like TLDs
  if (FILE_EXTENSIONS.has(tld.toLowerCase())) return true;

  // Reject very long local parts (likely a URL path misparse)
  const localPart = email.split('@')[0];
  if (localPart.length > 64) return true;

  // Reject domains that look like version numbers (e.g., "2.0")
  if (/^\d+\.\d+$/.test(domain)) return true;

  // Reject if domain has no letters (e.g., 192.168.1.1)
  if (!/[a-zA-Z]/.test(domain)) return true;

  return false;
}

/**
 * Decode HTML entities in a string.
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#64;/g, '@')
    .replace(/&#x40;/g, '@')
    .replace(/&commat;/g, '@')
    .replace(/&#46;/g, '.')
    .replace(/&#x2e;/g, '.')
    .replace(/&period;/g, '.')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, code) => String.fromCharCode(parseInt(code, 16)));
}

/**
 * Extract surrounding context text for an email found in a larger text.
 */
function getContext(text: string, email: string, maxLen: number = 100): string {
  const idx = text.indexOf(email);
  if (idx < 0) return '';

  const start = Math.max(0, idx - 40);
  const end = Math.min(text.length, idx + email.length + 40);
  let context = text.slice(start, end).replace(/\s+/g, ' ').trim();

  if (context.length > maxLen) {
    context = context.slice(0, maxLen) + '...';
  }
  return context;
}

// ---------------------------------------------------------------------------
// Detectors
// ---------------------------------------------------------------------------

/**
 * Detect emails from text content of the page.
 */
function detectFromText(doc: Document, results: Map<string, EmailResult>): void {
  // Walk text nodes in the body
  if (!doc.body) return;

  const walker = doc.createTreeWalker(
    doc.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode(node: Node): number {
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        const tag = parent.tagName;
        if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') {
          return NodeFilter.FILTER_REJECT;
        }
        return NodeFilter.FILTER_ACCEPT;
      },
    },
  );

  let node: Node | null = walker.nextNode();
  while (node) {
    const text = node.textContent || '';
    if (text.length > 5 && text.includes('@')) {
      // Decode any HTML entities that might be in text nodes
      const decoded = decodeHtmlEntities(text);

      // Standard email pattern
      const matches = decoded.matchAll(EMAIL_REGEX);
      for (const match of matches) {
        const email = normalizeEmail(match[0]);
        if (isLikelyFalsePositive(email)) continue;
        if (results.has(email)) continue;

        results.set(email, {
          email,
          source: 'text',
          element: node.parentElement,
          linkText: '',
          domain: extractEmailDomain(email),
          isValid: validateEmail(email),
          context: getContext(decoded, match[0]),
        });
      }

      // Obfuscated patterns
      for (const { pattern, replacer } of OBFUSCATION_PATTERNS) {
        const patternClone = new RegExp(pattern.source, pattern.flags);
        const obfMatches = decoded.matchAll(patternClone);
        for (const obfMatch of obfMatches) {
          const deobfuscated = normalizeEmail(replacer(obfMatch[0]));
          if (!EMAIL_REGEX.test(deobfuscated)) continue;
          if (isLikelyFalsePositive(deobfuscated)) continue;
          if (results.has(deobfuscated)) continue;

          results.set(deobfuscated, {
            email: deobfuscated,
            source: 'obfuscated',
            element: node.parentElement,
            linkText: '',
            domain: extractEmailDomain(deobfuscated),
            isValid: validateEmail(deobfuscated),
            context: getContext(decoded, obfMatch[0]),
          });
        }
      }
    }

    node = walker.nextNode();
  }
}

/**
 * Detect emails from mailto: links.
 */
function detectFromMailtoLinks(doc: Document, results: Map<string, EmailResult>): void {
  const links = doc.querySelectorAll('a[href^="mailto:"]');
  for (let i = 0; i < links.length; i++) {
    const anchor = links[i] as HTMLAnchorElement;
    const href = anchor.href || anchor.getAttribute('href') || '';

    // Extract email from mailto: URI
    const mailtoPrefix = 'mailto:';
    let emailPart = href.startsWith(mailtoPrefix)
      ? href.slice(mailtoPrefix.length)
      : href.replace(/^mailto:/i, '');

    // Strip query parameters (?subject=...&body=...)
    const queryIdx = emailPart.indexOf('?');
    if (queryIdx >= 0) {
      emailPart = emailPart.slice(0, queryIdx);
    }

    // Handle URL encoding
    emailPart = decodeURIComponent(emailPart);

    const email = normalizeEmail(emailPart);
    if (!email || !email.includes('@')) continue;
    if (isLikelyFalsePositive(email)) continue;

    const linkText = (anchor.textContent || '').trim();

    // Mailto links are high confidence – overwrite existing entries
    results.set(email, {
      email,
      source: 'mailto',
      element: anchor,
      linkText,
      domain: extractEmailDomain(email),
      isValid: validateEmail(email),
      context: linkText || getContext(anchor.outerHTML, email),
    });
  }
}

/**
 * Detect emails from meta tags (author, contact info).
 */
function detectFromMeta(doc: Document, results: Map<string, EmailResult>): void {
  // Check various meta tags that might contain emails
  const metaSelectors = [
    'meta[name="author"]',
    'meta[name="reply-to"]',
    'meta[name="email"]',
    'meta[name="contact"]',
  ];

  for (const selector of metaSelectors) {
    try {
      const el = doc.querySelector(selector);
      if (!el) continue;

      const content = el.getAttribute('content') || '';
      const matches = content.matchAll(EMAIL_REGEX);
      for (const match of matches) {
        const email = normalizeEmail(match[0]);
        if (isLikelyFalsePositive(email)) continue;
        if (results.has(email)) continue;

        results.set(email, {
          email,
          source: 'meta',
          element: null,
          linkText: '',
          domain: extractEmailDomain(email),
          isValid: validateEmail(email),
          context: content.slice(0, 100),
        });
      }
    } catch {
      // skip
    }
  }

  // Check LD+JSON for contact information
  const ldJsonScripts = doc.querySelectorAll('script[type="application/ld+json"]');
  for (let i = 0; i < ldJsonScripts.length; i++) {
    try {
      const data = JSON.parse(ldJsonScripts[i].textContent || '');
      const jsonStr = JSON.stringify(data);
      const matches = jsonStr.matchAll(EMAIL_REGEX);
      for (const match of matches) {
        const email = normalizeEmail(match[0]);
        if (isLikelyFalsePositive(email)) continue;
        if (results.has(email)) continue;

        results.set(email, {
          email,
          source: 'meta',
          element: null,
          linkText: '',
          domain: extractEmailDomain(email),
          isValid: validateEmail(email),
          context: 'LD+JSON structured data',
        });
      }
    } catch {
      // Invalid JSON – skip
    }
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Find all email addresses in a document.
 *
 * Scans text content, mailto links, obfuscated patterns, and meta tags.
 * Results are deduplicated by email address (mailto links take priority).
 *
 * @param doc - The Document to scan
 * @returns Array of EmailResult objects, sorted by source priority
 */
export function findEmails(doc: Document): EmailResult[] {
  if (!doc || !doc.documentElement) {
    return [];
  }

  const results = new Map<string, EmailResult>();

  // Run detectors in priority order (later detectors overwrite)
  detectFromText(doc, results);
  detectFromMeta(doc, results);
  detectFromMailtoLinks(doc, results); // Highest priority – overwrites text matches

  // Filter out known-invalid placeholder domains
  const emails: EmailResult[] = [];
  for (const [, result] of results) {
    if (INVALID_DOMAINS.has(result.domain)) continue;
    emails.push(result);
  }

  // Sort: mailto first, then valid before invalid, then alphabetically
  emails.sort((a, b) => {
    // Source priority
    const sourcePriority: Record<string, number> = { mailto: 0, text: 1, obfuscated: 2, meta: 3 };
    const sPri = (sourcePriority[a.source] ?? 9) - (sourcePriority[b.source] ?? 9);
    if (sPri !== 0) return sPri;

    // Valid first
    if (a.isValid !== b.isValid) return a.isValid ? -1 : 1;

    // Alphabetical
    return a.email.localeCompare(b.email);
  });

  return emails;
}

/**
 * Validate an email address format and check for common typos.
 *
 * @param email - The email address to validate
 * @returns true if the email appears to be validly formatted
 */
export function validateEmail(email: string): boolean {
  return validateEmailDetailed(email).isValid;
}

/**
 * Detailed email validation with issue descriptions and typo suggestions.
 *
 * @param email - The email address to validate
 * @returns EmailValidation with issues and suggestions
 */
export function validateEmailDetailed(email: string): EmailValidation {
  const issues: string[] = [];
  let suggestion: string | null = null;

  if (!email || typeof email !== 'string') {
    return { isValid: false, issues: ['Email is empty or not a string'], suggestion: null };
  }

  const trimmed = email.trim().toLowerCase();

  // Basic structure check
  const atIndex = trimmed.indexOf('@');
  if (atIndex < 0) {
    return { isValid: false, issues: ['Missing @ symbol'], suggestion: null };
  }

  const localPart = trimmed.slice(0, atIndex);
  const domainPart = trimmed.slice(atIndex + 1);

  // Local part validation
  if (localPart.length === 0) {
    issues.push('Empty local part (before @)');
  } else if (localPart.length > 64) {
    issues.push('Local part exceeds 64 characters');
  } else if (localPart.startsWith('.') || localPart.endsWith('.')) {
    issues.push('Local part cannot start or end with a dot');
  } else if (localPart.includes('..')) {
    issues.push('Local part contains consecutive dots');
  } else if (!/^[a-zA-Z0-9._%+\-]+$/.test(localPart)) {
    issues.push('Local part contains invalid characters');
  }

  // Domain validation
  if (domainPart.length === 0) {
    issues.push('Empty domain (after @)');
  } else if (domainPart.length > 253) {
    issues.push('Domain exceeds 253 characters');
  } else {
    // Must have at least one dot
    if (!domainPart.includes('.')) {
      issues.push('Domain must contain at least one dot');
    }

    // TLD must be at least 2 characters
    const tld = domainPart.split('.').pop() || '';
    if (tld.length < 2) {
      issues.push('TLD must be at least 2 characters');
    }

    // No consecutive dots
    if (domainPart.includes('..')) {
      issues.push('Domain contains consecutive dots');
    }

    // Valid characters
    if (!/^[a-zA-Z0-9.\-]+$/.test(domainPart)) {
      issues.push('Domain contains invalid characters');
    }

    // Check for common typos
    if (DOMAIN_TYPOS[domainPart]) {
      suggestion = localPart + '@' + DOMAIN_TYPOS[domainPart];
      issues.push(`Possible typo: did you mean ${suggestion}?`);
    }
  }

  // Multiple @ symbols
  const atCount = (trimmed.match(/@/g) || []).length;
  if (atCount > 1) {
    issues.push('Multiple @ symbols found');
  }

  return {
    isValid: issues.length === 0,
    issues,
    suggestion,
  };
}
