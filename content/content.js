/**
 * DataForge Content Script — Main Orchestrator
 * Coordinates all engines, handles user interactions, manages overlays,
 * and communicates with background/sidepanel via Chrome messaging.
 */
(function () {
  'use strict';

  // Prevent double-injection
  if (window.__dataforge_loaded) return;
  window.__dataforge_loaded = true;

  const DF = window.DataForge || {};

  // ============================================================
  // STATE
  // ============================================================
  const state = {
    mode: 'idle', // idle | selecting | extracting | paused
    selectionType: 'list', // list | element | pagination | email | image
    patternSense: new DF.PatternSense(),
    selectorForge: new DF.SelectorForge(),
    pageSense: new DF.PageSense(),
    typeSense: new DF.TypeSense(),
    cleanSense: new DF.CleanSense({ baseURL: window.location.origin }),
    // Selection state
    detectedPatterns: [],
    selectedPattern: null,
    selectedElements: [],
    excludedElements: new Set(),
    hoveredElement: null,
    // Extraction state
    extractionConfig: null,
    extractedRows: [],
    extractionAborted: false,
    currentPage: 0,
    // UI elements
    tooltip: null,
    matchBadge: null,
    extractionCounter: null,
    patternBadges: [],
    highlightedElements: [],
  };

  // ============================================================
  // OVERLAY UI
  // ============================================================

  function createTooltip() {
    if (state.tooltip) return state.tooltip;
    const el = document.createElement('div');
    el.className = 'df-cursor-tooltip';
    document.body.appendChild(el);
    state.tooltip = el;
    return el;
  }

  function updateTooltip(x, y, html) {
    const tip = createTooltip();
    tip.innerHTML = html;
    tip.style.left = x + 'px';
    tip.style.top = y + 'px';
    tip.classList.add('df-visible');

    // Keep tooltip on screen
    const rect = tip.getBoundingClientRect();
    if (rect.right > window.innerWidth) {
      tip.style.left = (x - rect.width - 16) + 'px';
    }
    if (rect.bottom > window.innerHeight) {
      tip.style.top = (y - rect.height - 16) + 'px';
    }
  }

  function hideTooltip() {
    if (state.tooltip) {
      state.tooltip.classList.remove('df-visible');
    }
  }

  function showMatchBadge(count) {
    removeMatchBadge();
    const el = document.createElement('div');
    el.className = 'df-match-badge';
    el.innerHTML = `<span class="df-check">&#10003;</span> ${count} items selected`;
    document.body.appendChild(el);
    state.matchBadge = el;
  }

  function removeMatchBadge() {
    if (state.matchBadge) {
      state.matchBadge.remove();
      state.matchBadge = null;
    }
  }

  function showExtractionCounter() {
    removeExtractionCounter();
    const el = document.createElement('div');
    el.className = 'df-extraction-counter';
    el.innerHTML = `
      <div class="df-pulse-dot"></div>
      <div>
        <div class="df-count" id="df-counter-value">0</div>
        <div class="df-label">extracted</div>
      </div>
    `;
    document.body.appendChild(el);
    state.extractionCounter = el;
  }

  function updateExtractionCounter(count) {
    const el = document.getElementById('df-counter-value');
    if (el) el.textContent = count.toLocaleString();
  }

  function removeExtractionCounter() {
    if (state.extractionCounter) {
      state.extractionCounter.remove();
      state.extractionCounter = null;
    }
  }

  function showShockwave(x, y) {
    const el = document.createElement('div');
    el.className = 'df-shockwave';
    el.style.left = x + 'px';
    el.style.top = y + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 600);
  }

  function clearPatternBadges() {
    state.patternBadges.forEach(b => b.remove());
    state.patternBadges = [];
  }

  // ============================================================
  // HIGHLIGHT MANAGEMENT
  // ============================================================

  function highlightElements(elements, className = 'df-highlight', stagger = false) {
    clearHighlights();
    elements.forEach((el, i) => {
      if (state.excludedElements.has(el)) {
        el.classList.add('df-highlight-excluded');
      } else if (stagger) {
        setTimeout(() => {
          el.classList.add(className);
          el.classList.add('df-highlight-wave');
          el.style.animationDelay = (i * 30) + 'ms';
        }, i * 30);
      } else {
        el.classList.add(className);
      }
      state.highlightedElements.push(el);
    });
  }

  function clearHighlights() {
    state.highlightedElements.forEach(el => {
      el.classList.remove(
        'df-highlight', 'df-highlight-hover', 'df-highlight-selected',
        'df-highlight-excluded', 'df-highlight-wave', 'df-scanning', 'df-scraped'
      );
      el.style.animationDelay = '';
    });
    state.highlightedElements = [];
  }

  function highlightHover(el) {
    clearHoverHighlight();
    if (!el || el === document.body || el === document.documentElement) return;

    // Smart detection: find pattern around hovered element
    const patterns = state.patternSense.scanAroundElement(el);
    if (patterns.length > 0 && patterns[0].allElements) {
      const items = patterns[0].allElements;
      items.forEach(item => item.classList.add('df-highlight-hover'));
      state.hoveredElement = { element: el, group: items, pattern: patterns[0] };

      updateTooltip(
        parseInt(el.getBoundingClientRect().left),
        parseInt(el.getBoundingClientRect().top) - 30,
        `<span class="df-tooltip-count">${items.length}</span> ${patterns[0].category || 'items'} detected`
      );
    } else {
      el.classList.add('df-highlight-hover');
      state.hoveredElement = { element: el, group: [el], pattern: null };
      hideTooltip();
    }
  }

  function clearHoverHighlight() {
    if (state.hoveredElement && state.hoveredElement.group) {
      state.hoveredElement.group.forEach(el => el.classList.remove('df-highlight-hover'));
    }
    state.hoveredElement = null;
  }

  // ============================================================
  // SELECTION MODE
  // ============================================================

  function activateSelectionMode(mode = 'list') {
    state.mode = 'selecting';
    state.selectionType = mode;
    document.body.classList.add('df-selection-active');

    // Add event listeners
    document.addEventListener('mousemove', onSelectionMouseMove, true);
    document.addEventListener('click', onSelectionClick, true);
    document.addEventListener('keydown', onSelectionKeydown, true);
  }

  function deactivateSelectionMode() {
    state.mode = 'idle';
    document.body.classList.remove('df-selection-active');
    clearHighlights();
    clearHoverHighlight();
    hideTooltip();
    removeMatchBadge();
    clearPatternBadges();

    document.removeEventListener('mousemove', onSelectionMouseMove, true);
    document.removeEventListener('click', onSelectionClick, true);
    document.removeEventListener('keydown', onSelectionKeydown, true);
  }

  let lastMoveTarget = null;
  const onSelectionMouseMove = throttle(function (e) {
    if (state.mode !== 'selecting') return;

    const target = document.elementFromPoint(e.clientX, e.clientY);
    if (!target || target === lastMoveTarget) return;
    if (target.className && typeof target.className === 'string' && target.className.includes('df-')) return;
    lastMoveTarget = target;

    highlightHover(target);

    // Update tooltip position
    if (state.hoveredElement) {
      const count = state.hoveredElement.group.length;
      const cat = state.hoveredElement.pattern?.category || 'items';
      updateTooltip(e.clientX, e.clientY,
        `<span class="df-tooltip-count">${count}</span> ${cat} detected`
      );
    }
  }, 50);

  function onSelectionClick(e) {
    if (state.mode !== 'selecting') return;

    // Ignore clicks on our UI
    const target = e.target;
    if (target.className && typeof target.className === 'string' && target.className.includes('df-')) return;

    e.preventDefault();
    e.stopPropagation();

    // If Alt key held, exclude element
    if (e.altKey && state.selectedElements.length > 0) {
      state.excludedElements.add(target);
      target.classList.remove('df-highlight', 'df-highlight-selected');
      target.classList.add('df-highlight-excluded');
      return;
    }

    // Shockwave animation
    showShockwave(e.clientX, e.clientY);

    if (state.hoveredElement && state.hoveredElement.pattern) {
      // Select the detected pattern
      selectPattern(state.hoveredElement.pattern);
    } else {
      // Single element selection — try to find a group
      const patterns = state.patternSense.scanAroundElement(target);
      if (patterns.length > 0) {
        selectPattern(patterns[0]);
      } else {
        // Select just this element
        state.selectedElements = [target];
        highlightElements([target], 'df-highlight-selected');
        showMatchBadge(1);
        sendSelectionToPanel([target], null);
      }
    }
  }

  function onSelectionKeydown(e) {
    if (state.mode !== 'selecting') return;

    // Arrow up: broaden selection (parent level)
    if (e.key === 'ArrowUp' && state.selectedPattern) {
      e.preventDefault();
      broadenSelection();
    }

    // Arrow down: narrow selection (child level)
    if (e.key === 'ArrowDown' && state.selectedPattern) {
      e.preventDefault();
      narrowSelection();
    }

    // Escape: deactivate
    if (e.key === 'Escape') {
      e.preventDefault();
      deactivateSelectionMode();
      chrome.runtime.sendMessage({ type: 'SELECTION_CANCELLED' });
    }
  }

  function selectPattern(pattern) {
    state.selectedPattern = pattern;

    // Resolve elements via selector
    let elements;
    try {
      elements = Array.from(document.querySelectorAll(pattern.selector));
    } catch (e) {
      elements = pattern.allElements || pattern.sampleElements || [];
    }

    state.selectedElements = elements;

    // Highlight with stagger animation
    highlightElements(elements, 'df-highlight-selected', true);
    showMatchBadge(elements.length);

    // Analyze fields
    const fields = state.typeSense.analyzeSchema(elements.slice(0, 5));

    // Detect pagination
    const pagination = state.pageSense.detect(document);

    // Send to side panel
    sendSelectionToPanel(elements, pattern, fields, pagination);
  }

  function broadenSelection() {
    if (!state.selectedElements.length) return;
    const first = state.selectedElements[0];
    const parent = first.parentElement;
    if (!parent || parent === document.body) return;

    const grandparent = parent.parentElement;
    if (!grandparent) return;

    // Re-scan at higher level
    const patterns = state.patternSense.scanAroundElement(grandparent);
    if (patterns.length > 0) {
      selectPattern(patterns[0]);
    }
  }

  function narrowSelection() {
    if (!state.selectedElements.length) return;
    const first = state.selectedElements[0];
    if (first.children.length < 3) return;

    // Re-scan at child level
    const patterns = state.patternSense.scanAroundElement(first.children[0]);
    if (patterns.length > 0) {
      selectPattern(patterns[0]);
    }
  }

  function sendSelectionToPanel(elements, pattern, fields = [], pagination = []) {
    const selectorPath = pattern ? state.selectorForge.toBreadcrumb(pattern.selector) : [];

    chrome.runtime.sendMessage({
      type: 'SELECTION_CONFIRMED',
      config: {
        selector: pattern?.selector || '',
        itemCount: elements.length,
        category: pattern?.category || 'generic',
        confidence: pattern?.confidence || 0,
        fields: fields.map(f => ({
          name: f.name,
          type: f.type,
          icon: f.icon,
          confidence: f.confidence,
          sampleValue: f.sampleValue,
          sampleValues: f.sampleValues || [f.sampleValue],
          attribute: f.attribute,
          enabled: true,
        })),
        pagination: pagination.map(p => ({
          type: p.type,
          confidence: p.confidence,
          config: p.config,
          recommended: false,
        })),
        selectorPath,
        sampleData: extractPreviewData(elements.slice(0, 10), fields),
      },
    });
  }

  // ============================================================
  // DATA EXTRACTION
  // ============================================================

  function extractPreviewData(elements, fields) {
    const rows = [];
    for (const el of elements) {
      const row = {};
      for (const field of fields) {
        row[field.name] = extractFieldValue(el, field);
      }
      rows.push(row);
    }
    return rows;
  }

  function extractFieldValue(itemEl, field) {
    let value = '';

    try {
      // If field has element reference, use it directly as relative path guide
      if (field.element) {
        const tag = field.element.tagName.toLowerCase();
        const classes = Array.from(field.element.classList || []).filter(c => c.length > 1).slice(0, 2);
        const classSel = classes.length > 0 ? classes.map(c => '.' + CSS.escape(c)).join('') : '';
        const sel = `${tag}${classSel}`;

        const found = itemEl.querySelector(sel);
        if (found) {
          value = getValueFromElement(found, field.attribute || 'textContent');
        }
      }

      // Fallback: search by type/tag heuristics
      if (!value) {
        value = extractByTypeHeuristic(itemEl, field);
      }
    } catch (e) {
      value = '';
    }

    // Clean value
    return state.cleanSense.cleanValue(value, field.type);
  }

  function extractByTypeHeuristic(itemEl, field) {
    switch (field.type) {
      case 'image': {
        const img = itemEl.querySelector('img');
        if (img) return img.src || img.getAttribute('data-src') || '';
        break;
      }
      case 'url': {
        const link = itemEl.querySelector('a[href]');
        if (link) return link.href;
        break;
      }
      case 'title': {
        const heading = itemEl.querySelector('h1,h2,h3,h4,h5,h6');
        if (heading) return heading.textContent.trim();
        const titleLink = itemEl.querySelector('a');
        if (titleLink) return titleLink.textContent.trim();
        break;
      }
      case 'price': {
        const priceEl = itemEl.querySelector('[class*="price"],[class*="cost"],[class*="amount"]');
        if (priceEl) return priceEl.textContent.trim();
        // Fallback: regex search in text
        const text = itemEl.textContent;
        const priceMatch = text.match(/[$€£¥₹]\s*[\d,.]+/);
        if (priceMatch) return priceMatch[0];
        break;
      }
      case 'rating': {
        const ratingEl = itemEl.querySelector('[class*="rating"],[class*="star"],[class*="score"]');
        if (ratingEl) return ratingEl.textContent.trim();
        break;
      }
      case 'date': {
        const timeEl = itemEl.querySelector('time,[datetime]');
        if (timeEl) return timeEl.getAttribute('datetime') || timeEl.textContent.trim();
        break;
      }
    }
    return '';
  }

  function getValueFromElement(el, attribute) {
    switch (attribute) {
      case 'textContent': return (el.textContent || '').trim();
      case 'href': return el.href || el.getAttribute('href') || '';
      case 'src': return el.src || el.getAttribute('data-src') || el.getAttribute('data-lazy-src') || '';
      case 'alt': return el.getAttribute('alt') || '';
      case 'title': return el.getAttribute('title') || '';
      case 'datetime': return el.getAttribute('datetime') || el.textContent.trim();
      case 'value': return el.value || '';
      default: return el.getAttribute(attribute) || el.textContent.trim();
    }
  }

  // ============================================================
  // EXTRACTION EXECUTION
  // ============================================================

  async function startExtraction(config) {
    state.mode = 'extracting';
    state.extractionConfig = config;
    state.extractedRows = [];
    state.extractionAborted = false;
    state.currentPage = 0;

    showExtractionCounter();

    const startTime = Date.now();
    let totalItems = 0;

    try {
      // Extract from current page
      const currentItems = await extractCurrentPage(config);
      totalItems += currentItems.length;

      // Handle pagination if configured
      if (config.pagination && config.pagination.type !== 'none' && !state.extractionAborted) {
        const maxPages = config.pagination.maxPages || 50;
        const maxItems = config.maxItems || 10000;

        for (let page = 1; page < maxPages && !state.extractionAborted && totalItems < maxItems; page++) {
          // Wait while paused
          while (state.mode === 'paused' && !state.extractionAborted) {
            await sleep(100);
          }
          if (state.extractionAborted) break;

          state.currentPage = page;

          const hasMore = await executePagination(config.pagination);
          if (!hasMore) break;

          // Wait for content to load
          await sleep(config.pagination.config?.waitTime || 1500);

          // Extract new page
          const pageItems = await extractCurrentPage(config);
          if (pageItems.length === 0) break; // No new items

          totalItems += pageItems.length;

          // Progress update
          sendProgress({
            items: totalItems,
            pages: page + 1,
            elapsed: Date.now() - startTime,
            speed: totalItems / ((Date.now() - startTime) / 1000),
          });
        }
      }

      // Complete
      const summary = {
        totalItems,
        totalPages: state.currentPage + 1,
        elapsed: Date.now() - startTime,
        url: window.location.href,
        title: document.title,
      };

      chrome.runtime.sendMessage({ type: 'EXTRACTION_COMPLETE', summary });
    } catch (error) {
      chrome.runtime.sendMessage({ type: 'EXTRACTION_ERROR', error: error.message });
    } finally {
      state.mode = 'idle';
      removeExtractionCounter();
      clearHighlights();
    }
  }

  async function extractCurrentPage(config) {
    const selector = config.selector;
    let elements;
    try {
      elements = Array.from(document.querySelectorAll(selector));
    } catch (e) {
      return [];
    }

    const rows = [];
    const fields = config.fields || [];
    const batchSize = 10;

    for (let i = 0; i < elements.length; i++) {
      if (state.extractionAborted) break;

      const el = elements[i];
      if (state.excludedElements.has(el)) continue;

      // Scanner beam animation
      el.classList.add('df-scanning');

      const row = { _index: state.extractedRows.length + rows.length };
      for (const field of fields) {
        if (field.enabled !== false) {
          row[field.name] = extractFieldFromElement(el, field);
        }
      }

      // Add URL column
      row['Source URL'] = window.location.href;

      rows.push(row);
      state.extractedRows.push(row);

      // Remove scanning, add scraped
      setTimeout(() => {
        el.classList.remove('df-scanning');
        el.classList.add('df-scraped');
      }, 300);

      // Update counter
      updateExtractionCounter(state.extractedRows.length);

      // Send row to panel
      chrome.runtime.sendMessage({ type: 'EXTRACTION_ROW', row });

      // Send batch every N items
      if (rows.length % batchSize === 0) {
        sendProgress({
          items: state.extractedRows.length,
          pages: state.currentPage + 1,
          elapsed: Date.now() - (state.extractionConfig?._startTime || Date.now()),
          speed: 0,
        });
        await sleep(10); // Yield to UI
      }
    }

    return rows;
  }

  function extractFieldFromElement(itemEl, field) {
    let value = '';

    // Try relative selector first
    if (field.relativeSelector) {
      try {
        const found = itemEl.querySelector(field.relativeSelector);
        if (found) {
          value = getValueFromElement(found, field.attribute || 'textContent');
        }
      } catch (e) { /* invalid selector */ }
    }

    // Fallback to type heuristic
    if (!value) {
      value = extractByTypeHeuristic(itemEl, field);
    }

    // Fallback: first text content
    if (!value && field.attribute === 'textContent') {
      value = (itemEl.textContent || '').trim().substring(0, 500);
    }

    return state.cleanSense.cleanValue(value, field.type);
  }

  // ============================================================
  // PAGINATION EXECUTION
  // ============================================================

  async function executePagination(pagination) {
    const { type, config } = pagination;

    switch (type) {
      case 'auto-scroll':
        return await executeAutoScroll(config);
      case 'click-next':
        return await executeClickNext(config);
      case 'load-more':
        return await executeLoadMore(config);
      case 'url-pattern':
        return await executeURLPattern(config);
      default:
        return false;
    }
  }

  async function executeAutoScroll(config) {
    const target = config.scrollTarget === 'window' ? window : document.querySelector(config.scrollTarget);
    if (!target) return false;

    const prevHeight = document.body.scrollHeight;
    const prevItemCount = state.extractedRows.length;

    // Scroll down
    if (target === window) {
      window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
    } else {
      target.scrollBy({ top: target.clientHeight * 0.8, behavior: 'smooth' });
    }

    // Wait for new content
    await sleep(config.waitTime || 1500);

    // Check if new content loaded
    const newHeight = document.body.scrollHeight;
    return newHeight > prevHeight;
  }

  async function executeClickNext(config) {
    let button;
    try {
      button = document.querySelector(config.selector);
    } catch (e) {
      return false;
    }

    if (!button) return false;

    // If it's disabled or hidden, stop
    if (button.disabled || button.getAttribute('aria-disabled') === 'true') return false;
    const rect = button.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return false;

    // Click it
    button.click();

    // Wait for navigation or content load
    if (config.waitForNavigation) {
      await waitForNavigation(config.waitTime || 3000);
    } else {
      await sleep(config.waitTime || 2000);
    }

    return true;
  }

  async function executeLoadMore(config) {
    let button;
    try {
      button = document.querySelector(config.selector);
    } catch (e) {
      return false;
    }

    if (!button) return false;
    if (button.disabled) return false;

    const prevCount = document.querySelectorAll(state.extractionConfig.selector).length;

    button.click();
    await sleep(config.waitTime || 1500);

    const newCount = document.querySelectorAll(state.extractionConfig.selector).length;
    return newCount > prevCount;
  }

  async function executeURLPattern(config) {
    const nextURL = state.pageSense.getNextURL({
      ...config,
      currentPage: config.currentPage + state.currentPage,
    });

    if (!nextURL) return false;

    window.location.href = nextURL;

    // Wait for page load (this will terminate current extraction context)
    await sleep(5000);
    return false; // New page will re-inject content script
  }

  function waitForNavigation(timeout = 3000) {
    return new Promise(resolve => {
      let resolved = false;

      const observer = new MutationObserver(() => {
        if (!resolved) {
          resolved = true;
          observer.disconnect();
          setTimeout(resolve, 500); // Extra wait after DOM settles
        }
      });

      observer.observe(document.body, { childList: true, subtree: true });
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          observer.disconnect();
          resolve();
        }
      }, timeout);
    });
  }

  // ============================================================
  // PAGE SCANNING
  // ============================================================

  function scanPage() {
    const patterns = state.patternSense.scan(document);
    state.detectedPatterns = patterns;

    // Analyze fields for each pattern
    patterns.forEach(pattern => {
      const sampleElements = pattern.allElements || pattern.sampleElements;
      pattern.fields = state.typeSense.analyzeSchema(sampleElements.slice(0, 5));
    });

    // Detect pagination
    const pagination = state.pageSense.detect(document);

    return {
      patterns: patterns.map(p => ({
        id: p.id,
        selector: p.selector,
        itemCount: p.itemCount,
        confidence: p.confidence,
        category: p.category,
        fields: (p.fields || []).map(f => ({
          name: f.name,
          type: f.type,
          icon: f.icon,
          confidence: f.confidence,
          sampleValue: f.sampleValue,
          sampleValues: f.sampleValues || [],
          attribute: f.attribute,
        })),
        visualArea: p.visualArea,
      })),
      pagination: pagination.map(p => ({
        type: p.type,
        confidence: p.confidence,
        config: p.config,
      })),
      url: window.location.href,
      title: document.title,
    };
  }

  // ============================================================
  // SELECTOR TESTING
  // ============================================================

  function testSelector(selector) {
    try {
      const matches = document.querySelectorAll(selector);
      const sampleValues = Array.from(matches).slice(0, 5).map(el =>
        (el.textContent || '').trim().substring(0, 100)
      );
      return { matchCount: matches.length, sampleValues };
    } catch (e) {
      return { matchCount: 0, sampleValues: [], error: e.message };
    }
  }

  // ============================================================
  // EMAIL EXTRACTION
  // ============================================================

  function extractEmails() {
    const emails = new Set();
    const html = document.documentElement.innerHTML;

    // Standard email regex
    const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
    let match;
    while ((match = emailRegex.exec(html)) !== null) {
      const email = match[0].toLowerCase();
      if (!email.endsWith('.png') && !email.endsWith('.jpg') && !email.endsWith('.gif')) {
        emails.add(email);
      }
    }

    // Mailto links
    document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
      const href = link.href.replace('mailto:', '').split('?')[0].toLowerCase();
      if (href) emails.add(href);
    });

    // Obfuscated emails
    const text = document.body.textContent || '';
    const obfuscatedRegex = /[a-zA-Z0-9._%+\-]+\s*[\[\(]\s*(?:at|@)\s*[\]\)]\s*[a-zA-Z0-9.\-]+\s*[\[\(]\s*(?:dot|\.)\s*[\]\)]\s*[a-zA-Z]{2,}/gi;
    while ((match = obfuscatedRegex.exec(text)) !== null) {
      const cleaned = match[0]
        .replace(/\s*[\[\(]\s*(?:at|@)\s*[\]\)]\s*/gi, '@')
        .replace(/\s*[\[\(]\s*(?:dot|\.)\s*[\]\)]\s*/gi, '.')
        .toLowerCase();
      emails.add(cleaned);
    }

    return Array.from(emails).map(email => ({
      email,
      sourceURL: window.location.href,
      pageTitle: document.title,
      timestamp: new Date().toISOString(),
    }));
  }

  // ============================================================
  // IMAGE EXTRACTION
  // ============================================================

  function extractImages() {
    const images = new Map(); // url -> metadata

    // <img> tags
    document.querySelectorAll('img').forEach(img => {
      const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src');
      if (!src || src.startsWith('data:')) return;
      const url = new URL(src, window.location.origin).href;
      if (!images.has(url)) {
        images.set(url, {
          url,
          alt: img.alt || '',
          title: img.title || '',
          width: img.naturalWidth || img.width || 0,
          height: img.naturalHeight || img.height || 0,
          type: 'img',
        });
      }
    });

    // CSS background images
    document.querySelectorAll('*').forEach(el => {
      const bg = getComputedStyle(el).backgroundImage;
      if (bg && bg !== 'none') {
        const urlMatch = bg.match(/url\(["']?(.*?)["']?\)/);
        if (urlMatch && !urlMatch[1].startsWith('data:')) {
          const url = new URL(urlMatch[1], window.location.origin).href;
          if (!images.has(url)) {
            images.set(url, { url, alt: '', title: '', width: 0, height: 0, type: 'background' });
          }
        }
      }
    });

    // <picture>/<source> elements
    document.querySelectorAll('source[srcset]').forEach(source => {
      const srcset = source.srcset;
      const srcs = srcset.split(',').map(s => s.trim().split(/\s+/)[0]);
      srcs.forEach(src => {
        if (src && !src.startsWith('data:')) {
          const url = new URL(src, window.location.origin).href;
          if (!images.has(url)) {
            images.set(url, { url, alt: '', title: '', width: 0, height: 0, type: 'picture' });
          }
        }
      });
    });

    // OpenGraph and Twitter Card
    const ogImage = document.querySelector('meta[property="og:image"]');
    if (ogImage && ogImage.content) {
      const url = new URL(ogImage.content, window.location.origin).href;
      if (!images.has(url)) {
        images.set(url, { url, alt: 'OpenGraph Image', title: '', width: 0, height: 0, type: 'og' });
      }
    }

    return Array.from(images.values());
  }

  // ============================================================
  // TEXT EXTRACTION (Readability)
  // ============================================================

  function extractText() {
    // Simple readability implementation
    const article = findMainContent();

    return {
      title: document.title,
      metaDescription: document.querySelector('meta[name="description"]')?.content || '',
      author: document.querySelector('meta[name="author"]')?.content ||
              document.querySelector('[rel="author"]')?.textContent || '',
      publishDate: document.querySelector('meta[property="article:published_time"]')?.content ||
                   document.querySelector('time[datetime]')?.getAttribute('datetime') || '',
      content: article.textContent.trim(),
      html: article.innerHTML,
      wordCount: article.textContent.trim().split(/\s+/).length,
      language: document.documentElement.lang || 'en',
      url: window.location.href,
    };
  }

  function findMainContent() {
    // Priority: <article>, <main>, role="main", largest text block
    const article = document.querySelector('article');
    if (article) return article;

    const main = document.querySelector('main, [role="main"]');
    if (main) return main;

    // Find largest text block
    let bestBlock = document.body;
    let bestLength = 0;

    const candidates = document.querySelectorAll('div, section');
    for (const el of candidates) {
      const text = el.textContent || '';
      const wordCount = text.trim().split(/\s+/).length;

      // Skip small elements
      if (wordCount < 100) continue;

      // Score: text density (words / total descendants)
      const descendants = el.querySelectorAll('*').length || 1;
      const density = wordCount / descendants;

      if (density > 2 && wordCount > bestLength) {
        bestLength = wordCount;
        bestBlock = el;
      }
    }

    return bestBlock;
  }

  // ============================================================
  // MESSAGE HANDLER
  // ============================================================

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    try {
      switch (message.type) {
        case 'SCAN_PAGE': {
          const result = scanPage();
          sendResponse(result);
          break;
        }

        case 'ACTIVATE_SELECTION': {
          activateSelectionMode(message.mode || 'list');
          sendResponse({ success: true });
          break;
        }

        case 'DEACTIVATE_SELECTION': {
          deactivateSelectionMode();
          sendResponse({ success: true });
          break;
        }

        case 'SELECT_PATTERN': {
          const pattern = state.detectedPatterns.find(p => p.id === message.patternId);
          if (pattern) {
            selectPattern(pattern);
            sendResponse({ success: true });
          } else {
            sendResponse({ error: 'Pattern not found' });
          }
          break;
        }

        case 'HIGHLIGHT_ELEMENTS': {
          try {
            const els = document.querySelectorAll(message.selector);
            highlightElements(Array.from(els), 'df-highlight', true);
            sendResponse({ matchCount: els.length });
          } catch (e) {
            sendResponse({ error: e.message });
          }
          break;
        }

        case 'CLEAR_HIGHLIGHTS': {
          clearHighlights();
          removeMatchBadge();
          sendResponse({ success: true });
          break;
        }

        case 'TEST_SELECTOR': {
          const result = testSelector(message.selector);
          sendResponse(result);
          break;
        }

        case 'START_EXTRACTION': {
          startExtraction(message.config);
          sendResponse({ started: true });
          break;
        }

        case 'PAUSE_EXTRACTION': {
          state.mode = 'paused';
          sendResponse({ paused: true });
          break;
        }

        case 'RESUME_EXTRACTION': {
          state.mode = 'extracting';
          sendResponse({ resumed: true });
          break;
        }

        case 'STOP_EXTRACTION': {
          state.extractionAborted = true;
          state.mode = 'idle';
          removeExtractionCounter();
          clearHighlights();
          sendResponse({ stopped: true });
          break;
        }

        case 'EXTRACT_EMAILS': {
          const emails = extractEmails();
          sendResponse({ emails });
          break;
        }

        case 'EXTRACT_IMAGES': {
          const imgs = extractImages();
          sendResponse({ images: imgs });
          break;
        }

        case 'EXTRACT_TEXT': {
          const text = extractText();
          sendResponse(text);
          break;
        }

        case 'PING': {
          sendResponse({ pong: true });
          break;
        }

        default:
          sendResponse({ error: 'Unknown message type: ' + message.type });
      }
    } catch (error) {
      sendResponse({ error: error.message });
    }
    return true; // async
  });

  // ============================================================
  // UTILITIES
  // ============================================================

  function sendProgress(data) {
    chrome.runtime.sendMessage({ type: 'EXTRACTION_PROGRESS', data });
  }

  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function throttle(fn, wait) {
    let last = 0;
    return function (...args) {
      const now = Date.now();
      if (now - last >= wait) {
        last = now;
        fn.apply(this, args);
      }
    };
  }

  console.log('DataForge content script loaded.');
})();
