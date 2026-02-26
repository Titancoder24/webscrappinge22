/**
 * Data table state slice.
 *
 * Manages the in-memory representation of extracted data tables,
 * including columns, rows, filtering, sorting, and search.
 */

import type { StateCreator } from 'zustand';
import type { TableMeta, ColumnDef, FilterConfig, SortConfig } from '../../types/table';
import type { Row } from '../../types/extraction';
import type { StoreState } from './index';

// ---------------------------------------------------------------------------
// Slice state
// ---------------------------------------------------------------------------

export interface TableSlice {
  /** All known table metadata entries. */
  tables: TableMeta[];

  /** ID of the table currently being viewed/edited. */
  activeTableId: string | null;

  /** Column definitions for the active table. */
  columns: ColumnDef[];

  /** Row data for the active table. */
  rows: Row[];

  /** Active filter configurations. */
  filters: FilterConfig[];

  /** Active sort configurations. */
  sorts: SortConfig[];

  /** Free-text search query against row data. */
  searchQuery: string;

  /** IDs of selected rows (for bulk operations). */
  selectedRowIds: Set<string>;

  // -- Actions ---------------------------------------------------------------

  setTables: (tables: TableMeta[]) => void;
  setActiveTable: (tableId: string | null) => void;
  setColumns: (columns: ColumnDef[]) => void;
  addColumn: (column: ColumnDef) => void;
  removeColumn: (columnId: string) => void;
  renameColumn: (columnId: string, newName: string) => void;
  reorderColumns: (columnIds: string[]) => void;
  setRows: (rows: Row[]) => void;
  setFilters: (filters: FilterConfig[]) => void;
  setSorts: (sorts: SortConfig[]) => void;
  setSearch: (query: string) => void;
  selectRows: (rowIds: string[]) => void;

  /** Computed: returns rows filtered and sorted according to current state. */
  getFilteredRows: () => Row[];
}

// ---------------------------------------------------------------------------
// Filter / sort helpers
// ---------------------------------------------------------------------------

function matchesFilter(row: Row, filter: FilterConfig): boolean {
  const raw = row.data[filter.columnId];
  const value = raw != null ? String(raw) : '';
  const filterVal = filter.value;

  switch (filter.operator) {
    case 'contains':
      return value.toLowerCase().includes(filterVal.toLowerCase());
    case 'equals':
      return value.toLowerCase() === filterVal.toLowerCase();
    case 'starts_with':
      return value.toLowerCase().startsWith(filterVal.toLowerCase());
    case 'ends_with':
      return value.toLowerCase().endsWith(filterVal.toLowerCase());
    case 'regex': {
      try {
        return new RegExp(filterVal, 'i').test(value);
      } catch {
        return false;
      }
    }
    case 'gt': {
      const numVal = parseFloat(value);
      const numFilter = parseFloat(filterVal);
      return !isNaN(numVal) && !isNaN(numFilter) && numVal > numFilter;
    }
    case 'lt': {
      const numVal = parseFloat(value);
      const numFilter = parseFloat(filterVal);
      return !isNaN(numVal) && !isNaN(numFilter) && numVal < numFilter;
    }
    case 'between': {
      const numVal = parseFloat(value);
      const lo = parseFloat(filterVal);
      const hi = parseFloat(filter.value2 ?? '');
      return !isNaN(numVal) && !isNaN(lo) && !isNaN(hi) && numVal >= lo && numVal <= hi;
    }
    case 'empty':
      return value.trim() === '';
    case 'not_empty':
      return value.trim() !== '';
    default:
      return true;
  }
}

function applyFilters(rows: Row[], filters: FilterConfig[]): Row[] {
  if (filters.length === 0) return rows;
  return rows.filter((row) => filters.every((f) => matchesFilter(row, f)));
}

