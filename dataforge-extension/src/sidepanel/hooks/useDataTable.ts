/**
 * useDataTable - Hook for data table operations.
 *
 * Provides a simplified interface over the DataTable store for common
 * operations: filtering, sorting, cell editing, column management,
 * and an undo/redo stack for row mutations.
 */

import { useCallback, useRef, useMemo } from 'react';
import { useDataTableStore } from '../components/data-table/useDataTableStore';
import type { ColumnDef, FilterConfig, SortConfig } from '../../types/table';
import type { Row } from '../../types/extraction';
import { generatePrefixedId } from '../../utils/id';

// ---------------------------------------------------------------------------
// Undo/Redo snapshot
// ---------------------------------------------------------------------------

interface Snapshot {
  rows: Row[];
  columns: ColumnDef[];
}

const MAX_UNDO_STACK = 30;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseDataTableReturn {
  /** Current rows (unfiltered). */
  rows: Row[];
  /** Current column definitions. */
  columns: ColumnDef[];
  /** Get filtered + sorted rows. */
  getFilteredSortedRows: () => Row[];
  /** Current filter configs. */
  filters: FilterConfig[];
  /** Current sort configs. */
  sorts: SortConfig[];

  /** Edit a single cell value. */
  editCell: (rowId: string, colId: string, value: string | number | null) => void;
  /** Add a new column. */
  addColumn: (name: string, dataType?: ColumnDef['dataType']) => void;
  /** Remove a column by ID. */
  removeColumn: (columnId: string) => void;
  /** Rename a column. */
  renameColumn: (columnId: string, newName: string) => void;

  /** Undo last mutation. */
  undo: () => void;
  /** Redo last undone mutation. */
  redo: () => void;
  /** Whether undo is available. */
  canUndo: boolean;
  /** Whether redo is available. */
  canRedo: boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useDataTable(): UseDataTableReturn {
  const store = useDataTableStore();
  const undoStackRef = useRef<Snapshot[]>([]);
  const redoStackRef = useRef<Snapshot[]>([]);

  const {
    rows,
    columns,
    filters,
    sorts,
    getFilteredSortedRows,
    updateCell,
    addColumn: storeAddColumn,
    removeColumn: storeRemoveColumn,
    renameColumn: storeRenameColumn,
    setRows,
    setColumns,
  } = store;

  // ---- Save current state to undo stack ----
  const pushUndo = useCallback(() => {
    const snapshot: Snapshot = {
      rows: [...rows],
      columns: [...columns],
    };
    undoStackRef.current = [...undoStackRef.current.slice(-MAX_UNDO_STACK + 1), snapshot];
    // Clear redo stack on new mutation
    redoStackRef.current = [];
  }, [rows, columns]);

  // ---- Edit cell ----
  const editCell = useCallback(
    (rowId: string, colId: string, value: string | number | null) => {
      pushUndo();
      updateCell(rowId, colId, value);
    },
    [pushUndo, updateCell],
  );

  // ---- Add column ----
  const addColumn = useCallback(
    (name: string, dataType: ColumnDef['dataType'] = 'text') => {
      pushUndo();
      const column: ColumnDef = {
        id: generatePrefixedId('col'),
        name,
        dataType,
        width: 150,
        visible: true,
        sortable: true,
        filterable: true,
      };
      storeAddColumn(column);
    },
    [pushUndo, storeAddColumn],
  );

  // ---- Remove column ----
  const removeColumn = useCallback(
    (columnId: string) => {
      pushUndo();
      storeRemoveColumn(columnId);
    },
    [pushUndo, storeRemoveColumn],
  );

  // ---- Rename column ----
  const renameColumn = useCallback(
    (columnId: string, newName: string) => {
      pushUndo();
      storeRenameColumn(columnId, newName);
    },
    [pushUndo, storeRenameColumn],
  );

  // ---- Undo ----
  const undo = useCallback(() => {
    const stack = undoStackRef.current;
    if (stack.length === 0) return;

    // Save current state to redo
    redoStackRef.current = [
      ...redoStackRef.current,
      { rows: [...rows], columns: [...columns] },
    ];

    const snapshot = stack[stack.length - 1];
    undoStackRef.current = stack.slice(0, -1);

    setRows(snapshot.rows);
    setColumns(snapshot.columns);
  }, [rows, columns, setRows, setColumns]);

  // ---- Redo ----
  const redo = useCallback(() => {
    const stack = redoStackRef.current;
    if (stack.length === 0) return;

    // Save current state to undo
    undoStackRef.current = [
      ...undoStackRef.current,
      { rows: [...rows], columns: [...columns] },
    ];

    const snapshot = stack[stack.length - 1];
    redoStackRef.current = stack.slice(0, -1);

    setRows(snapshot.rows);
    setColumns(snapshot.columns);
  }, [rows, columns, setRows, setColumns]);

  const canUndo = undoStackRef.current.length > 0;
  const canRedo = redoStackRef.current.length > 0;

  return useMemo(
    () => ({
      rows,
      columns,
      getFilteredSortedRows,
      filters,
      sorts,
      editCell,
      addColumn,
      removeColumn,
      renameColumn,
      undo,
      redo,
      canUndo,
      canRedo,
    }),
    [
      rows,
      columns,
      getFilteredSortedRows,
      filters,
      sorts,
      editCell,
      addColumn,
      removeColumn,
      renameColumn,
      undo,
      redo,
      canUndo,
      canRedo,
    ],
  );
}
