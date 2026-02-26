/**
 * useExtraction - Hook managing the full extraction workflow.
 *
 * Wraps store actions and Chrome messaging into a single ergonomic API.
 * Handles:
 *  - Page scanning (SCAN_PAGE) and pattern detection
 *  - Pattern selection (SELECT_PATTERN)
 *  - Extraction start / pause / resume / stop
 *  - Real-time progress and row ingestion via message listeners
 */

import { useCallback, useEffect, useRef } from 'react';
import { useStore } from '../store';
import { useChromeMessages } from './useChromeMessages';
import type { Message } from '../../types/messages';
import type { ExtractionConfig, DetectedPattern, ExtractionProgress, Row } from '../../types/extraction';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseExtractionReturn {
  /** Current extraction status. */
  status: ReturnType<typeof useStore>['extractionStatus'];
  /** Live progress metrics. */
  progress: ReturnType<typeof useStore>['extractionProgress'];
  /** Detected patterns from the last scan. */
  patterns: DetectedPattern[];
  /** Extracted rows so far. */
  extractedRows: Row[];
  /** Whether a scan is currently in progress. */
  isScanning: boolean;
  /** Last error message. */
  error: string | null;

  /** Scan the current page for extractable patterns. */
  startScan: () => Promise<DetectedPattern[]>;
  /** Select a detected pattern by ID. */
  selectPattern: (patternId: string) => void;
  /** Start extraction with the current configuration. */
  startExtraction: (config?: ExtractionConfig) => Promise<void>;
  /** Pause a running extraction. */
  pause: () => Promise<void>;
  /** Resume a paused extraction. */
  resume: () => Promise<void>;
  /** Stop the extraction entirely. */
  stop: () => Promise<void>;
  /** Reset extraction state to idle. */
  reset: () => void;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useExtraction(): UseExtractionReturn {
  const store = useStore();
  const { sendToActiveTab, on } = useChromeMessages();
  const cleanupRef = useRef<Array<() => void>>([]);

  const {
    extractionStatus: status,
    extractionProgress: progress,
    detectedPatterns: patterns,
    extractedRows,
    isScanning,
    error,
    setIsScanning,
    setDetectedPatterns,
    selectPattern: storeSelectPattern,
    setExtractionStatus,
    updateExtractionProgress,
    addExtractedRows,
    clearExtractedRows,
    setExtractionSummary,
    setError,
    buildExtractionConfig,
    resetListExtractor,
  } = store;

  // ---- Set up message listeners for extraction events ----
  useEffect(() => {
    const unsubs: Array<() => void> = [];

    unsubs.push(
      on('EXTRACTION_PROGRESS', (msg) => {
        if (msg.type === 'EXTRACTION_PROGRESS') {
          updateExtractionProgress(msg.data);
        }
      }),
    );

    unsubs.push(
      on('EXTRACTION_ROW', (msg) => {
        if (msg.type === 'EXTRACTION_ROW') {
          addExtractedRows([msg.row]);
        }
      }),
    );

    unsubs.push(
      on('EXTRACTION_BATCH', (msg) => {
        if (msg.type === 'EXTRACTION_BATCH') {
          addExtractedRows(msg.rows);
        }
      }),
    );

    unsubs.push(
      on('EXTRACTION_COMPLETE', (msg) => {
        if (msg.type === 'EXTRACTION_COMPLETE') {
          setExtractionStatus('completed');
          setExtractionSummary(msg.summary);
        }
      }),
    );

    unsubs.push(
      on('EXTRACTION_ERROR', (msg) => {
        if (msg.type === 'EXTRACTION_ERROR') {
          setExtractionStatus('error');
          setError(msg.error);
        }
      }),
    );

    cleanupRef.current = unsubs;

    return () => {
      for (const unsub of unsubs) {
        unsub();
      }
    };
  }, [on, updateExtractionProgress, addExtractedRows, setExtractionStatus, setExtractionSummary, setError]);

  // ---- Scan page ----
  const startScan = useCallback(async (): Promise<DetectedPattern[]> => {
    try {
      setIsScanning(true);
      setError(null);

      const response = await sendToActiveTab({ type: 'SCAN_PAGE' });

      if (response && response.type === 'SCAN_RESULT') {
        setDetectedPatterns(response.patterns);
        setIsScanning(false);
        return response.patterns;
      }

      setIsScanning(false);
      return [];
    } catch (err) {
      setIsScanning(false);
      const message = err instanceof Error ? err.message : 'Failed to scan page';
      setError(message);
      return [];
    }
  }, [sendToActiveTab, setIsScanning, setDetectedPatterns, setError]);

  // ---- Select pattern ----
  const selectPattern = useCallback(
    (patternId: string) => {
      storeSelectPattern(patternId);
      sendToActiveTab({ type: 'SELECT_PATTERN', patternId }).catch((err) => {
        console.error('[DataForge] Failed to select pattern:', err);
      });
    },
    [storeSelectPattern, sendToActiveTab],
  );

  // ---- Start extraction ----
  const startExtraction = useCallback(
    async (config?: ExtractionConfig): Promise<void> => {
      try {
        setError(null);
        clearExtractedRows();

        const extractionConfig = config ?? buildExtractionConfig();
        setExtractionStatus('running');

        await sendToActiveTab({
          type: 'START_EXTRACTION',
          config: extractionConfig,
        });
      } catch (err) {
        setExtractionStatus('error');
        const message = err instanceof Error ? err.message : 'Failed to start extraction';
        setError(message);
      }
    },
    [sendToActiveTab, setExtractionStatus, setError, clearExtractedRows, buildExtractionConfig],
  );

  // ---- Pause ----
  const pause = useCallback(async (): Promise<void> => {
    try {
      setExtractionStatus('paused');
      await sendToActiveTab({ type: 'PAUSE_EXTRACTION' });
    } catch (err) {
      console.error('[DataForge] Failed to pause extraction:', err);
    }
  }, [sendToActiveTab, setExtractionStatus]);

  // ---- Resume ----
  const resume = useCallback(async (): Promise<void> => {
    try {
      setExtractionStatus('running');
      await sendToActiveTab({ type: 'RESUME_EXTRACTION' });
    } catch (err) {
      console.error('[DataForge] Failed to resume extraction:', err);
    }
  }, [sendToActiveTab, setExtractionStatus]);

  // ---- Stop ----
  const stop = useCallback(async (): Promise<void> => {
    try {
      setExtractionStatus('completed');
      await sendToActiveTab({ type: 'STOP_EXTRACTION' });
    } catch (err) {
      console.error('[DataForge] Failed to stop extraction:', err);
    }
  }, [sendToActiveTab, setExtractionStatus]);

  // ---- Reset ----
  const reset = useCallback(() => {
    resetListExtractor();
  }, [resetListExtractor]);

  return {
    status,
    progress,
    patterns,
    extractedRows,
    isScanning,
    error,
    startScan,
    selectPattern,
    startExtraction,
    pause,
    resume,
    stop,
    reset,
  };
}
