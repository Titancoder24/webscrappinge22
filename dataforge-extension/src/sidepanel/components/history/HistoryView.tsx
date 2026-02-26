/**
 * HistoryView - Main history list view.
 *
 * Layout:
 *  1. HistorySearch bar at the top
 *  2. Chronological list of HistoryItem cards
 *  3. Empty state illustration when no extractions exist
 *  4. Clear all button in header when items exist
 */

import React, { useCallback, useMemo } from 'react';
import { useHistory } from '../../hooks/useHistory';
import { useAnimations } from '../../hooks/useAnimations';
import { useStore } from '../../store';
import type { HistoryItem as HistoryItemType } from '../../store/history-slice';
import HistorySearch from './HistorySearch';
import HistoryItem from './HistoryItem';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const HistoryView: React.FC = () => {
  const {
    filteredHistory,
    isLoading,
    searchQuery,
    searchHistory,
    removeFromHistory,
    clearAllHistory,
  } = useHistory();

  const { shouldAnimate, staggerDelay } = useAnimations();
  const setTab = useStore((s) => s.setTab);
  const setActiveTable = useStore((s) => s.setActiveTable);

  // ---- View a history item (open its data table) ----
  const handleView = useCallback(
    (item: HistoryItemType) => {
      if (item.tableId) {
        setActiveTable(item.tableId);
        setTab('data');
      }
    },
    [setActiveTable, setTab],
  );

  // ---- Delete a history item ----
  const handleDelete = useCallback(
    (id: string) => {
      removeFromHistory(id);
    },
    [removeFromHistory],
  );

  // ---- Clear all ----
  const handleClearAll = useCallback(() => {
    if (window.confirm('Are you sure you want to clear all history? This cannot be undone.')) {
      clearAllHistory();
    }
  }, [clearAllHistory]);

  // ---- Rendered history items ----
  const renderedItems = useMemo(
    () =>
      filteredHistory.map((item, index) => (
        <HistoryItem
          key={item.id}
          item={item}
          onView={handleView}
          onDelete={handleDelete}
          style={shouldAnimate ? staggerDelay(index, 30) : undefined}
          className={shouldAnimate ? 'animate-[staggerFadeInUp_0.35s_ease-out]' : ''}
        />
      )),
    [filteredHistory, handleView, handleDelete, shouldAnimate, staggerDelay],
  );

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 pt-4 pb-2">
        <h2 className="text-sm font-semibold text-forge-text">
          Extraction History
        </h2>
        {filteredHistory.length > 0 && (
          <button
            type="button"
            onClick={handleClearAll}
            className={[
              'text-[11px] font-medium text-forge-text-muted/60',
              'hover:text-status-error transition-colors duration-150',
              'motion-reduce:transition-none',
            ].join(' ')}
          >
            Clear All
          </button>
        )}
      </div>

      {/* Search */}
      <div className="px-4 pb-3">
        <HistorySearch value={searchQuery} onChange={searchHistory} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {isLoading ? (
          /* Loading state */
          <div className="flex flex-col items-center justify-center py-16">
            <svg
              className="animate-spin w-8 h-8 text-accent-primary/50 mb-3"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className="opacity-25"
              />
              <path
                d="M12 2a10 10 0 0 1 10 10"
                stroke="currentColor"
                strokeWidth="3"
                strokeLinecap="round"
                className="opacity-75"
              />
            </svg>
            <p className="text-xs text-forge-text-muted">Loading history...</p>
          </div>
        ) : filteredHistory.length === 0 ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div
              className={[
                'flex items-center justify-center w-16 h-16 rounded-2xl mb-4',
                'bg-forge-bg-tertiary/60 border border-forge-border',
              ].join(' ')}
            >
              <svg
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-forge-text-muted/30"
                aria-hidden="true"
              >
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-forge-text-muted mb-1">
              {searchQuery ? 'No matching extractions' : 'No extractions yet'}
            </h3>
            <p className="text-xs text-forge-text-muted/60 max-w-[200px]">
              {searchQuery
                ? 'Try a different search term or clear the filter.'
                : 'Your extraction history will appear here after your first data extraction.'}
            </p>
          </div>
        ) : (
          /* History items */
          <div className="flex flex-col gap-2">
            {renderedItems}
          </div>
        )}
      </div>
    </div>
  );
};

export default HistoryView;
