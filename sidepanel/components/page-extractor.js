/**
 * DataForge Page Extractor — Bulk multi-page extraction from URL list.
 */
(function () {
  'use strict';

  const UI = window.DataForgeUI;
  const Store = window.DataForgeStore;

  window.PageExtractor = {
    state: { urls: [], fields: [], extracting: false, results: [], progress: 0 },

    render() {
      const container = document.createElement('div');
      container.className = 'view-enter';

      // Header
      container.innerHTML = `
        <div class="section-header mb-3">
          <button class="btn btn-ghost btn-sm" id="btn-back-pe">&#8592; Back</button>
          <span class="section-title">Page Extractor</span>
        </div>
      `;

      if (this.state.extracting) {
        container.appendChild(this.renderProgress());
      } else {
        container.appendChild(this.renderConfig());
      }

      setTimeout(() => {
        document.getElementById('btn-back-pe')?.addEventListener('click', () => Store.goBack());
      }, 0);

      return container;
    },

    renderConfig() {
      const el = document.createElement('div');

      el.innerHTML = `
        ${UI.complianceBanner()}
        <label class="label">URLs (one per line)</label>
        <textarea class="textarea mb-3" id="pe-urls" rows="6" placeholder="https://example.com/page1\nhttps://example.com/page2\n...">${this.state.urls.join('\n')}</textarea>
        <div class="text-xs text-muted mb-3">${this.state.urls.length} URL(s) entered</div>

        <label class="label">Fields to Extract</label>
        <div class="text-xs text-muted mb-2">Navigate to a sample page first, then click "Select Fields on Page" to pick elements.</div>
        <button class="btn btn-secondary btn-block mb-3" id="btn-pe-select">Select Fields on Page</button>
      `;

      // Show configured fields
      if (this.state.fields.length > 0) {
        const fieldList = document.createElement('div');
        fieldList.className = 'flex flex-col gap-2 mb-3';
        this.state.fields.forEach((f, i) => {
          fieldList.innerHTML += `
            <div class="column-chip">
              <div class="column-chip-icon">${UI.fieldIcon(f.icon || 'text')}</div>
              <div class="column-chip-name">${UI.esc(f.name)}</div>
              <div class="column-chip-sample font-mono">${UI.esc(f.selector || '')}</div>
            </div>
          `;
        });
        el.appendChild(fieldList);
      }

      // Settings
      el.innerHTML += `
        <label class="label">Delay between pages (ms)</label>
        <input type="number" class="input mb-3" id="pe-delay" value="1000" min="500" max="10000" step="500">

        <button class="btn btn-primary btn-lg btn-block mt-2" id="btn-pe-start" ${this.state.urls.length === 0 ? 'disabled' : ''}>
          Start Bulk Extraction
        </button>
      `;

      setTimeout(() => {
        const urlsArea = document.getElementById('pe-urls');
        if (urlsArea) {
          urlsArea.addEventListener('input', (e) => {
            this.state.urls = e.target.value.split('\n').map(u => u.trim()).filter(u => u.length > 0);
          });
        }

        document.getElementById('btn-pe-select')?.addEventListener('click', async () => {
          try {
            await UI.sendMessage({ type: 'ACTIVATE_SELECTION', mode: 'element' });
            UI.showToast('Click elements on the page to add fields.', 'info');
          } catch (e) {
            UI.showToast('Could not activate selection mode.', 'error');
          }
        });

        document.getElementById('btn-pe-start')?.addEventListener('click', () => {
          this.startExtraction();
        });
      }, 0);

      return el;
    },

    renderProgress() {
      const el = document.createElement('div');
      const { results, progress, urls } = this.state;
      const percentage = urls.length > 0 ? (progress / urls.length) * 100 : 0;

      el.innerHTML = `
        <div style="text-align:center;margin-bottom:var(--sp-4)">
          ${UI.progressRing(percentage)}
        </div>
        <div class="text-sm text-center text-secondary mb-3">
          Processing ${progress} of ${urls.length} URLs
        </div>
      `;

      // Results list
      const resultList = document.createElement('div');
      resultList.className = 'flex flex-col gap-1';
      results.slice(-10).reverse().forEach(r => {
        const item = document.createElement('div');
        item.className = 'flex items-center gap-2 text-xs';
        item.innerHTML = `
          <span class="${r.status === 'success' ? 'text-success' : r.status === 'error' ? 'text-error' : 'text-muted'}">
            ${r.status === 'success' ? '&#10003;' : r.status === 'error' ? '&#10007;' : '&#8230;'}
          </span>
          <span class="truncate" style="flex:1">${UI.esc(r.url)}</span>
          <span class="text-muted">${r.itemCount || 0} items</span>
        `;
        resultList.appendChild(item);
      });
      el.appendChild(resultList);

      // Stop button
      const stopBtn = document.createElement('button');
      stopBtn.className = 'btn btn-danger-ghost btn-block mt-4';
      stopBtn.textContent = 'Stop Extraction';
      stopBtn.addEventListener('click', () => {
        this.state.extracting = false;
        window.DataForgeApp?.renderContent();
      });
      el.appendChild(stopBtn);

      return el;
    },

    async startExtraction() {
      const delay = parseInt(document.getElementById('pe-delay')?.value) || 1000;
      this.state.extracting = true;
      this.state.results = [];
      this.state.progress = 0;
      window.DataForgeApp?.renderContent();

      const allRows = [];
      for (const url of this.state.urls) {
        if (!this.state.extracting) break;

        this.state.progress++;
        this.state.results.push({ url, status: 'processing', itemCount: 0 });
        window.DataForgeApp?.renderContent();

        try {
          // Navigate to URL
          await UI.sendMessage({ type: 'NAVIGATE_URL', url });
          await new Promise(r => setTimeout(r, delay + 1000));

          // Extract using configured fields (or auto-detect)
          const result = await UI.sendMessage({ type: 'EXTRACT_TEXT' });
          if (result) {
            allRows.push({ ...result, 'Source URL': url });
            this.state.results[this.state.results.length - 1] = { url, status: 'success', itemCount: 1 };
          }
        } catch (e) {
          this.state.results[this.state.results.length - 1] = { url, status: 'error', itemCount: 0 };
        }

        window.DataForgeApp?.renderContent();
        await new Promise(r => setTimeout(r, delay));
      }

      this.state.extracting = false;

      if (allRows.length > 0) {
        const columns = Object.keys(allRows[0]).map(k => ({ id: k, name: k, type: 'text' }));
        const tableId = UI.uid();
        await Store.saveTableToIDB(tableId, allRows, columns);
        Store.addHistoryItem({
          id: tableId, type: 'page', title: 'Bulk Page Extraction',
          url: '', rowCount: allRows.length, columnCount: columns.length,
          date: new Date().toISOString(), status: 'complete',
        });
        Store.setState({ activeTab: 'data', activeTableId: tableId, tableData: { columns, rows: allRows } });
        UI.showToast(`Extracted data from ${allRows.length} pages.`, 'success');
      }
    },
  };
})();
