/**
 * FilterPanel -- Filter configuration panel for the DataForge data table.
 *
 * Features:
 * - Per-column filter rules
 * - Operator dropdown: contains, equals, starts_with, ends_with, regex, gt, lt, between, empty, not_empty
 * - Value input(s) -- two inputs for "between"
 * - Add filter button
 * - Active filters shown as removable chips
 * - "Clear All" button
 * - Animated slide-in panel
 */

import React, { useCallback, useState } from 'react';
import type { FilterConfig } from '@/types/table';
import { useDataTableStore } from './useDataTableStore';

// ---------------------------------------------------------------------------
// Operator definitions
// ---------------------------------------------------------------------------

interface OperatorDef {
  value: FilterConfig['operator'];
  label: string;
  needsValue: boolean;
  needsValue2: boolean;
}

const OPERATORS: OperatorDef[] = [
  { value: 'contains', label: 'Contains', needsValue: true, needsValue2: false },
  { value: 'equals', label: 'Equals', needsValue: true, needsValue2: false },
  { value: 'starts_with', label: 'Starts with', needsValue: true, needsValue2: false },
  { value: 'ends_with', label: 'Ends with', needsValue: true, needsValue2: false },
  { value: 'regex', label: 'Regex', needsValue: true, needsValue2: false },
  { value: 'gt', label: 'Greater than', needsValue: true, needsValue2: false },
  { value: 'lt', label: 'Less than', needsValue: true, needsValue2: false },
  { value: 'between', label: 'Between', needsValue: true, needsValue2: true },
  { value: 'empty', label: 'Is empty', needsValue: false, needsValue2: false },
  { value: 'not_empty', label: 'Is not empty', needsValue: false, needsValue2: false },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const FilterPanel: React.FC = () => {
  const columns = useDataTableStore((s) => s.columns);
  const filters = useDataTableStore((s) => s.filters);
  const addFilter = useDataTableStore((s) => s.addFilter);
  const removeFilter = useDataTableStore((s) => s.removeFilter);
  const clearFilters = useDataTableStore((s) => s.clearFilters);
  const setFilterPanelOpen = useDataTableStore((s) => s.setFilterPanelOpen);

  // New filter form state
  const [newColumnId, setNewColumnId] = useState(columns[0]?.id ?? '');
  const [newOperator, setNewOperator] = useState<FilterConfig['operator']>('contains');
  const [newValue, setNewValue] = useState('');
  const [newValue2, setNewValue2] = useState('');

  const currentOperator = OPERATORS.find((o) => o.value === newOperator);

  // ---- Add filter ----
  const handleAddFilter = useCallback(() => {
    if (!newColumnId) return;
    if (currentOperator?.needsValue && !newValue.trim()) return;

    const filter: FilterConfig = {
      columnId: newColumnId,
      operator: newOperator,
      value: newValue.trim(),
      ...(currentOperator?.needsValue2 ? { value2: newValue2.trim() } : {}),
    };

    addFilter(filter);
    setNewValue('');
    setNewValue2('');
  }, [newColumnId, newOperator, newValue, newValue2, currentOperator, addFilter]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        handleAddFilter();
      }
    },
    [handleAddFilter],
  );

  // ---- Get column name by id ----
  const getColumnName = useCallback(
    (id: string) => columns.find((c) => c.id === id)?.name ?? id,
    [columns],
  );

  // ---- Get operator label ----
  const getOperatorLabel = useCallback(
    (op: FilterConfig['operator']) => OPERATORS.find((o) => o.value === op)?.label ?? op,
    [],
  );

  return (
    <div className="absolute top-0 right-0 z-40 w-[320px] h-full bg-forge-bg-secondary border-l border-forge-border shadow-xl animate-slide-in-right overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-forge-border/40">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-accent-primary" aria-hidden="true">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <h3 className="text-sm font-semibold text-forge-text">Filters</h3>
          {filters.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-accent-primary/20 text-accent-primary text-[10px] font-bold">
              {filters.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setFilterPanelOpen(false)}
          className="flex items-center justify-center w-6 h-6 rounded text-forge-text-muted hover:text-forge-text hover:bg-forge-bg-tertiary transition-colors"
          aria-label="Close filter panel"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      {/* Active filters as chips */}
      {filters.length > 0 && (
        <div className="px-3 py-2 border-b border-forge-border/20">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-forge-text-muted/60 uppercase tracking-wider">Active Filters</span>
            <button
              type="button"
              onClick={clearFilters}
              className="text-[10px] text-status-error hover:text-status-error/80 transition-colors"
            >
              Clear All
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {filters.map((filter, idx) => (
              <div
                key={idx}
                className="flex items-center gap-1 px-2 py-1 rounded-full bg-accent-primary/10 border border-accent-primary/20 text-[10px] text-forge-text animate-scale-in group"
              >
                <span className="font-semibold text-accent-primary">{getColumnName(filter.columnId)}</span>
                <span className="text-forge-text-muted/60">{getOperatorLabel(filter.operator)}</span>
                {filter.value && (
                  <span className="text-forge-text-secondary max-w-[80px] truncate">
                    &quot;{filter.value}&quot;
                    {filter.value2 && ` - "${filter.value2}"`}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => removeFilter(idx)}
                  className="ml-0.5 flex-shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center bg-forge-bg-tertiary/50 text-forge-text-muted hover:bg-status-error/20 hover:text-status-error transition-colors"
                  aria-label={`Remove filter on ${getColumnName(filter.columnId)}`}
                >
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New filter form */}
      <div className="px-3 py-3 space-y-3">
        <h4 className="text-[10px] text-forge-text-muted/60 uppercase tracking-wider">Add Filter</h4>

        {/* Column selector */}
        <div>
          <label className="block text-[10px] text-forge-text-muted mb-1">Column</label>
          <select
            value={newColumnId}
            onChange={(e) => setNewColumnId(e.target.value)}
            className="w-full h-7 bg-forge-bg border border-forge-border/50 rounded px-2 text-xs text-forge-text outline-none focus:border-accent-primary/50 appearance-none cursor-pointer"
          >
            {columns.map((col) => (
              <option key={col.id} value={col.id}>
                {col.name}
              </option>
            ))}
          </select>
        </div>

        {/* Operator selector */}
        <div>
          <label className="block text-[10px] text-forge-text-muted mb-1">Operator</label>
          <select
            value={newOperator}
            onChange={(e) => setNewOperator(e.target.value as FilterConfig['operator'])}
            className="w-full h-7 bg-forge-bg border border-forge-border/50 rounded px-2 text-xs text-forge-text outline-none focus:border-accent-primary/50 appearance-none cursor-pointer"
          >
            {OPERATORS.map((op) => (
              <option key={op.value} value={op.value}>
                {op.label}
              </option>
            ))}
          </select>
        </div>

        {/* Value input(s) */}
        {currentOperator?.needsValue && (
          <div>
            <label className="block text-[10px] text-forge-text-muted mb-1">
              {currentOperator.needsValue2 ? 'From' : 'Value'}
            </label>
            <input
              type="text"
              value={newValue}
              onChange={(e) => setNewValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={newOperator === 'regex' ? 'Regular expression...' : 'Filter value...'}
              className="w-full h-7 bg-forge-bg border border-forge-border/50 rounded px-2 text-xs text-forge-text outline-none placeholder:text-forge-text-muted/30 focus:border-accent-primary/50 font-mono"
              spellCheck={false}
            />
          </div>
        )}

        {currentOperator?.needsValue2 && (
          <div>
            <label className="block text-[10px] text-forge-text-muted mb-1">To</label>
            <input
              type="text"
              value={newValue2}
              onChange={(e) => setNewValue2(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Upper bound..."
              className="w-full h-7 bg-forge-bg border border-forge-border/50 rounded px-2 text-xs text-forge-text outline-none placeholder:text-forge-text-muted/30 focus:border-accent-primary/50 font-mono"
              spellCheck={false}
            />
          </div>
        )}

        {/* Add button */}
        <button
          type="button"
          onClick={handleAddFilter}
          disabled={!newColumnId || (currentOperator?.needsValue && !newValue.trim())}
          className={[
            'w-full h-8 rounded text-xs font-semibold transition-all duration-150',
            'flex items-center justify-center gap-1.5',
            newColumnId && (!currentOperator?.needsValue || newValue.trim())
              ? 'bg-accent-primary/15 text-accent-primary border border-accent-primary/30 hover:bg-accent-primary/25 active:scale-[0.98]'
              : 'bg-forge-bg-tertiary/30 text-forge-text-muted/30 border border-forge-border/20 cursor-not-allowed',
          ]
            .filter(Boolean)
            .join(' ')}
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Filter
        </button>
      </div>

      {/* Empty state */}
      {filters.length === 0 && (
        <div className="px-3 py-6 text-center">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mx-auto text-forge-text-muted/20 mb-2" aria-hidden="true">
            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
          </svg>
          <p className="text-[11px] text-forge-text-muted/40">No active filters</p>
          <p className="text-[10px] text-forge-text-muted/25 mt-1">Add a filter to narrow down your data</p>
        </div>
      )}
    </div>
  );
};

export default FilterPanel;
