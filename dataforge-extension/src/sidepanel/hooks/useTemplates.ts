/**
 * useTemplates - Hook for extraction template operations.
 *
 * Templates are saved extraction configurations that can be re-applied
 * to matching pages. This hook manages CRUD operations and persistence.
 */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { useStore } from '../store';
import type { Template } from '../../types/template';
import { saveSetting, loadSetting } from '../../utils/storage';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TEMPLATES_STORAGE_KEY = 'dataforge_templates';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface UseTemplatesReturn {
  /** All saved templates. */
  templates: Template[];
  /** Whether templates are currently being loaded. */
  isLoading: boolean;

  /** Load templates from persistent storage. */
  loadTemplates: () => Promise<void>;
  /** Save a new template. */
  saveTemplate: (template: Template) => Promise<void>;
  /** Update an existing template. */
  updateTemplate: (id: string, updates: Partial<Omit<Template, 'id'>>) => Promise<void>;
  /** Delete a template by ID. */
  deleteTemplate: (id: string) => Promise<void>;
  /** Apply a template's config and attempt to use it on the current page. */
  applyTemplate: (id: string) => Template | null;
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useTemplates(): UseTemplatesReturn {
  const [isLoading, setIsLoading] = useState(false);

  const store = useStore();
  const {
    templates,
    addTemplate,
    updateTemplate: storeUpdateTemplate,
    removeTemplate,
    setTemplates,
    applyTemplate: storeApplyTemplate,
  } = store;

  // ---- Persist templates to storage ----
  const persistTemplates = useCallback(async (items: Template[]) => {
    try {
      await saveSetting(TEMPLATES_STORAGE_KEY, items);
    } catch (err) {
      console.error('[DataForge] Failed to persist templates:', err);
    }
  }, []);

  // ---- Load templates from storage ----
  const loadTemplates = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      const stored = await loadSetting<Template[] | null>(TEMPLATES_STORAGE_KEY, null);
      if (stored && Array.isArray(stored)) {
        setTemplates(stored);
      }
    } catch (err) {
      console.error('[DataForge] Failed to load templates:', err);
    } finally {
      setIsLoading(false);
    }
  }, [setTemplates]);

  // ---- Save template ----
  const saveTemplate = useCallback(
    async (template: Template): Promise<void> => {
      addTemplate(template);
      await persistTemplates([...templates, template]);
    },
    [addTemplate, templates, persistTemplates],
  );

  // ---- Update template ----
  const updateTemplate = useCallback(
    async (id: string, updates: Partial<Omit<Template, 'id'>>): Promise<void> => {
      storeUpdateTemplate(id, updates);
      const updated = templates.map((t) =>
        t.id === id ? { ...t, ...updates, updatedAt: Date.now() } : t,
      );
      await persistTemplates(updated);
    },
    [storeUpdateTemplate, templates, persistTemplates],
  );

  // ---- Delete template ----
  const deleteTemplate = useCallback(
    async (id: string): Promise<void> => {
      removeTemplate(id);
      const updated = templates.filter((t) => t.id !== id);
      await persistTemplates(updated);
    },
    [removeTemplate, templates, persistTemplates],
  );

  // ---- Apply template ----
  const applyTemplate = useCallback(
    (id: string): Template | null => {
      return storeApplyTemplate(id);
    },
    [storeApplyTemplate],
  );

  // ---- Load on mount ----
  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  return useMemo(
    () => ({
      templates,
      isLoading,
      loadTemplates,
      saveTemplate,
      updateTemplate,
      deleteTemplate,
      applyTemplate,
    }),
    [templates, isLoading, loadTemplates, saveTemplate, updateTemplate, deleteTemplate, applyTemplate],
  );
}
