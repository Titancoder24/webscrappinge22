/**
 * Extraction state slice.
 *
 * Manages the lifecycle of a data extraction operation:
 * idle → selecting → configuring → running/paused → completed/error
 *
 * Also manages the List Extractor wizard steps, selector refinement,
 * field mapping, pagination config, speed tracking, and shared UI state
 * (error, scanning) used by multiple tool views and hooks.
 */

import type { StateCreator } from 'zustand';
import type {
  ExtractionStatus,
  ExtractionConfig,
  ExtractionProgress,
  ExtractionSummary,
  DetectedPattern,
  DetectedField,
  PaginationConfig as PaginationConfigType,
  PaginationMode,
  Row,
} from '../../types/extraction';
import type { SelectorPath } from '../../types/selector';
import type { StoreState } from './index';
import { generatePrefixedId } from '../../utils/id';

// ---------------------------------------------------------------------------
// List Extractor step types
// ---------------------------------------------------------------------------

/** List Extractor wizard steps: 0=Select, 1=Columns, 2=Pagination, 3=Run */
export type ListExtractorStep = 0 | 1 | 2 | 3;

export const STEP_LABELS: Record<ListExtractorStep, string> = {
  0: 'Select List',
  1: 'Map Columns',
  2: 'Pagination',
  3: 'Run & Results',
};

// ---------------------------------------------------------------------------
// Speed entry type
// ---------------------------------------------------------------------------

export interface SpeedEntry {
  timestamp: number;
  itemsPerSec: number;
}

// ---------------------------------------------------------------------------
// Default pagination config
// ---------------------------------------------------------------------------

