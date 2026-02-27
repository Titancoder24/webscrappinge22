/**
 * TypeSense™ — Field Type Classification Engine
 * Analyzes extracted text values to determine data types and suggest column names.
 * Uses regex + positional heuristics + semantic rules.
 * No ML. Just pattern matching.
 */
(function () {
  'use strict';

  const PRICE_PATTERNS = [
    /^\$[\d,.]+/,
    /^€[\d,.]+/,
    /^£[\d,.]+/,
    /^¥[\d,.]+/,
    /^₹[\d,.]+/,
    /^[\d,.]+\s*(?:USD|EUR|GBP|JPY|INR|CAD|AUD)/i,
    /^(?:USD|EUR|GBP)\s*[\d,.]+/i,
    /^\d{1,3}(?:,\d{3})*(?:\.\d{2})?\s*(?:₽|kr|zł|Kč|R\$|฿)/,
  ];

  const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

  const URL_PATTERN = /^(?:https?:\/\/|www\.)[^\s]+$/i;

  const PHONE_PATTERNS = [
    /^(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}$/,
    /^(?:\+?[0-9]{1,4}[-.\s]?)?(?:\([0-9]{1,5}\)[-.\s]?)?[0-9][-.\s0-9]{5,15}$/,
  ];

  const DATE_PATTERNS = [
    /^\d{4}-\d{2}-\d{2}/,                     // 2024-01-15
    /^\d{1,2}\/\d{1,2}\/\d{2,4}/,             // 1/15/2024
    /^\d{1,2}-\d{1,2}-\d{2,4}/,               // 15-01-2024
    /^(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*\s+\d{1,2}/i, // January 15
    /^\d{1,2}\s+(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\w*/i, // 15 January
    /^(?:yesterday|today|tomorrow|\d+\s+(?:hours?|days?|weeks?|months?|years?)\s+ago)/i,
  ];

  const RATING_PATTERNS = [
    /^[0-5](?:\.\d)?(?:\s*\/\s*5)?$/,       // 4.5 or 4.5/5
    /^[0-9](?:\.\d)?(?:\s*\/\s*10)?$/,       // 8.5 or 8.5/10
    /^[★☆⭐]{1,5}$/,                         // Star characters
    /^\d(?:\.\d)?\s*(?:stars?|out of)/i,      // "4.5 stars"
  ];

  const HEADING_TAGS = new Set(['H1', 'H2', 'H3', 'H4', 'H5', 'H6']);

  class TypeSense {
    /**
     * Analyze sub-elements within a list item and return detected fields.
     * @param {Element} item - A single list item element
     * @param {Element[]} allItems - All items in the list (for validation)
     * @returns {Array} Detected fields with name, selector, type, sampleValues
     */
    analyzeItem(item, allItems = []) {
      const fields = [];
      const visited = new Set();

      // Walk the item's DOM tree
      this._walkForFields(item, fields, visited, 0);

      // Validate fields against all items for consistency
      if (allItems.length > 1) {
        this._validateFields(fields, allItems);
      }

      // Deduplicate by type/position
      return this._deduplicateFields(fields);
    }

    /**
     * Classify a text value and return its detected type.
     * @param {string} value - Text to classify
     * @param {Element} element - The source DOM element
     * @returns {Object} { type, confidence, suggestedName }
     */
    classify(value, element = null) {
      if (!value || typeof value !== 'string') {
        return { type: 'text', confidence: 0.1, suggestedName: 'Text' };
      }

      const trimmed = value.trim();
      if (trimmed.length === 0) {
        return { type: 'empty', confidence: 1.0, suggestedName: 'Empty' };
      }

      // Image (check element)
      if (element && (element.tagName === 'IMG' || element.querySelector('img'))) {
        return { type: 'image', confidence: 0.95, suggestedName: 'Image' };
      }

      // URL
      if (URL_PATTERN.test(trimmed)) {
        return { type: 'url', confidence: 0.95, suggestedName: 'URL' };
      }

      // Email
      if (EMAIL_PATTERN.test(trimmed)) {
        return { type: 'email', confidence: 0.95, suggestedName: 'Email' };
      }

      // Price
      for (const pattern of PRICE_PATTERNS) {
        if (pattern.test(trimmed)) {
          return { type: 'price', confidence: 0.9, suggestedName: 'Price' };
        }
      }

      // Rating
      for (const pattern of RATING_PATTERNS) {
        if (pattern.test(trimmed)) {
          return { type: 'rating', confidence: 0.85, suggestedName: 'Rating' };
        }
      }

      // Phone
      for (const pattern of PHONE_PATTERNS) {
        if (pattern.test(trimmed)) {
          return { type: 'phone', confidence: 0.8, suggestedName: 'Phone' };
        }
      }

      // Date
      for (const pattern of DATE_PATTERNS) {
        if (pattern.test(trimmed)) {
          return { type: 'date', confidence: 0.8, suggestedName: 'Date' };
        }
      }

      // Number (pure numeric)
      if (/^-?[\d,]+(?:\.\d+)?$/.test(trimmed)) {
        return { type: 'number', confidence: 0.85, suggestedName: 'Number' };
      }

      // Check element context for hints
      if (element) {
        const contextType = this._classifyByContext(element, trimmed);
        if (contextType) return contextType;
      }

      // Title (short text in heading-like element)
      if (element && (HEADING_TAGS.has(element.tagName) || element.closest('h1,h2,h3,h4,h5,h6'))) {
        return { type: 'title', confidence: 0.8, suggestedName: 'Title' };
      }

      // Short text (< 50 chars)
      if (trimmed.length < 50) {
        if (element) {
          const tag = element.tagName;
          if (tag === 'A') return { type: 'text', confidence: 0.7, suggestedName: 'Link Text' };
          if (tag === 'SPAN' || tag === 'STRONG' || tag === 'B') {
            return { type: 'text', confidence: 0.6, suggestedName: 'Label' };
          }
        }
        return { type: 'text', confidence: 0.5, suggestedName: 'Text' };
      }

      // Medium text (50-200 chars)
      if (trimmed.length < 200) {
        return { type: 'text', confidence: 0.5, suggestedName: 'Description' };
      }

      // Long text
      return { type: 'text', confidence: 0.5, suggestedName: 'Content' };
    }

    /**
     * Classify based on element context (classes, attributes, position).
     */
    _classifyByContext(element, value) {
      const classes = (element.className || '').toLowerCase();
      const id = (element.id || '').toLowerCase();
      const combined = classes + ' ' + id;

      // Price context
      if (/price|cost|amount|fee|total|msrp|sale/.test(combined)) {
        return { type: 'price', confidence: 0.75, suggestedName: 'Price' };
      }

      // Rating context
      if (/rating|star|score|review-count|votes/.test(combined)) {
        return { type: 'rating', confidence: 0.7, suggestedName: 'Rating' };
      }

      // Title context
      if (/title|name|heading|subject|product-name/.test(combined)) {
        return { type: 'title', confidence: 0.7, suggestedName: 'Title' };
      }

      // Description context
      if (/desc|description|summary|excerpt|snippet|abstract/.test(combined)) {
        return { type: 'text', confidence: 0.7, suggestedName: 'Description' };
      }

      // Date context
      if (/date|time|published|created|posted|when|timestamp/.test(combined)) {
        return { type: 'date', confidence: 0.7, suggestedName: 'Date' };
      }

      // Author context
      if (/author|by|writer|creator|user|username|poster/.test(combined)) {
        return { type: 'text', confidence: 0.7, suggestedName: 'Author' };
      }

      // Location context
      if (/location|address|city|state|country|place|region|zip|postal/.test(combined)) {
        return { type: 'location', confidence: 0.7, suggestedName: 'Location' };
      }

      // Category/tag context
      if (/category|tag|label|type|genre|topic/.test(combined)) {
        return { type: 'text', confidence: 0.6, suggestedName: 'Category' };
      }

      // Count/quantity
      if (/count|quantity|num|total|views|likes|comments/.test(combined)) {
        return { type: 'number', confidence: 0.6, suggestedName: 'Count' };
      }

      return null;
    }

    /**
     * Walk DOM tree of a list item to find extractable fields.
     */
    _walkForFields(element, fields, visited, depth) {
      if (depth > 8 || visited.has(element)) return;
      visited.add(element);

      const tag = element.tagName;

      // Skip script, style, etc.
      if (['SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG'].includes(tag)) return;

      // Check for image
      if (tag === 'IMG') {
        const src = element.src || element.getAttribute('data-src') || element.getAttribute('data-lazy-src');
        if (src) {
          fields.push({
            element,
            name: 'Image',
            type: 'image',
            confidence: 0.9,
            sampleValue: src,
            attribute: 'src',
            icon: 'image',
          });
        }
        return;
      }

      // Check for link
      if (tag === 'A' && element.href) {
        const text = (element.textContent || '').trim();
        if (text.length > 0 && text.length < 200) {
          fields.push({
            element,
            name: this._suggestNameForLink(element, text),
            type: 'url',
            confidence: 0.85,
            sampleValue: text,
            attribute: 'href',
            icon: 'link',
          });
        }
      }

      // Check for text content (leaf node or meaningful content)
      const directText = this._getDirectText(element);
      if (directText.length > 0) {
        const classification = this.classify(directText, element);
        if (classification.type !== 'empty') {
          fields.push({
            element,
            name: classification.suggestedName,
            type: classification.type,
            confidence: classification.confidence,
            sampleValue: directText.substring(0, 100),
            attribute: 'textContent',
            icon: this._getIconForType(classification.type),
          });
        }
      }

      // Recurse into children
      for (const child of element.children) {
        this._walkForFields(child, fields, visited, depth + 1);
      }
    }

    /**
     * Get direct text of an element (not including children's text).
     */
    _getDirectText(element) {
      let text = '';
      for (const node of element.childNodes) {
        if (node.nodeType === Node.TEXT_NODE) {
          text += node.textContent;
        }
      }
      return text.trim();
    }

    /**
     * Suggest a name for a link element.
     */
    _suggestNameForLink(element, text) {
      const classes = (element.className || '').toLowerCase();
      if (/title|name|heading/.test(classes)) return 'Title Link';
      if (element.closest('h1,h2,h3,h4,h5,h6')) return 'Title';
      if (text.length > 50) return 'Link';
      return 'Link';
    }

    /**
     * Validate fields exist consistently across all items.
     */
    _validateFields(fields, allItems) {
      // For each field, check if similar content exists in other items
      for (const field of fields) {
        let matchCount = 0;
        const sample = allItems.slice(0, Math.min(5, allItems.length));

        for (const item of sample) {
          // Try to find similar element in this item
          if (field.element.tagName === 'IMG') {
            if (item.querySelector('img')) matchCount++;
          } else if (field.element.tagName === 'A') {
            if (item.querySelector('a[href]')) matchCount++;
          } else {
            const tag = field.element.tagName.toLowerCase();
            const similar = item.querySelector(tag);
            if (similar) matchCount++;
          }
        }

        field.consistency = matchCount / sample.length;
        field.confidence *= field.consistency;
      }
    }

    /**
     * Deduplicate fields (same type at same position).
     */
    _deduplicateFields(fields) {
      const seen = new Map();
      const result = [];

      for (const field of fields) {
        const key = `${field.type}_${field.name}_${field.attribute}`;
        if (!seen.has(key) || field.confidence > seen.get(key).confidence) {
          seen.set(key, field);
        }
      }

      // Sort by visual position (top to bottom, left to right)
      const sorted = Array.from(seen.values());
      sorted.sort((a, b) => {
        const rectA = a.element.getBoundingClientRect();
        const rectB = b.element.getBoundingClientRect();
        if (Math.abs(rectA.top - rectB.top) > 20) return rectA.top - rectB.top;
        return rectA.left - rectB.left;
      });

      return sorted;
    }

    _getIconForType(type) {
      const icons = {
        title: 'tag',
        text: 'text',
        price: 'dollar',
        url: 'link',
        image: 'image',
        email: 'mail',
        date: 'calendar',
        rating: 'star',
        phone: 'phone',
        number: 'hash',
        location: 'map',
      };
      return icons[type] || 'text';
    }

    /**
     * Batch analyze multiple items and return a merged field schema.
     * Takes the most common fields across items.
     */
    analyzeSchema(items, maxSamples = 5) {
      if (items.length === 0) return [];

      const sample = items.slice(0, maxSamples);
      const allFields = [];

      for (const item of sample) {
        const fields = this.analyzeItem(item, items);
        allFields.push(fields);
      }

      // Merge: find fields that appear in most items
      const fieldMap = new Map();
      for (const itemFields of allFields) {
        for (const field of itemFields) {
          const key = `${field.type}_${field.icon}`;
          if (!fieldMap.has(key)) {
            fieldMap.set(key, { ...field, occurrences: 1, sampleValues: [field.sampleValue] });
          } else {
            const existing = fieldMap.get(key);
            existing.occurrences++;
            if (existing.sampleValues.length < 3 && field.sampleValue) {
              existing.sampleValues.push(field.sampleValue);
            }
          }
        }
      }

      // Return fields that appear in >= 50% of samples
      const threshold = sample.length * 0.5;
      return Array.from(fieldMap.values())
        .filter(f => f.occurrences >= threshold)
        .sort((a, b) => b.confidence - a.confidence);
    }
  }

  window.DataForge = window.DataForge || {};
  window.DataForge.TypeSense = TypeSense;
})();
