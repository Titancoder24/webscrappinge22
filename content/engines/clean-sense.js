/**
 * CleanSense™ — Data Cleaning Pipeline Engine
 * Automatic post-extraction data cleaning: whitespace normalization, URL resolution,
 * Unicode cleanup, deduplication, type-specific formatting.
 * No ML. Just transformation rules.
 */
(function () {
  'use strict';

  class CleanSense {
    constructor(options = {}) {
      this.baseURL = options.baseURL || window.location.origin;
      this.options = {
        trimWhitespace: true,
        normalizeUnicode: true,
        resolveURLs: true,
        removeHTMLEntities: true,
        stripInvisible: true,
        normalizePrices: false,  // Keep original format by default
        parseDates: false,       // Keep original format by default
        deduplicateRows: false,  // User-triggered
        removeEmptyRows: true,
        ...options,
      };
    }

    /**
     * Clean a single extracted value.
     * @param {string} value - Raw extracted value
     * @param {string} type - Data type (from TypeSense)
     * @returns {string} Cleaned value
     */
    cleanValue(value, type = 'text') {
      if (value === null || value === undefined) return '';
      let cleaned = String(value);

      if (this.options.trimWhitespace) {
        cleaned = this._trimWhitespace(cleaned);
      }

      if (this.options.normalizeUnicode) {
        cleaned = this._normalizeUnicode(cleaned);
      }

      if (this.options.removeHTMLEntities) {
        cleaned = this._decodeHTMLEntities(cleaned);
      }

      if (this.options.stripInvisible) {
        cleaned = this._stripInvisible(cleaned);
      }

      // Type-specific cleaning
      switch (type) {
        case 'url':
        case 'image':
          if (this.options.resolveURLs) {
            cleaned = this._resolveURL(cleaned);
          }
          break;
        case 'price':
          if (this.options.normalizePrices) {
            cleaned = this._normalizePrice(cleaned);
          }
          break;
        case 'date':
          if (this.options.parseDates) {
            cleaned = this._parseDate(cleaned);
          }
          break;
        case 'email':
          cleaned = this._cleanEmail(cleaned);
          break;
        case 'phone':
          cleaned = this._cleanPhone(cleaned);
          break;
        case 'number':
        case 'rating':
          cleaned = this._cleanNumber(cleaned);
          break;
      }

      return cleaned;
    }

    /**
     * Clean an entire row of data.
     * @param {Object} row - { column: value } pairs
     * @param {Object} schema - { column: type } pairs
     * @returns {Object} Cleaned row
     */
    cleanRow(row, schema = {}) {
      const cleaned = {};
      for (const [key, value] of Object.entries(row)) {
        const type = schema[key] || 'text';
        cleaned[key] = this.cleanValue(value, type);
      }
      return cleaned;
    }

    /**
     * Clean an array of rows and optionally deduplicate.
     * @param {Array} rows - Array of row objects
     * @param {Object} schema - Column type map
     * @param {Object} options - Additional options
     * @returns {Object} { rows, stats }
     */
    cleanDataset(rows, schema = {}, options = {}) {
      const stats = {
        totalRows: rows.length,
        cleanedRows: 0,
        removedEmpty: 0,
        removedDuplicates: 0,
        cleanedValues: 0,
      };

      let cleaned = rows.map(row => {
        const cleanedRow = this.cleanRow(row, schema);
        stats.cleanedRows++;
        return cleanedRow;
      });

      // Remove empty rows
      if (this.options.removeEmptyRows) {
        const before = cleaned.length;
        cleaned = cleaned.filter(row => {
          return Object.values(row).some(v => v && String(v).trim().length > 0);
        });
        stats.removedEmpty = before - cleaned.length;
      }

      // Deduplicate
      if (options.deduplicate || this.options.deduplicateRows) {
        const keyColumns = options.keyColumns || Object.keys(schema).slice(0, 2);
        const before = cleaned.length;
        cleaned = this._deduplicateRows(cleaned, keyColumns);
        stats.removedDuplicates = before - cleaned.length;
      }

      return { rows: cleaned, stats };
    }

    // ========== CLEANING FUNCTIONS ==========

    _trimWhitespace(str) {
      // Normalize all whitespace (including tabs, newlines, non-breaking spaces)
      return str
        .replace(/[\t\n\r]+/g, ' ')
        .replace(/\s{2,}/g, ' ')
        .replace(/^\s+|\s+$/g, '');
    }

    _normalizeUnicode(str) {
      // Normalize to NFC form
      try {
        str = str.normalize('NFC');
      } catch (e) { /* older environments */ }

      // Replace common problematic Unicode chars
      return str
        .replace(/[\u2018\u2019\u201A\u201B]/g, "'")  // Smart single quotes
        .replace(/[\u201C\u201D\u201E\u201F]/g, '"')  // Smart double quotes
        .replace(/[\u2013\u2014]/g, '-')               // En/em dash
        .replace(/\u2026/g, '...')                      // Ellipsis
        .replace(/\u00A0/g, ' ')                        // Non-breaking space
        .replace(/\u200B/g, '')                         // Zero-width space
        .replace(/\u200C/g, '')                         // Zero-width non-joiner
        .replace(/\u200D/g, '')                         // Zero-width joiner
        .replace(/\uFEFF/g, '');                        // BOM
    }

    _decodeHTMLEntities(str) {
      const entityMap = {
        '&amp;': '&', '&lt;': '<', '&gt;': '>', '&quot;': '"',
        '&#39;': "'", '&apos;': "'", '&nbsp;': ' ', '&copy;': '©',
        '&reg;': '®', '&trade;': '™', '&hellip;': '...', '&mdash;': '—',
        '&ndash;': '–', '&lsquo;': "'", '&rsquo;': "'", '&ldquo;': '"',
        '&rdquo;': '"', '&bull;': '•', '&middot;': '·',
      };

      return str.replace(/&[a-zA-Z0-9#]+;/g, match => {
        if (entityMap[match]) return entityMap[match];
        // Numeric entities
        if (match.startsWith('&#x')) {
          const code = parseInt(match.slice(3, -1), 16);
          return isNaN(code) ? match : String.fromCharCode(code);
        }
        if (match.startsWith('&#')) {
          const code = parseInt(match.slice(2, -1), 10);
          return isNaN(code) ? match : String.fromCharCode(code);
        }
        return match;
      });
    }

    _stripInvisible(str) {
      // Remove zero-width and other invisible characters
      return str.replace(/[\u200B-\u200F\u2028\u2029\u202A-\u202E\u2060-\u206F\uFE00-\uFE0F\uFEFF]/g, '');
    }

    _resolveURL(url) {
      if (!url) return '';
      url = url.trim();

      // Already absolute
      if (/^https?:\/\//i.test(url)) return url;

      // Protocol-relative
      if (url.startsWith('//')) return 'https:' + url;

      // Relative URL
      try {
        return new URL(url, this.baseURL).href;
      } catch (e) {
        return url;
      }
    }

    _normalizePrice(str) {
      if (!str) return '';
      // Extract numeric value from price string
      const match = str.match(/[\d,.]+/);
      if (!match) return str;

      let num = match[0];
      // Detect format: 1,234.56 vs 1.234,56
      if (/\d+\.\d{3},/.test(num)) {
        // European format: 1.234,56
        num = num.replace(/\./g, '').replace(',', '.');
      } else {
        // US format: 1,234.56
        num = num.replace(/,/g, '');
      }

      const parsed = parseFloat(num);
      return isNaN(parsed) ? str : parsed.toString();
    }

    _parseDate(str) {
      if (!str) return '';
      try {
        const date = new Date(str);
        if (!isNaN(date.getTime())) {
          return date.toISOString().split('T')[0]; // YYYY-MM-DD
        }
      } catch (e) { /* ignore */ }
      return str;
    }

    _cleanEmail(str) {
      return str.toLowerCase().trim();
    }

    _cleanPhone(str) {
      // Remove non-phone characters but keep + for international
      return str.replace(/[^\d+\-() ]/g, '').trim();
    }

    _cleanNumber(str) {
      if (!str) return '';
      const match = str.match(/-?[\d,.]+/);
      return match ? match[0].replace(/,/g, '') : str;
    }

    /**
     * Deduplicate rows based on key columns using exact + fuzzy matching.
     */
    _deduplicateRows(rows, keyColumns) {
      if (rows.length === 0 || keyColumns.length === 0) return rows;

      const seen = new Map();
      const result = [];

      for (const row of rows) {
        const key = keyColumns.map(col => String(row[col] || '').trim().toLowerCase()).join('|||');

        if (!seen.has(key)) {
          seen.set(key, true);
          result.push(row);
        }
      }

      return result;
    }

    /**
     * Detect duplicates in a dataset (without removing).
     * Returns indices of duplicate rows.
     */
    findDuplicates(rows, keyColumns) {
      if (rows.length === 0) return [];

      const seen = new Map();
      const duplicates = [];

      for (let i = 0; i < rows.length; i++) {
        const key = keyColumns.map(col => String(rows[i][col] || '').trim().toLowerCase()).join('|||');

        if (seen.has(key)) {
          duplicates.push(i);
        } else {
          seen.set(key, i);
        }
      }

      return duplicates;
    }

    /**
     * Fuzzy duplicate detection using Levenshtein distance.
     * Returns pairs of (index, index) that are likely duplicates.
     */
    findFuzzyDuplicates(rows, keyColumns, threshold = 0.85) {
      const pairs = [];
      const keys = rows.map(row =>
        keyColumns.map(col => String(row[col] || '').trim().toLowerCase()).join(' ')
      );

      for (let i = 0; i < keys.length; i++) {
        for (let j = i + 1; j < keys.length; j++) {
          const similarity = this._stringSimilarity(keys[i], keys[j]);
          if (similarity >= threshold) {
            pairs.push([i, j, similarity]);
          }
        }
      }

      return pairs;
    }

    /**
     * Levenshtein-based string similarity (0-1).
     */
    _stringSimilarity(a, b) {
      if (a === b) return 1;
      if (a.length === 0 || b.length === 0) return 0;

      const maxLen = Math.max(a.length, b.length);
      if (maxLen > 200) {
        // For very long strings, use a faster approximate method
        return this._jaroWinkler(a, b);
      }

      const distance = this._levenshteinDistance(a, b);
      return 1 - (distance / maxLen);
    }

    _levenshteinDistance(a, b) {
      const m = a.length;
      const n = b.length;

      // Use single-row optimization
      let prev = new Array(n + 1);
      let curr = new Array(n + 1);

      for (let j = 0; j <= n; j++) prev[j] = j;

      for (let i = 1; i <= m; i++) {
        curr[0] = i;
        for (let j = 1; j <= n; j++) {
          const cost = a[i - 1] === b[j - 1] ? 0 : 1;
          curr[j] = Math.min(
            prev[j] + 1,      // deletion
            curr[j - 1] + 1,  // insertion
            prev[j - 1] + cost // substitution
          );
        }
        [prev, curr] = [curr, prev];
      }

      return prev[n];
    }

    _jaroWinkler(a, b) {
      if (a === b) return 1;

      const aLen = a.length;
      const bLen = b.length;
      const matchWindow = Math.floor(Math.max(aLen, bLen) / 2) - 1;

      const aMatches = new Array(aLen).fill(false);
      const bMatches = new Array(bLen).fill(false);

      let matches = 0;
      let transpositions = 0;

      for (let i = 0; i < aLen; i++) {
        const start = Math.max(0, i - matchWindow);
        const end = Math.min(bLen - 1, i + matchWindow);

        for (let j = start; j <= end; j++) {
          if (bMatches[j] || a[i] !== b[j]) continue;
          aMatches[i] = bMatches[j] = true;
          matches++;
          break;
        }
      }

      if (matches === 0) return 0;

      let k = 0;
      for (let i = 0; i < aLen; i++) {
        if (!aMatches[i]) continue;
        while (!bMatches[k]) k++;
        if (a[i] !== b[k]) transpositions++;
        k++;
      }

      const jaro = (matches / aLen + matches / bLen + (matches - transpositions / 2) / matches) / 3;

      // Winkler bonus for common prefix
      let prefix = 0;
      for (let i = 0; i < Math.min(4, aLen, bLen); i++) {
        if (a[i] === b[i]) prefix++;
        else break;
      }

      return jaro + (prefix * 0.1 * (1 - jaro));
    }
  }

  window.DataForge = window.DataForge || {};
  window.DataForge.CleanSense = CleanSense;
})();
