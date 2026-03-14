/**
 * DataForge Store — Lightweight reactive state management
 * No dependencies. Simple pub/sub with immutable updates.
 */
(function () {
  'use strict';

  const listeners = new Set();
  let state = {
    // UI
    activeTab: 'tools', // tools | history | data
    activeTool: null,   // list | page | email | image | text | templates | null
    activeStep: 0,

    // Selection
    selectionActive: false,
    detectedPatterns: [],
    selectedPatternId: null,
    selectedConfig: null, // { selector, itemCount, category, fields, pagination, selectorPath, sampleData }

    // Extraction
    extractionStatus: 'idle', // idle | selecting | configuring | running | paused | completed | error
    extractedRows: [],
    progress: { items: 0, pages: 0, elapsed: 0, speed: 0, errors: 0 },
    extractionSummary: null,

    // Data Table
    tables: [],
    activeTableId: null,
    tableData: { columns: [], rows: [], filteredRows: null },
    tableSearch: '',
    tableSorts: [],
    tableFilters: [],

    // History
    history: [],

    // Templates
    templates: [],

    // Settings
    settings: {
      extractionDelay: 500,
      maxConcurrentTabs: 2,
      respectRobotsTxt: true,
      autoClean: true,
      animationsEnabled: true,
      notificationsEnabled: true,
      defaultExportFormat: 'csv',
      maxItemsPerExtraction: 10000,
      scrollSpeed: 'medium',
    },

    // Toast notifications
    toasts: [],
  };

  const Store = {
    getState() {
      return state;
    },

    setState(partial) {
      const prev = state;
      state = { ...state, ...partial };
      listeners.forEach(fn => {
        try { fn(state, prev); } catch (e) { console.error('Store listener error:', e); }
      });
    },

    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },

    // ============================================================
    // ACTIONS
    // ============================================================

    setActiveTab(tab) {
      this.setState({ activeTab: tab, activeTool: null, activeStep: 0 });
    },

    setActiveTool(tool) {
      this.setState({ activeTool: tool, activeStep: 0 });
    },

    goBack() {
      if (state.activeTool) {
        this.setState({ activeTool: null, activeStep: 0 });
      }
    },

    setStep(step) {
      this.setState({ activeStep: step });
    },

    // Selection
    setDetectedPatterns(patterns) {
      this.setState({ detectedPatterns: patterns });
    },

    selectPattern(config) {
      this.setState({
        selectedConfig: config,
        selectedPatternId: config?.id || null,
        activeStep: 1, // Move to column config step
      });
    },

    updateField(index, updates) {
      const config = { ...state.selectedConfig };
      const fields = [...(config.fields || [])];
      fields[index] = { ...fields[index], ...updates };
      config.fields = fields;
      this.setState({ selectedConfig: config });
    },

    setPagination(paginationConfig) {
      const config = { ...state.selectedConfig };
      config.activePagination = paginationConfig;
      this.setState({ selectedConfig: config });
    },

    // Extraction
    startExtraction() {
      this.setState({
        extractionStatus: 'running',
        extractedRows: [],
        progress: { items: 0, pages: 0, elapsed: 0, speed: 0, errors: 0 },
        extractionSummary: null,
        activeStep: 3,
      });
    },

    pauseExtraction() {
      this.setState({ extractionStatus: 'paused' });
    },

    resumeExtraction() {
      this.setState({ extractionStatus: 'running' });
    },

    stopExtraction() {
      this.setState({ extractionStatus: 'idle' });
    },

    addExtractedRow(row) {
      const rows = [...state.extractedRows, row];
      this.setState({ extractedRows: rows });
    },

    addExtractedRows(newRows) {
      const rows = [...state.extractedRows, ...newRows];
      this.setState({ extractedRows: rows });
    },

    updateProgress(progress) {
      this.setState({ progress: { ...state.progress, ...progress } });
    },

    completeExtraction(summary) {
      this.setState({
        extractionStatus: 'completed',
        extractionSummary: summary,
      });
    },

    extractionError(error) {
      this.setState({
        extractionStatus: 'error',
        extractionSummary: { error },
      });
    },

    // Data Table
    setTableData(data) {
      this.setState({ tableData: data });
    },

    setActiveTable(tableId) {
      this.setState({ activeTableId: tableId });
    },

    // History
    addHistoryItem(item) {
      const history = [item, ...state.history].slice(0, 100);
      this.setState({ history });
      this._persistHistory(history);
    },

    removeHistoryItem(id) {
      const history = state.history.filter(h => h.id !== id);
      this.setState({ history });
      this._persistHistory(history);
    },

    // Templates
    addTemplate(template) {
      const templates = [...state.templates, template];
      this.setState({ templates });
      this._persistTemplates(templates);
    },

    removeTemplate(id) {
      const templates = state.templates.filter(t => t.id !== id);
      this.setState({ templates });
      this._persistTemplates(templates);
    },

    // Settings
    updateSetting(key, value) {
      const settings = { ...state.settings, [key]: value };
      this.setState({ settings });
      this._persistSettings(settings);
    },

    // Toasts
    showToast(message, type = 'info', duration = 3000) {
      const id = 'toast_' + Date.now();
      const toasts = [...state.toasts, { id, message, type }];
      this.setState({ toasts });
      setTimeout(() => {
        this.setState({ toasts: state.toasts.filter(t => t.id !== id) });
      }, duration);
    },

    // ============================================================
    // PERSISTENCE
    // ============================================================

    async loadPersistedState() {
      try {
        const result = await chrome.storage.local.get(['history', 'templates', 'settings']);
        const updates = {};
        if (result.history) updates.history = result.history;
        if (result.templates) updates.templates = result.templates;
        if (result.settings) updates.settings = { ...state.settings, ...result.settings };
        if (Object.keys(updates).length > 0) this.setState(updates);
      } catch (e) {
        console.error('Failed to load persisted state:', e);
      }
    },

    async _persistHistory(history) {
      try {
        await chrome.storage.local.set({ history });
      } catch (e) { console.error('Failed to persist history:', e); }
    },

    async _persistTemplates(templates) {
      try {
        await chrome.storage.local.set({ templates });
      } catch (e) { console.error('Failed to persist templates:', e); }
    },

    async _persistSettings(settings) {
      try {
        await chrome.storage.local.set({ settings });
      } catch (e) { console.error('Failed to persist settings:', e); }
    },

    // ============================================================
    // DATA STORAGE (IndexedDB for large datasets)
    // ============================================================

    async saveTableToIDB(tableId, rows, columns) {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('DataForge', 1);
        request.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('tables')) {
            db.createObjectStore('tables', { keyPath: 'id' });
          }
        };
        request.onsuccess = (e) => {
          const db = e.target.result;
          const tx = db.transaction('tables', 'readwrite');
          tx.objectStore('tables').put({ id: tableId, rows, columns, updatedAt: Date.now() });
          tx.oncomplete = resolve;
          tx.onerror = () => reject(tx.error);
        };
        request.onerror = () => reject(request.error);
      });
    },

    async loadTableFromIDB(tableId) {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('DataForge', 1);
        request.onupgradeneeded = (e) => {
          const db = e.target.result;
          if (!db.objectStoreNames.contains('tables')) {
            db.createObjectStore('tables', { keyPath: 'id' });
          }
        };
        request.onsuccess = (e) => {
          const db = e.target.result;
          const tx = db.transaction('tables', 'readonly');
          const req = tx.objectStore('tables').get(tableId);
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        };
        request.onerror = () => reject(request.error);
      });
    },

    async deleteTableFromIDB(tableId) {
      return new Promise((resolve, reject) => {
        const request = indexedDB.open('DataForge', 1);
        request.onsuccess = (e) => {
          const db = e.target.result;
          const tx = db.transaction('tables', 'readwrite');
          tx.objectStore('tables').delete(tableId);
          tx.oncomplete = resolve;
          tx.onerror = () => reject(tx.error);
        };
        request.onerror = () => reject(request.error);
      });
    },
  };

  window.DataForgeStore = Store;
})();
