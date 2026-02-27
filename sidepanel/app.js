/**
 * DataForge App — Main application controller.
 * Manages routing, rendering, and message passing.
 */
(function () {
  'use strict';

  const Store = window.DataForgeStore;
  const UI = window.DataForgeUI;

  const App = {
    contentEl: null,
    currentView: null,
    isRendering: false,

    async init() {
      this.contentEl = document.getElementById('content');
      this.setupNavigation();
      this.setupMessageListeners();
      this.setupSettingsButton();

      // Load persisted state
      await Store.loadPersistedState();

      // Subscribe to store changes
      Store.subscribe((state, prev) => {
        // Only re-render if relevant state changed
        if (
          state.activeTab !== prev.activeTab ||
          state.activeTool !== prev.activeTool ||
          state.activeStep !== prev.activeStep ||
          state.detectedPatterns !== prev.detectedPatterns ||
          state.selectedConfig !== prev.selectedConfig ||
          state.extractionStatus !== prev.extractionStatus ||
          state.extractedRows !== prev.extractedRows ||
          state.progress !== prev.progress ||
          state.tableData !== prev.tableData ||
          state.tableSearch !== prev.tableSearch ||
          state.tableSorts !== prev.tableSorts ||
          state.history !== prev.history ||
          state.templates !== prev.templates
        ) {
          this.renderContent();
        }

        // Update bottom bar
        this.updateBottomBar(state);

        // Render toasts
        this.renderToasts(state.toasts);
      });

      // Initial render
      this.renderContent();
    },

    setupNavigation() {
      const navTabs = document.querySelectorAll('.nav-tab');
      navTabs.forEach(tab => {
        tab.addEventListener('click', () => {
          Store.setActiveTab(tab.dataset.tab);
          navTabs.forEach(t => t.classList.remove('active'));
          tab.classList.add('active');
        });
      });
    },

    setupSettingsButton() {
      document.getElementById('btn-settings')?.addEventListener('click', () => {
        Store.setState({ activeTab: 'settings', activeTool: null });
        // Update nav tabs
        document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
      });
    },

    setupMessageListeners() {
      // Listen for messages from background/content script
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        switch (message.type) {
          case 'SCAN_RESULT':
            Store.setDetectedPatterns(message.patterns || []);
            break;

          case 'SELECTION_CONFIRMED':
            if (message.config) {
              Store.selectPattern({
                ...message.config,
                fields: (message.config.fields || []).map(f => ({ ...f, enabled: true })),
              });
            }
            break;

          case 'SELECTION_CANCELLED':
            Store.setState({ selectionActive: false });
            break;

          case 'EXTRACTION_PROGRESS':
            Store.updateProgress(message.data || {});
            break;

          case 'EXTRACTION_ROW':
            if (message.row) {
              Store.addExtractedRow(message.row);
            }
            break;

          case 'EXTRACTION_BATCH':
            if (message.rows) {
              Store.addExtractedRows(message.rows);
            }
            break;

          case 'EXTRACTION_COMPLETE':
            Store.completeExtraction(message.summary || {});
            break;

          case 'EXTRACTION_ERROR':
            Store.extractionError(message.error);
            UI.showToast('Extraction error: ' + (message.error || 'Unknown'), 'error');
            break;

          case 'TAB_CHANGED':
            // Could trigger a re-scan
            break;

          case 'SELECTOR_TEST_RESULT':
            // Handled by direct response
            break;
        }
      });
    },

    renderContent() {
      if (this.isRendering) return;
      this.isRendering = true;

      requestAnimationFrame(() => {
        const state = Store.getState();
        const view = this.getView(state);

        if (this.contentEl) {
          this.contentEl.innerHTML = '';
          if (view) {
            const el = view.render();
            if (el) this.contentEl.appendChild(el);
          }
        }

        this.isRendering = false;
      });
    },

    getView(state) {
      // Settings override
      if (state.activeTab === 'settings') {
        return window.SettingsView;
      }

      // Tab-based routing
      switch (state.activeTab) {
        case 'tools':
          return this.getToolView(state);
        case 'history':
          return window.HistoryView;
        case 'data':
          return window.DataTable;
        default:
          return window.ToolsMenu;
      }
    },

    getToolView(state) {
      if (!state.activeTool) return window.ToolsMenu;

      switch (state.activeTool) {
        case 'list': return window.ListExtractor;
        case 'page': return window.PageExtractor;
        case 'email': return window.EmailExtractor;
        case 'image': return window.ImageDownloader;
        case 'text': return window.TextExtractor;
        case 'templates': return window.TemplatesView;
        default: return window.ToolsMenu;
      }
    },

    updateBottomBar(state) {
      const bar = document.getElementById('bottombar');
      const countEl = document.getElementById('bottom-count');
      const timeEl = document.getElementById('bottom-time');

      if (!bar) return;

      const isExtracting = state.extractionStatus === 'running' || state.extractionStatus === 'paused';

      if (isExtracting) {
        bar.classList.remove('hidden');
        if (countEl) countEl.textContent = UI.formatNumber(state.progress.items);
        if (timeEl) timeEl.textContent = UI.formatTime(state.progress.elapsed);

        // Setup bottom bar buttons
        const pauseBtn = document.getElementById('btn-bottom-pause');
        const stopBtn = document.getElementById('btn-bottom-stop');

        if (pauseBtn) {
          pauseBtn.textContent = state.extractionStatus === 'paused' ? 'Resume' : 'Pause';
          pauseBtn.onclick = () => {
            if (state.extractionStatus === 'paused') {
              UI.sendMessage({ type: 'RESUME_EXTRACTION' });
              Store.resumeExtraction();
            } else {
              UI.sendMessage({ type: 'PAUSE_EXTRACTION' });
              Store.pauseExtraction();
            }
          };
        }
        if (stopBtn) {
          stopBtn.onclick = () => {
            UI.sendMessage({ type: 'STOP_EXTRACTION' });
            Store.stopExtraction();
          };
        }
      } else {
        bar.classList.add('hidden');
      }
    },

    renderToasts(toasts) {
      const container = document.getElementById('toast-container');
      if (!container) return;

      container.innerHTML = '';
      toasts.forEach(toast => {
        const el = document.createElement('div');
        el.className = `toast ${toast.type}`;
        el.textContent = toast.message;
        container.appendChild(el);
      });
    },
  };

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => App.init());
  } else {
    App.init();
  }

  window.DataForgeApp = App;
})();
