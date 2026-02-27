/**
 * DataForge Image Downloader — Detect and download images from any page.
 */
(function () {
  'use strict';

  const UI = window.DataForgeUI;
  const Store = window.DataForgeStore;

  window.ImageDownloader = {
    state: { images: [], selected: new Set(), loading: false, filter: 'all' },

    render() {
      const container = document.createElement('div');
      container.className = 'view-enter';

      container.innerHTML = `
        <div class="section-header mb-3">
          <button class="btn btn-ghost btn-sm" id="btn-back-img">&#8592; Back</button>
          <span class="section-title">Image Downloader</span>
        </div>
      `;

      if (this.state.loading) {
        container.innerHTML += `
          <div style="text-align:center;padding:var(--sp-6)">
            ${UI.spinner('lg')}
            <div class="text-sm text-muted mt-3">Detecting images...</div>
          </div>
        `;
      } else if (this.state.images.length > 0) {
        container.appendChild(this.renderGallery());
      } else {
        const scanBtn = document.createElement('button');
        scanBtn.className = 'btn btn-primary btn-lg btn-block';
        scanBtn.textContent = 'Detect Images on Page';
        scanBtn.addEventListener('click', () => this.detectImages());
        container.appendChild(scanBtn);
      }

      setTimeout(() => {
        document.getElementById('btn-back-img')?.addEventListener('click', () => Store.goBack());
      }, 0);

      return container;
    },

    renderGallery() {
      const el = document.createElement('div');
      const { images, selected, filter } = this.state;

      // Toolbar
      el.innerHTML = `
        <div class="flex items-center justify-between mb-3">
          <span class="text-sm">${images.length} images found</span>
          <div class="flex gap-2">
            <button class="btn btn-sm ${selected.size > 0 ? 'btn-ghost' : 'btn-secondary'}" id="btn-select-all">
              ${selected.size === images.length ? 'Deselect All' : 'Select All'}
            </button>
            <button class="btn btn-sm btn-primary" id="btn-download-selected" ${selected.size === 0 ? 'disabled' : ''}>
              Download (${selected.size})
            </button>
          </div>
        </div>
      `;

      // Filter
      el.innerHTML += `
        <div class="flex gap-1 mb-3">
          <button class="btn btn-sm ${filter === 'all' ? 'btn-secondary' : 'btn-ghost'}" data-filter="all">All</button>
          <button class="btn btn-sm ${filter === 'large' ? 'btn-secondary' : 'btn-ghost'}" data-filter="large">Large</button>
          <button class="btn btn-sm ${filter === 'medium' ? 'btn-secondary' : 'btn-ghost'}" data-filter="medium">Medium</button>
          <button class="btn btn-sm ${filter === 'small' ? 'btn-secondary' : 'btn-ghost'}" data-filter="small">Small</button>
        </div>
      `;

      // Image grid
      const filteredImages = this.filterImages(images, filter);
      const grid = document.createElement('div');
      grid.className = 'image-grid';

      filteredImages.forEach((img, i) => {
        const item = document.createElement('div');
        item.className = 'image-grid-item' + (selected.has(img.url) ? ' selected' : '');
        item.innerHTML = `
          <img src="${UI.esc(img.url)}" alt="${UI.esc(img.alt)}" loading="lazy" onerror="this.style.display='none'">
          <div class="image-info">${img.width || '?'}x${img.height || '?'}</div>
          <div class="image-check">&#10003;</div>
        `;
        item.addEventListener('click', () => {
          if (selected.has(img.url)) {
            selected.delete(img.url);
          } else {
            selected.add(img.url);
          }
          window.DataForgeApp?.renderContent();
        });
        grid.appendChild(item);
      });

      el.appendChild(grid);

      // Rescan button
      const rescanBtn = document.createElement('button');
      rescanBtn.className = 'btn btn-ghost btn-block mt-3';
      rescanBtn.textContent = 'Rescan Page';
      rescanBtn.addEventListener('click', () => this.detectImages());
      el.appendChild(rescanBtn);

      setTimeout(() => {
        document.getElementById('btn-select-all')?.addEventListener('click', () => {
          if (selected.size === images.length) {
            selected.clear();
          } else {
            images.forEach(img => selected.add(img.url));
          }
          window.DataForgeApp?.renderContent();
        });

        document.getElementById('btn-download-selected')?.addEventListener('click', () => {
          this.downloadSelected();
        });

        el.querySelectorAll('[data-filter]').forEach(btn => {
          btn.addEventListener('click', () => {
            this.state.filter = btn.dataset.filter;
            window.DataForgeApp?.renderContent();
          });
        });
      }, 0);

      return el;
    },

    filterImages(images, filter) {
      if (filter === 'all') return images;
      return images.filter(img => {
        const size = Math.max(img.width || 0, img.height || 0);
        if (filter === 'large') return size >= 500;
        if (filter === 'medium') return size >= 100 && size < 500;
        if (filter === 'small') return size < 100;
        return true;
      });
    },

    async detectImages() {
      this.state.loading = true;
      this.state.images = [];
      this.state.selected.clear();
      window.DataForgeApp?.renderContent();

      try {
        const result = await UI.sendMessage({ type: 'EXTRACT_IMAGES' });
        this.state.images = result?.images || [];
        if (this.state.images.length === 0) {
          UI.showToast('No images found on this page.', 'info');
        } else {
          UI.showToast(`Found ${this.state.images.length} images.`, 'success');
        }
      } catch (e) {
        UI.showToast('Image detection failed.', 'error');
      }

      this.state.loading = false;
      window.DataForgeApp?.renderContent();
    },

    downloadSelected() {
      const { selected, images } = this.state;
      const toDownload = images.filter(img => selected.has(img.url));

      toDownload.forEach((img, i) => {
        setTimeout(() => {
          chrome.downloads.download({ url: img.url, conflictAction: 'uniquify' });
        }, i * 200); // Stagger downloads
      });

      UI.showToast(`Downloading ${toDownload.length} images...`, 'success');
    },
  };
})();
