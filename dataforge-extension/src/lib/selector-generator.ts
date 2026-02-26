/**
 * SelectorGenerator – Thin wrapper for side panel selector generation.
 *
 * Re-exports key selector-related functions that the content script uses,
 * providing a unified import point for the side panel when testing selectors.
 * Also includes lightweight utilities for selector construction and testing
 * that do not require direct DOM access (pure string operations).
 *
 * The heavy DOM-dependent selector generation lives in the content script.
 * This module provides helpers and types usable in both contexts.
 *
 * Zero dependencies.
 */

import type { SelectorResult, SelectorSegment, SelectorPath } from '../types/selector';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Options for selector generation strategies. */
export interface SelectorGeneratorOptions {
  /** Maximum selector depth (number of segments). */
  maxDepth: number;
  /** Prefer data-* attributes when available. */
  preferDataAttributes: boolean;
  /** Prefer semantic class names over structural selectors. */
  preferSemantic: boolean;
  /** Exclude these class patterns from selectors (regex strings). */
  excludeClassPatterns: string[];
  /** Root element to anchor selectors to (CSS selector). */
  root?: string;
}

/** Default options for selector generation. */
export const DEFAULT_SELECTOR_OPTIONS: SelectorGeneratorOptions = {
  maxDepth: 5,
  preferDataAttributes: true,
  preferSemantic: true,
  excludeClassPatterns: [
    '^js-', '^is-', '^has-', '^ng-', '^v-',
    '^data-v-', '^_', '^css-', '^emotion-',
    'active', 'selected', 'hover', 'focus', 'open', 'closed',
    'visible', 'hidden', 'disabled', 'enabled',
  ],
  root: undefined,
};

// ---------------------------------------------------------------------------
// Class name filtering
// ---------------------------------------------------------------------------

/** Common dynamically generated or utility class prefixes that are unstable. */
const UNSTABLE_CLASS_PATTERNS = [
  /^[a-z]{1,3}-[a-zA-Z0-9]{4,8}$/, // CSS modules hash (e.g., "sc-1abc234")
  /^css-[a-z0-9]+$/i,                // Emotion/styled-components
  /^_[a-z0-9]{5,}$/i,                // Private/minified classes
  /^[a-f0-9]{6,}$/,                  // Pure hex hashes
  /^svelte-[a-z0-9]+$/,              // Svelte scoped styles
  /^jsx-[0-9]+$/,                    // styled-jsx
];

/**
 * Check if a class name is likely stable (not dynamically generated).
 *
 * @param className - The class name to evaluate
 * @param excludePatterns - Additional regex patterns to exclude
 * @returns true if the class is likely stable and usable in selectors
 */
export function isStableClass(
  className: string,
  excludePatterns: string[] = [],
): boolean {
  if (!className || className.length === 0) return false;
  if (className.length < 2) return false;

  // Check against known unstable patterns
  for (const pattern of UNSTABLE_CLASS_PATTERNS) {
    if (pattern.test(className)) return false;
  }

  // Check against user-provided exclude patterns
  for (const patternStr of excludePatterns) {
    try {
      if (new RegExp(patternStr).test(className)) return false;
    } catch {
      // Invalid regex – skip
    }
  }

  return true;
}

/**
 * Filter a list of class names to only include stable ones.
 *
 * @param classes - Array of class names
 * @param excludePatterns - Additional regex patterns to exclude
 * @returns Filtered array of stable class names
 */
export function filterStableClasses(
  classes: string[],
  excludePatterns: string[] = [],
): string[] {
  return classes.filter((c) => isStableClass(c, excludePatterns));
}

// ---------------------------------------------------------------------------
// Selector construction helpers
// ---------------------------------------------------------------------------

/**
 * Build a CSS selector string from a SelectorPath.
 *
 * @param path - The selector path containing segments
 * @returns CSS selector string
 */
export function buildSelector(path: SelectorPath): string {
  if (!path || !path.segments || path.segments.length === 0) return '';
  return path.segments.map((s) => s.selector).join(' > ');
}

/**
 * Build a single selector segment from element properties.
 *
 * @param tag - HTML tag name
 * @param id - Element ID (optional)
 * @param classes - Element class list
 * @param index - nth-child index (1-based, 0 = not used)
 * @param options - Selector generation options
 * @returns SelectorSegment object
 */
export function buildSegment(
  tag: string,
  id: string | undefined,
  classes: string[],
  index: number = 0,
  options: SelectorGeneratorOptions = DEFAULT_SELECTOR_OPTIONS,
): SelectorSegment {
  const lowerTag = tag.toLowerCase();
  let selector = lowerTag;

  // ID selector (highest specificity)
  if (id && /^[a-zA-Z][\w-]*$/.test(id)) {
    selector = `#${escapeCssIdent(id)}`;
    return { tag: lowerTag, classes: [], id, index, selector };
  }

  // Class selector
  const stableClasses = filterStableClasses(classes, options.excludeClassPatterns);
  if (stableClasses.length > 0) {
    // Use up to 2 most specific classes
    const selectedClasses = stableClasses.slice(0, 2);
    selector = lowerTag + selectedClasses.map((c) => `.${escapeCssIdent(c)}`).join('');
    return { tag: lowerTag, classes: selectedClasses, id: undefined, index, selector };
  }

  // nth-child fallback
  if (index > 0) {
    selector = `${lowerTag}:nth-child(${index})`;
  }

  return { tag: lowerTag, classes: [], id: undefined, index, selector };
}

/**
 * Escape a string for use as a CSS identifier (class or ID).
 * Handles special characters that are valid in HTML but need escaping in CSS.
 */
