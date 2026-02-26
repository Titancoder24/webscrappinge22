/**
 * Zustand store for the DataForge data table.
 *
 * Manages rows, columns, selection, sorting, filtering, column ordering,
 * cell editing, formula evaluation, and export state. Every data-table
 * component reads from and writes to this single store.
 */

import { create } from 'zustand';
import type { ColumnDef, FilterConfig, SortConfig } from '@/types/table';
import type { Row } from '@/types/extraction';
import type { ExportFormat, ExportOptions } from '@/types/export';
import { generatePrefixedId } from '@/utils/id';

// ---------------------------------------------------------------------------
// Derived / internal types
// ---------------------------------------------------------------------------

export type CellAddress = { rowId: string; columnId: string };

export interface FormulaEntry {
  /** The column this formula targets */
  columnId: string;
  /** Raw formula string, e.g. "=UPPER(A)" */
  expression: string;
}

export interface ColumnOrder {
  columnId: string;
  position: number;
}

// ---------------------------------------------------------------------------
// Store shape
// ---------------------------------------------------------------------------

export interface DataTableState {
  /* ---- data ---- */
  rows: Row[];
  columns: ColumnDef[];
  /** IDs of rows that were added during the current/latest extraction (for animations) */
  newRowIds: Set<string>;

  /* ---- selection ---- */
  selectedRowIds: Set<string>;
  activeCell: CellAddress | null;
  /** Range start for shift-click */
  anchorRowId: string | null;

  /* ---- sorting ---- */
  sorts: SortConfig[];

  /* ---- filtering ---- */
  filters: FilterConfig[];

  /* ---- column config ---- */
  columnOrder: string[];

  /* ---- editing ---- */
  editingCell: CellAddress | null;
  editValue: string;

  /* ---- formula bar ---- */
  formulas: FormulaEntry[];

  /* ---- search ---- */
  searchQuery: string;

  /* ---- panels ---- */
  filterPanelOpen: boolean;
  columnConfigOpen: boolean;
  exportMenuOpen: boolean;
  sortControlsOpen: boolean;

  /* ---- export ---- */
  isExporting: boolean;
  exportFormat: ExportFormat | null;

  /* ---- image preview ---- */
  previewImageUrl: string | null;
  previewPosition: { x: number; y: number } | null;
}

export interface DataTableActions {
  /* ---- data ---- */
  setRows: (rows: Row[]) => void;
  addRows: (rows: Row[]) => void;
  updateCell: (rowId: string, columnId: string, value: string | number | null) => void;
  deleteRows: (rowIds: string[]) => void;
  clearNewRowIds: () => void;
  setColumns: (columns: ColumnDef[]) => void;
  addColumn: (column: ColumnDef) => void;
  removeColumn: (columnId: string) => void;
  updateColumn: (columnId: string, patch: Partial<ColumnDef>) => void;

  /* ---- selection ---- */
  selectRow: (rowId: string, mode: 'single' | 'toggle' | 'range') => void;
  selectAll: () => void;
  clearSelection: () => void;
  setActiveCell: (cell: CellAddress | null) => void;

  /* ---- sorting ---- */
  toggleSort: (columnId: string) => void;
  setSorts: (sorts: SortConfig[]) => void;
  removeSortByColumn: (columnId: string) => void;
  clearSorts: () => void;

  /* ---- filtering ---- */
  addFilter: (filter: FilterConfig) => void;
  updateFilter: (index: number, filter: FilterConfig) => void;
  removeFilter: (index: number) => void;
  clearFilters: () => void;

  /* ---- column config ---- */
  setColumnOrder: (order: string[]) => void;
  toggleColumnVisibility: (columnId: string) => void;
  renameColumn: (columnId: string, name: string) => void;
  resizeColumn: (columnId: string, width: number) => void;

  /* ---- editing ---- */
  startEditing: (cell: CellAddress, initialValue: string) => void;
  setEditValue: (value: string) => void;
  commitEdit: () => void;
  cancelEdit: () => void;

  /* ---- formula ---- */
  applyFormula: (columnId: string, expression: string) => void;

  /* ---- search ---- */
  setSearchQuery: (query: string) => void;

  /* ---- panels ---- */
  setFilterPanelOpen: (open: boolean) => void;
  setColumnConfigOpen: (open: boolean) => void;
  setExportMenuOpen: (open: boolean) => void;
  setSortControlsOpen: (open: boolean) => void;

  /* ---- export ---- */
  triggerExport: (format: ExportFormat) => void;
  finishExport: () => void;