const defaultPaginationConfig: PaginationConfigType = {
  mode: 'auto-scroll',
  maxPages: 50,
  delayMs: 1000,
  confidence: 0,
};

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

  /** Whether a page scan is in progress. */
  isScanning: boolean;

  /** Last error message (shared across tool views). */
  error: string | null;

  /** Summary of the last completed extraction. */
  extractionSummary: ExtractionSummary | null;

  // -- List Extractor wizard state ------------------------------------------

  currentStep: ListExtractorStep;
  completedSteps: Set<ListExtractorStep>;

  // -- Selection mode state -------------------------------------------------

  selectionMode: boolean;
  selectorPath: SelectorPath | null;
  manualSelector: string;
  matchCount: number;

  // -- Field mapping state --------------------------------------------------

  fields: DetectedField[];

  // -- Pagination config state ----------------------------------------------

  detectedPaginationConfigs: PaginationConfigType[];
  selectedPaginationMode: PaginationMode | null;
  paginationConfig: PaginationConfigType;

  // -- Speed tracking -------------------------------------------------------

  speedHistory: SpeedEntry[];

  // -- Aliases --------------------------------------------------------------
  extractionStatus: ExtractionStatus;
  extractionProgress: ExtractionProgress;

  // -- Actions ---------------------------------------------------------------

  setStatus: (status: ExtractionStatus) => void;
  setExtractionStatus: (status: ExtractionStatus) => void;
  setConfig: (config: ExtractionConfig | null) => void;
  addRow: (row: Row) => void;
  addRows: (rows: Row[]) => void;
  addExtractedRows: (rows: Row[]) => void;
  clearExtractedRows: () => void;
  setProgress: (progress: Partial<ExtractionProgress>) => void;
  updateExtractionProgress: (progress: Partial<ExtractionProgress>) => void;
  reset: () => void;
  setPatterns: (patterns: DetectedPattern[]) => void;
  setDetectedPatterns: (patterns: DetectedPattern[]) => void;
  selectPattern: (patternId: string | null) => void;
  setStep: (step: number) => void;
  pauseExtraction: () => void;
  resumeExtraction: () => void;
  setIsScanning: (scanning: boolean) => void;
  setError: (error: string | null) => void;
  setExtractionSummary: (summary: ExtractionSummary) => void;
  buildExtractionConfig: () => ExtractionConfig;
  resetListExtractor: () => void;
  goToStep: (step: ListExtractorStep) => void;
  nextStep: () => void;
  prevStep: () => void;
  markStepCompleted: (step: ListExtractorStep) => void;
  setSelectionMode: (mode: boolean) => void;
  setSelectorPath: (path: SelectorPath | null) => void;
  setManualSelector: (selector: string) => void;
  setMatchCount: (count: number) => void;
  setFields: (fields: DetectedField[]) => void;
  toggleField: (fieldId: string) => void;
  renameField: (fieldId: string, name: string) => void;
  removeField: (fieldId: string) => void;
  reorderFields: (fieldIds: string[]) => void;
  addCustomField: (field: DetectedField) => void;
  setDetectedPaginationConfigs: (configs: PaginationConfigType[]) => void;
  selectPaginationMode: (mode: PaginationMode) => void;
  setPaginationConfig: (config: PaginationConfigType) => void;
  updatePaginationConfig: (partial: Partial<PaginationConfigType>) => void;
  addSpeedEntry: (entry: SpeedEntry) => void;
  clearSpeedHistory: () => void;
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
> = (set, get) => ({
  // -- State -----------------------------------------------------------------
  status: 'idle',
  extractionStatus: 'idle',
  currentConfig: null,
  extractedRows: [],
  progress: { ...initialProgress },
  extractionProgress: { ...initialProgress },
  detectedPatterns: [],
  selectedPatternId: null,
  activeStep: 0,
  isScanning: false,
  error: null,
  extractionSummary: null,
  currentStep: 0 as ListExtractorStep,
  completedSteps: new Set<ListExtractorStep>(),
  selectionMode: false,
  selectorPath: null,
  manualSelector: '',
  matchCount: 0,
  fields: [],
  detectedPaginationConfigs: [],
  selectedPaginationMode: null,
  paginationConfig: { ...defaultPaginationConfig },
  speedHistory: [],

  // -- Actions ---------------------------------------------------------------

  setStatus: (status) =>
    set({ status, extractionStatus: status }, false, 'extraction/setStatus'),

  setExtractionStatus: (status) =>
    set({ status, extractionStatus: status }, false, 'extraction/setStatus'),

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

  addExtractedRows: (rows) =>
    set(
      (state) => ({ extractedRows: [...state.extractedRows, ...rows] }),
      false,
      'extraction/addRows',
    ),

  clearExtractedRows: () =>
    set({ extractedRows: [] }, false, 'extraction/clearRows'),

  setProgress: (partial) =>
    set(
      (state) => {
        const updated = { ...state.progress, ...partial };
        return { progress: updated, extractionProgress: updated };
      },
      false,
      'extraction/setProgress',
    ),

  updateExtractionProgress: (partial) =>
    set(
      (state) => {
        const updated = { ...state.progress, ...partial };
        return { progress: updated, extractionProgress: updated };
      },
      false,
      'extraction/setProgress',
    ),

  reset: () =>
    set(
      {
        status: 'idle',
        extractionStatus: 'idle',
        currentConfig: null,
        extractedRows: [],
        progress: { ...initialProgress },
        extractionProgress: { ...initialProgress },
        detectedPatterns: [],
        selectedPatternId: null,
        activeStep: 0,
        isScanning: false,
        error: null,
        extractionSummary: null,
        currentStep: 0 as ListExtractorStep,
        completedSteps: new Set<ListExtractorStep>(),
        selectionMode: false,
        selectorPath: null,
        manualSelector: '',
        matchCount: 0,
        fields: [],
        detectedPaginationConfigs: [],
        selectedPaginationMode: null,
        paginationConfig: { ...defaultPaginationConfig },
        speedHistory: [],
      },
      false,
      'extraction/reset',
    ),

  setPatterns: (patterns) =>
    set({ detectedPatterns: patterns }, false, 'extraction/setPatterns'),

  setDetectedPatterns: (patterns) =>
    set({ detectedPatterns: patterns }, false, 'extraction/setPatterns'),

  selectPattern: (patternId) => {
    const state = get();
    const pattern = state.detectedPatterns.find((p) => p.id === patternId);
    set(
      {
        selectedPatternId: patternId,
        fields: pattern?.fields ?? state.fields,
      },
      false,
      'extraction/selectPattern',
    );
  },

  setStep: (step) =>
    set({ activeStep: Math.max(0, Math.min(3, step)) }, false, 'extraction/setStep'),

  pauseExtraction: () =>
    set(
      (state) => ({
        status: state.status === 'running' ? 'paused' : state.status,
        extractionStatus: state.status === 'running' ? 'paused' : state.extractionStatus,
      }),
      false,
      'extraction/pause',
    ),

  resumeExtraction: () =>
    set(
      (state) => ({
        status: state.status === 'paused' ? 'running' : state.status,
        extractionStatus: state.status === 'paused' ? 'running' : state.extractionStatus,
      }),
      false,
      'extraction/resume',
    ),

  setIsScanning: (scanning) =>
    set({ isScanning: scanning }, false, 'extraction/setIsScanning'),

  setError: (error) =>
    set({ error }, false, 'extraction/setError'),

  setExtractionSummary: (summary) =>
    set({ extractionSummary: summary }, false, 'extraction/setSummary'),

  buildExtractionConfig: () => {
    const state = get();
    const selectedPattern = state.detectedPatterns.find(
      (p) => p.id === state.selectedPatternId,
    );

    if (state.currentConfig) {
      return state.currentConfig;
    }

    return {
      id: generatePrefixedId('exc'),
      patternSelector: selectedPattern?.selector ?? state.manualSelector,
      fields: state.fields.filter((f) => f.enabled),
      pagination: { ...state.paginationConfig },
      maxItems: state.settings.extraction.defaultMaxItems,
      maxPages: state.paginationConfig.maxPages,
      delayBetweenPages: state.paginationConfig.delayMs,
    };
  },

  resetListExtractor: () =>
    set(
      {
        status: 'idle',
        extractionStatus: 'idle',
        currentConfig: null,
        extractedRows: [],
        progress: { ...initialProgress },
        extractionProgress: { ...initialProgress },
        detectedPatterns: [],
        selectedPatternId: null,
        activeStep: 0,
        isScanning: false,
        error: null,
        extractionSummary: null,
        currentStep: 0 as ListExtractorStep,
        completedSteps: new Set<ListExtractorStep>(),
        selectionMode: false,
        selectorPath: null,
        manualSelector: '',
        matchCount: 0,
        fields: [],
        detectedPaginationConfigs: [],
        selectedPaginationMode: null,
        paginationConfig: { ...defaultPaginationConfig },
        speedHistory: [],
      },
      false,
      'extraction/resetListExtractor',
    ),

  // -- Wizard step navigation -----------------------------------------------

  goToStep: (step) =>
    set({ currentStep: step, activeStep: step }, false, 'extraction/goToStep'),

  nextStep: () =>
    set(
      (state) => {
        const next = Math.min(3, state.currentStep + 1) as ListExtractorStep;
        return { currentStep: next, activeStep: next };
      },
      false,
      'extraction/nextStep',
    ),

  prevStep: () =>
    set(
      (state) => {
        const prev = Math.max(0, state.currentStep - 1) as ListExtractorStep;
        return { currentStep: prev, activeStep: prev };
      },
      false,
      'extraction/prevStep',
    ),

  markStepCompleted: (step) =>
    set(
      (state) => {
        const next = new Set(state.completedSteps);
        next.add(step);
        return { completedSteps: next };
      },
      false,
      'extraction/markStepCompleted',
    ),

  // -- Selection mode actions -----------------------------------------------

  setSelectionMode: (mode) =>
    set({ selectionMode: mode }, false, 'extraction/setSelectionMode'),

  setSelectorPath: (path) =>
    set({ selectorPath: path }, false, 'extraction/setSelectorPath'),

  setManualSelector: (selector) =>
    set({ manualSelector: selector }, false, 'extraction/setManualSelector'),

  setMatchCount: (count) =>
    set({ matchCount: count }, false, 'extraction/setMatchCount'),

  // -- Field mapping actions ------------------------------------------------

  setFields: (fields) =>
    set({ fields }, false, 'extraction/setFields'),

  toggleField: (fieldId) =>
    set(
      (state) => ({
        fields: state.fields.map((f) =>
          f.id === fieldId ? { ...f, enabled: !f.enabled } : f,
        ),
      }),
      false,
      'extraction/toggleField',
    ),

  renameField: (fieldId, name) =>
    set(
      (state) => ({
        fields: state.fields.map((f) =>
          f.id === fieldId ? { ...f, name } : f,
        ),
      }),
      false,
      'extraction/renameField',
    ),

  removeField: (fieldId) =>
    set(
      (state) => ({
        fields: state.fields.filter((f) => f.id !== fieldId),
      }),
      false,
      'extraction/removeField',
    ),

  reorderFields: (fieldIds) =>
    set(
      (state) => {
        const fieldMap = new Map(state.fields.map((f) => [f.id, f]));
        const reordered: DetectedField[] = [];
        for (const id of fieldIds) {
          const field = fieldMap.get(id);
          if (field) reordered.push(field);
        }
        for (const field of state.fields) {
          if (!fieldIds.includes(field.id)) {
            reordered.push(field);
          }
        }
        return { fields: reordered };
      },
      false,
      'extraction/reorderFields',
    ),

  addCustomField: (field) =>
    set(
      (state) => ({
        fields: [...state.fields, field],
      }),
      false,
      'extraction/addCustomField',
    ),

  // -- Pagination actions ---------------------------------------------------

  setDetectedPaginationConfigs: (configs) =>
    set({ detectedPaginationConfigs: configs }, false, 'extraction/setDetectedPaginationConfigs'),

  selectPaginationMode: (mode) =>
    set(
      (state) => ({
        selectedPaginationMode: mode,
        paginationConfig: { ...state.paginationConfig, mode },
      }),
      false,
      'extraction/selectPaginationMode',
    ),

  setPaginationConfig: (config) =>
    set({ paginationConfig: config }, false, 'extraction/setPaginationConfig'),

  updatePaginationConfig: (partial) =>
    set(
      (state) => ({
        paginationConfig: { ...state.paginationConfig, ...partial },
      }),
      false,
      'extraction/updatePaginationConfig',
    ),

  // -- Speed tracking actions -----------------------------------------------

  addSpeedEntry: (entry) =>
    set(
      (state) => ({
        speedHistory: [...state.speedHistory.slice(-59), entry],
      }),
      false,
      'extraction/addSpeedEntry',
    ),

  clearSpeedHistory: () =>
    set({ speedHistory: [] }, false, 'extraction/clearSpeedHistory'),
});
