/**
 * Extraction state slice.
 *
 * Manages the lifecycle of a data extraction operation:
 * idle → selecting → configuring → running/paused → completed/error
 */

import type { StateCreator } from 'zustand';
import type {
  ExtractionStatus,
  ExtractionConfig,
  ExtractionProgress,
  DetectedPattern,
  Row,
} from '../../types/extraction';
import type { StoreState } from './index';

// ---------------------------------------------------------------------------
// Slice state
// ---------------------------------------------------------------------------

export interface ExtractionSlice {
  /** Current extraction lifecycle status. */
  status: ExtractionStatus;

  /** Active extraction configuration (null when idle). */
  currentConfig: ExtractionConfig | null;

  /** Rows extracted during the current session. */
  extractedRows: Row[];

  /** Live progress metrics. */
  progress: ExtractionProgress;

  /** Patterns detected on the current page. */
  detectedPatterns: DetectedPattern[];

  /** ID of the pattern the user has selected. */
  selectedPatternId: string | null;

  /**
   * Current wizard step.
   * 0 = select pattern, 1 = configure fields, 2 = pagination, 3 = running/results
   */
  activeStep: number;

  // -- Actions ---------------------------------------------------------------

  setStatus: (status: ExtractionStatus) => void;
  setConfig: (config: ExtractionConfig | null) => void;
  addRow: (row: Row) => void;
  addRows: (rows: Row[]) => void;
  setProgress: (progress: Partial<ExtractionProgress>) => void;
  reset: () => void;
  setPatterns: (patterns: DetectedPattern[]) => void;
  selectPattern: (patternId: string | null) => void;
  setStep: (step: number) => void;
  pauseExtraction: () => void;
  resumeExtraction: () => void;
}

// ---------------------------------------------------------------------------
// Initial values
// ---------------------------------------------------------------------------

const initialProgress: ExtractionProgress = {
  items: 0,
  pages: 0,
  elapsed: 0,
  speed: 0,
  errors: 0,
  estimatedRemaining: 0,
};

// ---------------------------------------------------------------------------
// Slice creator
// ---------------------------------------------------------------------------

export const createExtractionSlice: StateCreator<
  StoreState,
  [['zustand/devtools', never]],
  [],
  ExtractionSlice
> = (set) => ({
  // -- State -----------------------------------------------------------------
  status: 'idle',
  currentConfig: null,
  extractedRows: [],
  progress: { ...initialProgress },
  detectedPatterns: [],
  selectedPatternId: null,
  activeStep: 0,

  // -- Actions ---------------------------------------------------------------

  setStatus: (status) =>
    set({ status }, false, 'extraction/setStatus'),

  setConfig: (config) =>
    set({ currentConfig: config }, false, 'extraction/setConfig'),

  addRow: (row) =>
    set(
      (state) => ({ extractedRows: [...state.extractedRows, row] }),
      false,
      'extraction/addRow',
    ),

  addRows: (rows) =>
    set(
      (state) => ({ extractedRows: [...state.extractedRows, ...rows] }),
      false,
      'extraction/addRows',
    ),

  setProgress: (partial) =>
    set(
      (state) => ({
        progress: { ...state.progress, ...partial },
      }),
      false,
      'extraction/setProgress',
    ),

  reset: () =>
    set(
      {
        status: 'idle',
        currentConfig: null,
        extractedRows: [],
        progress: { ...initialProgress },
        detectedPatterns: [],
        selectedPatternId: null,
        activeStep: 0,
      },
      false,
      'extraction/reset',
    ),

  setPatterns: (patterns) =>
    set({ detectedPatterns: patterns }, false, 'extraction/setPatterns'),

  selectPattern: (patternId) =>
    set({ selectedPatternId: patternId }, false, 'extraction/selectPattern'),

  setStep: (step) =>
    set({ activeStep: Math.max(0, Math.min(3, step)) }, false, 'extraction/setStep'),

  pauseExtraction: () =>
    set(
      (state) => ({
        status: state.status === 'running' ? 'paused' : state.status,
      }),
      false,
      'extraction/pause',
    ),

  resumeExtraction: () =>
    set(
      (state) => ({
        status: state.status === 'paused' ? 'running' : state.status,
      }),
      false,
      'extraction/resume',
    ),
});