  /* ---- image preview ---- */
  showImagePreview: (url: string, position: { x: number; y: number }) => void;
  hideImagePreview: () => void;

  /* ---- computed helpers (not stored, but convenient) ---- */
  getFilteredSortedRows: () => Row[];
  getVisibleColumns: () => ColumnDef[];
}

export type DataTableStore = DataTableState & DataTableActions;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function applyFilters(rows: Row[], filters: FilterConfig[], searchQuery: string): Row[] {
  let result = rows;

  // Search across all columns
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    result = result.filter((row) =>
      Object.values(row.data).some((v) => v != null && String(v).toLowerCase().includes(q)),
    );
  }

  for (const filter of filters) {
    result = result.filter((row) => {
      const raw = row.data[filter.columnId];
      const val = raw == null ? '' : String(raw);
      const cmp = filter.value ?? '';
      const cmp2 = filter.value2 ?? '';

      switch (filter.operator) {
        case 'contains':
          return val.toLowerCase().includes(cmp.toLowerCase());
        case 'equals':
          return val.toLowerCase() === cmp.toLowerCase();
        case 'starts_with':
          return val.toLowerCase().startsWith(cmp.toLowerCase());
        case 'ends_with':
          return val.toLowerCase().endsWith(cmp.toLowerCase());
        case 'regex':
          try {
            return new RegExp(cmp, 'i').test(val);
          } catch {
            return true;
          }
        case 'gt':
          return Number(val) > Number(cmp);
        case 'lt':
          return Number(val) < Number(cmp);
        case 'between':
          return Number(val) >= Number(cmp) && Number(val) <= Number(cmp2);
        case 'empty':
          return val.trim() === '';
        case 'not_empty':
          return val.trim() !== '';
        default:
          return true;
      }
    });
  }

  return result;
}

function applySorts(rows: Row[], sorts: SortConfig[]): Row[] {
  if (sorts.length === 0) return rows;

  return [...rows].sort((a, b) => {
    for (const sort of sorts) {
      const aVal = a.data[sort.columnId];
      const bVal = b.data[sort.columnId];

      // null / undefined sort to the end
      if (aVal == null && bVal == null) continue;
      if (aVal == null) return 1;
      if (bVal == null) return -1;

      let cmp = 0;
      const aNum = Number(aVal);
      const bNum = Number(bVal);

      if (!Number.isNaN(aNum) && !Number.isNaN(bNum)) {
        cmp = aNum - bNum;
      } else {
        cmp = String(aVal).localeCompare(String(bVal), undefined, { sensitivity: 'base' });
      }

      if (cmp !== 0) {
        return sort.direction === 'asc' ? cmp : -cmp;
      }
    }
    return 0;
  });
}

