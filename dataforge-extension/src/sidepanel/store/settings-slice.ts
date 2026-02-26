/**
 * Settings state slice.
 *
 * Manages user-configurable settings with auto-persistence to
 * chrome.storage.local. Changes are debounced to avoid excessive writes.
 */

import type { StateCreator } from 'zustand';
import type { Settings } from '../../types/settings';
import { defaultSettings } from '../../types/settings';
import { saveSetting, loadSetting } from '../../utils/storage';
import type { StoreState } from './index';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'dataforge_settings';
const PERSIST_DEBOUNCE_MS = 500;

// ---------------------------------------------------------------------------
// Deep merge utility
// ---------------------------------------------------------------------------

/**
 * Deep-merge `source` into `target`. Only merges plain objects recursively;
 * arrays and primitives are replaced outright.
 */
function deepMerge<T>(target: T, source: DeepPartial<T>): T {
  if (
    target === null ||
    target === undefined ||
    typeof target !== 'object' ||
    Array.isArray(target)
  ) {
    return (source as T) ?? target;
  }

  const result = { ...target } as Record<string, unknown>;
  const src = source as Record<string, unknown>;

  for (const key of Object.keys(src)) {
    const sourceVal = src[key];
    const targetVal = result[key];

    if (
      sourceVal !== null &&
      sourceVal !== undefined &&
      typeof sourceVal === 'object' &&
      !Array.isArray(sourceVal) &&
      targetVal !== null &&
      targetVal !== undefined &&
      typeof targetVal === 'object' &&
      !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(targetVal, sourceVal);
    } else if (sourceVal !== undefined) {
      result[key] = sourceVal;
    }
  }

  return result as T;
}

// ---------------------------------------------------------------------------
// Slice state
// ---------------------------------------------------------------------------

export interface SettingsSlice {
  /** The current settings object. */
  settings: Settings;

  /** Whether settings have been loaded from storage. */
  settingsLoaded: boolean;

  // -- Actions ---------------------------------------------------------------

  /**
   * Deep-merge partial updates into settings.
   * Automatically persists to chrome.storage.local (debounced).
   */
  updateSettings: (partial: DeepPartial<Settings>) => void;

  /**
   * Reset all settings to factory defaults and persist.
   */
  resetSettings: () => void;

  /**
   * Load settings from chrome.storage.local.
   * Called once during store initialization.
   */
  loadSettings: () => Promise<void>;
}

// ---------------------------------------------------------------------------
// DeepPartial helper type
// ---------------------------------------------------------------------------

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ---------------------------------------------------------------------------
// Debounced persistence
// ---------------------------------------------------------------------------

let persistTimeout: ReturnType<typeof setTimeout> | null = null;

function schedulePersist(settings: Settings): void {
  if (persistTimeout !== null) {
    clearTimeout(persistTimeout);
  }
  persistTimeout = setTimeout(() => {
    persistTimeout = null;
    saveSetting(STORAGE_KEY, settings).catch((err) => {
      console.error('[DataForge] Failed to persist settings:', err);
    });
  }, PERSIST_DEBOUNCE_MS);
}

// ---------------------------------------------------------------------------
// Slice creator
// ---------------------------------------------------------------------------

export const createSettingsSlice: StateCreator<
  StoreState,
  [['zustand/devtools', never]],
  [],
  SettingsSlice
> = (set, get) => ({
  // -- State -----------------------------------------------------------------
  settings: { ...defaultSettings },
  settingsLoaded: false,

  // -- Actions ---------------------------------------------------------------

  updateSettings: (partial) => {
    const current = get().settings;
    const merged = deepMerge(current, partial as Partial<Settings>);

    set({ settings: merged }, false, 'settings/updateSettings');
    schedulePersist(merged);
  },

  resetSettings: () => {
    const defaults = { ...defaultSettings };
    set(
      { settings: defaults },
      false,
      'settings/resetSettings',
    );
    schedulePersist(defaults);
  },

  loadSettings: async () => {
    try {
      const stored = await loadSetting<Settings | null>(STORAGE_KEY, null);
      if (stored) {
        // Deep merge stored settings with defaults to handle schema migrations
        // (new keys get default values, removed keys are ignored)
        const merged = deepMerge(defaultSettings, stored as Partial<Settings>);
        set({ settings: merged, settingsLoaded: true }, false, 'settings/loadSettings');
      } else {
        set({ settingsLoaded: true }, false, 'settings/loadSettings:defaults');
      }
    } catch (err) {
      console.error('[DataForge] Failed to load settings:', err);
      // Continue with defaults — don't block the app
      set({ settingsLoaded: true }, false, 'settings/loadSettings:error');
    }
  },
});
