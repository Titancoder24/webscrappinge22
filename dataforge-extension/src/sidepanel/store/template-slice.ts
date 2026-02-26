/**
 * Template state slice.
 *
 * Manages saved extraction templates that can be re-applied to
 * matching pages for one-click repeat extractions.
 */

import type { StateCreator } from 'zustand';
import type { Template } from '../../types/template';
import type { StoreState } from './index';

// ---------------------------------------------------------------------------
// Slice state
// ---------------------------------------------------------------------------

export interface TemplateSlice {
  /** All saved extraction templates. */
  templates: Template[];

  // -- Actions ---------------------------------------------------------------

  addTemplate: (template: Template) => void;
  updateTemplate: (id: string, updates: Partial<Omit<Template, 'id'>>) => void;
  removeTemplate: (id: string) => void;
  setTemplates: (templates: Template[]) => void;

  /**
   * Apply a template by ID — sets the extraction config from the template
   * and updates the template's usage statistics.
   * Returns the template if found, null otherwise.
   */
  applyTemplate: (id: string) => Template | null;
}

// ---------------------------------------------------------------------------
// Slice creator
// ---------------------------------------------------------------------------

export const createTemplateSlice: StateCreator<
  StoreState,
  [['zustand/devtools', never]],
  [],
  TemplateSlice
> = (set, get) => ({
  // -- State -----------------------------------------------------------------
  templates: [],

  // -- Actions ---------------------------------------------------------------

  addTemplate: (template) =>
    set(
      (state) => ({
        templates: [...state.templates, template],
      }),
      false,
      'template/addTemplate',
    ),

  updateTemplate: (id, updates) =>
    set(
      (state) => ({
        templates: state.templates.map((t) =>
          t.id === id
            ? { ...t, ...updates, updatedAt: Date.now() }
            : t,
        ),
      }),
      false,
      'template/updateTemplate',
    ),

  removeTemplate: (id) =>
    set(
      (state) => ({
        templates: state.templates.filter((t) => t.id !== id),
      }),
      false,
      'template/removeTemplate',
    ),

  setTemplates: (templates) =>
    set({ templates }, false, 'template/setTemplates'),

  applyTemplate: (id) => {
    const state = get();
    const template = state.templates.find((t) => t.id === id);
    if (!template) return null;

    const now = Date.now();

    // Update extraction state from template config
    set(
      {
        currentConfig: { ...template.config },
        status: 'configuring' as const,
        activeStep: 1,
      },
      false,
      'template/applyTemplate',
    );

    // Bump usage stats on the template
    set(
      (s) => ({
        templates: s.templates.map((t) =>
          t.id === id
            ? { ...t, lastUsed: now, useCount: t.useCount + 1 }
            : t,
        ),
      }),
      false,
      'template/applyTemplate:updateStats',
    );

    return template;
  },
});
