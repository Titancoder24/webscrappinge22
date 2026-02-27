/**
 * DataForge Shared UI Components
 * Reusable rendering functions for common UI patterns.
 */
(function () {
  'use strict';

  const Shared = {
    /**
     * Create HTML element from template string.
     */
    html(template) {
      const container = document.createElement('div');
      container.innerHTML = template.trim();
      return container.firstElementChild || container;
    },

    /**
     * Render a progress ring SVG.
     */
    progressRing(percentage, size = 120, strokeWidth = 6) {
      const radius = (size / 2) - strokeWidth;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (percentage / 100) * circumference;

      return `
        <div class="progress-ring-container" style="width:${size}px;height:${size}px">
          <div class="radar-pulse"></div>
          <div class="radar-pulse"></div>
          <svg class="progress-ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
            <defs>
              <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stop-color="#8B5CF6"/>
                <stop offset="100%" stop-color="#10B981"/>
              </linearGradient>
            </defs>
            <circle class="progress-ring-bg" cx="${size/2}" cy="${size/2}" r="${radius}"/>
            <circle class="progress-ring-fill" cx="${size/2}" cy="${size/2}" r="${radius}"
              stroke-dasharray="${circumference}" stroke-dashoffset="${offset}"/>
          </svg>
          <div class="progress-ring-text">
            <div class="progress-value">${Math.round(percentage)}%</div>
            <div class="progress-label">complete</div>
          </div>
        </div>
      `;
    },

    /**
     * Render step indicator.
     */
    stepIndicator(steps, currentStep) {
      let html = '<div class="step-indicator">';
      steps.forEach((label, i) => {
        const isActive = i === currentStep;
        const isCompleted = i < currentStep;
        const cls = isActive ? 'active' : isCompleted ? 'completed' : '';

        if (i > 0) {
          html += `<div class="step-line ${isCompleted ? 'completed' : ''}"></div>`;
        }
        html += `<div class="step-dot ${cls}" title="${label}">${isCompleted ? '&#10003;' : i + 1}</div>`;
      });
      html += '</div>';
      return html;
    },

    /**
     * Render a toggle switch.
     */
    toggle(id, checked, label = '') {
      return `
        <div class="settings-row">
          <div>
            <div class="settings-label">${label}</div>
          </div>
          <label class="toggle">
            <input type="checkbox" id="${id}" ${checked ? 'checked' : ''}>
            <div class="toggle-track"></div>
          </label>
        </div>
      `;
    },

    /**
     * Render a badge.
     */
    badge(text, type = 'violet') {
      return `<span class="badge badge-${type}">${text}</span>`;
    },

    /**
     * Render an empty state.
     */
    emptyState(icon, title, desc) {
      return `
        <div class="empty-state">
          <div class="empty-state-icon">${icon}</div>
          <div class="empty-state-title">${title}</div>
          <div class="empty-state-desc">${desc}</div>
        </div>
      `;
    },

    /**
     * Render loading skeleton.
     */
    skeleton(count = 3) {
      let html = '';
      for (let i = 0; i < count; i++) {
        const width = ['full', 'medium', 'short'][i % 3];
        html += `<div class="skeleton skeleton-text ${width}"></div>`;
      }
      return html;
    },

    /**
     * Render a spinner.
     */
    spinner(size = '') {
      return `<div class="spinner ${size ? 'spinner-' + size : ''}"></div>`;
    },

    /**
     * Render compliance banner.
     */
    complianceBanner() {
      return `
        <div class="compliance-banner">
          <strong>Ethical Scraping</strong> — DataForge respects website terms of service.
          Always check robots.txt and ToS before scraping. Rate limiting is enabled by default.
          This tool is for personal data collection and research purposes.
        </div>
      `;
    },

    /**
     * Show a toast notification.
     */
    showToast(message, type = 'info') {
      window.DataForgeStore.showToast(message, type);
    },

    /**
     * Format elapsed time.
     */
    formatTime(ms) {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const secs = seconds % 60;
      if (minutes > 0) return `${minutes}:${secs.toString().padStart(2, '0')}`;
      return `0:${secs.toString().padStart(2, '0')}`;
    },

    /**
     * Format a number with commas.
     */
    formatNumber(n) {
      return n.toLocaleString();
    },

    /**
     * Format file size.
     */
    formatSize(bytes) {
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    },

    /**
     * Format relative time.
     */
    formatRelativeTime(date) {
      const now = Date.now();
      const diff = now - new Date(date).getTime();
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      const days = Math.floor(diff / 86400000);

      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      if (days < 7) return `${days}d ago`;
      return new Date(date).toLocaleDateString();
    },

    /**
     * Generate a unique ID.
     */
    uid() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
    },

    /**
     * Category icons (text-based, no emoji).
     */
    categoryIcon(category) {
      const icons = {
        product: '&#9632;',   // square
        review: '&#9733;',    // star
        article: '&#9998;',   // pencil
        listing: '&#9776;',   // list
        'table-row': '&#9638;', // table
        'feed-item': '&#9679;', // circle
        card: '&#9644;',      // rectangle
        generic: '&#8942;',   // dots
      };
      return icons[category] || icons.generic;
    },

    /**
     * Field type icons.
     */
    fieldIcon(type) {
      const icons = {
        tag: '&#9654;',
        text: 'T',
        dollar: '$',
        link: '&#8599;',
        image: '&#9634;',
        mail: '@',
        calendar: '&#9636;',
        star: '&#9733;',
        phone: '&#9742;',
        hash: '#',
        map: '&#9660;',
      };
      return icons[type] || 'T';
    },

    /**
     * Escape HTML.
     */
    esc(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    /**
     * Send message to background/content script.
     */
    async sendMessage(message) {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(message, (response) => {
          resolve(response || {});
        });
      });
    },
  };

  window.DataForgeUI = Shared;
})();
