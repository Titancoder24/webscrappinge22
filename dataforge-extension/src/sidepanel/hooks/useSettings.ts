/**
 * useSettings - Hook for application settings.
 *
 * Wraps the settings slice of the store with a clean interface.
 * Settings are automatically persisted to chrome.storage.local
 * via the store's built-in debounced persistence.
 */

import { useCallback, useEffect, useMemo } from 'react';
import { useStore } from '../store';
import type { Settings } from '../../types/settings';

// ---------------------------------------------------------------------------
// DeepPartial helper
// ---------------------------------------------------------------------------

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseSettingsReturn {
  /** Current settings object. */
  settings: Settings;
  /** Whether settings have been loaded from storage. */
  isLoading: boolean;

  /** Update settings with a deep partial merge. */
  updateSettings: (partial: DeepPartial<Settings>) => void;
  /** Reset all settings to factory defaults. */
  resetSettings: () => void;
  /** Reload settings from storage. */
  loadSettings: () => Promise<void>;

  /** Convenience getters for commonly accessed settings. */
  animationsEnabled: boolean;
  notificationsEnabled: boolean;
  defaultExportFormat: Settings['export']['defaultFormat'];
  debugMode: boolean;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useSettings(): UseSettingsReturn {
  const store = useStore();

  const {
    settings,
    settingsLoaded,
    updateSettings: storeUpdateSettings,
    resetSettings: storeResetSettings,
    loadSettings: storeLoadSettings,
  } = store;

  // Load settings on mount if not already loaded
  useEffect(() => {
    if (!settingsLoaded) {
      storeLoadSettings();
    }
  }, [settingsLoaded, storeLoadSettings]);

  const updateSettings = useCallback(
    (partial: DeepPartial<Settings>) => {
      storeUpdateSettings(partial);
    },
    [storeUpdateSettings],
  );

  const resetSettings = useCallback(() => {
    storeResetSettings();
  }, [storeResetSettings]);

  const loadSettings = useCallback(async () => {
    await storeLoadSettings();
  }, [storeLoadSettings]);

  return useMemo(
    () => ({
      settings,
      isLoading: !settingsLoaded,
      updateSettings,
      resetSettings,
      loadSettings,
      animationsEnabled: settings.general.animationsEnabled,
      notificationsEnabled: settings.general.notificationsEnabled,
      defaultExportFormat: settings.export.defaultFormat,
      debugMode: settings.advanced.debugMode,
    }),
    [settings, settingsLoaded, updateSettings, resetSettings, loadSettings],
  );
}
