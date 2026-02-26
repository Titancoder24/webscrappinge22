/**
 * useSelector - Hook for CSS selector testing and visual selection mode.
 *
 * Communicates with the content script to:
 *  - Test a CSS selector and report match count + sample values
 *  - Activate/deactivate visual element selection mode
 *  - Listen for element click events from the content script
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { useChromeMessages } from './useChromeMessages';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseSelectorReturn {
  /** Number of elements matching the current selector. */
  matchCount: number;
  /** Sample values from matched elements. */
  sampleValues: string[];
  /** Whether the visual selection mode is active. */
  isSelecting: boolean;
  /** The selector chosen by the user (via click or manual entry). */
  selectedSelector: string | null;
  /** Whether a test is currently in progress. */
  isTesting: boolean;

  /** Test a CSS selector against the current page. */
  testSelector: (selector: string) => Promise<{ matchCount: number; sampleValues: string[] }>;
  /** Activate visual element picker on the page. */
  activateSelectionMode: () => Promise<void>;
  /** Deactivate visual element picker. */
  deactivateSelectionMode: () => Promise<void>;
  /** Clear the selected selector. */
  clearSelection: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSelector(): UseSelectorReturn {
  const [matchCount, setMatchCount] = useState(0);
  const [sampleValues, setSampleValues] = useState<string[]>([]);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectedSelector, setSelectedSelector] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  const { sendToActiveTab, on } = useChromeMessages();

  // Listen for element click events from content script
  useEffect(() => {
    const unsub = on('ELEMENT_CLICKED', (msg) => {
      if (msg.type === 'ELEMENT_CLICKED') {
        setSelectedSelector(msg.selector);
        setIsSelecting(false);
      }
    });

    return unsub;
  }, [on]);

  // Listen for selector test results (from async tests)
  useEffect(() => {
    const unsub = on('SELECTOR_TEST_RESULT', (msg) => {
      if (msg.type === 'SELECTOR_TEST_RESULT') {
        setMatchCount(msg.matchCount);
        setSampleValues(msg.sampleValues);
        setIsTesting(false);
      }
    });

    return unsub;
  }, [on]);

  // ---- Test selector ----
  const testSelector = useCallback(
    async (selector: string): Promise<{ matchCount: number; sampleValues: string[] }> => {
      if (!selector.trim()) {
        setMatchCount(0);
        setSampleValues([]);
        return { matchCount: 0, sampleValues: [] };
      }

      try {
        setIsTesting(true);
        const response = await sendToActiveTab({ type: 'TEST_SELECTOR', selector });

        if (response && response.type === 'SELECTOR_TEST_RESULT') {
          setMatchCount(response.matchCount);
          setSampleValues(response.sampleValues);
          setIsTesting(false);
          return {
            matchCount: response.matchCount,
            sampleValues: response.sampleValues,
          };
        }

        setIsTesting(false);
        return { matchCount: 0, sampleValues: [] };
      } catch (err) {
        setIsTesting(false);
        console.error('[DataForge] Selector test failed:', err);
        return { matchCount: 0, sampleValues: [] };
      }
    },
    [sendToActiveTab],
  );

  // ---- Activate selection mode ----
  const activateSelectionMode = useCallback(async (): Promise<void> => {
    try {
      setIsSelecting(true);
      await sendToActiveTab({ type: 'ACTIVATE_SELECTION_MODE', tool: 'selector' });
    } catch (err) {
      setIsSelecting(false);
      console.error('[DataForge] Failed to activate selection mode:', err);
    }
  }, [sendToActiveTab]);

  // ---- Deactivate selection mode ----
  const deactivateSelectionMode = useCallback(async (): Promise<void> => {
    try {
      setIsSelecting(false);
      await sendToActiveTab({ type: 'DEACTIVATE_SELECTION_MODE' });
    } catch (err) {
      console.error('[DataForge] Failed to deactivate selection mode:', err);
    }
  }, [sendToActiveTab]);

  // ---- Clear selection ----
  const clearSelection = useCallback(() => {
    setSelectedSelector(null);
    setMatchCount(0);
    setSampleValues([]);
  }, []);

  return {
    matchCount,
    sampleValues,
    isSelecting,
    selectedSelector,
    isTesting,
    testSelector,
    activateSelectionMode,
    deactivateSelectionMode,
    clearSelection,
  };
}
