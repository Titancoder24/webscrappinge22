/**
 * DataForge Text Extractor — Clean article text extraction.
 */
(function () {
  'use strict';

  const UI = window.DataForgeUI;
  const Store = window.DataForgeStore;

  window.TextExtractor = {
    state: { result: null, loading: false },

    render() {
      const container = document.createElement('div');
      container.className = 'view-enter';

      container.innerHTML = `
        <div class="section-header mb-3">
          <button class="btn btn-ghost btn-sm" id="btn-back-te">&#8592; Back</button>
          <span class="section-title">Text Extractor</span>
        </div>
      `;

      if (this.state.loading) {
        container.innerHTML += `
          <div style="text-align:center;padding:var(--sp-6)">
            ${UI.spinner('lg')}
            <div class="text-sm text-muted mt-3">Extracting text...</div>
          </div>
        `;
      } else if (this.state.result) {
        container.appendChild(this.renderResult());
      } else {
        const extractBtn = document.createElement('button');
        extractBtn.className = 'btn btn-primary btn-lg btn-block';
        extractBtn.textContent = 'Extract Page Text';
        extractBtn.addEventListener('click', () => this.extractText());
        container.appendChild(extractBtn);

        container.innerHTML += `
          <div class="text-xs text-muted mt-3" style="text-align:center">
            Extracts clean article text, title, author, date, and metadata from the current page.
          </div>
        `;
      }

      setTimeout(() => {
        document.getElementById('btn-back-te')?.addEventListener('click', () => Store.goBack());
      }, 0);

      return container;
    },

    renderResult() {
      const el = document.createElement('div');
      const r = this.state.result;

      el.innerHTML = `
        <div class="card mb-3" style="padding:var(--sp-3)">
          <div class="text-sm font-bold mb-2">${UI.esc(r.title)}</div>
          <div class="flex flex-col gap-1 text-xs text-muted">
            ${r.author ? `<div>Author: ${UI.esc(r.author)}</div>` : ''}
            ${r.publishDate ? `<div>Published: ${UI.esc(r.publishDate)}</div>` : ''}
            <div>Words: ${UI.formatNumber(r.wordCount || 0)}</div>
            <div>Language: ${UI.esc(r.language || 'Unknown')}</div>
          </div>
        </div>

        ${r.metaDescription ? `<div class="card mb-3" style="padding:var(--sp-3)">
          <div class="label">Meta Description</div>
          <div class="text-sm text-secondary">${UI.esc(r.metaDescription)}</div>
        </div>` : ''}

        <div class="card mb-3" style="padding:var(--sp-3);max-height:300px;overflow-y:auto">
          <div class="label">Content</div>
          <div class="text-sm text-secondary" style="white-space:pre-wrap;word-break:break-word">${UI.esc((r.content || '').substring(0, 5000))}${(r.content || '').length > 5000 ? '\n\n... (truncated)' : ''}</div>
        </div>

        <div class="flex gap-2">
          <button class="btn btn-secondary flex-1" id="btn-copy-text">Copy Text</button>
          <button class="btn btn-secondary flex-1" id="btn-copy-json">Copy as JSON</button>
          <button class="btn btn-primary flex-1" id="btn-export-text">Export</button>
        </div>

        <button class="btn btn-ghost btn-block mt-2" id="btn-new-text">Extract Another Page</button>
      `;

      setTimeout(() => {
        document.getElementById('btn-copy-text')?.addEventListener('click', () => {
          navigator.clipboard.writeText(r.content || '').then(() => UI.showToast('Text copied!', 'success'));
        });
        document.getElementById('btn-copy-json')?.addEventListener('click', () => {
          navigator.clipboard.writeText(JSON.stringify(r, null, 2)).then(() => UI.showToast('JSON copied!', 'success'));
        });
        document.getElementById('btn-export-text')?.addEventListener('click', () => {
          const columns = Object.keys(r).filter(k => k !== 'html').map(k => ({ id: k, name: k }));
          window.DataForgeExport?.toCSV(columns, [r], 'text-export');
          UI.showToast('Exported as CSV', 'success');
        });
        document.getElementById('btn-new-text')?.addEventListener('click', () => {
          this.state.result = null;
          window.DataForgeApp?.renderContent();
        });
      }, 0);

      return el;
    },

    async extractText() {
      this.state.loading = true;
      window.DataForgeApp?.renderContent();

      try {
        const result = await UI.sendMessage({ type: 'EXTRACT_TEXT' });
        if (result && !result.error) {
          this.state.result = result;
          UI.showToast('Text extracted successfully!', 'success');
        } else {
          UI.showToast('No text content found.', 'info');
        }
      } catch (e) {
        UI.showToast('Text extraction failed.', 'error');
      }

      this.state.loading = false;
      window.DataForgeApp?.renderContent();
    },
  };
})();
