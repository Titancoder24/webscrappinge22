/**
 * DataForge Tools Menu — Main home screen with tool cards and Quick Extract.
 */
(function () {
  'use strict';

  const UI = window.DataForgeUI;
  const Store = window.DataForgeStore;

  const TOOLS = [
    {
      id: 'list',
      title: 'List Extractor',
      desc: 'Extract repeating data from any page',
      iconClass: 'violet',
      icon: '&#9776;', // list icon
    },
    {
      id: 'page',
      title: 'Page Extractor',
      desc: 'Bulk extract from multiple URLs',
      iconClass: 'emerald',
      icon: '&#9741;', // document icon
    },
    {
      id: 'email',
      title: 'Email Extractor',
      desc: 'Find and extract email addresses',
      iconClass: 'info',
      icon: '@',
    },
    {
      id: 'image',
      title: 'Image Downloader',
      desc: 'Detect and download all images',
      iconClass: 'warning',
      icon: '&#9634;', // picture icon
    },
    {
      id: 'text',
      title: 'Text Extractor',
      desc: 'Extract clean article text',
      iconClass: 'teal',
      icon: 'T',
    },
    {
      id: 'templates',
      title: 'Templates',
      desc: 'Saved extraction configurations',
      iconClass: 'error',
      icon: '&#9881;', // gear icon
    },
  ];

  window.ToolsMenu = {
    render() {
      const container = document.createElement('div');
      container.className = 'stagger-enter';

      // Compliance banner
      container.innerHTML = UI.complianceBanner();

      // Quick Extract button
      const quickBtn = document.createElement('button');
      quickBtn.className = 'quick-extract-btn mb-4';
      quickBtn.innerHTML = `&#9889; Quick Extract`;
      quickBtn.addEventListener('click', () => this.quickExtract());
      container.appendChild(quickBtn);

      // Tool cards
      TOOLS.forEach(tool => {
        const card = document.createElement('div');
        card.className = 'tool-card mb-2';
        card.innerHTML = `
          <div class="tool-card-icon ${tool.iconClass}">${tool.icon}</div>
          <div class="tool-card-info">
            <div class="tool-card-title">${tool.title}</div>
            <div class="tool-card-desc">${tool.desc}</div>
          </div>
          <div class="tool-card-arrow">&#8250;</div>
        `;
        card.addEventListener('click', () => Store.setActiveTool(tool.id));
        container.appendChild(card);
      });

      return container;
    },

    async quickExtract() {
      UI.showToast('Scanning page for data patterns...', 'info');

      try {
        const result = await UI.sendMessage({ type: 'SCAN_PAGE' });

        if (result && result.patterns && result.patterns.length > 0) {
          Store.setDetectedPatterns(result.patterns);
          Store.setActiveTool('list');
          // Auto-select top pattern
          const top = result.patterns[0];
          Store.selectPattern({
            id: top.id,
            selector: top.selector,
            itemCount: top.itemCount,
            category: top.category,
            confidence: top.confidence,
            fields: top.fields || [],
            pagination: result.pagination || [],
            sampleData: [],
          });
          UI.showToast(`Found ${top.itemCount} ${top.category || 'items'}!`, 'success');
        } else {
          UI.showToast('No data patterns detected on this page. Try the List Extractor for manual selection.', 'info');
          Store.setActiveTool('list');
        }
      } catch (e) {
        UI.showToast('Could not scan page. Make sure you\'re on a webpage.', 'error');
      }
    },
  };
})();
