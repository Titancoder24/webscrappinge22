/**
 * History state slice.
 *
 * Tracks extraction history entries so the user can review, re-run,
 * or load past extractions.
 */

import type { StateCreator } from 'zustand';
import type { ToolType } from '../../types/extraction';
import type { StoreState } from './index';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type HistoryStatus = 'completed' | 'partial' | 'error';

export interface HistoryItem {
  id: string;
  /** Display name (e.g. "Amazon Products — Feb 26"). */
  name: string;
  /** Tool used for the extraction. */
  tool: ToolType;
  /** The URL the extraction was performed on. */
  sourceUrl: string;
  /** Number of rows extracted. */
  rowCount: number;
  /** Unix timestamp (ms) when the extraction was created. */
  createdAt: number;
  /** Outcome of the extraction. */
  status: HistoryStatus;
  /** ID of the associated table in IndexedDB (null if deleted). */
  tableId: string | null;
}

// ---------------------------------------------------------------------------
// Slice state
// ---------------------------------------------------------------------------

export interface HistorySlice {
  /** All history items, newest first. */
  history: HistoryItem[];

  /** Current search/filter query over history. */
  historySearchQuery: string;

  // -- Actions ---------------------------------------------------------------

  addHistory: (item: HistoryItem) => void;
  removeHistory: (id: string) => void;
  clearHistory: () => void;
  setHistorySearch: (query: string) => void;

  /** Computed: returns history items matching the current search query. */
  searchHistory: () => HistoryItem[];
}

// ---------------------------------------------------------------------------
// Slice creator
// ---------------------------------------------------------------------------

export const createHistorySlice: StateCreator<
  StoreState,
  [['zustand/devtools', never]],
  [],
  HistorySlice
> = (set, get) => ({
  // -- State -----------------------------------------------------------------
  history: [],
  historySearchQuery: '',

  // -- Actions ---------------------------------------------------------------

  addHistory: (item) =>
    set(
      (state) => ({
        // Prepend new items so the list stays newest-first
        history: [item, ...state.history],
      }),
      false,
      'history/addHistory',
    ),

  removeHistory: (id) =>
    set(
      (state) => ({
        history: state.history.filter((h) => h.id !== id),
      }),
      false,
      'history/removeHistory',
    ),

  clearHistory: () =>
    set({ history: [] }, false, 'history/clearHistory'),

  setHistorySearch: (query) =>
    set({ historySearchQuery: query }, false, 'history/setHistorySearch'),

  searchHistory: () => {
    const { history, historySearchQuery } = get();
    const query = historySearchQuery.trim().toLowerCase();
    if (!query) return history;

    return history.filter(
      (item) =>
        item.name.toLowerCase().includes(query) ||
        item.sourceUrl.toLowerCase().includes(query) ||
        item.tool.toLowerCase().includes(query),
    );
  },
});
