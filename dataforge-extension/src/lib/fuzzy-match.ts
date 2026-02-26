/**
 * FuzzyMatch – String similarity and duplicate detection for DataForge.
 *
 * Implements:
 *  - Levenshtein edit distance
 *  - Jaro-Winkler similarity score
 *  - Row-level duplicate detection using configurable thresholds
 *
 * All algorithms are implemented from scratch for zero external dependencies.
 * Optimized for performance with early termination and reusable buffers.
 */

import type { Row } from '../types/extraction';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A group of duplicate rows. */
export interface DuplicateGroup {
  /** Index of the "canonical" (first-seen) row in the original array. */
  canonicalIndex: number;
  /** The canonical row. */
  canonical: Row;
  /** Duplicate rows (similar to canonical, above the threshold). */
  duplicates: Array<{
    /** Index in the original array. */
    index: number;
    /** The duplicate row. */
    row: Row;
    /** Similarity score (0-1) between this row and the canonical. */
    similarity: number;
  }>;
}

// ---------------------------------------------------------------------------
// Levenshtein Distance
// ---------------------------------------------------------------------------

/**
 * Compute the Levenshtein edit distance between two strings.
 *
 * The Levenshtein distance is the minimum number of single-character edits
 * (insertions, deletions, or substitutions) needed to transform string `a`
 * into string `b`.
 *
 * Uses the Wagner-Fischer dynamic programming algorithm with a single-row
 * optimization for O(min(n,m)) space complexity.
 *
 * @param a - First string
 * @param b - Second string
 * @returns Non-negative integer representing the edit distance
 */
export function levenshtein(a: string, b: string): number {
  // Handle trivial cases
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  // Ensure a is the shorter string (for space optimization)
  if (a.length > b.length) {
    const tmp = a;
    a = b;
    b = tmp;
  }

  const aLen = a.length;
  const bLen = b.length;

  // Single-row DP: prev[j] represents the distance for (i-1, j)
  const prev = new Uint32Array(aLen + 1);

  // Initialize base case: transforming empty string to a[0..j]
  for (let j = 0; j <= aLen; j++) {
    prev[j] = j;
  }

  // Fill the matrix row by row
  for (let i = 1; i <= bLen; i++) {
    let prevDiag = prev[0];
    prev[0] = i;

    const bChar = b.charCodeAt(i - 1);

    for (let j = 1; j <= aLen; j++) {
      const oldDiag = prev[j];
      const cost = a.charCodeAt(j - 1) === bChar ? 0 : 1;

      prev[j] = Math.min(
        prev[j] + 1,        // deletion
        prev[j - 1] + 1,    // insertion
        prevDiag + cost,     // substitution
      );

      prevDiag = oldDiag;
    }
  }

  return prev[aLen];
}

// ---------------------------------------------------------------------------
// Jaro-Winkler Similarity
// ---------------------------------------------------------------------------

/**
 * Compute the Jaro similarity between two strings.
 *
 * @returns Similarity score between 0 (completely different) and 1 (identical)
 */
function jaroSimilarity(a: string, b: string): number {
  if (a === b) return 1.0;
  if (a.length === 0 || b.length === 0) return 0.0;

  const aLen = a.length;
  const bLen = b.length;

  // Maximum matching distance
  const matchDistance = Math.max(0, Math.floor(Math.max(aLen, bLen) / 2) - 1);

  const aMatched = new Uint8Array(aLen);
  const bMatched = new Uint8Array(bLen);

  let matches = 0;
  let transpositions = 0;

  // Find matching characters
  for (let i = 0; i < aLen; i++) {
    const start = Math.max(0, i - matchDistance);
    const end = Math.min(bLen, i + matchDistance + 1);

    for (let j = start; j < end; j++) {
      if (bMatched[j] || a[i] !== b[j]) continue;
      aMatched[i] = 1;
      bMatched[j] = 1;
      matches++;
      break;
    }
  }

  if (matches === 0) return 0.0;

  // Count transpositions
  let bIdx = 0;
  for (let i = 0; i < aLen; i++) {
    if (!aMatched[i]) continue;
    while (!bMatched[bIdx]) bIdx++;
    if (a[i] !== b[bIdx]) transpositions++;
    bIdx++;
  }

  const jaro =
    (matches / aLen + matches / bLen + (matches - transpositions / 2) / matches) / 3;

  return jaro;
}

/**
 * Compute the Jaro-Winkler similarity between two strings.
 *
 * Jaro-Winkler adds a prefix bonus to the Jaro similarity, giving higher
 * scores to strings that share a common prefix (up to 4 characters).
 *
 * @param a - First string
 * @param b - Second string
 * @param prefixScale - Scaling factor for prefix bonus (default: 0.1, max: 0.25)
 * @returns Similarity score between 0 (completely different) and 1 (identical)
 */
