/**
 * DataForge Settings View
 */
(function () {
  'use strict';

  const UI = window.DataForgeUI;
  const Store = window.DataForgeStore;

  window.SettingsView = {
    render() {
      const state = Store.getState();
      const s = state.settings;

      const container = document.createElement('div');
      container.className = 'view-enter';

      container.innerHTML = `
        <div class="section-header mb-4">
          <button class="btn btn-ghost btn-sm" id="btn-back-settings">&#8592; Back</button>
          <span class="section-title">Settings</span>
        </div>

        <div class="settings-section">
          <div class="settings-section-title">Extraction</div>

          <div class="settings-row">
            <div>
              <div class="settings-label">Respect robots.txt</div>
              <div class="settings-desc">Check and follow robots.txt rules</div>
            </div>
            <label class="toggle">
              <input type="checkbox" data-setting="respectRobotsTxt" ${s.respectRobotsTxt ? 'checked' : ''}>
              <div class="toggle-track"></div>
            </label>
          </div>

          <div class="settings-row">
            <div>
              <div class="settings-label">Auto-clean data</div>
              <div class="settings-desc">Automatically clean extracted data</div>
            </div>
            <label class="toggle">
              <input type="checkbox" data-setting="autoClean" ${s.autoClean ? 'checked' : ''}>
              <div class="toggle-track"></div>
            </label>
          </div>

          <div class="settings-row">
            <div>
              <div class="settings-label">Delay between pages (ms)</div>
            </div>
            <input type="number" class="input" style="width:80px" data-setting="extractionDelay" value="${s.extractionDelay}" min="100" max="10000" step="100">
          </div>

          <div class="settings-row">
            <div>
              <div class="settings-label">Max items per extraction</div>
            </div>
            <input type="number" class="input" style="width:80px" data-setting="maxItemsPerExtraction" value="${s.maxItemsPerExtraction}" min="10" max="100000" step="10">
          </div>

          <div class="settings-row">
            <div>
              <div class="settings-label">Concurrent tabs</div>
            </div>
            <input type="number" class="input" style="width:80px" data-setting="maxConcurrentTabs" value="${s.maxConcurrentTabs}" min="1" max="5">
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-section-title">Interface</div>

          <div class="settings-row">
            <div>
              <div class="settings-label">Animations</div>
              <div class="settings-desc">Enable UI animations and transitions</div>
            </div>
            <label class="toggle">
              <input type="checkbox" data-setting="animationsEnabled" ${s.animationsEnabled ? 'checked' : ''}>
              <div class="toggle-track"></div>
            </label>
          </div>

          <div class="settings-row">
            <div>
              <div class="settings-label">Notifications</div>
              <div class="settings-desc">Show browser notifications on completion</div>
            </div>
            <label class="toggle">
              <input type="checkbox" data-setting="notificationsEnabled" ${s.notificationsEnabled ? 'checked' : ''}>
              <div class="toggle-track"></div>
            </label>
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-section-title">Export</div>

          <div class="settings-row">
            <div>
              <div class="settings-label">Default format</div>
            </div>
            <select class="select" style="width:100px" data-setting="defaultExportFormat">
              <option value="csv" ${s.defaultExportFormat === 'csv' ? 'selected' : ''}>CSV</option>
              <option value="json" ${s.defaultExportFormat === 'json' ? 'selected' : ''}>JSON</option>
              <option value="xlsx" ${s.defaultExportFormat === 'xlsx' ? 'selected' : ''}>Excel</option>
            </select>
          </div>
        </div>

        <div class="settings-section">
          <div class="settings-section-title">Data</div>
          <button class="btn btn-danger-ghost btn-block" id="btn-clear-all-data">
            Clear All Data
          </button>
          <div class="text-xs text-muted mt-2" style="text-align:center">
            Removes all saved extractions, templates, and history.
          </div>
        </div>

        <div class="text-xs text-muted mt-4" style="text-align:center">
          DataForge v1.0.0 &middot; 100% Client-Side &middot; No Data Leaves Your Browser
        </div>
      `;

      // Bind events
      setTimeout(() => {
        document.getElementById('btn-back-settings')?.addEventListener('click', () => {
          Store.setState({ activeTab: 'tools', activeTool: null });
        });

        // Toggle settings
        container.querySelectorAll('[data-setting]').forEach(input => {
          const key = input.dataset.setting;
          const handler = () => {
            let value;
            if (input.type === 'checkbox') value = input.checked;
            else if (input.type === 'number') value = parseInt(input.value);
            else value = input.value;
            Store.updateSetting(key, value);
          };
          input.addEventListener('change', handler);
          if (input.type === 'number') input.addEventListener('blur', handler);
        });

        document.getElementById('btn-clear-all-data')?.addEventListener('click', async () => {
          if (confirm('This will permanently delete all your extraction data, history, and templates. Continue?')) {
            await chrome.storage.local.clear();
            try {
              const req = indexedDB.deleteDatabase('DataForge');
              req.onsuccess = () => {};
            } catch (e) {}
            Store.setState({ history: [], templates: [], tableData: { columns: [], rows: [] } });
            UI.showToast('All data cleared.', 'info');
          }
        });
      }, 0);

      return container;
    },
  };
})();
