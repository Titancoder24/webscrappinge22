/**
 * useHistory - Hook for extraction history operations.
 *
 * Manages loading, adding, removing, and searching history items.
 * History is persisted to IndexedDB via the storage layer and
 * kept in the Zustand store for reactive UI updates.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useStore } from '../store';
import type { HistoryItem } from '../store/history-slice';
import { saveSetting, loadSetting } from '../../utils/storage';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const HISTORY_STORAGE_KEY = 'dataforge_history';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseHistoryReturn {
  /** All history items (newest first). */
  history: HistoryItem[];
  /** Whether history is currently being loaded. */
  isLoading: boolean;
  /** Filtered history items based on current search query. */
  filteredHistory: HistoryItem[];
  /** Current search query. */
  searchQuery: string;

  /** Load history from persistent storage. */
  loadHistory: () => Promise<void>;
  /** Add a new item to history and persist. */
  addToHistory: (item: HistoryItem) => Promise<void>;
  /** Remove an item from history and persist. */
  removeFromHistory: (id: string) => Promise<void>;
  /** Clear all history. */
  clearAllHistory: () => Promise<void>;
  /** Update the search query for filtering. */
  searchHistory: (query: string) => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useHistory(): UseHistoryReturn {
  const [isLoading, setIsLoading] = useState(false);

  const store = useStore();
  const {
    history,
    historySearchQuery: searchQuery,
    addHistory,
    removeHistory,
    clearHistory,
    setHistorySearch,
    searchHistory: getFilteredHistory,
  } = store;

  // ---- Load history from storage ----
  const loadHistory = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const stored = await loadSetting<HistoryItem[] | null>(HISTORY_STORAGE_KEY, null);
      if (stored && Array.isArray(stored)) {
        // Clear existing and reload. Since store only has addHistory (prepend),
        // we use a workaround: clear then add in reverse order to maintain order.
        clearHistory();
        // Add in reverse so newest ends up first after prepending
        for (let i = stored.length - 1; i >= 0; i--) {
          addHistory(stored[i]);
        }
      }
    } catch (err) {
      console.error('[DataForge] Failed to load history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [addHistory, clearHistory]);

  // ---- Persist current history to storage ----
  const persistHistory = useCallback(async (items: HistoryItem[]) => {
    try {
      await saveSetting(HISTORY_STORAGE_KEY, items);
    } catch (err) {
      console.error('[DataForge] Failed to persist history:', err);
    }
  }, []);

  // ---- Add to history ----
  const addToHistory = useCallback(
    async (item: HistoryItem): Promise<void> => {
      addHistory(item);
      // Persist the updated list (with the new item prepended)
      await persistHistory([item, ...history]);
    },
    [addHistory, history, persistHistory],
  );

  // ---- Remove from history ----
  const removeFromHistory = useCallback(
    async (id: string): Promise<void> => {
      removeHistory(id);
      const updated = history.filter((h) => h.id !== id);
      await persistHistory(updated);
    },
    [removeHistory, history, persistHistory],
  );

  // ---- Clear all history ----
  const clearAllHistory = useCallback(async (): Promise<void> => {
    clearHistory();
    await persistHistory([]);
  }, [clearHistory, persistHistory]);

  // ---- Search ----
  const searchHistoryFn = useCallback(
    (query: string) => {
      setHistorySearch(query);
    },
    [setHistorySearch],
  );

  // ---- Compute filtered history ----
  const filteredHistory = useMemo(() => {
    return getFilteredHistory();
  }, [getFilteredHistory, searchQuery, history]);

  // ---- Load on mount ----
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  return {
    history,
    isLoading,
    filteredHistory,
    searchQuery,
    loadHistory,
    addToHistory,
    removeFromHistory,
    clearAllHistory,
    searchHistory: searchHistoryFn,
  };
}
