/**
 * App - Root component for the DataForge side panel.
 *
 * Responsibilities:
 *  - Wraps the entire UI in PanelLayout
 *  - Routes content based on activeTab: TOOLS, HISTORY, DATA
 *  - Within TOOLS tab: shows ToolsMenu (home) or active tool view
 *  - Manages settings overlay state
 *  - Error boundary for graceful error recovery
 *  - Toast notification container
 *  - Initializes settings on mount
 */

import React, { useCallback, useEffect, useState, useMemo, type ReactNode } from 'react';
import { useStore } from './store';
import { useSettings } from './hooks/useSettings';
import type { NavigationTab } from './store/ui-slice';
import type { ToolType } from '../types/extraction';

// Layout
import PanelLayout from './components/layout/PanelLayout';

// Views
import ToolsMenu from './components/tools/ToolsMenu';
import HistoryView from './components/history/HistoryView';
import SettingsView from './components/settings/SettingsView';

// ---------------------------------------------------------------------------
// Error Boundary
// ---------------------------------------------------------------------------

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('[DataForge] Uncaught error:', error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full p-6 text-center">
          <div
            className={[
              'flex items-center justify-center w-14 h-14 rounded-2xl mb-4',
              'bg-status-error/10 border border-status-error/20',
            ].join(' ')}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-status-error"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <h2 className="text-sm font-semibold text-forge-text mb-1">Something went wrong</h2>
          <p className="text-xs text-forge-text-muted mb-4 max-w-[240px]">
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            className={[
              'h-8 px-4 rounded-lg text-xs font-semibold',
              'bg-gradient-to-br from-accent-primary to-accent-secondary',
              'text-forge-bg',
              'hover:shadow-[0_0_16px_rgba(16,185,129,0.3)]',
              'transition-all duration-150',
              'active:scale-[0.98]',
            ].join(' ')}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// ---------------------------------------------------------------------------
// Toast Container
// ---------------------------------------------------------------------------

const ToastContainer: React.FC = () => {
  const toasts = useStore((s) => s.toasts);
  const removeToast = useStore((s) => s.removeToast);

  // Auto-dismiss toasts
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];

    for (const toast of toasts) {
      if (toast.duration > 0) {
        const timer = setTimeout(() => {
          removeToast(toast.id);
        }, toast.duration);
        timers.push(timer);
      }
    }

    return () => {
      for (const timer of timers) {
        clearTimeout(timer);
      }
    };
  }, [toasts, removeToast]);

  if (toasts.length === 0) return null;

  const typeStyles: Record<string, string> = {
    success: 'border-status-success/30 bg-status-success/10',
    error: 'border-status-error/30 bg-status-error/10',
    warning: 'border-status-warning/30 bg-status-warning/10',
    info: 'border-status-info/30 bg-status-info/10',
  };

  const typeIconColors: Record<string, string> = {
    success: 'text-status-success',
    error: 'text-status-error',
    warning: 'text-status-warning',
    info: 'text-status-info',
  };

  return (
    <div className="toast-container" aria-live="polite" aria-label="Notifications">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={[
            'flex items-start gap-2.5 p-3 rounded-xl border backdrop-blur-xl',
            'animate-slide-in-right motion-reduce:animate-none',
            'shadow-[0_4px_20px_rgba(0,0,0,0.3)]',
            'max-w-[300px]',
            typeStyles[toast.type] ?? typeStyles.info,
          ].join(' ')}
          role="alert"
        >
          {/* Icon */}
          <div className={`shrink-0 mt-0.5 ${typeIconColors[toast.type] ?? ''}`}>
            {toast.type === 'success' && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            {toast.type === 'error' && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="15" y1="9" x2="9" y2="15" />
                <line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            )}
            {toast.type === 'warning' && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            )}
            {toast.type === 'info' && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="16" x2="12" y2="12" />
                <line x1="12" y1="8" x2="12.01" y2="8" />
              </svg>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-forge-text">{toast.title}</p>
            {toast.message && (
              <p className="text-[11px] text-forge-text-muted mt-0.5">{toast.message}</p>
            )}
          </div>

          {/* Dismiss */}
          <button
            type="button"
            onClick={() => removeToast(toast.id)}
            className="shrink-0 text-forge-text-muted/50 hover:text-forge-text transition-colors duration-150"
            aria-label="Dismiss notification"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Tool View Placeholder
// ---------------------------------------------------------------------------

/**
 * Placeholder for individual tool views that haven't been implemented yet.
 * In production, this would route to the specific tool component.
 */
const ToolViewPlaceholder: React.FC<{ tool: ToolType }> = ({ tool }) => {
  const setActiveTool = useStore((s) => s.setTool);

  const toolNames: Record<ToolType, string> = {
    'list-extractor': 'List Extractor',
    'page-extractor': 'Page Extractor',
    'email-extractor': 'Email Extractor',
    'image-downloader': 'Image Downloader',
    'text-extractor': 'Text Extractor',
    'templates': 'Templates',
  };

  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <h3 className="text-sm font-semibold text-forge-text mb-1">
        {toolNames[tool] || tool}
      </h3>
      <p className="text-xs text-forge-text-muted mb-4">
        This tool view is being loaded...
      </p>
      <button
        type="button"
        onClick={() => setActiveTool('list-extractor')}
        className={[
          'h-8 px-4 rounded-lg text-xs font-medium',
          'text-accent-primary border border-accent-primary/40',
          'hover:bg-accent-primary/10',
          'transition-all duration-150 motion-reduce:transition-none',
        ].join(' ')}
      >
        Back to Tools
      </button>
    </div>
  );
};

