/**
 * DataTable -- Main data table container for the DataForge side panel.
 *
 * The orchestrator component that assembles the full spreadsheet experience:
 *
 * Layout (top to bottom):
 *  1. Toolbar — search, filter button (with badge), sort indicator, columns button, export dropdown
 *  2. FormulaBar — appears when a cell is selected
 *  3. TableHeader — sticky header row with sort/resize/reorder
 *  4. VirtualizedBody — virtual-scrolling body supporting 10,000+ rows at 60fps
 *  5. StatusBar — row count, selection count, filtered indicator
 *
 * Overlay panels (right-side slide-in):
 *  - FilterPanel
 *  - SortControls
 *  - ColumnConfig
 *
 * Floating:
 *  - ExportMenu (dropdown below export button)
 *  - ImagePreview (near cursor on image cells)
 *
 * All data flows through the useDataTableStore Zustand store.
 * Integrates with the export engine for file/clipboard/webhook exports.
 */

import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { useDataTableStore } from './useDataTableStore';
import VirtualizedBody, { type VirtualizedBodyHandle } from './VirtualizedBody';
import TableHeader from './TableHeader';
import FormulaBar from './FormulaBar';
import FilterPanel from './FilterPanel';
import SortControls from './SortControls';
import ColumnConfig from './ColumnConfig';
import ExportMenu from './ExportMenu';
import ImagePreview from './ImagePreview';
import { exportData } from '@/lib/export-engine';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DataTable: React.FC = () => {
  // ---- Store selectors ----
  const rows = useDataTableStore((s) => s.rows);
  const columns = useDataTableStore((s) => s.columns);
  const searchQuery = useDataTableStore((s) => s.searchQuery);
  const setSearchQuery = useDataTableStore((s) => s.setSearchQuery);
  const filters = useDataTableStore((s) => s.filters);
  const sorts = useDataTableStore((s) => s.sorts);
  const selectedRowIds = useDataTableStore((s) => s.selectedRowIds);
  const activeCell = useDataTableStore((s) => s.activeCell);

  // Panels
  const filterPanelOpen = useDataTableStore((s) => s.filterPanelOpen);
  const setFilterPanelOpen = useDataTableStore((s) => s.setFilterPanelOpen);
  const columnConfigOpen = useDataTableStore((s) => s.columnConfigOpen);
  const setColumnConfigOpen = useDataTableStore((s) => s.setColumnConfigOpen);
  const exportMenuOpen = useDataTableStore((s) => s.exportMenuOpen);
  const setExportMenuOpen = useDataTableStore((s) => s.setExportMenuOpen);
  const sortControlsOpen = useDataTableStore((s) => s.sortControlsOpen);
  const setSortControlsOpen = useDataTableStore((s) => s.setSortControlsOpen);

  // Export
  const isExporting = useDataTableStore((s) => s.isExporting);
  const exportFormat = useDataTableStore((s) => s.exportFormat);
  const finishExport = useDataTableStore((s) => s.finishExport);

  // Computed
  const getFilteredSortedRows = useDataTableStore((s) => s.getFilteredSortedRows);
  const getVisibleColumns = useDataTableStore((s) => s.getVisibleColumns);

  // ---- Refs ----
  const virtualizedBodyRef = useRef<VirtualizedBodyHandle>(null);
  const exportButtonRef = useRef<HTMLDivElement>(null);

  // ---- Computed data ----
  const filteredRows = useMemo(() => getFilteredSortedRows(), [getFilteredSortedRows, rows, filters, sorts, searchQuery]);
  const visibleColumns = useMemo(() => getVisibleColumns(), [getVisibleColumns, columns]);

  // ---- Export effect ----
  // When triggerExport fires, perform the actual export
  useEffect(() => {
    if (!isExporting || !exportFormat) return;

    const doExport = async () => {
      try {
        const rowsToExport = getFilteredSortedRows();
        await exportData(rowsToExport, columns, {
          format: exportFormat,
          includeHeaders: true,
          csvDelimiter: ',',
          csvEncoding: 'utf-8',
          jsonFormat: 'array',
        });
      } catch (err) {
        console.error('[DataForge] Export failed:', err);
      } finally {
        finishExport();
      }
    };

    doExport();
  }, [isExporting, exportFormat, columns, getFilteredSortedRows, finishExport]);

  // ---- Close export menu on outside click ----
  useEffect(() => {
    if (!exportMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (exportButtonRef.current && !exportButtonRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    const timer = setTimeout(() => window.addEventListener('click', handler), 0);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('click', handler);
    };
  }, [exportMenuOpen, setExportMenuOpen]);

  // ---- Keyboard shortcuts ----
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Ctrl+F to focus search
      if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.getElementById('df-table-search');
        searchInput?.focus();
      }
      // Ctrl+A to select all (when table is focused)
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        const tableEl = document.getElementById('df-data-table');
        if (tableEl?.contains(document.activeElement)) {
          e.preventDefault();
          useDataTableStore.getState().selectAll();
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // ---- Render empty state ----
  if (rows.length === 0 && columns.length === 0) {
    return (
      <div
        id="df-data-table"
        className="flex flex-col items-center justify-center h-full bg-forge-bg text-forge-text-muted/40 select-none"
      >
        <div className="flex flex-col items-center gap-4 p-8">
          {/* Empty state icon */}
          <div className="relative">
            <svg
              width="64"
              height="64"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-forge-text-muted/20"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="3" y1="15" x2="21" y2="15" />
              <line x1="9" y1="3" x2="9" y2="21" />
              <line x1="15" y1="3" x2="15" y2="21" />
            </svg>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-forge-bg flex items-center justify-center">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-forge-text-muted/30"
                aria-hidden="true"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </div>
          </div>

          <div className="text-center">
            <h3 className="text-sm font-semibold text-forge-text-muted/50 mb-1">No Data Yet</h3>
            <p className="text-xs text-forge-text-muted/30 max-w-[200px] leading-relaxed">
              Run an extraction to populate the data table, or import data from a file.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id="df-data-table"
      className="flex flex-col h-full bg-forge-bg overflow-hidden relative"
    >
      {/* ================================================================== */}
      {/* TOOLBAR                                                            */}
      {/* ================================================================== */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 bg-forge-bg/90 backdrop-blur-sm border-b border-forge-border/40 shrink-0 z-10">
        {/* Search */}
        <div className="relative flex-1 min-w-0 max-w-[200px]">
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="absolute left-2 top-1/2 -translate-y-1/2 text-forge-text-muted/40 pointer-events-none"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            id="df-table-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="w-full h-7 pl-7 pr-2 bg-forge-bg-secondary/60 border border-forge-border/30 rounded-md text-xs text-forge-text outline-none placeholder:text-forge-text-muted/30 focus:border-accent-primary/40 focus:ring-1 focus:ring-accent-primary/20 transition-all"
            spellCheck={false}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full flex items-center justify-center text-forge-text-muted/40 hover:text-forge-text hover:bg-forge-bg-tertiary/50"
              aria-label="Clear search"
            >
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          )}
        </div>

        {/* Filter button */}
        <button
          type="button"
          onClick={() => {
            setFilterPanelOpen(!filterPanelOpen);
            if (sortControlsOpen) setSortControlsOpen(false);
            if (columnConfigOpen) setColumnConfigOpen(false);
          }}
          className={[
            'relative flex items-center gap-1 px-2 h-7 rounded-md text-xs transition-all duration-100',
            'border',
            filterPanelOpen
              ? 'bg-accent-primary/15 border-accent-primary/30 text-accent-primary'
              : 'bg-forge-bg-secondary/40 border-forge-border/30 text-forge-text-secondary hover:text-forge-text hover:border-forge-border/50',
          ].join(' ')}
          title="Filters"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <span className="hidden sm:inline">Filter</span>
          {filters.length > 0 && (
            <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-accent-primary text-forge-bg text-[9px] font-bold flex items-center justify-center animate-scale-in">
              {filters.length}
            </span>
          )}
        </button>

        {/* Sort indicator / button */}
        <button
          type="button"
          onClick={() => {
            setSortControlsOpen(!sortControlsOpen);
            if (filterPanelOpen) setFilterPanelOpen(false);
            if (columnConfigOpen) setColumnConfigOpen(false);
          }}
          className={[
            'flex items-center gap-1 px-2 h-7 rounded-md text-xs transition-all duration-100',
            'border',
            sortControlsOpen
              ? 'bg-accent-primary/15 border-accent-primary/30 text-accent-primary'
              : sorts.length > 0
                ? 'bg-accent-primary/5 border-accent-primary/20 text-accent-primary'
                : 'bg-forge-bg-secondary/40 border-forge-border/30 text-forge-text-secondary hover:text-forge-text hover:border-forge-border/50',
          ].join(' ')}
          title={sorts.length > 0 ? `Sorted by ${sorts.length} column(s)` : 'Sort'}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <polyline points="19 12 12 19 5 12" />
          </svg>
          {sorts.length > 0 && (
            <span className="font-mono text-[10px]">
              {sorts.length}
            </span>
          )}
        </button>

        {/* Columns button */}
        <button
          type="button"
          onClick={() => {
            setColumnConfigOpen(!columnConfigOpen);
            if (filterPanelOpen) setFilterPanelOpen(false);
            if (sortControlsOpen) setSortControlsOpen(false);
          }}
          className={[
            'flex items-center gap-1 px-2 h-7 rounded-md text-xs transition-all duration-100',
            'border',
            columnConfigOpen
              ? 'bg-accent-primary/15 border-accent-primary/30 text-accent-primary'
              : 'bg-forge-bg-secondary/40 border-forge-border/30 text-forge-text-secondary hover:text-forge-text hover:border-forge-border/50',
          ].join(' ')}
          title="Column configuration"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <line x1="12" y1="3" x2="12" y2="21" />
          </svg>
          <span className="hidden sm:inline">Columns</span>
        </button>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Row info */}
        <div className="flex items-center gap-2 text-[10px] text-forge-text-muted/40 flex-shrink-0">
          {filteredRows.length !== rows.length && (
            <span className="text-accent-primary/60">
              {filteredRows.length} of {rows.length}
            </span>
          )}
          {filteredRows.length === rows.length && (
            <span>{rows.length} rows</span>
          )}
          {selectedRowIds.size > 0 && (
            <span className="text-accent-primary">
              {selectedRowIds.size} selected
            </span>
          )}
        </div>

        {/* Export button */}
        <div ref={exportButtonRef} className="relative flex-shrink-0">
          <button
            type="button"
            onClick={() => setExportMenuOpen(!exportMenuOpen)}
            className={[
              'flex items-center gap-1 px-2.5 h-7 rounded-md text-xs font-semibold transition-all duration-150',
              'border',
              exportMenuOpen || isExporting
                ? 'bg-accent-primary/20 border-accent-primary/40 text-accent-primary'
                : 'bg-accent-primary/10 border-accent-primary/20 text-accent-primary hover:bg-accent-primary/20',
              isExporting && 'animate-pulse',
            ].join(' ')}
          >
            {isExporting ? (
              <div className="w-3 h-3 border-2 border-accent-primary/30 border-t-accent-primary rounded-full animate-spin" />
            ) : (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
            )}
            Export
          </button>

          {/* Export dropdown */}
          {exportMenuOpen && <ExportMenu />}
        </div>
      </div>

      {/* ================================================================== */}
      {/* FORMULA BAR (when cell is selected)                                */}
      {/* ================================================================== */}
      {activeCell && <FormulaBar />}

      {/* ================================================================== */}
      {/* TABLE AREA                                                         */}
      {/* ================================================================== */}
      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Horizontal scroll wrapper */}
        <div className="flex-1 flex flex-col overflow-x-auto overflow-y-hidden">
          {/* Header */}
          <TableHeader columns={visibleColumns} />

          {/* Virtualized body */}
          <VirtualizedBody
            ref={virtualizedBodyRef}
            rows={filteredRows}
            columns={visibleColumns}
          />
        </div>

        {/* ================================================================ */}
        {/* OVERLAY PANELS (right-side slide-in)                             */}
        {/* ================================================================ */}
        {filterPanelOpen && <FilterPanel />}
        {sortControlsOpen && <SortControls />}
        {columnConfigOpen && <ColumnConfig />}
      </div>

      {/* ================================================================== */}
      {/* STATUS BAR                                                         */}
      {/* ================================================================== */}
      <div className="flex items-center justify-between px-3 py-1 bg-forge-bg-secondary/60 border-t border-forge-border/30 shrink-0 text-[10px] text-forge-text-muted/40 select-none">
        <div className="flex items-center gap-3">
          <span>
            {filteredRows.length === rows.length
              ? `${rows.length} rows`
              : `${filteredRows.length} of ${rows.length} rows`}
          </span>
          <span>{visibleColumns.length} columns</span>
          {filters.length > 0 && (
            <span className="text-accent-primary/60">
              {filters.length} filter{filters.length !== 1 ? 's' : ''} active
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {selectedRowIds.size > 0 && (
            <span className="text-accent-primary/60">
              {selectedRowIds.size} selected
            </span>
          )}
          {sorts.length > 0 && (
            <span>
              Sorted by {sorts.length} column{sorts.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>
      </div>

      {/* ================================================================== */}
      {/* IMAGE PREVIEW (floating near cursor)                               */}
      {/* ================================================================== */}
      <ImagePreview />
    </div>
  );
};

export default DataTable;
