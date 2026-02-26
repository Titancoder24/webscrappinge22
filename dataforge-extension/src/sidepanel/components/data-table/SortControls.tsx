/**
 * SortControls -- Sort configuration panel for the DataForge data table.
 *
 * Features:
 * - Current sort indicators for each active sort column
 * - Multi-column sort support with priority ordering
 * - Drag to reorder sort priority
 * - Toggle direction (asc/desc)
 * - Remove individual sort rules
 * - Clear all sorts button
 * - Add new sort rule from available columns
 */

import React, { useCallback, useState } from 'react';
import type { SortConfig } from '@/types/table';
import { useDataTableStore } from './useDataTableStore';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const SortControls: React.FC = () => {
  const columns = useDataTableStore((s) => s.columns);
  const sorts = useDataTableStore((s) => s.sorts);
  const setSorts = useDataTableStore((s) => s.setSorts);
  const removeSortByColumn = useDataTableStore((s) => s.removeSortByColumn);
  const clearSorts = useDataTableStore((s) => s.clearSorts);
  const setSortControlsOpen = useDataTableStore((s) => s.setSortControlsOpen);

  // Drag state
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Available columns (not yet used in a sort)
  const availableColumns = columns.filter(
    (col) => col.sortable && !sorts.some((s) => s.columnId === col.id),
  );

  // ---- Get column name ----
  const getColumnName = useCallback(
    (id: string) => columns.find((c) => c.id === id)?.name ?? id,
    [columns],
  );

  // ---- Toggle direction ----
  const toggleDirection = useCallback(
    (index: number) => {
      const updated = sorts.map((s, i) =>
        i === index
          ? { ...s, direction: (s.direction === 'asc' ? 'desc' : 'asc') as SortConfig['direction'] }
          : s,
      );
      setSorts(updated);
    },
    [sorts, setSorts],
  );

  // ---- Add sort rule ----
  const handleAddSort = useCallback(
    (columnId: string) => {
      setSorts([...sorts, { columnId, direction: 'asc' }]);
    },
    [sorts, setSorts],
  );

  // ---- Drag to reorder ----
  const handleDragStart = useCallback((_e: React.DragEvent, index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, index: number) => {
      e.preventDefault();
      if (index !== dragIndex) {
        setDragOverIndex(index);
      }
    },
    [dragIndex],
  );

  const handleDragLeave = useCallback(() => {
    setDragOverIndex(null);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent, targetIndex: number) => {
      e.preventDefault();
      if (dragIndex === null || dragIndex === targetIndex) return;

      const updated = [...sorts];
      const [moved] = updated.splice(dragIndex, 1);
      updated.splice(targetIndex, 0, moved);
      setSorts(updated);
      setDragIndex(null);
      setDragOverIndex(null);
    },
    [dragIndex, sorts, setSorts],
  );

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
    setDragOverIndex(null);
  }, []);

  return (
    <div className="absolute top-0 right-0 z-40 w-[280px] h-full bg-forge-bg-secondary border-l border-forge-border shadow-xl animate-slide-in-right overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-forge-border/40">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-primary" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <polyline points="19 12 12 19 5 12" />
          </svg>
          <h3 className="text-sm font-semibold text-forge-text">Sort</h3>
          {sorts.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-accent-primary/20 text-accent-primary text-[10px] font-bold">
              {sorts.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setSortControlsOpen(false)}
          className="flex items-center justify-center w-6 h-6 rounded text-forge-text-muted hover:text-forge-text hover:bg-forge-bg-tertiary transition-colors"
          aria-label="Close sort panel"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Active sort rules */}
      <div className="px-3 py-2 space-y-1">
        {sorts.length > 0 && (
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-forge-text-muted/60 uppercase tracking-wider">
              Sort Priority
            </span>
            <button
              type="button"
              onClick={clearSorts}
              className="text-[10px] text-status-error hover:text-status-error/80 transition-colors"
            >
              Clear All
            </button>
          </div>
        )}

        {sorts.map((sort, idx) => (
          <div
            key={sort.columnId}
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={(e) => handleDragOver(e, idx)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, idx)}
            onDragEnd={handleDragEnd}
            className={[
              'flex items-center gap-2 px-2 py-1.5 rounded-lg border transition-all duration-100 cursor-grab active:cursor-grabbing',
              dragOverIndex === idx
                ? 'border-accent-primary/50 bg-accent-primary/10'
                : 'border-forge-border/30 bg-forge-bg/50 hover:border-forge-border/50',
              dragIndex === idx && 'opacity-50',
            ]
              .filter(Boolean)
              .join(' ')}
          >
            {/* Drag handle */}
            <div className="flex-shrink-0 text-forge-text-muted/30">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <circle cx="9" cy="6" r="2" />
                <circle cx="15" cy="6" r="2" />
                <circle cx="9" cy="12" r="2" />
                <circle cx="15" cy="12" r="2" />
                <circle cx="9" cy="18" r="2" />
                <circle cx="15" cy="18" r="2" />
              </svg>
            </div>

            {/* Priority number */}
            <span className="flex-shrink-0 w-4 h-4 rounded-full bg-accent-primary/20 text-accent-primary text-[9px] font-bold flex items-center justify-center">
              {idx + 1}
            </span>

            {/* Column name */}
            <span className="flex-1 text-xs text-forge-text truncate">
              {getColumnName(sort.columnId)}
            </span>

            {/* Direction toggle */}
            <button
              type="button"
              onClick={() => toggleDirection(idx)}
              className="flex-shrink-0 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-forge-bg-tertiary/50 text-[10px] font-mono text-forge-text-secondary hover:bg-accent-primary/10 hover:text-accent-primary transition-colors"
              title={`Sort ${sort.direction === 'asc' ? 'ascending' : 'descending'} - click to toggle`}
            >
              <span>{sort.direction === 'asc' ? '\u25B2' : '\u25BC'}</span>
              <span className="uppercase">{sort.direction}</span>
            </button>

            {/* Remove button */}
            <button
              type="button"
              onClick={() => removeSortByColumn(sort.columnId)}
              className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-forge-text-muted/40 hover:text-status-error hover:bg-status-error/10 transition-colors"
              aria-label={`Remove sort on ${getColumnName(sort.columnId)}`}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        ))}

        {/* Empty state */}
        {sorts.length === 0 && (
          <div className="py-6 text-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-forge-text-muted/20 mb-2" aria-hidden="true">
              <line x1="12" y1="5" x2="12" y2="19" />
              <polyline points="19 12 12 19 5 12" />
            </svg>
            <p className="text-[11px] text-forge-text-muted/40">No sort rules</p>
            <p className="text-[10px] text-forge-text-muted/25 mt-1">Click a column header or add a rule below</p>
          </div>
        )}
      </div>

      {/* Add sort rule */}
      {availableColumns.length > 0 && (
        <div className="px-3 py-2 border-t border-forge-border/20">
          <h4 className="text-[10px] text-forge-text-muted/60 uppercase tracking-wider mb-2">
            Add Sort Rule
          </h4>
          <div className="space-y-1">
            {availableColumns.map((col) => (
              <button
                key={col.id}
                type="button"
                onClick={() => handleAddSort(col.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs text-forge-text-secondary hover:text-forge-text hover:bg-accent-primary/[0.06] transition-colors text-left"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                <span className="truncate">{col.name}</span>
                <span className="ml-auto text-[8px] text-forge-text-muted/30 uppercase">
                  {col.dataType.slice(0, 3)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default SortControls;