export function jaroWinkler(a: string, b: string, prefixScale: number = 0.1): number {
  if (a === b) return 1.0;
  if (a.length === 0 || b.length === 0) return 0.0;

  // Clamp prefix scale to prevent score > 1
  const p = Math.min(prefixScale, 0.25);

  const jaro = jaroSimilarity(a, b);

  // Find the length of the common prefix (up to 4 characters)
  const maxPrefix = Math.min(4, Math.min(a.length, b.length));
  let prefixLen = 0;
  for (let i = 0; i < maxPrefix; i++) {
    if (a[i] === b[i]) {
      prefixLen++;
    } else {
      break;
    }
  }

  return jaro + prefixLen * p * (1 - jaro);
}

// ---------------------------------------------------------------------------
// Duplicate Detection
// ---------------------------------------------------------------------------

/**
 * Normalize a string for comparison: lowercase, trim, collapse whitespace.
 */
function normalizeForComparison(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = typeof value === 'number' ? String(value) : value;
  return str.trim().toLowerCase().replace(/\s+/g, ' ');
}

/**
 * Build a composite comparison string from a row's key columns.
 */
function buildComparisonKey(row: Row, keyColumns: string[]): string {
  const parts: string[] = [];
  for (const col of keyColumns) {
    parts.push(normalizeForComparison(row.data[col]));
  }
  return parts.join(' | ');
}

/**
 * Find duplicate rows based on string similarity of key columns.
 *
 * Groups rows that are similar (above the threshold) using Jaro-Winkler
 * similarity on the concatenated key column values. The first occurrence
 * in each group becomes the "canonical" row.
 *
 * Algorithmic approach:
 *  1. Pre-compute normalized comparison keys for all rows
 *  2. For each row, compare against all subsequent rows
 *  3. Group rows with similarity >= threshold
 *  4. A row that is already assigned to a group is not re-assigned
 *
 * Time complexity: O(n^2 * k) where n is the number of rows and k is the
 * average key string length. For large datasets, consider pre-filtering
 * by exact-match bucketing before calling this function.
 *
 * @param rows - The rows to check for duplicates
 * @param keyColumns - Column IDs to compare for similarity
 * @param threshold - Minimum Jaro-Winkler score to consider as duplicate (default: 0.85)
 * @returns Array of DuplicateGroup objects. Each group contains a canonical
 *          row and its duplicates.
 */
export function findDuplicates(
  rows: Row[],
  keyColumns: string[],
  threshold: number = 0.85,
): DuplicateGroup[] {
  if (!rows || rows.length < 2) return [];
  if (!keyColumns || keyColumns.length === 0) return [];

  // Clamp threshold to valid range
  const effectiveThreshold = Math.max(0, Math.min(1, threshold));

  // Pre-compute comparison keys
  const keys = new Array<string>(rows.length);
  for (let i = 0; i < rows.length; i++) {
    keys[i] = buildComparisonKey(rows[i], keyColumns);
  }

  // Track which rows are already assigned to a group
  const assigned = new Set<number>();
  const groups: DuplicateGroup[] = [];

  for (let i = 0; i < rows.length; i++) {
    if (assigned.has(i)) continue;
    if (!keys[i]) continue; // Skip rows with empty keys

    const group: DuplicateGroup = {
      canonicalIndex: i,
      canonical: rows[i],
      duplicates: [],
    };

    for (let j = i + 1; j < rows.length; j++) {
      if (assigned.has(j)) continue;
      if (!keys[j]) continue;

      // Quick check: if keys are identical, similarity is 1.0
      let similarity: number;
      if (keys[i] === keys[j]) {
        similarity = 1.0;
      } else {
        // Early rejection: if length difference is too large, skip
        const lenDiff = Math.abs(keys[i].length - keys[j].length);
        const maxLen = Math.max(keys[i].length, keys[j].length);
        if (maxLen > 0 && lenDiff / maxLen > 1 - effectiveThreshold) {
          continue;
        }
        similarity = jaroWinkler(keys[i], keys[j]);
      }

      if (similarity >= effectiveThreshold) {
        group.duplicates.push({
          index: j,
          row: rows[j],
          similarity,
        });
        assigned.add(j);
      }
    }

    // Only include groups that actually have duplicates
    if (group.duplicates.length > 0) {
      assigned.add(i);
      // Sort duplicates by similarity (highest first)
      group.duplicates.sort((a, b) => b.similarity - a.similarity);
      groups.push(group);
    }
  }

  return groups;
}
