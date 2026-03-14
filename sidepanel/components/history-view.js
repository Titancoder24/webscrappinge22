/**
 * DataForge History View — Browse past extractions.
 */
(function () {
  'use strict';

  const UI = window.DataForgeUI;
  const Store = window.DataForgeStore;

  const TYPE_ICONS = {
    list: '&#9776;',
    page: '&#9741;',
    email: '@',
    image: '&#9634;',
    text: 'T',
  };

  window.HistoryView = {
    render() {
      const state = Store.getState();
      const { history } = state;

      const container = document.createElement('div');

      if (history.length === 0) {
        container.innerHTML = UI.emptyState('&#9203;', 'No History Yet', 'Your past extractions will appear here.');
        return container;
      }

      // Search
      container.innerHTML = `
        <div class="table-search mb-3">
          <svg class="table-search-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="text" placeholder="Search history..." id="history-search-input">
        </div>
      `;

      // History list
      const list = document.createElement('div');
      list.className = 'flex flex-col gap-2 stagger-enter';
      list.id = 'history-list';

      history.forEach(item => {
        const card = document.createElement('div');
        card.className = 'history-item';
        card.innerHTML = `
          <div class="history-icon">${TYPE_ICONS[item.type] || '&#9632;'}</div>
          <div class="history-info">
            <div class="history-title">${UI.esc(item.title || 'Untitled')}</div>
            <div class="history-meta">
              <span>${item.rowCount || 0} rows</span>
              <span>&middot;</span>
              <span>${UI.formatRelativeTime(item.date)}</span>
            </div>
          </div>
          <div class="history-actions">
            <button class="icon-btn" title="Open" data-action="open" data-id="${item.id}">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15,3 21,3 21,9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
            </button>
            <button class="icon-btn" title="Delete" data-action="delete" data-id="${item.id}" style="color:var(--error)">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            </button>
          </div>
        `;

        card.addEventListener('click', (e) => {
          const action = e.target.closest('[data-action]');
          if (action) {
            e.stopPropagation();
            const id = action.dataset.id;
            if (action.dataset.action === 'delete') {
              this.deleteItem(id);
            } else {
              this.openItem(id);
            }
          } else {
            this.openItem(item.id);
          }
        });

        list.appendChild(card);
      });

      container.appendChild(list);

      // Clear all
      if (history.length > 0) {
        const clearBtn = document.createElement('button');
        clearBtn.className = 'btn btn-ghost btn-block mt-4 text-xs';
        clearBtn.textContent = 'Clear All History';
        clearBtn.addEventListener('click', () => {
          if (confirm('Clear all extraction history? This cannot be undone.')) {
            Store.setState({ history: [] });
            chrome.storage.local.set({ history: [] });
            window.DataForgeApp?.renderContent();
          }
        });
        container.appendChild(clearBtn);
      }

      // Search binding
      setTimeout(() => {
        const searchInput = document.getElementById('history-search-input');
        if (searchInput) {
          searchInput.addEventListener('input', (e) => {
            const query = e.target.value.toLowerCase();
            const items = document.querySelectorAll('.history-item');
            items.forEach(item => {
              const text = item.textContent.toLowerCase();
              item.style.display = text.includes(query) ? '' : 'none';
            });
          });
        }
      }, 0);

      return container;
    },

    async openItem(id) {
      try {
        const data = await Store.loadTableFromIDB(id);
        if (data) {
          Store.setState({
            activeTab: 'data',
            activeTableId: id,
            tableData: { columns: data.columns || [], rows: data.rows || [] },
          });
        } else {
          UI.showToast('Data not found. It may have been deleted.', 'error');
        }
      } catch (e) {
        UI.showToast('Failed to load data.', 'error');
      }
    },

    async deleteItem(id) {
      Store.removeHistoryItem(id);
      try {
        await Store.deleteTableFromIDB(id);
      } catch (e) { /* ignore */ }
      UI.showToast('Deleted.', 'info');
      window.DataForgeApp?.renderContent();
    },
  };
})();
