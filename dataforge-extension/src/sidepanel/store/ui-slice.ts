/**
 * UI state slice.
 *
 * Manages global UI concerns: active tabs, tool selection, loading state,
 * toast notifications, and modal dialogs.
 */

import type { StateCreator } from 'zustand';
import type { ToolType } from '../../types/extraction';
import type { StoreState } from './index';
import { generateId } from '../../utils/id';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type NavigationTab = 'tools' | 'history' | 'data';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  /** Auto-dismiss after this many ms. 0 = manual dismiss only. Default 5000. */
  duration: number;
}

export interface ModalState {
  id: string;
  /** Component key / type identifier for the modal to render. */
  type: string;
  /** Arbitrary props passed to the modal component. */
  props?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// Slice state
// ---------------------------------------------------------------------------

export interface UISlice {
  /** Which main navigation tab is active. */
  activeTab: NavigationTab;

  /** Which extraction tool is currently selected (null = none). */
  activeTool: ToolType | null;

  /** Sidebar panel width in pixels. */
  sidebarWidth: number;

  /** Global loading indicator. */
  isLoading: boolean;

  /** Stack of visible toast notifications. */
  toasts: Toast[];

  /** Stack of open modal dialogs. */
  modals: ModalState[];

  // -- Actions ---------------------------------------------------------------

  setTab: (tab: NavigationTab) => void;
  setTool: (tool: ToolType | null) => void;
  setSidebarWidth: (width: number) => void;
  setLoading: (loading: boolean) => void;
  addToast: (toast: Omit<Toast, 'id'> & { id?: string }) => string;
  removeToast: (id: string) => void;
  openModal: (modal: Omit<ModalState, 'id'> & { id?: string }) => string;
  closeModal: (id: string) => void;
  closeAllModals: () => void;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_TOASTS = 5;
const DEFAULT_TOAST_DURATION = 5000;
const MIN_SIDEBAR_WIDTH = 320;
const MAX_SIDEBAR_WIDTH = 600;

// ---------------------------------------------------------------------------
// Slice creator
// ---------------------------------------------------------------------------

export const createUISlice: StateCreator<
  StoreState,
  [['zustand/devtools', never]],
  [],
  UISlice
> = (set) => ({
  // -- State -----------------------------------------------------------------
  activeTab: 'tools',
  activeTool: null,
  sidebarWidth: 400,
  isLoading: false,
  toasts: [],
  modals: [],

  // -- Actions ---------------------------------------------------------------

  setTab: (tab) =>
    set({ activeTab: tab }, false, 'ui/setTab'),

  setTool: (tool) =>
    set({ activeTool: tool }, false, 'ui/setTool'),

  setSidebarWidth: (width) =>
    set(
      { sidebarWidth: Math.max(MIN_SIDEBAR_WIDTH, Math.min(MAX_SIDEBAR_WIDTH, width)) },
      false,
      'ui/setSidebarWidth',
    ),

  setLoading: (loading) =>
    set({ isLoading: loading }, false, 'ui/setLoading'),

  addToast: (toast) => {
    const id = toast.id ?? generateId(12);
    const newToast: Toast = {
      id,
      type: toast.type,
      title: toast.title,
      message: toast.message,
      duration: toast.duration ?? DEFAULT_TOAST_DURATION,
    };

    set(
      (state) => {
        // Keep toast stack within limits — remove oldest if needed
        const existing = state.toasts.length >= MAX_TOASTS
          ? state.toasts.slice(1)
          : state.toasts;
        return { toasts: [...existing, newToast] };
      },
      false,
      'ui/addToast',
    );

    return id;
  },

  removeToast: (id) =>
    set(
      (state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }),
      false,
      'ui/removeToast',
    ),

  openModal: (modal) => {
    const id = modal.id ?? generateId(12);
    const newModal: ModalState = {
      id,
      type: modal.type,
      props: modal.props,
    };

    set(
      (state) => ({
        modals: [...state.modals, newModal],
      }),
      false,
      'ui/openModal',
    );

    return id;
  },

  closeModal: (id) =>
    set(
      (state) => ({
        modals: state.modals.filter((m) => m.id !== id),
      }),
      false,
      'ui/closeModal',
    ),

  closeAllModals: () =>
    set({ modals: [] }, false, 'ui/closeAllModals'),
});
