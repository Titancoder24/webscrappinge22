/**
 * DiffEngine – Change detection between extraction runs for DataForge.
 *
 * Compares two sets of rows using configurable key columns to identify:
 *  - New rows (present in B but not in A)
 *  - Removed rows (present in A but not in B)
 *  - Changed rows (same key, different values)
 *  - Unchanged rows (same key, same values)
 *
 * Uses a hash-map approach for O(n + m) comparison where n and m are the
 * row counts of the two tables.
 *
 * Zero dependencies.
 */

import type { Row } from '../types/extraction';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** A single cell-level change within a row. */
export interface FieldChange {
  /** Column ID where the change occurred. */
  columnId: string;
  /** Value in table A (the "before" value). */
  oldValue: string | number | null;
  /** Value in table B (the "after" value). */
  newValue: string | number | null;
}

/** A row that changed between runs. */
export interface ChangedRow {
  /** The composite key that identifies this row. */
  key: string;
  /** The full row from table A (before). */
  rowA: Row;
  /** The full row from table B (after). */
  rowB: Row;
  /** List of individual field changes. */
  changes: FieldChange[];
}

/** Complete diff report between two tables. */
export interface DiffResult {
  /** Rows present in B but not in A. */
  added: Row[];
  /** Rows present in A but not in B. */
  removed: Row[];
  /** Rows present in both but with different non-key values. */
  changed: ChangedRow[];
  /** Rows present in both with identical values. */
  unchanged: Row[];
  /** Summary counts. */
  summary: {
    addedCount: number;
    removedCount: number;
    changedCount: number;
    unchangedCount: number;
    totalA: number;
    totalB: number;
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Build a composite key string from a row's data using the specified key columns.
 * Values are joined with a null-byte separator to avoid collisions.
 */
function buildKey(row: Row, keyColumns: string[]): string {
  const parts: string[] = [];
  for (let i = 0; i < keyColumns.length; i++) {
    const val = row.data[keyColumns[i]];
    parts.push(val === null || val === undefined ? '\x00NULL\x00' : String(val));
  }
  return parts.join('\x00');
}

/**
 * Normalize a cell value for comparison purposes.
 * Treats null, undefined, and empty string as equivalent.
 * Trims whitespace from strings.
 */
function normalizeValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return '';
    return String(value);
  }
  return value.trim();
}

/**
 * Compare two rows and return a list of field-level changes.
 * Only compares non-key columns (key columns are identical by definition).
 */
function compareRows(rowA: Row, rowB: Row, keyColumns: Set<string>): FieldChange[] {
  const changes: FieldChange[] = [];

  // Collect all column IDs from both rows
  const allColumns = new Set<string>();
  const dataA = rowA.data;
  const dataB = rowB.data;

  for (const key of Object.keys(dataA)) {
    allColumns.add(key);
  }
  for (const key of Object.keys(dataB)) {
    allColumns.add(key);
  }

  for (const colId of allColumns) {
    // Skip key columns – they match by definition
    if (keyColumns.has(colId)) continue;

    const valA = normalizeValue(dataA[colId]);
    const valB = normalizeValue(dataB[colId]);

    if (valA !== valB) {
      changes.push({
        columnId: colId,
        oldValue: dataA[colId] ?? null,
        newValue: dataB[colId] ?? null,
      });
    }
  }

  return changes;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compare two sets of rows and produce a diff report.
 *
 * @param tableA - The "before" table (e.g., previous extraction run)
 * @param tableB - The "after" table (e.g., current extraction run)
 * @param keyColumns - Column IDs used to match rows between tables.
 *                     Rows with the same composite key are considered the
 *                     same entity.
 * @returns A DiffResult with added, removed, changed, and unchanged rows.
 * @throws Error if keyColumns is empty or if inputs are invalid.
 */
export function diffTables(
  tableA: Row[],
  tableB: Row[],
  keyColumns: string[],
): DiffResult {
  if (!keyColumns || keyColumns.length === 0) {
    throw new Error('At least one key column is required for diff comparison');
  }

  if (!tableA || !tableB) {
    throw new Error('Both tableA and tableB must be provided');
  }

  const keySet = new Set(keyColumns);

  // Index table A by composite key
  const indexA = new Map<string, Row>();
  for (let i = 0; i < tableA.length; i++) {
    const key = buildKey(tableA[i], keyColumns);
    // In case of duplicate keys in A, last occurrence wins
    indexA.set(key, tableA[i]);
  }

  // Index table B by composite key
  const indexB = new Map<string, Row>();
  for (let i = 0; i < tableB.length; i++) {
    const key = buildKey(tableB[i], keyColumns);
    indexB.set(key, tableB[i]);
  }

  const added: Row[] = [];
  const removed: Row[] = [];
  const changed: ChangedRow[] = [];
  const unchanged: Row[] = [];

  // Find removed and changed/unchanged rows (iterate A)
  for (const [key, rowA] of indexA) {
    const rowB = indexB.get(key);
    if (!rowB) {
      // Present in A, absent from B → removed
      removed.push(rowA);
    } else {
      // Present in both → check for changes
      const fieldChanges = compareRows(rowA, rowB, keySet);
      if (fieldChanges.length > 0) {
        changed.push({ key, rowA, rowB, changes: fieldChanges });
      } else {
        unchanged.push(rowB);
      }
    }
  }

  // Find added rows (iterate B, check absence from A)
  for (const [key, rowB] of indexB) {
    if (!indexA.has(key)) {
      added.push(rowB);
    }
  }

  return {
    added,
    removed,
    changed,
    unchanged,
    summary: {
      addedCount: added.length,
      removedCount: removed.length,
      changedCount: changed.length,
      unchangedCount: unchanged.length,
      totalA: tableA.length,
      totalB: tableB.length,
    },
  };
}
