/**
 * DataForge Email Extractor — Find and extract emails from pages.
 */
(function () {
  'use strict';

  const UI = window.DataForgeUI;
  const Store = window.DataForgeStore;

  window.EmailExtractor = {
    state: { emails: [], extracting: false, mode: 'current' },

    render() {
      const container = document.createElement('div');
      container.className = 'view-enter';

      container.innerHTML = `
        <div class="section-header mb-3">
          <button class="btn btn-ghost btn-sm" id="btn-back-ee">&#8592; Back</button>
          <span class="section-title">Email Extractor</span>
        </div>
      `;

      container.innerHTML += UI.complianceBanner();

      if (this.state.extracting) {
        container.innerHTML += `
          <div style="text-align:center;padding:var(--sp-6)">
            ${UI.spinner('lg')}
            <div class="text-sm text-muted mt-3">Scanning for emails...</div>
          </div>
        `;
      } else if (this.state.emails.length > 0) {
        container.appendChild(this.renderResults());
      } else {
        container.appendChild(this.renderConfig());
      }

      setTimeout(() => {
        document.getElementById('btn-back-ee')?.addEventListener('click', () => Store.goBack());
      }, 0);

      return container;
    },

    renderConfig() {
      const el = document.createElement('div');
      el.innerHTML = `
        <div class="section-title mb-2">Extraction Mode</div>
        <div class="flex flex-col gap-2 mb-4">
          <div class="pagination-mode selected" id="mode-current">
            <div class="mode-radio"></div>
            <div class="mode-info">
              <div class="mode-name">Current Page</div>
              <div class="mode-desc">Scan the current page for email addresses</div>
            </div>
          </div>
        </div>
        <button class="btn btn-primary btn-lg btn-block" id="btn-extract-emails">
          Extract Emails
        </button>
      `;

      setTimeout(() => {
        document.getElementById('btn-extract-emails')?.addEventListener('click', () => this.extractEmails());
      }, 0);

      return el;
    },

    renderResults() {
      const el = document.createElement('div');

      const count = this.state.emails.length;
      el.innerHTML = `
        <div class="card mb-3" style="padding:var(--sp-3)">
          <div class="flex items-center justify-between">
            <span class="text-sm font-bold">Found ${count} email(s)</span>
            <div class="flex gap-2">
              <button class="btn btn-sm btn-secondary" id="btn-copy-emails">Copy All</button>
              <button class="btn btn-sm btn-primary" id="btn-export-emails">Export CSV</button>
            </div>
          </div>
        </div>
      `;

      // Email list
      const list = document.createElement('div');
      list.className = 'flex flex-col gap-1 stagger-enter';
      this.state.emails.forEach(item => {
        const row = document.createElement('div');
        row.className = 'flex items-center gap-2 text-sm';
        row.style.padding = 'var(--sp-2) var(--sp-3)';
        row.style.background = 'var(--bg-card)';
        row.style.borderRadius = 'var(--radius-sm)';
        row.innerHTML = `
          <span style="color:var(--accent-violet)">@</span>
          <span class="truncate" style="flex:1">${UI.esc(item.email)}</span>
        `;
        list.appendChild(row);
      });
      el.appendChild(list);

      // New scan button
      const newBtn = document.createElement('button');
      newBtn.className = 'btn btn-ghost btn-block mt-3';
      newBtn.textContent = 'New Scan';
      newBtn.addEventListener('click', () => {
        this.state.emails = [];
        window.DataForgeApp?.renderContent();
      });
      el.appendChild(newBtn);

      setTimeout(() => {
        document.getElementById('btn-copy-emails')?.addEventListener('click', () => {
          const text = this.state.emails.map(e => e.email).join('\n');
          navigator.clipboard.writeText(text).then(() => UI.showToast('Emails copied!', 'success'));
        });
        document.getElementById('btn-export-emails')?.addEventListener('click', () => {
          const columns = [
            { id: 'email', name: 'Email' },
            { id: 'sourceURL', name: 'Source URL' },
            { id: 'pageTitle', name: 'Page Title' },
            { id: 'timestamp', name: 'Timestamp' },
          ];
          window.DataForgeExport?.toCSV(columns, this.state.emails, 'emails-export');
          UI.showToast('Exported as CSV', 'success');
        });
      }, 0);

      return el;
    },

    async extractEmails() {
      this.state.extracting = true;
      window.DataForgeApp?.renderContent();

      try {
        const result = await UI.sendMessage({ type: 'EXTRACT_EMAILS' });
        this.state.emails = result?.emails || [];
        if (this.state.emails.length === 0) {
          UI.showToast('No emails found on this page.', 'info');
        } else {
          UI.showToast(`Found ${this.state.emails.length} email(s)!`, 'success');
        }
      } catch (e) {
        UI.showToast('Email extraction failed.', 'error');
      }

      this.state.extracting = false;
      window.DataForgeApp?.renderContent();
    },
  };
})();