// ---------------------------------------------------------------------------
// Data View Placeholder
// ---------------------------------------------------------------------------

const DataViewPlaceholder: React.FC = () => (
  <div className="flex flex-col items-center justify-center h-full p-6 text-center">
    <div
      className={[
        'flex items-center justify-center w-14 h-14 rounded-2xl mb-4',
        'bg-forge-bg-tertiary/60 border border-forge-border',
      ].join(' ')}
    >
      <svg
        width="28"
        height="28"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="text-forge-text-muted/30"
        aria-hidden="true"
      >
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <line x1="3" y1="9" x2="21" y2="9" />
        <line x1="3" y1="15" x2="21" y2="15" />
        <line x1="9" y1="3" x2="9" y2="21" />
        <line x1="15" y1="3" x2="15" y2="21" />
      </svg>
    </div>
    <h3 className="text-sm font-medium text-forge-text-muted mb-1">No data yet</h3>
    <p className="text-xs text-forge-text-muted/60 max-w-[200px]">
      Extracted data will appear here. Start by running an extraction from the Tools tab.
    </p>
  </div>
);

// ---------------------------------------------------------------------------
// App Component
// ---------------------------------------------------------------------------

const App: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);

  // Store state
  const activeTab = useStore((s) => s.activeTab);
  const activeTool = useStore((s) => s.activeTool);
  const setTab = useStore((s) => s.setTab);
  const extractionStatus = useStore((s) => s.status);
  const extractionProgress = useStore((s) => s.progress);
  const extractedRows = useStore((s) => s.extractedRows);
  const setExtractionStatus = useStore((s) => s.setStatus);

  // Initialize settings
  useSettings();

  // ---- Tab change handler ----
  const handleTabChange = useCallback(
    (tab: NavigationTab) => {
      if (showSettings) {
        setShowSettings(false);
      }
      setTab(tab);
    },
    [setTab, showSettings],
  );

  // ---- Settings toggle ----
  const handleSettingsClick = useCallback(() => {
    setShowSettings((prev) => !prev);
  }, []);

  // ---- Bottom bar state ----
  const isExtracting = extractionStatus === 'running' || extractionStatus === 'paused';
  const bottomBarConfig = useMemo(
    () => ({
      visible: isExtracting,
      itemsCount: extractedRows.length,
      elapsedTime: extractionProgress.elapsed,
      progress:
        extractionProgress.items > 0
          ? Math.min(100, (extractionProgress.items / 1000) * 100)
          : 0,
      isPaused: extractionStatus === 'paused',
      onPause: () => setExtractionStatus('paused'),
      onResume: () => setExtractionStatus('running'),
      onStop: () => setExtractionStatus('completed'),
      onViewData: () => setTab('data'),
    }),
    [isExtracting, extractedRows.length, extractionProgress, extractionStatus, setExtractionStatus, setTab],
  );

  // ---- Tab badges ----
  const tabBadges = useMemo(
    () => ({
      data: extractedRows.length > 0 ? extractedRows.length : undefined,
    }),
    [extractedRows.length],
  );

  // ---- Route content based on active tab ----
  const renderContent = useCallback((): ReactNode => {
    // Settings overlay takes precedence
    if (showSettings) {
      return <SettingsView />;
    }

    switch (activeTab) {
      case 'tools':
        // If a specific tool is selected, show its view; otherwise show the menu
        if (activeTool) {
          return <ToolViewPlaceholder tool={activeTool} />;
        }
        return <ToolsMenu />;

      case 'history':
        return <HistoryView />;

      case 'data':
        return <DataViewPlaceholder />;

      default:
        return <ToolsMenu />;
    }
  }, [activeTab, activeTool, showSettings]);

  return (
    <ErrorBoundary>
      <PanelLayout
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onSettingsClick={handleSettingsClick}
        tabBadges={tabBadges}
        bottomBar={bottomBarConfig}
      >
        {renderContent()}
      </PanelLayout>
      <ToastContainer />
    </ErrorBoundary>
  );
};

export default App;