/** Evaluate a simple formula on a row. */
function evaluateFormula(expression: string, row: Row, columns: ColumnDef[]): string | number | null {
  const trimmed = expression.trim();
  if (!trimmed.startsWith('=')) return null;

  const body = trimmed.slice(1).trim();

  // Extract function name and args
  const funcMatch = body.match(/^(\w+)\((.+)\)$/s);
  if (!funcMatch) return null;

  const funcName = funcMatch[1].toUpperCase();
  const argsRaw = funcMatch[2];

  // Resolve a column reference: either column name or column id
  const resolveRef = (ref: string): string => {
    const clean = ref.trim().replace(/^["']|["']$/g, '');
    const col = columns.find((c) => c.name === clean || c.id === clean);
    if (col) {
      const v = row.data[col.id];
      return v == null ? '' : String(v);
    }
    return clean; // literal string
  };

  // Parse comma-separated arguments respecting quoted strings
  const parseArgs = (raw: string): string[] => {
    const args: string[] = [];
    let current = '';
    let inQuote = false;
    let quoteChar = '';
    for (const ch of raw) {
      if (!inQuote && (ch === '"' || ch === "'")) {
        inQuote = true;
        quoteChar = ch;
        current += ch;
      } else if (inQuote && ch === quoteChar) {
        inQuote = false;
        current += ch;
        quoteChar = '';
      } else if (!inQuote && ch === ',') {
        args.push(current.trim());
        current = '';
      } else {
        current += ch;
      }
    }
    if (current.trim()) args.push(current.trim());
    return args;
  };

  const args = parseArgs(argsRaw);

  switch (funcName) {
    case 'CONCAT':
      return args.map(resolveRef).join('');
    case 'UPPER':
      return resolveRef(args[0]).toUpperCase();
    case 'LOWER':
      return resolveRef(args[0]).toLowerCase();
    case 'TRIM':
      return resolveRef(args[0]).trim();
    case 'REPLACE': {
      const src = resolveRef(args[0]);
      const search = resolveRef(args[1]);
      const replacement = resolveRef(args[2]);
      return src.replaceAll(search, replacement);
    }
    case 'EXTRACT_DOMAIN': {
      const url = resolveRef(args[0]);
      try {
        return new URL(url.startsWith('http') ? url : `https://${url}`).hostname;
      } catch {
        return '';
      }
    }
    case 'EXTRACT_NUMBER': {
      const str = resolveRef(args[0]);
      const nums = str.match(/-?[\d,.]+/);
      if (!nums) return '';
      return parseFloat(nums[0].replace(/,/g, ''));
    }
    default:
      return null;
  }
}

// ---------------------------------------------------------------------------
// Store creation
// ---------------------------------------------------------------------------

export const useDataTableStore = create<DataTableStore>((set, get) => ({
  /* ---- initial state ---- */
  rows: [],
  columns: [],
  newRowIds: new Set<string>(),
  selectedRowIds: new Set<string>(),
  activeCell: null,
  anchorRowId: null,
  sorts: [],
  filters: [],
  columnOrder: [],
  editingCell: null,
  editValue: '',
  formulas: [],
  searchQuery: '',
  filterPanelOpen: false,
  columnConfigOpen: false,
  exportMenuOpen: false,
  sortControlsOpen: false,
  isExporting: false,
  exportFormat: null,
  previewImageUrl: null,
  previewPosition: null,

  /* ---- actions ---- */

  setRows: (rows) => set({ rows, newRowIds: new Set<string>() }),

  addRows: (incoming) =>
    set((state) => {
      const ids = new Set(state.newRowIds);
      for (const r of incoming) ids.add(r.id);
      return { rows: [...state.rows, ...incoming], newRowIds: ids };
    }),

  updateCell: (rowId, columnId, value) =>
    set((state) => ({
      rows: state.rows.map((r) =>
        r.id === rowId ? { ...r, data: { ...r.data, [columnId]: value } } : r,
      ),
    })),

  deleteRows: (rowIds) => {
    const idSet = new Set(rowIds);
    set((state) => ({
      rows: state.rows.filter((r) => !idSet.has(r.id)),
      selectedRowIds: new Set([...state.selectedRowIds].filter((id) => !idSet.has(id))),
    }));
  },

  clearNewRowIds: () => set({ newRowIds: new Set<string>() }),

  setColumns: (columns) =>
    set({
      columns,
      columnOrder: columns.map((c) => c.id),
    }),

  addColumn: (column) =>
    set((state) => ({
      columns: [...state.columns, column],
      columnOrder: [...state.columnOrder, column.id],
    })),

  removeColumn: (columnId) =>
    set((state) => ({
      columns: state.columns.filter((c) => c.id !== columnId),
      columnOrder: state.columnOrder.filter((id) => id !== columnId),
    })),

  updateColumn: (columnId, patch) =>
    set((state) => ({
      columns: state.columns.map((c) => (c.id === columnId ? { ...c, ...patch } : c)),
    })),

  /* ---- selection ---- */

  selectRow: (rowId, mode) =>
    set((state) => {
      const next = new Set(state.selectedRowIds);

      if (mode === 'single') {
        next.clear();
        next.add(rowId);
        return { selectedRowIds: next, anchorRowId: rowId };
      }

      if (mode === 'toggle') {
        if (next.has(rowId)) next.delete(rowId);
        else next.add(rowId);
        return { selectedRowIds: next, anchorRowId: rowId };
      }

      // range
      if (state.anchorRowId) {
        const filtered = get().getFilteredSortedRows();
        const anchorIdx = filtered.findIndex((r) => r.id === state.anchorRowId);
        const targetIdx = filtered.findIndex((r) => r.id === rowId);
        if (anchorIdx !== -1 && targetIdx !== -1) {
          const [start, end] = anchorIdx < targetIdx ? [anchorIdx, targetIdx] : [targetIdx, anchorIdx];
          for (let i = start; i <= end; i++) {
            next.add(filtered[i].id);
          }
        }
      } else {
        next.add(rowId);
      }
      return { selectedRowIds: next };
    }),

  selectAll: () =>
    set((state) => ({
      selectedRowIds: new Set(get().getFilteredSortedRows().map((r) => r.id)),
    })),

  clearSelection: () => set({ selectedRowIds: new Set<string>(), anchorRowId: null }),

  setActiveCell: (cell) => set({ activeCell: cell }),

  /* ---- sorting ---- */

  toggleSort: (columnId) =>
    set((state) => {
      const existing = state.sorts.find((s) => s.columnId === columnId);
      if (!existing) {
        return { sorts: [...state.sorts, { columnId, direction: 'asc' as const }] };
      }
      if (existing.direction === 'asc') {
        return {
          sorts: state.sorts.map((s) =>
            s.columnId === columnId ? { ...s, direction: 'desc' as const } : s,
          ),
        };
      }
      // desc -> remove
      return { sorts: state.sorts.filter((s) => s.columnId !== columnId) };
    }),

  setSorts: (sorts) => set({ sorts }),

  removeSortByColumn: (columnId) =>
    set((state) => ({ sorts: state.sorts.filter((s) => s.columnId !== columnId) })),

  clearSorts: () => set({ sorts: [] }),

  /* ---- filtering ---- */

  addFilter: (filter) => set((state) => ({ filters: [...state.filters, filter] })),

  updateFilter: (index, filter) =>
    set((state) => ({
      filters: state.filters.map((f, i) => (i === index ? filter : f)),
    })),

  removeFilter: (index) =>
    set((state) => ({ filters: state.filters.filter((_, i) => i !== index) })),

  clearFilters: () => set({ filters: [] }),

  /* ---- column config ---- */

  setColumnOrder: (order) => set({ columnOrder: order }),

  toggleColumnVisibility: (columnId) =>
    set((state) => ({
      columns: state.columns.map((c) =>
        c.id === columnId ? { ...c, visible: !c.visible } : c,
      ),
    })),

  renameColumn: (columnId, name) =>
    set((state) => ({
      columns: state.columns.map((c) => (c.id === columnId ? { ...c, name } : c)),
    })),

  resizeColumn: (columnId, width) =>
    set((state) => ({
      columns: state.columns.map((c) =>
        c.id === columnId ? { ...c, width: Math.max(60, width) } : c,
      ),
    })),

  /* ---- editing ---- */

  startEditing: (cell, initialValue) =>
    set({ editingCell: cell, editValue: initialValue, activeCell: cell }),

  setEditValue: (value) => set({ editValue: value }),

  commitEdit: () => {
    const { editingCell, editValue, rows } = get();
    if (!editingCell) return;
    const { rowId, columnId } = editingCell;
    set({
      rows: rows.map((r) =>
        r.id === rowId ? { ...r, data: { ...r.data, [columnId]: editValue } } : r,
      ),
      editingCell: null,
      editValue: '',
    });
  },

  cancelEdit: () => set({ editingCell: null, editValue: '' }),

  /* ---- formula ---- */

  applyFormula: (columnId, expression) =>
    set((state) => {
      const updated = state.rows.map((row) => {
        const result = evaluateFormula(expression, row, state.columns);
        if (result == null) return row;
        return { ...row, data: { ...row.data, [columnId]: result } };
      });
      return {
        rows: updated,
        formulas: [
          ...state.formulas.filter((f) => f.columnId !== columnId),
          { columnId, expression },
        ],
      };
    }),

  /* ---- search ---- */

  setSearchQuery: (query) => set({ searchQuery: query }),

  /* ---- panels ---- */

  setFilterPanelOpen: (open) => set({ filterPanelOpen: open }),
  setColumnConfigOpen: (open) => set({ columnConfigOpen: open }),
  setExportMenuOpen: (open) => set({ exportMenuOpen: open }),
  setSortControlsOpen: (open) => set({ sortControlsOpen: open }),

  /* ---- export ---- */

  triggerExport: (format) => set({ isExporting: true, exportFormat: format }),
  finishExport: () => set({ isExporting: false, exportFormat: null }),

  /* ---- image preview ---- */

  showImagePreview: (url, position) => set({ previewImageUrl: url, previewPosition: position }),
  hideImagePreview: () => set({ previewImageUrl: null, previewPosition: null }),

  /* ---- computed ---- */

  getFilteredSortedRows: () => {
    const { rows, filters, sorts, searchQuery } = get();
    const filtered = applyFilters(rows, filters, searchQuery);
    return applySorts(filtered, sorts);
  },

  getVisibleColumns: () => {
    const { columns, columnOrder } = get();
    const orderMap = new Map(columnOrder.map((id, idx) => [id, idx]));
    return columns
      .filter((c) => c.visible)
      .sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0));
  },
}));
