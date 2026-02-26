/**
 * usePagination - Hook for pagination detection and configuration.
 *
 * Sends DETECT_PAGINATION to the content script, receives back an
 * array of possible pagination configurations, and allows the user
 * to select one.
 */

import { useState, useCallback } from 'react';
import { useStore } from '../store';
import { useChromeMessages } from './useChromeMessages';
import type { PaginationConfig, PaginationMode } from '../../types/extraction';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UsePaginationReturn {
  /** Detected pagination configurations from the page. */
  paginationConfigs: PaginationConfig[];
  /** The currently selected pagination mode. */
  selectedMode: PaginationMode | null;
  /** Whether detection is in progress. */
  isDetecting: boolean;
  /** Current pagination config (selected or default). */
  currentConfig: PaginationConfig;

  /** Detect pagination options on the current page. */
  detectPagination: () => Promise<PaginationConfig[]>;
  /** Select a pagination mode. */
  selectMode: (mode: PaginationMode) => void;
  /** Update the current pagination config. */
  updateConfig: (partial: Partial<PaginationConfig>) => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function usePagination(): UsePaginationReturn {
  const [isDetecting, setIsDetecting] = useState(false);

  const store = useStore();
  const { sendToActiveTab } = useChromeMessages();

  const {
    detectedPaginationConfigs: paginationConfigs,
    selectedPaginationMode: selectedMode,
    paginationConfig: currentConfig,
    setDetectedPaginationConfigs,
    selectPaginationMode,
    updatePaginationConfig,
  } = store;

  // ---- Detect pagination ----
  const detectPagination = useCallback(async (): Promise<PaginationConfig[]> => {
    try {
      setIsDetecting(true);
      const response = await sendToActiveTab({ type: 'DETECT_PAGINATION' });

      if (response && response.type === 'PAGINATION_RESULT') {
        setDetectedPaginationConfigs(response.configs);
        setIsDetecting(false);
        return response.configs;
      }

      setIsDetecting(false);
      return [];
    } catch (err) {
      setIsDetecting(false);
      console.error('[DataForge] Pagination detection failed:', err);
      return [];
    }
  }, [sendToActiveTab, setDetectedPaginationConfigs]);

  // ---- Select mode ----
  const selectMode = useCallback(
    (mode: PaginationMode) => {
      selectPaginationMode(mode);
    },
    [selectPaginationMode],
  );

  // ---- Update config ----
  const updateConfig = useCallback(
    (partial: Partial<PaginationConfig>) => {
      updatePaginationConfig(partial);
    },
    [updatePaginationConfig],
  );

  return {
    paginationConfigs,
    selectedMode,
    isDetecting,
    currentConfig,
    detectPagination,
    selectMode,
    updateConfig,
  };
}
