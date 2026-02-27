/**
 * Main Zustand store for DataForge side panel.
 *
 * Combines all state slices into a single store using the Zustand
 * slices pattern. Devtools middleware is enabled when `advanced.debugMode`
 * is true (or during development).
 *
 * Usage:
 *   import { useStore } from './store';
 *   const status = useStore((s) => s.status);
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

import { createExtractionSlice, type ExtractionSlice } from './extraction-slice';
import { createTableSlice, type TableSlice } from './table-slice';
import { createUISlice, type UISlice } from './ui-slice';
import { createHistorySlice, type HistorySlice } from './history-slice';
import { createTemplateSlice, type TemplateSlice } from './template-slice';
import { createSettingsSlice, type SettingsSlice } from './settings-slice';

// ---------------------------------------------------------------------------
// Combined store type
// ---------------------------------------------------------------------------

export type StoreState =
  & ExtractionSlice
  & TableSlice
  & UISlice
  & HistorySlice
  & TemplateSlice
  & SettingsSlice;

// ---------------------------------------------------------------------------
// Debug mode detection
// ---------------------------------------------------------------------------

/**
 * Returns true when devtools should be enabled.
 * Enabled during development builds or when user has debugMode on.
 */
function isDebugMode(): boolean {
  try {
    // Vite injects import.meta.env.MODE at build time.
    // Access via bracket notation to avoid TS errors when vite/client types
    // are not referenced in tsconfig.
    const meta = import.meta as unknown as Record<string, unknown>;
    const env = meta['env'] as Record<string, unknown> | undefined;
    if (env?.['MODE'] === 'development') {
      return true;
    }
  } catch {
    // import.meta may not be available in all contexts
  }
  return false;
}

// ---------------------------------------------------------------------------
// Store creation
// ---------------------------------------------------------------------------

export const useStore = create<StoreState>()(
  devtools(
    (...a) => ({
      ...createExtractionSlice(...a),
      ...createTableSlice(...a),
      ...createUISlice(...a),
      ...createHistorySlice(...a),
      ...createTemplateSlice(...a),
      ...createSettingsSlice(...a),
    }),
    {
      name: 'DataForge',
      enabled: isDebugMode(),
    },
  ),
);

// ---------------------------------------------------------------------------
// Store initialization
// ---------------------------------------------------------------------------

/**
 * Initialize the store by loading persisted state.
 * Call this once when the side panel mounts.
 */
export async function initializeStore(): Promise<void> {
  const { loadSettings } = useStore.getState();
  await loadSettings();
}

// ---------------------------------------------------------------------------
// Re-exports for convenience
// ---------------------------------------------------------------------------

export type { ExtractionSlice, ListExtractorStep, SpeedEntry } from './extraction-slice';
export { STEP_LABELS } from './extraction-slice';
export type { TableSlice } from './table-slice';
export type { UISlice, NavigationTab, Toast, ModalState } from './ui-slice';
export type { HistorySlice, HistoryItem, HistoryStatus } from './history-slice';
export type { TemplateSlice } from './template-slice';
export type { SettingsSlice } from './settings-slice';
