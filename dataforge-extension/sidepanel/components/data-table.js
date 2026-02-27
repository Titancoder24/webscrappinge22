/**
 * DataForge Data Table — Virtualized spreadsheet with sort, filter, search, export.
 */
(function () {
  'use strict';

  const UI = window.DataForgeUI;
  const Store = window.DataForgeStore;

  const ROW_HEIGHT = 32;
  const BUFFER_ROWS = 10;

  window.DataTable = {
    scrollTop: 0,
    editingCell: null,

    render() {
      const state = Store.getState();
      const { tableData, tableSearch } = state;
      const { columns, rows } = tableData;

      if (!rows || rows.length === 0) {
        const el = document.createElement('div');
        el.innerHTML = UI.emptyState('&#9634;', 'No Data Yet', 'Extract data from a website to see it here, or load from history.');
        return el;
      }

      const container = document.createElement('div');
      container.className = 'data-table-container';
      container.style.height = '100%';

      // Toolbar
      const toolbar = document.createElement('div');
      toolbar.className = 'table-toolbar';
      toolbar.innerHTML = `
        <div class="table-search">
          <svg class="table-search-icon" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input type="text" placeholder="Search..." id="table-search-input" value="${UI.esc(tableSearch)}">
        </div>
        <div class="export-dropdown">
          <button class="btn btn-sm btn-secondary" id="btn-export">Export</button>
          <div class="export-menu hidden" id="export-menu">
            <button class="export-menu-item" data-format="csv">CSV</button>
            <button class="export-menu-item" data-format="json">JSON</button>
            <button class="export-menu-item" data-format="xlsx">Excel (XLSX)</button>
            <button class="export-menu-item" data-format="clipboard">Copy to Clipboard</button>
          </div>
        </div>
        <span class="text-xs text-muted">${UI.formatNumber(rows.length)} rows</span>
      `;
      container.appendChild(toolbar);

      // Filter visible rows by search
      let displayRows = rows;
      if (tableSearch) {
        const search = tableSearch.toLowerCase();
        displayRows = rows.filter(row =>
          Object.values(row).some(v => String(v).toLowerCase().includes(search))
        );
      }

      // Apply sorts
      if (state.tableSorts.length > 0) {
        displayRows = [...displayRows];
        const sort = state.tableSorts[0];
        displayRows.sort((a, b) => {
          const va = String(a[sort.column] || '');
          const vb = String(b[sort.column] || '');
          const cmp = va.localeCompare(vb, undefined, { numeric: true });
          return sort.direction === 'desc' ? -cmp : cmp;
        });
      }

      // Table wrapper (scrollable)
      const wrapper = document.createElement('div');
      wrapper.className = 'table-wrapper';
      wrapper.id = 'table-wrapper';

      const table = document.createElement('table');
      table.className = 'data-table';

      // Header
      const thead = document.createElement('thead');
      const headerRow = document.createElement('tr');

      // Row number column
      const thNum = document.createElement('th');
      thNum.style.width = '40px';
      thNum.textContent = '#';
      headerRow.appendChild(thNum);

      columns.forEach(col => {
        const th = document.createElement('th');
        th.textContent = col.name;
        th.dataset.colId = col.id;

        // Sort indicator
        const currentSort = state.tableSorts.find(s => s.column === col.id);
        if (currentSort) {
          th.innerHTML += ` <span class="sort-icon active">${currentSort.direction === 'asc' ? '&#9650;' : '&#9660;'}</span>`;
        } else {
          th.innerHTML += ` <span class="sort-icon">&#9650;</span>`;
        }

        th.addEventListener('click', () => {
          this.toggleSort(col.id);
        });
        headerRow.appendChild(th);
      });
      thead.appendChild(headerRow);
      table.appendChild(thead);

      // Body — virtualized
      const tbody = document.createElement('tbody');
      const totalHeight = displayRows.length * ROW_HEIGHT;
      const viewportHeight = 400; // approximate

      const startIdx = Math.max(0, Math.floor(this.scrollTop / ROW_HEIGHT) - BUFFER_ROWS);
      const endIdx = Math.min(displayRows.length, Math.ceil((this.scrollTop + viewportHeight) / ROW_HEIGHT) + BUFFER_ROWS);

      // Spacer for top
      if (startIdx > 0) {
        const spacer = document.createElement('tr');
        spacer.style.height = (startIdx * ROW_HEIGHT) + 'px';
        tbody.appendChild(spacer);
      }

      for (let i = startIdx; i < endIdx; i++) {
        const row = displayRows[i];
        const tr = document.createElement('tr');

        // Row number
        const tdNum = document.createElement('td');
        tdNum.style.width = '40px';
        tdNum.style.color = 'var(--text-muted)';
        tdNum.style.fontSize = 'var(--font-size-xs)';
        tdNum.textContent = i + 1;
        tr.appendChild(tdNum);

        columns.forEach(col => {
          const td = document.createElement('td');
          td.className = 'editable';
          td.textContent = row[col.id] || '';
          td.title = row[col.id] || '';
          td.tabIndex = 0;
          td.dataset.rowIdx = i;
          td.dataset.colId = col.id;

          // Inline edit
          td.addEventListener('dblclick', () => {
            this.startCellEdit(td, i, col.id, displayRows);
          });
          tr.appendChild(td);
        });

        tbody.appendChild(tr);
      }

      // Spacer for bottom
      const bottomSpace = Math.max(0, (displayRows.length - endIdx) * ROW_HEIGHT);
      if (bottomSpace > 0) {
        const spacer = document.createElement('tr');
        spacer.style.height = bottomSpace + 'px';
        tbody.appendChild(spacer);
      }

      table.appendChild(tbody);
      wrapper.appendChild(table);

      // Scroll handler for virtualization
      wrapper.addEventListener('scroll', () => {
        this.scrollTop = wrapper.scrollTop;
        // Re-render on significant scroll
        const newStart = Math.max(0, Math.floor(wrapper.scrollTop / ROW_HEIGHT) - BUFFER_ROWS);
        if (Math.abs(newStart - startIdx) > BUFFER_ROWS / 2) {
          window.DataForgeApp?.renderContent();
        }
      });

      container.appendChild(wrapper);

      // Footer
      const footer = document.createElement('div');
      footer.className = 'table-footer';
      footer.innerHTML = `
        <span>${UI.formatNumber(displayRows.length)} of ${UI.formatNumber(rows.length)} rows</span>
        <span>${columns.length} columns</span>
      `;
      container.appendChild(footer);

      // Bind events
      setTimeout(() => {
        const searchInput = document.getElementById('table-search-input');
        if (searchInput) {
          let debounce;
          searchInput.addEventListener('input', (e) => {
            clearTimeout(debounce);
            debounce = setTimeout(() => {
              Store.setState({ tableSearch: e.target.value });
            }, 200);
          });
        }

        const exportBtn = document.getElementById('btn-export');
        const exportMenu = document.getElementById('export-menu');
        if (exportBtn && exportMenu) {
          exportBtn.addEventListener('click', () => {
            exportMenu.classList.toggle('hidden');
          });
          exportMenu.querySelectorAll('.export-menu-item').forEach(item => {
            item.addEventListener('click', () => {
              this.exportData(item.dataset.format, columns, displayRows);
              exportMenu.classList.add('hidden');
            });
          });
        }
      }, 0);

      return container;
    },

    toggleSort(columnId) {
      const state = Store.getState();
      const sorts = [...state.tableSorts];
      const existing = sorts.findIndex(s => s.column === columnId);

      if (existing >= 0) {
        if (sorts[existing].direction === 'asc') {
          sorts[existing].direction = 'desc';
        } else {
          sorts.splice(existing, 1);
        }
      } else {
        sorts.unshift({ column: columnId, direction: 'asc' });
      }

      Store.setState({ tableSorts: sorts.slice(0, 3) });
    },

    startCellEdit(td, rowIdx, colId, displayRows) {
      const currentValue = displayRows[rowIdx][colId] || '';
      const input = document.createElement('input');
      input.type = 'text';
      input.value = currentValue;
      input.className = 'input';
      input.style.cssText = 'padding:2px 4px;font-size:11px;height:auto;';

      td.textContent = '';
      td.appendChild(input);
      input.focus();
      input.select();

      const finish = () => {
        const newValue = input.value;
        td.textContent = newValue;
        td.title = newValue;

        // Update in store
        const state = Store.getState();
        const rows = [...state.tableData.rows];
        if (rows[rowIdx]) {
          rows[rowIdx] = { ...rows[rowIdx], [colId]: newValue };
          Store.setTableData({ ...state.tableData, rows });
        }
      };

      input.addEventListener('blur', finish);
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { input.blur(); }
        if (e.key === 'Escape') { td.textContent = currentValue; }
      });
    },

    async exportData(format, columns, rows) {
      const ExportEngine = window.DataForgeExport;
      if (!ExportEngine) {
        UI.showToast('Export engine not loaded.', 'error');
        return;
      }

      try {
        switch (format) {
          case 'csv':
            ExportEngine.toCSV(columns, rows, 'dataforge-export');
            break;
          case 'json':
            ExportEngine.toJSON(columns, rows, 'dataforge-export');
            break;
          case 'xlsx':
            ExportEngine.toXLSX(columns, rows, 'dataforge-export');
            break;
          case 'clipboard':
            await ExportEngine.toClipboard(columns, rows);
            UI.showToast('Copied to clipboard!', 'success');
            return;
        }
        UI.showToast(`Exported as ${format.toUpperCase()}`, 'success');
      } catch (e) {
        UI.showToast('Export failed: ' + e.message, 'error');
      }
    },
  };
})();
