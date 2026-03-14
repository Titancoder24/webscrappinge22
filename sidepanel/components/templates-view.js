/**
 * DataForge Templates View — Save and reuse extraction configurations.
 */
(function () {
  'use strict';

  const UI = window.DataForgeUI;
  const Store = window.DataForgeStore;

  window.TemplatesView = {
    render() {
      const state = Store.getState();
      const { templates } = state;

      const container = document.createElement('div');
      container.className = 'view-enter';

      container.innerHTML = `
        <div class="section-header mb-3">
          <button class="btn btn-ghost btn-sm" id="btn-back-tpl">&#8592; Back</button>
          <span class="section-title">Templates</span>
        </div>
      `;

      if (templates.length === 0) {
        container.innerHTML += UI.emptyState(
          '&#9881;',
          'No Templates Yet',
          'Save an extraction configuration as a template to reuse it later.'
        );

        // Tip
        const tip = document.createElement('div');
        tip.className = 'text-xs text-muted mt-4';
        tip.style.textAlign = 'center';
        tip.textContent = 'After configuring a List Extraction, you can save it as a template.';
        container.appendChild(tip);
      } else {
        const list = document.createElement('div');
        list.className = 'flex flex-col gap-2 stagger-enter';

        templates.forEach(template => {
          const card = document.createElement('div');
          card.className = 'card card-clickable';
          card.innerHTML = `
            <div class="flex items-center justify-between mb-2">
              <div class="text-sm font-bold">${UI.esc(template.name)}</div>
              <span class="badge badge-violet">${template.fields?.length || 0} fields</span>
            </div>
            <div class="text-xs text-muted">${UI.esc(template.description || '')}</div>
            <div class="text-xs text-muted mt-1">
              Domain: ${UI.esc(template.domain || 'Any')} &middot; Last used: ${UI.formatRelativeTime(template.lastUsed || template.createdAt)}
            </div>
            <div class="flex gap-2 mt-3">
              <button class="btn btn-sm btn-primary flex-1" data-action="apply" data-id="${template.id}">Apply</button>
              <button class="btn btn-sm btn-danger-ghost" data-action="delete" data-id="${template.id}">Delete</button>
            </div>
          `;

          card.addEventListener('click', (e) => {
            const action = e.target.closest('[data-action]');
            if (!action) return;
            const id = action.dataset.id;
            if (action.dataset.action === 'apply') {
              this.applyTemplate(id);
            } else if (action.dataset.action === 'delete') {
              Store.removeTemplate(id);
              window.DataForgeApp?.renderContent();
              UI.showToast('Template deleted.', 'info');
            }
          });

          list.appendChild(card);
        });

        container.appendChild(list);
      }

      setTimeout(() => {
        document.getElementById('btn-back-tpl')?.addEventListener('click', () => Store.goBack());
      }, 0);

      return container;
    },

    applyTemplate(id) {
      const state = Store.getState();
      const template = state.templates.find(t => t.id === id);
      if (!template) return;

      Store.setState({
        activeTool: 'list',
        activeStep: 1,
        selectedConfig: {
          selector: template.selector,
          itemCount: 0,
          category: template.category || 'generic',
          confidence: 0.8,
          fields: template.fields || [],
          pagination: template.pagination || [],
          sampleData: [],
        },
      });

      // Update last used
      const templates = state.templates.map(t =>
        t.id === id ? { ...t, lastUsed: new Date().toISOString() } : t
      );
      Store.setState({ templates });
      Store._persistTemplates(templates);

      UI.showToast('Template applied. Verify the selector matches on this page.', 'info');
    },

    /**
     * Save current extraction config as a template.
     * Called from the extraction flow.
     */
    saveCurrentAsTemplate() {
      const state = Store.getState();
      const config = state.selectedConfig;
      if (!config) {
        UI.showToast('No active extraction to save.', 'error');
        return;
      }

      const name = prompt('Template name:');
      if (!name) return;

      const template = {
        id: UI.uid(),
        name,
        description: '',
        domain: new URL(window.location.href || 'https://example.com').hostname,
        selector: config.selector,
        category: config.category,
        fields: config.fields,
        pagination: config.pagination,
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
      };

      Store.addTemplate(template);
      UI.showToast('Template saved!', 'success');
    },
  };
})();