function applySearch(rows: Row[], query: string): Row[] {
  if (!query.trim()) return rows;
  const lower = query.toLowerCase();
  return rows.filter((row) =>
    Object.values(row.data).some(
      (val) => val != null && String(val).toLowerCase().includes(lower),
    ),
  );
}

function applySorts(rows: Row[], sorts: SortConfig[]): Row[] {
  if (sorts.length === 0) return rows;

  return [...rows].sort((a, b) => {
    for (const sort of sorts) {
      const aVal = a.data[sort.columnId];
      const bVal = b.data[sort.columnId];

      // Nulls sort to the end
      if (aVal == null && bVal == null) continue;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let comparison = 0;
      const aNum = typeof aVal === 'number' ? aVal : parseFloat(String(aVal));
      const bNum = typeof bVal === 'number' ? bVal : parseFloat(String(bVal));

      if (!isNaN(aNum) && !isNaN(bNum)) {
        comparison = aNum - bNum;
      } else {
        comparison = String(aVal).localeCompare(String(bVal));
      }

      if (comparison !== 0) {
        return sort.direction === 'desc' ? -comparison : comparison;
      }
    }
    return 0;
  });
}

// ---------------------------------------------------------------------------
// Slice creator
// ---------------------------------------------------------------------------

export const createTableSlice: StateCreator<
  StoreState,
  [['zustand/devtools', never]],
  [],
  TableSlice
> = (set, get) => ({
  // -- State -----------------------------------------------------------------
  tables: [],
  activeTableId: null,
  columns: [],
  rows: [],
  filters: [],
  sorts: [],
  searchQuery: '',
  selectedRowIds: new Set<string>(),

  // -- Actions ---------------------------------------------------------------

  setTables: (tables) =>
    set({ tables }, false, 'table/setTables'),

  setActiveTable: (tableId) =>
    set(
      {
        activeTableId: tableId,
        filters: [],
        sorts: [],
        searchQuery: '',
        selectedRowIds: new Set<string>(),
      },
      false,
      'table/setActiveTable',
    ),

  setColumns: (columns) =>
    set({ columns }, false, 'table/setColumns'),

  addColumn: (column) =>
    set(
      (state) => ({ columns: [...state.columns, column] }),
      false,
      'table/addColumn',
    ),

  removeColumn: (columnId) =>
    set(
      (state) => ({
        columns: state.columns.filter((c) => c.id !== columnId),
      }),
      false,
      'table/removeColumn',
    ),

  renameColumn: (columnId, newName) =>
    set(
      (state) => ({
        columns: state.columns.map((c) =>
          c.id === columnId ? { ...c, name: newName } : c,
        ),
      }),
      false,
      'table/renameColumn',
    ),

  reorderColumns: (columnIds) =>
    set(
      (state) => {
        const columnMap = new Map(state.columns.map((c) => [c.id, c]));
        const reordered: ColumnDef[] = [];
        for (const id of columnIds) {
          const col = columnMap.get(id);
          if (col) reordered.push(col);
        }
        // Append any columns that weren't in the ordered list
        for (const col of state.columns) {
          if (!columnIds.includes(col.id)) {
            reordered.push(col);
          }
        }
        return { columns: reordered };
      },
      false,
      'table/reorderColumns',
    ),

  setRows: (rows) =>
    set({ rows }, false, 'table/setRows'),

  setFilters: (filters) =>
    set({ filters }, false, 'table/setFilters'),

  setSorts: (sorts) =>
    set({ sorts }, false, 'table/setSorts'),

  setSearch: (query) =>
    set({ searchQuery: query }, false, 'table/setSearch'),

  selectRows: (rowIds) =>
    set({ selectedRowIds: new Set(rowIds) }, false, 'table/selectRows'),

  getFilteredRows: () => {
    const { rows, filters, sorts, searchQuery } = get();
    let result = applyFilters(rows, filters);
    result = applySearch(result, searchQuery);
    result = applySorts(result, sorts);
    return result;
  },
});