export function escapeCssIdent(ident: string): string {
  if (!ident) return '';

  let result = '';
  for (let i = 0; i < ident.length; i++) {
    const ch = ident[i];
    const code = ident.charCodeAt(i);

    // First character: if it's a digit, escape it
    if (i === 0 && code >= 0x30 && code <= 0x39) {
      result += `\\3${ch} `;
      continue;
    }

    // Characters that need escaping: anything that isn't [a-zA-Z0-9_-]
    if (
      (code >= 0x41 && code <= 0x5A) || // A-Z
      (code >= 0x61 && code <= 0x7A) || // a-z
      (code >= 0x30 && code <= 0x39) || // 0-9
      code === 0x5F ||                   // _
      code === 0x2D                      // -
    ) {
      result += ch;
    } else {
      result += `\\${ch}`;
    }
  }

  return result;
}

/**
 * Score a selector based on its expected reliability.
 *
 * Scoring factors:
 *  - Data attributes: +30 (most stable)
 *  - ID selectors: +25
 *  - Semantic classes: +20
 *  - ARIA roles: +15
 *  - Tag + class: +10
 *  - Structural (nth-child): +5
 *
 * Penalties:
 *  - Deep nesting (>4 levels): -5 per extra level
 *  - Multiple nth-child: -3 per occurrence
 *  - Universal selector (*): -10
 *
 * @param selector - CSS selector string to score
 * @returns Score (higher is more reliable, range: 0-100)
 */
export function scoreSelector(selector: string): SelectorResult {
  if (!selector) {
    return {
      selector: '',
      specificity: 0,
      stability: 0,
      readability: 0,
      totalScore: 0,
      strategy: 'structural-path',
      matchCount: 0,
    };
  }

  let stability = 50; // Base score
  let readability = 50;
  let specificity = 0;
  let strategy: SelectorResult['strategy'] = 'structural-path';

  // Data attributes (most stable)
  const dataAttrCount = (selector.match(/\[data-[^\]]+\]/g) || []).length;
  if (dataAttrCount > 0) {
    stability += 30;
    specificity += dataAttrCount * 10;
    strategy = 'data-attribute';
  }

  // ID selector
  const idCount = (selector.match(/#[a-zA-Z][\w-]*/g) || []).length;
  if (idCount > 0) {
    stability += 25;
    specificity += idCount * 100;
    readability += 15;
    if (strategy === 'structural-path') strategy = 'semantic-class';
  }

  // Class selectors
  const classCount = (selector.match(/\.[a-zA-Z][\w-]*/g) || []).length;
  if (classCount > 0) {
    stability += Math.min(20, classCount * 8);
    specificity += classCount * 10;
    readability += Math.min(10, classCount * 5);
    if (strategy === 'structural-path') strategy = 'semantic-class';
  }

  // ARIA role
  if (selector.includes('[role=')) {
    stability += 15;
    strategy = 'aria-role';
  }

  // Depth penalty
  const depth = selector.split(/\s*>\s*|\s+/).length;
  if (depth > 4) {
    stability -= (depth - 4) * 5;
    readability -= (depth - 4) * 3;
  }

  // nth-child penalty
  const nthCount = (selector.match(/:nth-child/g) || []).length;
  if (nthCount > 0) {
    stability -= nthCount * 3;
    readability -= nthCount * 5;
    strategy = 'nth-child';
  }

  // Universal selector penalty
  if (selector.includes('*')) {
    stability -= 10;
  }

  // Readability: shorter selectors are more readable
  if (selector.length < 30) readability += 10;
  if (selector.length > 80) readability -= 10;
  if (selector.length > 120) readability -= 10;

  // Clamp scores
  stability = Math.max(0, Math.min(100, stability));
  readability = Math.max(0, Math.min(100, readability));
  specificity = Math.max(0, Math.min(100, specificity));

  const totalScore = Math.round(stability * 0.5 + readability * 0.3 + specificity * 0.2);

  return {
    selector,
    specificity,
    stability,
    readability,
    totalScore,
    strategy,
    matchCount: 0, // Must be computed by the caller with actual DOM access
  };
}

/**
 * Test whether a CSS selector is syntactically valid.
 *
 * @param selector - The CSS selector to validate
 * @returns true if the selector is syntactically valid
 */
export function isValidSelector(selector: string): boolean {
  if (!selector || typeof selector !== 'string') return false;
  try {
    // Use a minimal document fragment to test the selector
    if (typeof document !== 'undefined') {
      document.createDocumentFragment().querySelector(selector);
      return true;
    }
    // Fallback: basic syntax validation
    return /^[a-zA-Z#.\[\]():,>+~ *\w\-="'^$|]+$/.test(selector);
  } catch {
    return false;
  }
}

/**
 * Simplify a selector by removing unnecessary specificity.
 * For example: "div.container > div.wrapper > p.text" might become ".container > .wrapper > p.text"
 *
 * @param selector - The CSS selector to simplify
 * @returns Simplified selector (may be same as input if no simplification possible)
 */
export function simplifySelector(selector: string): string {
  if (!selector) return '';

  // Split into parts
  const parts = selector.split(/\s*>\s*/);
  const simplified = parts.map((part) => {
    const trimmed = part.trim();

    // If part has an ID, keep only the ID
    const idMatch = trimmed.match(/#[a-zA-Z][\w-]*/);
    if (idMatch) return idMatch[0];

    // If part has classes, try removing the tag
    const hasClasses = trimmed.includes('.');
    if (hasClasses) {
      const withoutTag = trimmed.replace(/^[a-z][a-z0-9]*/, '');
      if (withoutTag && withoutTag.startsWith('.')) return withoutTag;
    }

    return trimmed;
  });

  return simplified.join(' > ');
}
