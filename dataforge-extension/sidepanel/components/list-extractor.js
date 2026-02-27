/**
 * DataForge List Extractor — Flagship extraction tool.
 * 4-step flow: Select > Columns > Pagination > Extract
 */
(function () {
  'use strict';

  const UI = window.DataForgeUI;
  const Store = window.DataForgeStore;

  const STEPS = ['Select Data', 'Configure Columns', 'Pagination', 'Extract'];

  const PAGINATION_MODES = [
    { id: 'auto-scroll', name: 'Auto Scroll', desc: 'Scroll page to load more content', icon: '&#8595;' },
    { id: 'click-next', name: 'Click Next', desc: 'Click next/pagination buttons', icon: '&#8250;' },
    { id: 'url-pattern', name: 'URL Pattern', desc: 'Increment page number in URL', icon: '&#8634;' },
    { id: 'load-more', name: 'Load More', desc: 'Click "Load More" button', icon: '+' },
    { id: 'none', name: 'Single Page', desc: 'Extract from current page only', icon: '&#9632;' },
  ];

  window.ListExtractor = {
    render() {
      const state = Store.getState();
      const container = document.createElement('div');
      container.className = 'view-enter';

      // Back button
      const header = document.createElement('div');
      header.className = 'section-header mb-3';
      header.innerHTML = `
        <button class="btn btn-ghost btn-sm" id="btn-back-tools">&#8592; Back</button>
        <span class="section-title">List Extractor</span>
      `;
      container.appendChild(header);

      // Step indicator
      const steps = document.createElement('div');
      steps.innerHTML = UI.stepIndicator(STEPS, state.activeStep);
      container.appendChild(steps);

      // Step content
      const stepContent = document.createElement('div');
      stepContent.className = 'mt-3';

      switch (state.activeStep) {
        case 0:
          stepContent.appendChild(this.renderSelectStep(state));
          break;
        case 1:
          stepContent.appendChild(this.renderColumnsStep(state));
          break;
        case 2:
          stepContent.appendChild(this.renderPaginationStep(state));
          break;
        case 3:
          if (state.extractionStatus === 'completed') {
            stepContent.appendChild(this.renderCompletionStep(state));
          } else {
            stepContent.appendChild(this.renderExtractionStep(state));
          }
          break;
      }

      container.appendChild(stepContent);

      // Bind events after append
      setTimeout(() => {
        const backBtn = document.getElementById('btn-back-tools');
        if (backBtn) backBtn.addEventListener('click', () => Store.goBack());
      }, 0);

      return container;
    },

    // ============================================================
    // STEP 1: SELECT DATA
    // ============================================================
    renderSelectStep(state) {
      const el = document.createElement('div');

      // Scan button
      const scanBtn = document.createElement('button');
      scanBtn.className = 'btn btn-primary btn-block mb-3';
      scanBtn.textContent = 'Scan Page for Data';
      scanBtn.addEventListener('click', () => this.scanPage());
      el.appendChild(scanBtn);

      // Manual selection button
      const manualBtn = document.createElement('button');
      manualBtn.className = 'btn btn-secondary btn-block mb-4';
      manualBtn.textContent = 'Select Manually on Page';
      manualBtn.addEventListener('click', () => this.activateSelection());
      el.appendChild(manualBtn);

      // Detected patterns
      if (state.detectedPatterns.length > 0) {
        const title = document.createElement('div');
        title.className = 'section-title mb-2';
        title.textContent = 'Detected Patterns';
        el.appendChild(title);

        const list = document.createElement('div');
        list.className = 'flex flex-col gap-2 stagger-enter';

        state.detectedPatterns.forEach((pattern, i) => {
          const card = document.createElement('div');
          card.className = 'suggestion-card' + (i === 0 ? ' recommended' : '');
          card.innerHTML = `
            <div class="suggestion-icon">${UI.categoryIcon(pattern.category)}</div>
            <div class="suggestion-info">
              <div class="suggestion-title">${UI.esc(pattern.category || 'Data')} ${i === 0 ? UI.badge('Recommended', 'emerald') : ''}</div>
              <div class="suggestion-meta">${pattern.itemCount} items &middot; ${pattern.fields?.length || 0} fields</div>
            </div>
            <div class="suggestion-confidence">${Math.round((pattern.confidence || 0) * 100)}%</div>
          `;
          card.addEventListener('click', () => this.selectDetectedPattern(pattern));
          list.appendChild(card);
        });

        el.appendChild(list);
      }

      // Custom selector input
      const customSection = document.createElement('div');
      customSection.className = 'mt-4';
      customSection.innerHTML = `
        <label class="label">Custom CSS Selector</label>
        <div class="flex gap-2">
          <input type="text" class="input" id="custom-selector" placeholder="e.g., div.product-card" value="${UI.esc(state.selectedConfig?.selector || '')}">
          <button class="btn btn-secondary" id="btn-test-selector">Test</button>
        </div>
        <div class="text-xs text-muted mt-1" id="selector-result"></div>
      `;
      el.appendChild(customSection);

      setTimeout(() => {
        const testBtn = document.getElementById('btn-test-selector');
        if (testBtn) testBtn.addEventListener('click', () => this.testSelector());
      }, 0);

      return el;
    },

    async scanPage() {
      UI.showToast('Scanning page...', 'info');
      try {
        const result = await UI.sendMessage({ type: 'SCAN_PAGE' });
        if (result?.patterns) {
          Store.setDetectedPatterns(result.patterns);
          if (result.patterns.length > 0) {
            UI.showToast(`Found ${result.patterns.length} data pattern(s)!`, 'success');
          } else {
            UI.showToast('No patterns detected. Try manual selection.', 'info');
          }
        }
      } catch (e) {
        UI.showToast('Scan failed. Ensure you\'re on a webpage.', 'error');
      }
    },

    async activateSelection() {
      try {
        await UI.sendMessage({ type: 'ACTIVATE_SELECTION', mode: 'list' });
        Store.setState({ selectionActive: true });
        UI.showToast('Click on repeating items on the page to select them.', 'info');
      } catch (e) {
        UI.showToast('Could not activate selection mode.', 'error');
      }
    },

    async selectDetectedPattern(pattern) {
      try {
        await UI.sendMessage({ type: 'SELECT_PATTERN', patternId: pattern.id });
      } catch (e) { /* ignore if content script doesn't respond */ }

      Store.selectPattern({
        id: pattern.id,
        selector: pattern.selector,
        itemCount: pattern.itemCount,
        category: pattern.category,
        confidence: pattern.confidence,
        fields: (pattern.fields || []).map(f => ({ ...f, enabled: true })),
        pagination: [],
        sampleData: [],
      });
    },

    async testSelector() {
      const input = document.getElementById('custom-selector');
      const resultEl = document.getElementById('selector-result');
      if (!input || !resultEl) return;

      const selector = input.value.trim();
      if (!selector) {
        resultEl.textContent = 'Enter a CSS selector to test.';
        return;
      }

      try {
        const result = await UI.sendMessage({ type: 'TEST_SELECTOR', selector });
        if (result?.matchCount > 0) {
          resultEl.innerHTML = `<span class="text-success">Matched ${result.matchCount} elements</span>`;
          // If good match, allow proceeding
          if (result.matchCount >= 3) {
            Store.selectPattern({
              selector,
              itemCount: result.matchCount,
              category: 'generic',
              confidence: 0.7,
              fields: [],
              pagination: [],
              sampleData: [],
            });
          }
        } else {
          resultEl.innerHTML = `<span class="text-error">No matches found</span>`;
        }
      } catch (e) {
        resultEl.innerHTML = `<span class="text-error">Error: ${UI.esc(e.message)}</span>`;
      }
    },

    // ============================================================
    // STEP 2: CONFIGURE COLUMNS
    // ============================================================
    renderColumnsStep(state) {
      const el = document.createElement('div');
      const config = state.selectedConfig;

      if (!config) {
        el.innerHTML = `<div class="text-muted">No data selected. Go back to select data first.</div>`;
        return el;
      }

      // Info banner
      el.innerHTML = `
        <div class="card mb-3" style="padding:var(--sp-3)">
          <div class="flex items-center justify-between">
            <span class="text-sm">${UI.esc(config.category || 'Data')}</span>
            <span class="badge badge-emerald">${config.itemCount} items</span>
          </div>
          <div class="text-xs text-muted font-mono mt-1">${UI.esc(config.selector)}</div>
        </div>
      `;

      // Field toggles
      const fieldsTitle = document.createElement('div');
      fieldsTitle.className = 'section-title mb-2';
      fieldsTitle.textContent = 'Columns to Extract';
      el.appendChild(fieldsTitle);

      const fields = config.fields || [];
      if (fields.length === 0) {
        const addHint = document.createElement('div');
        addHint.className = 'text-muted text-sm mb-3';
        addHint.textContent = 'No fields auto-detected. Fields will be extracted based on the element content.';
        el.appendChild(addHint);
      }

      const fieldList = document.createElement('div');
      fieldList.className = 'flex flex-col gap-2';

      fields.forEach((field, i) => {
        const chip = document.createElement('div');
        chip.className = 'column-chip' + (field.enabled === false ? ' disabled' : '');
        chip.innerHTML = `
          <div class="column-chip-icon">${UI.fieldIcon(field.icon || 'text')}</div>
          <input class="column-chip-name" type="text" value="${UI.esc(field.name)}" data-field-idx="${i}" style="background:transparent;border:none;border-bottom:1px dashed var(--accent-violet);color:var(--text-primary);font-size:12px;font-weight:500;padding:0;width:80px;outline:none">
          <div class="column-chip-sample">${UI.esc(field.sampleValue || '')}</div>
          <label class="toggle" style="margin-left:auto">
            <input type="checkbox" ${field.enabled !== false ? 'checked' : ''} data-toggle-idx="${i}">
            <div class="toggle-track"></div>
          </label>
        `;
        fieldList.appendChild(chip);
      });

      el.appendChild(fieldList);

      // Always include source URL
      const urlNote = document.createElement('div');
      urlNote.className = 'text-xs text-muted mt-2';
      urlNote.textContent = 'Source URL column is always included automatically.';
      el.appendChild(urlNote);

      // Next button
      const nextBtn = document.createElement('button');
      nextBtn.className = 'btn btn-primary btn-block mt-4';
      nextBtn.textContent = 'Next: Configure Pagination';
      nextBtn.addEventListener('click', () => Store.setStep(2));
      el.appendChild(nextBtn);

      // Bind field name edits and toggles
      setTimeout(() => {
        fieldList.querySelectorAll('input[data-field-idx]').forEach(input => {
          input.addEventListener('change', (e) => {
            Store.updateField(parseInt(e.target.dataset.fieldIdx), { name: e.target.value });
          });
        });
        fieldList.querySelectorAll('input[data-toggle-idx]').forEach(input => {
          input.addEventListener('change', (e) => {
            Store.updateField(parseInt(e.target.dataset.toggleIdx), { enabled: e.target.checked });
          });
        });
      }, 0);

      return el;
    },

    // ============================================================
    // STEP 3: PAGINATION
    // ============================================================
    renderPaginationStep(state) {
      const el = document.createElement('div');
      const config = state.selectedConfig;
      const activePag = config?.activePagination;

      const title = document.createElement('div');
      title.className = 'section-title mb-2';
      title.textContent = 'Loading Strategy';
      el.appendChild(title);

      const desc = document.createElement('div');
      desc.className = 'text-xs text-muted mb-3';
      desc.textContent = 'How should DataForge load additional pages of data?';
      el.appendChild(desc);

      // Pagination mode cards
      const modeList = document.createElement('div');
      modeList.className = 'flex flex-col gap-2';

      PAGINATION_MODES.forEach(mode => {
        const isSelected = activePag?.type === mode.id;
        const isDetected = (config?.pagination || []).find(p => p.type === mode.id);

        const card = document.createElement('div');
        card.className = 'pagination-mode' + (isSelected ? ' selected' : '');
        card.innerHTML = `
          <div class="mode-radio"></div>
          <div class="mode-info">
            <div class="mode-name">${mode.icon} ${mode.name} ${isDetected ? UI.badge('Detected', 'emerald') : ''}</div>
            <div class="mode-desc">${mode.desc}</div>
          </div>
        `;
        card.addEventListener('click', () => {
          const pagConfig = isDetected || { type: mode.id, config: {} };
          Store.setPagination(pagConfig);
        });
        modeList.appendChild(card);
      });

      el.appendChild(modeList);

      // Pagination settings (if a mode is selected and not "none")
      if (activePag && activePag.type !== 'none') {
        const settingsDiv = document.createElement('div');
        settingsDiv.className = 'card mt-3';
        settingsDiv.style.padding = 'var(--sp-3)';

        let settingsHTML = '<div class="section-title mb-2">Settings</div>';

        if (activePag.type === 'auto-scroll') {
          settingsHTML += `
            <label class="label">Max Scrolls</label>
            <input type="number" class="input mb-2" id="pag-max-scrolls" value="${activePag.config?.maxScrolls || 50}" min="1" max="500">
            <label class="label">Wait Time (ms)</label>
            <input type="number" class="input" id="pag-wait-time" value="${activePag.config?.waitTime || 1500}" min="500" max="10000" step="500">
          `;
        } else if (activePag.type === 'click-next') {
          settingsHTML += `
            <label class="label">Max Pages</label>
            <input type="number" class="input mb-2" id="pag-max-pages" value="${activePag.config?.totalPages || 20}" min="1" max="500">
            <label class="label">Wait Time (ms)</label>
            <input type="number" class="input" id="pag-wait-time" value="${activePag.config?.waitTime || 2000}" min="500" max="10000" step="500">
          `;
        } else if (activePag.type === 'url-pattern') {
          settingsHTML += `
            <label class="label">Max Pages</label>
            <input type="number" class="input mb-2" id="pag-max-pages" value="20" min="1" max="500">
          `;
        } else if (activePag.type === 'load-more') {
          settingsHTML += `
            <label class="label">Max Clicks</label>
            <input type="number" class="input mb-2" id="pag-max-clicks" value="${activePag.config?.maxClicks || 50}" min="1" max="200">
            <label class="label">Wait Time (ms)</label>
            <input type="number" class="input" id="pag-wait-time" value="${activePag.config?.waitTime || 1500}" min="500" max="10000" step="500">
          `;
        }

        settingsDiv.innerHTML = settingsHTML;
        el.appendChild(settingsDiv);
      }

      // Max items setting
      const maxItemsDiv = document.createElement('div');
      maxItemsDiv.className = 'mt-3';
      maxItemsDiv.innerHTML = `
        <label class="label">Max Items to Extract</label>
        <input type="number" class="input" id="pag-max-items" value="${state.settings.maxItemsPerExtraction}" min="10" max="100000" step="10">
      `;
      el.appendChild(maxItemsDiv);

      // Start extraction button
      const startBtn = document.createElement('button');
      startBtn.className = 'btn btn-primary btn-lg btn-block mt-4';
      startBtn.innerHTML = `&#9889; Start Extraction`;
      startBtn.addEventListener('click', () => this.startExtraction(state));
      el.appendChild(startBtn);

      return el;
    },

    async startExtraction(state) {
      const config = state.selectedConfig;
      if (!config?.selector) {
        UI.showToast('No data selected. Go back and select data first.', 'error');
        return;
      }

      Store.startExtraction();

      const maxItems = parseInt(document.getElementById('pag-max-items')?.value) || 10000;
      const pagination = config.activePagination || { type: 'none', config: {} };

      // Read pagination settings from inputs
      if (pagination.type !== 'none') {
        const pConfig = { ...pagination.config };
        const maxScrolls = document.getElementById('pag-max-scrolls');
        const maxPages = document.getElementById('pag-max-pages');
        const maxClicks = document.getElementById('pag-max-clicks');
        const waitTime = document.getElementById('pag-wait-time');

        if (maxScrolls) pConfig.maxScrolls = parseInt(maxScrolls.value) || 50;
        if (maxPages) pConfig.maxPages = parseInt(maxPages.value) || 20;
        if (maxClicks) pConfig.maxClicks = parseInt(maxClicks.value) || 50;
        if (waitTime) pConfig.waitTime = parseInt(waitTime.value) || 1500;
        pagination.config = pConfig;
      }

      try {
        await UI.sendMessage({
          type: 'START_EXTRACTION',
          config: {
            selector: config.selector,
            fields: (config.fields || []).filter(f => f.enabled !== false),
            pagination,
            maxItems,
          },
        });
      } catch (e) {
        UI.showToast('Failed to start extraction: ' + e.message, 'error');
        Store.stopExtraction();
      }
    },

    // ============================================================
    // STEP 4: EXTRACTION PROGRESS
    // ============================================================
    renderExtractionStep(state) {
      const el = document.createElement('div');
      const { progress, extractedRows, extractionStatus } = state;
      const isRunning = extractionStatus === 'running';
      const isPaused = extractionStatus === 'paused';

      // Progress ring
      const maxItems = state.settings.maxItemsPerExtraction || 10000;
      const percentage = Math.min((progress.items / maxItems) * 100, 99);

      el.innerHTML = `
        <div style="text-align:center;margin-bottom:var(--sp-4)">
          ${UI.progressRing(isRunning || isPaused ? percentage : 0)}
        </div>
      `;

      // Stats
      const stats = document.createElement('div');
      stats.className = 'completion-stats';
      stats.innerHTML = `
        <div class="completion-stat">
          <div class="completion-stat-value">${UI.formatNumber(progress.items)}</div>
          <div class="completion-stat-label">Items</div>
        </div>
        <div class="completion-stat">
          <div class="completion-stat-value">${progress.pages}</div>
          <div class="completion-stat-label">Pages</div>
        </div>
        <div class="completion-stat">
          <div class="completion-stat-value">${UI.formatTime(progress.elapsed)}</div>
          <div class="completion-stat-label">Elapsed</div>
        </div>
        <div class="completion-stat">
          <div class="completion-stat-value">${progress.speed > 0 ? progress.speed.toFixed(1) : '—'}</div>
          <div class="completion-stat-label">Items/sec</div>
        </div>
      `;
      el.appendChild(stats);

      // Live data feed
      if (extractedRows.length > 0) {
        const feedTitle = document.createElement('div');
        feedTitle.className = 'section-title mt-3 mb-2';
        feedTitle.textContent = 'Live Data Feed';
        el.appendChild(feedTitle);

        const feed = document.createElement('div');
        feed.className = 'data-feed';

        const lastRows = extractedRows.slice(-5).reverse();
        const fields = state.selectedConfig?.fields?.filter(f => f.enabled !== false) || [];
        const displayFields = fields.slice(0, 3);

        // Header
        let headerHTML = '<div class="data-feed-header">';
        displayFields.forEach(f => {
          headerHTML += `<div class="data-feed-cell">${UI.esc(f.name)}</div>`;
        });
        headerHTML += '</div>';
        feed.innerHTML = headerHTML;

        // Rows
        lastRows.forEach((row, i) => {
          const rowDiv = document.createElement('div');
          rowDiv.className = 'data-feed-row' + (i === 0 ? ' new' : '');
          let rowHTML = '';
          displayFields.forEach(f => {
            rowHTML += `<div class="data-feed-cell">${UI.esc(row[f.name] || '')}</div>`;
          });
          rowDiv.innerHTML = rowHTML;
          feed.appendChild(rowDiv);
        });

        el.appendChild(feed);
      }

      // Action buttons
      const actions = document.createElement('div');
      actions.className = 'flex gap-2 mt-4';

      if (isRunning) {
        actions.innerHTML = `
          <button class="btn btn-secondary flex-1" id="btn-pause">Pause</button>
          <button class="btn btn-danger-ghost flex-1" id="btn-stop">Stop</button>
        `;
      } else if (isPaused) {
        actions.innerHTML = `
          <button class="btn btn-primary flex-1" id="btn-resume">Resume</button>
          <button class="btn btn-danger-ghost flex-1" id="btn-stop">Stop</button>
        `;
      }

      el.appendChild(actions);

      // View data button
      if (extractedRows.length > 0) {
        const viewBtn = document.createElement('button');
        viewBtn.className = 'btn btn-ghost btn-block mt-2';
        viewBtn.textContent = 'View Data Table';
        viewBtn.addEventListener('click', () => {
          this.saveAndViewData(state);
        });
        el.appendChild(viewBtn);
      }

      setTimeout(() => {
        const pauseBtn = document.getElementById('btn-pause');
        const resumeBtn = document.getElementById('btn-resume');
        const stopBtn = document.getElementById('btn-stop');

        if (pauseBtn) pauseBtn.addEventListener('click', () => {
          UI.sendMessage({ type: 'PAUSE_EXTRACTION' });
          Store.pauseExtraction();
        });
        if (resumeBtn) resumeBtn.addEventListener('click', () => {
          UI.sendMessage({ type: 'RESUME_EXTRACTION' });
          Store.resumeExtraction();
        });
        if (stopBtn) stopBtn.addEventListener('click', () => {
          UI.sendMessage({ type: 'STOP_EXTRACTION' });
          Store.stopExtraction();
        });
      }, 0);

      return el;
    },

    // ============================================================
    // COMPLETION
    // ============================================================
    renderCompletionStep(state) {
      const el = document.createElement('div');
      const summary = state.extractionSummary || {};
      const rows = state.extractedRows;

      el.innerHTML = `
        <div class="completion-card">
          <div class="completion-checkmark">&#10003;</div>
          <div class="completion-title">Extraction Complete!</div>
          <div class="completion-stats">
            <div class="completion-stat">
              <div class="completion-stat-value">${UI.formatNumber(summary.totalItems || rows.length)}</div>
              <div class="completion-stat-label">Items Extracted</div>
            </div>
            <div class="completion-stat">
              <div class="completion-stat-value">${summary.totalPages || 1}</div>
              <div class="completion-stat-label">Pages</div>
            </div>
            <div class="completion-stat">
              <div class="completion-stat-value">${UI.formatTime(summary.elapsed || 0)}</div>
              <div class="completion-stat-label">Time</div>
            </div>
            <div class="completion-stat">
              <div class="completion-stat-value">${UI.formatSize(JSON.stringify(rows).length)}</div>
              <div class="completion-stat-label">Data Size</div>
            </div>
          </div>
          <button class="btn btn-primary btn-lg btn-block mt-3" id="btn-view-data">Open Data Table</button>
          <button class="btn btn-secondary btn-block mt-2" id="btn-new-extraction">New Extraction</button>
        </div>
      `;

      setTimeout(() => {
        document.getElementById('btn-view-data')?.addEventListener('click', () => {
          this.saveAndViewData(state);
        });
        document.getElementById('btn-new-extraction')?.addEventListener('click', () => {
          Store.setState({
            extractionStatus: 'idle',
            extractedRows: [],
            selectedConfig: null,
            detectedPatterns: [],
            activeStep: 0,
            progress: { items: 0, pages: 0, elapsed: 0, speed: 0, errors: 0 },
          });
        });
      }, 0);

      return el;
    },

    async saveAndViewData(state) {
      const rows = state.extractedRows;
      const fields = state.selectedConfig?.fields?.filter(f => f.enabled !== false) || [];

      // Create columns from fields
      const columns = fields.map(f => ({
        id: f.name,
        name: f.name,
        type: f.type || 'text',
      }));
      columns.push({ id: 'Source URL', name: 'Source URL', type: 'url' });

      // Save to IndexedDB
      const tableId = UI.uid();
      try {
        await Store.saveTableToIDB(tableId, rows, columns);
      } catch (e) {
        console.error('Failed to save to IDB:', e);
      }

      // Add to history
      Store.addHistoryItem({
        id: tableId,
        type: 'list',
        title: state.extractionSummary?.title || document.title || 'Extraction',
        url: state.extractionSummary?.url || '',
        rowCount: rows.length,
        columnCount: columns.length,
        date: new Date().toISOString(),
        status: 'complete',
      });

      // Switch to data tab
      Store.setState({
        activeTab: 'data',
        activeTableId: tableId,
        tableData: { columns, rows, filteredRows: null },
      });
    },
  };
})();
