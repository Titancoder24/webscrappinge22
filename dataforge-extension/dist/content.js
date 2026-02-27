(function () {
  'use strict';

  const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-";
  const ALPHABET_LEN = ALPHABET.length;
  function generateId(length = 21) {
    if (typeof crypto !== "undefined" && crypto.getRandomValues) {
      const bytes = new Uint8Array(length);
      crypto.getRandomValues(bytes);
      let id2 = "";
      for (let i = 0; i < length; i++) {
        id2 += ALPHABET[bytes[i] & 63];
      }
      return id2;
    }
    let id = "";
    for (let i = 0; i < length; i++) {
      id += ALPHABET[Math.floor(Math.random() * ALPHABET_LEN)];
    }
    return id;
  }
  function generatePrefixedId(prefix, length = 12) {
    return `${prefix}_${generateId(length)}`;
  }

  const OVERLAY_ID = "dataforge-overlay";
  const HIGHLIGHT_CLASS = "dataforge-highlight";
  const VISIBLE_CLASS = "dataforge-highlight--visible";
  const HOVER_CLASS = "dataforge-highlight--hover";
  const SELECTED_CLASS = "dataforge-highlight--selected";
  const PULSE_CLASS = "dataforge-highlight--pulse";
  const BADGE_CLASS = "dataforge-highlight__badge";
  const WAVE_DELAY_MS = 30;
  const FADE_DURATION_MS = 150;
  class ElementHighlighter {
    container = null;
    highlights = /* @__PURE__ */ new Map();
    color = "#10B981";
    resizeObserver = null;
    scrollHandler = null;
    repositionRafId = null;
    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------
    /**
     * Highlight all elements matching a CSS selector.
     * Applies a staggered "wave" animation across matched elements.
     *
     * @param selector - CSS selector string
     * @returns Number of elements highlighted
     */
    highlightElements(selector) {
      this.clearAll();
      this.ensureContainer();
      let elements;
      try {
        elements = document.querySelectorAll(selector);
      } catch {
        return 0;
      }
      if (elements.length === 0) return 0;
      for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        const overlay = this.createOverlayBox(el);
        if (!overlay) continue;
        const entry = { element: el, overlay, rafId: null };
        this.highlights.set(el, entry);
        this.container.appendChild(overlay);
        const delay = i * WAVE_DELAY_MS;
        entry.rafId = requestAnimationFrame(() => {
          setTimeout(() => {
            overlay.classList.add(VISIBLE_CLASS);
            entry.rafId = null;
          }, delay);
        });
      }
      this.startTracking();
      return elements.length;
    }
    /**
     * Highlight a single element, typically on hover.
     * Does not clear existing highlights.
     *
     * @param el - The element to highlight
     * @param mode - 'hover' for mouseover styling, 'selected' for click confirmation
     */
    highlightSingle(el, mode = "hover") {
      this.ensureContainer();
      const existing = this.highlights.get(el);
      if (existing) {
        existing.overlay.classList.remove(HOVER_CLASS, SELECTED_CLASS, PULSE_CLASS);
        if (mode === "hover") {
          existing.overlay.classList.add(HOVER_CLASS);
        } else {
          existing.overlay.classList.add(SELECTED_CLASS, PULSE_CLASS);
        }
        this.repositionOverlay(existing);
        return;
      }
      const overlay = this.createOverlayBox(el);
      if (!overlay) return;
      if (mode === "hover") {
        overlay.classList.add(HOVER_CLASS);
      } else {
        overlay.classList.add(SELECTED_CLASS, PULSE_CLASS);
      }
      const entry = { element: el, overlay, rafId: null };
      this.highlights.set(el, entry);
      this.container.appendChild(overlay);
      requestAnimationFrame(() => {
        overlay.classList.add(VISIBLE_CLASS);
      });
      this.startTracking();
    }
    /**
     * Remove a single element's highlight.
     */
    removeSingle(el) {
      const entry = this.highlights.get(el);
      if (!entry) return;
      entry.overlay.classList.remove(VISIBLE_CLASS);
      setTimeout(() => {
        if (entry.rafId !== null) {
          cancelAnimationFrame(entry.rafId);
        }
        entry.overlay.remove();
        this.highlights.delete(el);
        if (this.highlights.size === 0) {
          this.stopTracking();
        }
      }, FADE_DURATION_MS);
    }
    /**
     * Clear all highlights and remove the overlay container.
     */
    clearAll() {
      this.stopTracking();
      for (const [, entry] of this.highlights) {
        if (entry.rafId !== null) {
          cancelAnimationFrame(entry.rafId);
        }
        entry.overlay.remove();
      }
      this.highlights.clear();
      if (this.container) {
        this.container.remove();
        this.container = null;
      }
    }
    /**
     * Change the highlight border color.
     *
     * @param color - CSS color value
     */
    setHighlightColor(color) {
      this.color = color;
      for (const [, entry] of this.highlights) {
        entry.overlay.style.borderColor = color;
        entry.overlay.style.background = this.colorToBackground(color);
      }
    }
    /**
     * Add a count badge to the top-right of highlighted elements.
     *
     * @param count - Number to display
     */
    showBadge(count) {
      if (!this.container) return;
      const existing = this.container.querySelectorAll(`.${BADGE_CLASS}`);
      for (let i = 0; i < existing.length; i++) {
        existing[i].remove();
      }
      const firstEntry = this.highlights.values().next().value;
      if (firstEntry) {
        const badge = document.createElement("div");
        badge.className = BADGE_CLASS;
        badge.textContent = String(count);
        firstEntry.overlay.appendChild(badge);
      }
    }
    /** Number of currently active highlights. */
    get count() {
      return this.highlights.size;
    }
    // -------------------------------------------------------------------------
    // Internal
    // -------------------------------------------------------------------------
    ensureContainer() {
      if (this.container && this.container.isConnected) return;
      const existing = document.getElementById(OVERLAY_ID);
      if (existing) {
        this.container = existing;
        return;
      }
      const container = document.createElement("div");
      container.id = OVERLAY_ID;
      container.className = "dataforge-overlay";
      document.documentElement.appendChild(container);
      this.container = container;
    }
    createOverlayBox(el) {
      let rect;
      try {
        rect = el.getBoundingClientRect();
      } catch {
        return null;
      }
      if (rect.width === 0 && rect.height === 0) return null;
      const overlay = document.createElement("div");
      overlay.className = HIGHLIGHT_CLASS;
      overlay.style.borderColor = this.color;
      overlay.style.background = this.colorToBackground(this.color);
      this.positionOverlay(overlay, rect);
      return overlay;
    }
    positionOverlay(overlay, rect) {
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;
      overlay.style.transform = `translate3d(${rect.left}px, ${rect.top}px, 0)`;
      overlay.style.top = "0";
      overlay.style.left = "0";
    }
    repositionOverlay(entry) {
      try {
        const rect = entry.element.getBoundingClientRect();
        this.positionOverlay(entry.overlay, rect);
      } catch {
      }
    }
    repositionAll() {
      if (this.repositionRafId !== null) return;
      this.repositionRafId = requestAnimationFrame(() => {
        this.repositionRafId = null;
        for (const [el, entry] of this.highlights) {
          if (!el.isConnected) {
            entry.overlay.remove();
            this.highlights.delete(el);
            continue;
          }
          this.repositionOverlay(entry);
        }
        if (this.highlights.size === 0) {
          this.stopTracking();
        }
      });
    }
    /**
     * Start listening for scroll and resize events to reposition overlays.
     */
    startTracking() {
      if (this.scrollHandler) return;
      this.scrollHandler = () => this.repositionAll();
      window.addEventListener("scroll", this.scrollHandler, { passive: true, capture: true });
      window.addEventListener("resize", this.scrollHandler, { passive: true });
      if (typeof ResizeObserver !== "undefined" && !this.resizeObserver) {
        this.resizeObserver = new ResizeObserver(() => this.repositionAll());
        for (const [el] of this.highlights) {
          try {
            this.resizeObserver.observe(el);
          } catch {
          }
        }
      }
    }
    /**
     * Stop tracking scroll/resize events.
     */
    stopTracking() {
      if (this.repositionRafId !== null) {
        cancelAnimationFrame(this.repositionRafId);
        this.repositionRafId = null;
      }
      if (this.scrollHandler) {
        window.removeEventListener("scroll", this.scrollHandler, { capture: true });
        window.removeEventListener("resize", this.scrollHandler);
        this.scrollHandler = null;
      }
      if (this.resizeObserver) {
        this.resizeObserver.disconnect();
        this.resizeObserver = null;
      }
    }
    /**
     * Convert a hex color to a semi-transparent background.
     */
    colorToBackground(color) {
      const hex = color.replace("#", "");
      if (hex.length === 6) {
        const r = parseInt(hex.slice(0, 2), 16);
        const g = parseInt(hex.slice(2, 4), 16);
        const b = parseInt(hex.slice(4, 6), 16);
        return `rgba(${r}, ${g}, ${b}, 0.08)`;
      }
      return "rgba(16, 185, 129, 0.08)";
    }
  }

  const HOVER_THROTTLE_MS = 80;
  const SKIP_TAGS$1 = /* @__PURE__ */ new Set([
    "HTML",
    "BODY",
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "SVG",
    "HEAD",
    "META",
    "LINK",
    "BR",
    "HR"
  ]);
  const DATAFORGE_PREFIX = "dataforge-";
  class CursorController {
    active = false;
    tool = "";
    highlighter;
    currentTarget = null;
    // DOM elements for cursor UI
    cursorRing = null;
    tooltip = null;
    dimOverlay = null;
    // Bound event handlers
    boundMouseMove = null;
    boundClick = null;
    boundKeyDown = null;
    // Throttle state
    lastHoverTime = 0;
    pendingHoverRaf = null;
    constructor(highlighter) {
      this.highlighter = highlighter || new ElementHighlighter();
    }
    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------
    /**
     * Activate selection mode. The page cursor becomes a crosshair and
     * elements are highlighted on hover.
     *
     * @param tool - The tool type requesting selection (e.g., 'list-extractor')
     */
    activate(tool) {
      if (this.active) {
        this.deactivate();
      }
      this.active = true;
      this.tool = tool;
      document.documentElement.classList.add("dataforge-cursor-active");
      this.cursorRing = document.createElement("div");
      this.cursorRing.className = "dataforge-cursor-ring";
      document.documentElement.appendChild(this.cursorRing);
      this.tooltip = document.createElement("div");
      this.tooltip.className = "dataforge-tooltip";
      this.tooltip.innerHTML = '<span class="dataforge-tooltip__icon"></span><span class="dataforge-tooltip__text"></span>';
      document.documentElement.appendChild(this.tooltip);
      this.dimOverlay = document.createElement("div");
      this.dimOverlay.className = "dataforge-dim";
      document.documentElement.appendChild(this.dimOverlay);
      requestAnimationFrame(() => {
        if (this.dimOverlay) {
          this.dimOverlay.classList.add("dataforge-dim--active");
        }
      });
      this.boundMouseMove = (e) => this.onMouseMove(e);
      this.boundClick = (e) => this.onClick(e);
      this.boundKeyDown = (e) => this.onKeyDown(e);
      document.addEventListener("mousemove", this.boundMouseMove, { passive: true, capture: true });
      document.addEventListener("click", this.boundClick, { capture: true });
      document.addEventListener("keydown", this.boundKeyDown, { capture: true });
    }
    /**
     * Deactivate selection mode and clean up all UI elements.
     */
    deactivate() {
      if (!this.active) return;
      this.active = false;
      this.currentTarget = null;
      document.documentElement.classList.remove("dataforge-cursor-active");
      if (this.cursorRing) {
        this.cursorRing.remove();
        this.cursorRing = null;
      }
      if (this.tooltip) {
        this.tooltip.remove();
        this.tooltip = null;
      }
      if (this.dimOverlay) {
        this.dimOverlay.classList.remove("dataforge-dim--active");
        const dim = this.dimOverlay;
        setTimeout(() => dim.remove(), 300);
        this.dimOverlay = null;
      }
      if (this.boundMouseMove) {
        document.removeEventListener("mousemove", this.boundMouseMove, { capture: true });
        this.boundMouseMove = null;
      }
      if (this.boundClick) {
        document.removeEventListener("click", this.boundClick, { capture: true });
        this.boundClick = null;
      }
      if (this.boundKeyDown) {
        document.removeEventListener("keydown", this.boundKeyDown, { capture: true });
        this.boundKeyDown = null;
      }
      if (this.pendingHoverRaf !== null) {
        cancelAnimationFrame(this.pendingHoverRaf);
        this.pendingHoverRaf = null;
      }
      this.highlighter.clearAll();
    }
    /** Whether selection mode is currently active. */
    get isActive() {
      return this.active;
    }
    // -------------------------------------------------------------------------
    // Event handlers
    // -------------------------------------------------------------------------
    onMouseMove(e) {
      if (!this.active) return;
      if (this.cursorRing) {
        this.cursorRing.style.left = `${e.clientX}px`;
        this.cursorRing.style.top = `${e.clientY}px`;
      }
      const now = Date.now();
      if (now - this.lastHoverTime < HOVER_THROTTLE_MS) {
        return;
      }
      this.lastHoverTime = now;
      const target = this.getTargetElement(e.clientX, e.clientY);
      if (target === this.currentTarget) return;
      if (this.currentTarget) {
        this.highlighter.removeSingle(this.currentTarget);
      }
      this.currentTarget = target;
      if (!target) {
        this.hideTooltip();
        return;
      }
      this.highlighter.highlightSingle(target, "hover");
      this.updateTooltip(target, e.clientX, e.clientY);
    }
    onClick(e) {
      if (!this.active) return;
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();
      const target = this.getTargetElement(e.clientX, e.clientY);
      if (!target) return;
      this.highlighter.highlightSingle(target, "selected");
      this.createShockwave(e.clientX, e.clientY);
      const selector = this.generateSelector(target);
      const patternId = this.detectPatternId(target);
      const message = {
        type: "ELEMENT_CLICKED",
        selector,
        patternId
      };
      try {
        chrome.runtime.sendMessage(message);
      } catch {
      }
    }
    onKeyDown(e) {
      if (!this.active) return;
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        this.deactivate();
        try {
          const message = { type: "DEACTIVATE_SELECTION_MODE" };
          chrome.runtime.sendMessage(message);
        } catch {
        }
      }
    }
    // -------------------------------------------------------------------------
    // Target element detection
    // -------------------------------------------------------------------------
    /**
     * Determine which meaningful element is at the given coordinates.
     * Walks up from the raw element under cursor to find a suitable target.
     */
    getTargetElement(x, y) {
      const overlayElements = document.querySelectorAll(
        ".dataforge-overlay, .dataforge-cursor-ring, .dataforge-tooltip, .dataforge-dim"
      );
      const origDisplay = [];
      for (let i = 0; i < overlayElements.length; i++) {
        const el = overlayElements[i];
        origDisplay.push(el.style.display);
        el.style.display = "none";
      }
      let rawTarget = null;
      try {
        rawTarget = document.elementFromPoint(x, y);
      } catch {
      }
      for (let i = 0; i < overlayElements.length; i++) {
        overlayElements[i].style.display = origDisplay[i];
      }
      if (!rawTarget) return null;
      let target = rawTarget;
      while (target) {
        if (this.isDataForgeElement(target)) {
          target = target.parentElement;
          continue;
        }
        if (SKIP_TAGS$1.has(target.tagName)) {
          target = target.parentElement;
          continue;
        }
        break;
      }
      return target;
    }
    isDataForgeElement(el) {
      const id = el.id || "";
      const className = el.className || "";
      if (typeof className === "string") {
        return id.startsWith(DATAFORGE_PREFIX) || className.includes(DATAFORGE_PREFIX);
      }
      return id.startsWith(DATAFORGE_PREFIX);
    }
    // -------------------------------------------------------------------------
    // Tooltip
    // -------------------------------------------------------------------------
    updateTooltip(el, mouseX, mouseY) {
      if (!this.tooltip) return;
      const info = this.quickPatternDetect(el);
      const textSpan = this.tooltip.querySelector(".dataforge-tooltip__text");
      if (textSpan) {
        textSpan.innerHTML = info.label;
      }
      const offsetX = 16;
      const offsetY = 20;
      let tooltipX = mouseX + offsetX;
      let tooltipY = mouseY + offsetY;
      const tooltipRect = this.tooltip.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      if (tooltipX + tooltipRect.width > viewportWidth - 10) {
        tooltipX = mouseX - tooltipRect.width - offsetX;
      }
      if (tooltipY + tooltipRect.height > viewportHeight - 10) {
        tooltipY = mouseY - tooltipRect.height - offsetY;
      }
      this.tooltip.style.left = `${Math.max(5, tooltipX)}px`;
      this.tooltip.style.top = `${Math.max(5, tooltipY)}px`;
      this.tooltip.classList.add("dataforge-tooltip--visible");
    }
    hideTooltip() {
      if (this.tooltip) {
        this.tooltip.classList.remove("dataforge-tooltip--visible");
      }
    }
    // -------------------------------------------------------------------------
    // Quick pattern detection (lightweight)
    // -------------------------------------------------------------------------
    quickPatternDetect(el) {
      const parent = el.parentElement;
      if (!parent) {
        return { count: 1, label: `&lt;${el.tagName.toLowerCase()}&gt;` };
      }
      const tag = el.tagName;
      const classKey = this.getClassSignature(el);
      let count = 0;
      const siblings = parent.children;
      for (let i = 0; i < siblings.length; i++) {
        if (siblings[i].tagName === tag && this.getClassSignature(siblings[i]) === classKey) {
          count++;
        }
      }
      const category = this.classifyElement(el, count);
      if (count > 1) {
        return {
          count,
          label: `<span class="dataforge-tooltip__count">${count}</span> ${category} detected`
        };
      }
      const grandparent = parent.parentElement;
      if (grandparent) {
        const parentTag = parent.tagName;
        const parentClassKey = this.getClassSignature(parent);
        let parentCount = 0;
        const uncles = grandparent.children;
        for (let i = 0; i < uncles.length; i++) {
          if (uncles[i].tagName === parentTag && this.getClassSignature(uncles[i]) === parentClassKey) {
            parentCount++;
          }
        }
        if (parentCount > 1) {
          const parentCategory = this.classifyElement(parent, parentCount);
          return {
            count: parentCount,
            label: `List: <span class="dataforge-tooltip__count">${parentCount}</span> ${parentCategory}`
          };
        }
      }
      return {
        count: 1,
        label: `&lt;${el.tagName.toLowerCase()}&gt; element`
      };
    }
    /**
     * Generate a simple class-based signature for quick comparison.
     */
    getClassSignature(el) {
      const classes = Array.from(el.classList).sort();
      return classes.join(".");
    }
    /**
     * Attempt to classify what kind of content an element represents.
     */
    classifyElement(el, count) {
      const tag = el.tagName.toLowerCase();
      const classText = (el.className || "").toLowerCase();
      const html = el.innerHTML || "";
      if (classText.includes("product") || classText.includes("item") && html.includes("price")) {
        return "products";
      }
      if (classText.includes("review") || classText.includes("comment") || classText.includes("testimonial")) {
        return "reviews";
      }
      if (classText.includes("article") || classText.includes("post") || classText.includes("story")) {
        return "articles";
      }
      if (classText.includes("card")) {
        return "cards";
      }
      if (tag === "tr") {
        return "rows";
      }
      if (tag === "li") {
        return count > 5 ? "items" : "items";
      }
      if (classText.includes("listing") || classText.includes("result")) {
        return "listings";
      }
      return "items";
    }
    // -------------------------------------------------------------------------
    // Selector generation
    // -------------------------------------------------------------------------
    /**
     * Generate a CSS selector for the given element.
     * Tries data attributes > id > semantic classes > structural path.
     */
    generateSelector(el) {
      if (el.id && !el.id.match(/^\d/) && !el.id.includes(":")) {
        const idSelector = `#${CSS.escape(el.id)}`;
        if (this.isUniqueSelector(idSelector)) {
          return idSelector;
        }
      }
      const dataAttrs = this.getDataAttributes(el);
      for (const attr of dataAttrs) {
        const val = el.getAttribute(attr);
        if (val) {
          const selector = `[${attr}="${CSS.escape(val)}"]`;
          if (this.isUniqueSelector(selector)) {
            return selector;
          }
        }
      }
      const tag = el.tagName.toLowerCase();
      const stableClasses = this.getStableClasses(el);
      if (stableClasses.length > 0) {
        const classSelector = `${tag}.${stableClasses.map((c) => CSS.escape(c)).join(".")}`;
        try {
          const count = document.querySelectorAll(classSelector).length;
          if (count >= 1) {
            return classSelector;
          }
        } catch {
        }
      }
      return this.buildStructuralPath(el);
    }
    getDataAttributes(el) {
      const attrs = [];
      const names = el.getAttributeNames();
      for (const name of names) {
        if (name.startsWith("data-") && !name.includes("random") && !name.includes("uid")) {
          attrs.push(name);
        }
      }
      return attrs;
    }
    getStableClasses(el) {
      const classes = [];
      for (let i = 0; i < el.classList.length; i++) {
        const cls = el.classList[i];
        if (cls.length > 30) continue;
        if (/^[a-z]{1,3}-[a-f0-9]{6,}$/i.test(cls)) continue;
        if (/^[a-f0-9]{8,}$/.test(cls)) continue;
        if (/^_/.test(cls)) continue;
        classes.push(cls);
      }
      return classes;
    }
    buildStructuralPath(el) {
      const segments = [];
      let current = el;
      let depth = 0;
      const maxDepth = 5;
      while (current && current !== document.documentElement && depth < maxDepth) {
        const tag = current.tagName.toLowerCase();
        const parent = current.parentElement;
        if (current.id && !current.id.match(/^\d/)) {
          segments.unshift(`#${CSS.escape(current.id)}`);
          break;
        }
        if (parent) {
          let index = 0;
          let sameTagCount = 0;
          const children = parent.children;
          for (let i = 0; i < children.length; i++) {
            if (children[i].tagName === current.tagName) {
              sameTagCount++;
              if (children[i] === current) {
                index = sameTagCount;
              }
            }
          }
          if (sameTagCount > 1) {
            segments.unshift(`${tag}:nth-of-type(${index})`);
          } else {
            segments.unshift(tag);
          }
        } else {
          segments.unshift(tag);
        }
        current = parent;
        depth++;
      }
      return segments.join(" > ");
    }
    isUniqueSelector(selector) {
      try {
        return document.querySelectorAll(selector).length === 1;
      } catch {
        return false;
      }
    }
    /**
     * Attempt to identify a pattern ID for the clicked element by checking
     * if it belongs to a repeating group.
     */
    detectPatternId(el) {
      const parent = el.parentElement;
      if (!parent) return "";
      const tag = el.tagName;
      const classKey = this.getClassSignature(el);
      let count = 0;
      const siblings = parent.children;
      for (let i = 0; i < siblings.length; i++) {
        if (siblings[i].tagName === tag && this.getClassSignature(siblings[i]) === classKey) {
          count++;
        }
      }
      if (count > 1) {
        const stableClasses = this.getStableClasses(el);
        if (stableClasses.length > 0) {
          return `${tag.toLowerCase()}.${stableClasses.join(".")}`;
        }
        return tag.toLowerCase();
      }
      return "";
    }
    // -------------------------------------------------------------------------
    // Shockwave animation
    // -------------------------------------------------------------------------
    createShockwave(x, y) {
      const shockwave = document.createElement("div");
      shockwave.className = "dataforge-shockwave";
      shockwave.style.left = `${x}px`;
      shockwave.style.top = `${y}px`;
      document.documentElement.appendChild(shockwave);
      setTimeout(() => {
        shockwave.remove();
      }, 600);
    }
  }

  const INVISIBLE_CHARS = /[\u200B\u200C\u200D\u200E\u200F\uFEFF\u00AD\u2060\u2061\u2062\u2063\u2064\u034F\u061C\u180E\u2028\u2029\u202A-\u202E\u2066-\u2069]/g;
  const HTML_ENTITIES = {
    "&amp;": "&",
    "&lt;": "<",
    "&gt;": ">",
    "&quot;": '"',
    "&#39;": "'",
    "&apos;": "'",
    "&nbsp;": " ",
    "&ndash;": "–",
    "&mdash;": "—",
    "&lsquo;": "‘",
    "&rsquo;": "’",
    "&ldquo;": "“",
    "&rdquo;": "”",
    "&bull;": "•",
    "&hellip;": "…",
    "&trade;": "™",
    "&copy;": "©",
    "&reg;": "®",
    "&deg;": "°",
    "&plusmn;": "±",
    "&times;": "×",
    "&divide;": "÷",
    "&cent;": "¢",
    "&pound;": "£",
    "&yen;": "¥",
    "&euro;": "€"
  };
  const RE_NUMERIC_ENTITY = /&#(\d+);/g;
  const RE_HEX_ENTITY = /&#x([0-9a-fA-F]+);/g;
  const RE_NAMED_ENTITY = /&([a-zA-Z]+);/g;
  const MONTH_MAP = {
    jan: 1,
    january: 1,
    feb: 2,
    february: 2,
    mar: 3,
    march: 3,
    apr: 4,
    april: 4,
    may: 5,
    jun: 6,
    june: 6,
    jul: 7,
    july: 7,
    aug: 8,
    august: 8,
    sep: 9,
    sept: 9,
    september: 9,
    oct: 10,
    october: 10,
    nov: 11,
    november: 11,
    dec: 12,
    december: 12
  };
  const CURRENCY_SYMBOLS = /[£$€¥₹₩₽¢]/g;
  const CURRENCY_CODES = /\s*(USD|EUR|GBP|JPY|INR|CAD|AUD|CHF|CNY|KRW|BRL|MXN|SEK|NOK|DKK|PLN|CZK|HUF|RUB|TRY|ZAR|SGD|HKD|NZD|THB|PHP|TWD|IDR|MYR|VND|ARS|CLP|COP|PEN|ILS)\s*/gi;
  function trimWhitespace(value) {
    return value.replace(/[\s\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]+/g, " ").trim();
  }
  function normalizeUnicode(value) {
    try {
      let normalized = value.normalize("NFC");
      normalized = normalized.replace(/[\u2018\u2019\u201A\u201B]/g, "'").replace(/[\u201C\u201D\u201E\u201F]/g, '"').replace(/\u2026/g, "...").replace(/[\u2013\u2014]/g, "-").replace(/\u00A0/g, " ");
      return normalized;
    } catch {
      return value;
    }
  }
  function resolveUrl$2(value, baseUrl) {
    const trimmed = value.trim();
    if (!trimmed) return trimmed;
    if (/^(https?:\/\/|data:|blob:|javascript:|mailto:|tel:)/i.test(trimmed)) return trimmed;
    if (trimmed.startsWith("/") || trimmed.startsWith("./") || trimmed.startsWith("../") || trimmed.startsWith("//")) {
      try {
        const resolved = new URL(trimmed, baseUrl);
        return resolved.href;
      } catch {
        return trimmed;
      }
    }
    return trimmed;
  }
  function decodeHtmlEntities(value) {
    let result = value;
    result = result.replace(RE_NAMED_ENTITY, (match) => {
      return HTML_ENTITIES[match] ?? match;
    });
    result = result.replace(RE_NUMERIC_ENTITY, (_match, code) => {
      try {
        const num = parseInt(code, 10);
        return num > 0 && num < 1114112 ? String.fromCodePoint(num) : _match;
      } catch {
        return _match;
      }
    });
    result = result.replace(RE_HEX_ENTITY, (_match, code) => {
      try {
        const num = parseInt(code, 16);
        return num > 0 && num < 1114112 ? String.fromCodePoint(num) : _match;
      } catch {
        return _match;
      }
    });
    return result;
  }
  function stripInvisibleChars(value) {
    return value.replace(INVISIBLE_CHARS, "");
  }
  function normalizePrice(value) {
    const trimmed = value.trim();
    if (!/[£$€¥₹₩₽¢]/.test(trimmed) && !/\d/.test(trimmed)) return trimmed;
    if (/[-\u2013\u2014]/.test(trimmed) && /\d.*[-\u2013\u2014].*\d/.test(trimmed)) {
      const parts = trimmed.split(/\s*[-\u2013\u2014]\s*/);
      if (parts.length === 2) {
        const left = normalizeSinglePrice(parts[0]);
        const right = normalizeSinglePrice(parts[1]);
        if (left && right) return `${left}-${right}`;
      }
    }
    return normalizeSinglePrice(trimmed) ?? trimmed;
  }
  function normalizeSinglePrice(value) {
    let cleaned = value.replace(CURRENCY_SYMBOLS, "").replace(CURRENCY_CODES, "").trim();
    if (!cleaned) return null;
    const lastComma = cleaned.lastIndexOf(",");
    const lastDot = cleaned.lastIndexOf(".");
    if (lastComma > lastDot && lastComma === cleaned.length - 3) {
      cleaned = cleaned.replace(/\./g, "").replace(",", ".");
    } else if (lastDot > lastComma) {
      cleaned = cleaned.replace(/,/g, "");
    } else if (lastComma > -1 && lastDot === -1) {
      const afterComma = cleaned.substring(lastComma + 1);
      if (afterComma.length === 2) {
        cleaned = cleaned.replace(",", ".");
      } else {
        cleaned = cleaned.replace(/,/g, "");
      }
    }
    cleaned = cleaned.replace(/[^\d.\-]/g, "");
    const num = parseFloat(cleaned);
    if (isNaN(num)) return null;
    return num % 1 === 0 ? num.toString() : num.toFixed(2);
  }
  function parseDate(value) {
    const trimmed = value.trim();
    if (!trimmed) return trimmed;
    try {
      if (/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2})?)?/.test(trimmed)) {
        return trimmed;
      }
      const longMatch = trimmed.match(
        /^(\w+)\s+(\d{1,2})(?:\s*,?\s*(\d{4}))?\s*$/i
      );
      if (longMatch) {
        const month = MONTH_MAP[longMatch[1].toLowerCase()];
        if (month) {
          const day = parseInt(longMatch[2], 10);
          const year = longMatch[3] ? parseInt(longMatch[3], 10) : (/* @__PURE__ */ new Date()).getFullYear();
          if (day >= 1 && day <= 31) {
            return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          }
        }
      }
      const dmyLongMatch = trimmed.match(
        /^(\d{1,2})\s+(\w+)\s+(\d{4})\s*$/i
      );
      if (dmyLongMatch) {
        const month = MONTH_MAP[dmyLongMatch[2].toLowerCase()];
        if (month) {
          const day = parseInt(dmyLongMatch[1], 10);
          const year = parseInt(dmyLongMatch[3], 10);
          if (day >= 1 && day <= 31) {
            return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          }
        }
      }
      const monthYearMatch = trimmed.match(/^(\w+)\s+(\d{4})\s*$/i);
      if (monthYearMatch) {
        const month = MONTH_MAP[monthYearMatch[1].toLowerCase()];
        if (month) {
          const year = parseInt(monthYearMatch[2], 10);
          return `${year}-${String(month).padStart(2, "0")}-01`;
        }
      }
      const usMatch = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})$/);
      if (usMatch) {
        const month = parseInt(usMatch[1], 10);
        const day = parseInt(usMatch[2], 10);
        let year = parseInt(usMatch[3], 10);
        if (year < 100) year += year < 50 ? 2e3 : 1900;
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        }
      }
      const euMatch = trimmed.match(/^(\d{1,2})[-.](\d{1,2})[-.](\d{2,4})$/);
      if (euMatch) {
        const day = parseInt(euMatch[1], 10);
        const month = parseInt(euMatch[2], 10);
        let year = parseInt(euMatch[3], 10);
        if (year < 100) year += year < 50 ? 2e3 : 1900;
        if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
          return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
        }
      }
      const relativeResult = parseRelativeDate(trimmed);
      if (relativeResult) return relativeResult;
    } catch {
    }
    return trimmed;
  }
  function parseRelativeDate(value) {
    const now = /* @__PURE__ */ new Date();
    const lower = value.toLowerCase().trim();
    if (lower === "today" || lower === "just now") {
      return toISODate(now);
    }
    if (lower === "yesterday") {
      now.setDate(now.getDate() - 1);
      return toISODate(now);
    }
    const agoMatch = lower.match(/^(\d+)\s+(second|minute|hour|day|week|month|year)s?\s+ago$/);
    if (agoMatch) {
      const amount = parseInt(agoMatch[1], 10);
      const unit = agoMatch[2];
      return toISODate(subtractTime(now, amount, unit));
    }
    const compactMatch = lower.match(/^(\d+)([smhdwMy])\s*(?:ago)?$/);
    if (compactMatch) {
      const amount = parseInt(compactMatch[1], 10);
      const unitMap = {
        s: "second",
        m: "minute",
        h: "hour",
        d: "day",
        w: "week",
        M: "month",
        y: "year"
      };
      const originalCompact = value.trim().match(/^(\d+)([smhdwMy])\s*(?:ago)?$/);
      const unitChar = originalCompact ? originalCompact[2] : compactMatch[2];
      const unit = unitMap[unitChar];
      if (unit) {
        return toISODate(subtractTime(now, amount, unit));
      }
    }
    const lastMatch = lower.match(/^last\s+(week|month|year)$/);
    if (lastMatch) {
      const unit = lastMatch[1];
      return toISODate(subtractTime(now, 1, unit));
    }
    return null;
  }
  function subtractTime(date, amount, unit) {
    const d = new Date(date);
    switch (unit) {
      case "second":
        d.setSeconds(d.getSeconds() - amount);
        break;
      case "minute":
        d.setMinutes(d.getMinutes() - amount);
        break;
      case "hour":
        d.setHours(d.getHours() - amount);
        break;
      case "day":
        d.setDate(d.getDate() - amount);
        break;
      case "week":
        d.setDate(d.getDate() - amount * 7);
        break;
      case "month":
        d.setMonth(d.getMonth() - amount);
        break;
      case "year":
        d.setFullYear(d.getFullYear() - amount);
        break;
    }
    return d;
  }
  function toISODate(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  const TYPE_CLEANERS = {
    text: (v, _baseUrl) => v,
    number: (v, _baseUrl) => {
      const cleaned = v.replace(/[^\d.\-+eE]/g, "");
      const num = parseFloat(cleaned);
      return isNaN(num) ? v : num.toString();
    },
    price: (v, _baseUrl) => normalizePrice(v),
    url: (v, baseUrl) => resolveUrl$2(v, baseUrl),
    image: (v, baseUrl) => resolveUrl$2(v, baseUrl),
    email: (v, _baseUrl) => v.toLowerCase().trim(),
    date: (v, _baseUrl) => parseDate(v),
    rating: (v, _baseUrl) => {
      const trimmed = v.trim();
      if (/^[★⭐✮✯]+[☆✩✪✫✬✭]*$/.test(trimmed)) {
        const filled = (trimmed.match(/[★⭐✮✯]/g) ?? []).length;
        return filled.toString();
      }
      const numMatch = trimmed.match(/([\d.]+)\s*(?:\/\s*(\d+))?/);
      if (numMatch) {
        const value = parseFloat(numMatch[1]);
        const max = numMatch[2] ? parseFloat(numMatch[2]) : 0;
        if (max === 10) return (value / 2).toFixed(1);
        return value.toString();
      }
      return trimmed;
    },
    phone: (v, _baseUrl) => {
      const trimmed = v.trim();
      const hasPlus = trimmed.startsWith("+");
      const digits = trimmed.replace(/\D/g, "");
      if (digits.length >= 10) {
        if (digits.length === 10) {
          return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
        }
        if (digits.length === 11 && digits.startsWith("1")) {
          return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
        }
        return hasPlus ? `+${digits}` : digits;
      }
      return trimmed;
    },
    location: (v, _baseUrl) => v.trim()
  };
  function cleanValue$1(value, type, baseUrl) {
    if (value == null) return "";
    let cleaned = String(value);
    try {
      cleaned = trimWhitespace(cleaned);
      cleaned = normalizeUnicode(cleaned);
      cleaned = decodeHtmlEntities(cleaned);
      cleaned = stripInvisibleChars(cleaned);
      const cleaner = TYPE_CLEANERS[type];
      if (cleaner) {
        cleaned = cleaner(cleaned, baseUrl ?? "");
      }
      cleaned = cleaned.trim();
    } catch {
      cleaned = cleaned.trim();
    }
    return cleaned;
  }

  function extractData(selector, fields, options = {}) {
    const {
      baseUrl = window.location.href,
      limit = 0,
      clean = true,
      deduplicate = true
    } = options;
    const enabledFields = fields.filter((f) => f.enabled);
    if (enabledFields.length === 0) return [];
    let elements;
    try {
      elements = document.querySelectorAll(selector);
    } catch {
      return [];
    }
    if (elements.length === 0) return [];
    const maxItems = limit > 0 ? Math.min(limit, elements.length) : elements.length;
    const rows = [];
    const seenHashes = /* @__PURE__ */ new Set();
    for (let i = 0; i < maxItems; i++) {
      const el = elements[i];
      const data = {};
      for (const field of enabledFields) {
        const rawValue = extractFieldValue(el, field, baseUrl);
        data[field.name] = clean ? cleanValue(rawValue, field.dataType) : rawValue;
      }
      if (deduplicate) {
        const hash = computeRowHash(data);
        if (seenHashes.has(hash)) continue;
        seenHashes.add(hash);
      }
      rows.push({
        id: generatePrefixedId("row"),
        data,
        sourceUrl: window.location.href,
        extractedAt: Date.now()
      });
    }
    return rows;
  }
  function extractFieldValue(itemEl, field, baseUrl) {
    let target = null;
    if (field.relativeSelector && field.relativeSelector !== ":scope") {
      try {
        target = itemEl.querySelector(field.relativeSelector);
      } catch {
        target = null;
      }
    }
    if (!target) {
      target = itemEl;
    }
    switch (field.dataType) {
      case "url":
        return extractUrl(target, baseUrl);
      case "image":
        return extractImageUrl(target, baseUrl);
      case "email":
        return extractEmail(target);
      case "number":
        return extractNumber(target);
      case "price":
        return extractPrice(target);
      case "rating":
        return extractRating(target);
      case "date":
        return extractDate(target);
      case "phone":
        return extractPhone(target);
      case "text":
      case "location":
      default:
        return extractText(target);
    }
  }
  function extractText(el) {
    const text = (el.textContent || "").trim();
    if (text) return text;
    const alt = el.getAttribute("alt");
    if (alt) return alt.trim();
    const title = el.getAttribute("title");
    if (title) return title.trim();
    const ariaLabel = el.getAttribute("aria-label");
    if (ariaLabel) return ariaLabel.trim();
    const placeholder = el.getAttribute("placeholder");
    if (placeholder) return placeholder.trim();
    if (el instanceof HTMLInputElement || el instanceof HTMLSelectElement || el instanceof HTMLTextAreaElement) {
      return el.value || null;
    }
    return null;
  }
  function extractUrl(el, baseUrl) {
    const href = el.getAttribute("href");
    if (href) return resolveUrl$1(href, baseUrl);
    const dataHref = el.getAttribute("data-href") || el.getAttribute("data-url");
    if (dataHref) return resolveUrl$1(dataHref, baseUrl);
    const anchor = el.querySelector("a[href]");
    if (anchor) {
      const anchorHref = anchor.getAttribute("href");
      if (anchorHref) return resolveUrl$1(anchorHref, baseUrl);
    }
    const text = (el.textContent || "").trim();
    const urlMatch = text.match(/https?:\/\/[^\s<>"']+/);
    if (urlMatch) return urlMatch[0];
    return null;
  }
  function extractImageUrl(el, baseUrl) {
    if (el.tagName === "IMG") {
      const src = el.getAttribute("src") || el.getAttribute("data-src") || el.getAttribute("data-lazy-src");
      if (src) return resolveUrl$1(src, baseUrl);
    }
    const srcset = el.getAttribute("srcset");
    if (srcset) {
      const bestSrc = parseSrcsetBest(srcset);
      if (bestSrc) return resolveUrl$1(bestSrc, baseUrl);
    }
    const img = el.querySelector("img");
    if (img) {
      const src = img.getAttribute("src") || img.getAttribute("data-src") || img.getAttribute("data-lazy-src");
      if (src) return resolveUrl$1(src, baseUrl);
      const imgSrcset = img.getAttribute("srcset");
      if (imgSrcset) {
        const bestSrc = parseSrcsetBest(imgSrcset);
        if (bestSrc) return resolveUrl$1(bestSrc, baseUrl);
      }
    }
    const bgImage = extractBackgroundImage(el);
    if (bgImage) return resolveUrl$1(bgImage, baseUrl);
    const picture = el.tagName === "PICTURE" ? el : el.querySelector("picture");
    if (picture) {
      const source = picture.querySelector("source[srcset]");
      if (source) {
        const sourceSrcset = source.getAttribute("srcset");
        if (sourceSrcset) {
          const bestSrc = parseSrcsetBest(sourceSrcset);
          if (bestSrc) return resolveUrl$1(bestSrc, baseUrl);
        }
      }
    }
    return null;
  }
  function extractEmail(el) {
    const href = el.getAttribute("href");
    if (href && href.startsWith("mailto:")) {
      return href.replace("mailto:", "").split("?")[0].trim();
    }
    const mailtoLink = el.querySelector('a[href^="mailto:"]');
    if (mailtoLink) {
      const mailHref = mailtoLink.getAttribute("href");
      if (mailHref) return mailHref.replace("mailto:", "").split("?")[0].trim();
    }
    const text = (el.textContent || "").trim();
    const emailMatch = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    return emailMatch ? emailMatch[0] : null;
  }
  function extractNumber(el) {
    const text = (el.textContent || "").trim();
    const cleaned = text.replace(/[,\s]/g, "");
    const match = cleaned.match(/-?[\d.]+/);
    if (match) {
      const num = parseFloat(match[0]);
      return Number.isFinite(num) ? num : null;
    }
    return null;
  }
  function extractPrice(el) {
    const text = (el.textContent || "").trim();
    const priceMatch = text.match(/[£$€¥₹]?\s*[\d,]+\.?\d{0,2}\s*[£$€¥₹]?/);
    if (priceMatch) {
      return priceMatch[0].trim();
    }
    return text || null;
  }
  function extractRating(el) {
    const ariaLabel = el.getAttribute("aria-label");
    if (ariaLabel && /\d/.test(ariaLabel)) {
      return ariaLabel.trim();
    }
    const dataRating = el.getAttribute("data-rating") || el.getAttribute("data-score");
    if (dataRating) return dataRating;
    const stars = el.querySelectorAll('[class*="star"][class*="fill"], [class*="star"][class*="active"], [aria-label*="star"]');
    if (stars.length > 0) {
      return `${stars.length}/5`;
    }
    const inner = el.querySelector('[style*="width"]');
    if (inner) {
      const style = inner.getAttribute("style") || "";
      const widthMatch = style.match(/width:\s*([\d.]+)%/);
      if (widthMatch) {
        const percentage = parseFloat(widthMatch[1]);
        const rating = (percentage / 20).toFixed(1);
        return `${rating}/5`;
      }
    }
    const text = (el.textContent || "").trim();
    const ratingMatch = text.match(/(\d+(?:\.\d+)?)\s*(?:\/\s*\d+|out of \d+|stars?)?/i);
    return ratingMatch ? ratingMatch[0] : null;
  }
  function extractDate(el) {
    if (el.tagName === "TIME") {
      const datetime = el.getAttribute("datetime");
      if (datetime) return datetime;
    }
    const timeEl = el.querySelector("time[datetime]");
    if (timeEl) {
      const datetime = timeEl.getAttribute("datetime");
      if (datetime) return datetime;
    }
    const dataDate = el.getAttribute("data-date") || el.getAttribute("data-timestamp");
    if (dataDate) return dataDate;
    return (el.textContent || "").trim() || null;
  }
  function extractPhone(el) {
    const href = el.getAttribute("href");
    if (href && href.startsWith("tel:")) {
      return href.replace("tel:", "").trim();
    }
    const telLink = el.querySelector('a[href^="tel:"]');
    if (telLink) {
      const telHref = telLink.getAttribute("href");
      if (telHref) return telHref.replace("tel:", "").trim();
    }
    const text = (el.textContent || "").trim();
    const phoneMatch = text.match(/[+]?[\d\s()-]{7,}/);
    return phoneMatch ? phoneMatch[0].trim() : null;
  }
  function cleanValue(value, dataType) {
    if (value === null || value === void 0) return null;
    if (typeof value === "number") return value;
    try {
      const cleaned = cleanValue$1(
        value,
        dataType,
        window.location.href
      );
      return cleaned || null;
    } catch {
      let cleaned = value;
      cleaned = cleaned.replace(/[\u200B\u200C\u200D\uFEFF\u00AD]/g, "");
      cleaned = cleaned.replace(/\s+/g, " ").trim();
      return cleaned || null;
    }
  }
  function resolveUrl$1(url, baseUrl) {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) {
      return url;
    }
    if (url.startsWith("//")) {
      try {
        const base = new URL(baseUrl);
        return `${base.protocol}${url}`;
      } catch {
        return `https:${url}`;
      }
    }
    try {
      return new URL(url, baseUrl).href;
    } catch {
      return url;
    }
  }
  function parseSrcsetBest(srcset) {
    const entries = srcset.split(",").map((s) => s.trim()).filter(Boolean);
    let bestUrl = "";
    let bestSize = 0;
    for (const entry of entries) {
      const parts = entry.split(/\s+/);
      const url = parts[0];
      const descriptor = parts[1] || "1x";
      let size = 1;
      if (descriptor.endsWith("w")) {
        size = parseInt(descriptor, 10) || 1;
      } else if (descriptor.endsWith("x")) {
        size = (parseFloat(descriptor) || 1) * 1e3;
      }
      if (size > bestSize) {
        bestSize = size;
        bestUrl = url;
      }
    }
    return bestUrl || null;
  }
  function extractBackgroundImage(el) {
    const inlineStyle = el.getAttribute("style") || "";
    const inlineMatch = inlineStyle.match(/background-image\s*:\s*url\(["']?([^"')]+)["']?\)/);
    if (inlineMatch) return inlineMatch[1];
    try {
      const computed = getComputedStyle(el);
      const bgImage = computed.backgroundImage;
      if (bgImage && bgImage !== "none") {
        const match = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
        if (match) return match[1];
      }
    } catch {
    }
    return null;
  }
  function computeRowHash(data) {
    const keys = Object.keys(data).sort();
    const parts = [];
    for (const key of keys) {
      const val = data[key];
      parts.push(`${key}=${val === null ? "" : String(val)}`);
    }
    return parts.join("|");
  }

  class DOMChangeWatcher {
    observer = null;
    callbacks = {};
    pendingMutations = [];
    rafId = null;
    isRunning = false;
    /**
     * Start observing the DOM for changes.
     *
     * @param callbacks - Handlers for different mutation types
     * @param root - Root node to observe (default document.body)
     */
    start(callbacks, root) {
      if (this.isRunning) {
        this.stop();
      }
      this.callbacks = callbacks;
      const targetNode = root || document.body;
      if (!targetNode) {
        return;
      }
      this.observer = new MutationObserver((mutations) => {
        this.pendingMutations.push(...mutations);
        this.scheduleFlush();
      });
      try {
        this.observer.observe(targetNode, {
          childList: true,
          subtree: true,
          attributes: !!callbacks.attributeChanged,
          attributeOldValue: !!callbacks.attributeChanged
        });
        this.isRunning = true;
      } catch (err) {
        this.observer = null;
        this.isRunning = false;
      }
    }
    /** Stop observing and flush any pending mutations. */
    stop() {
      if (this.rafId !== null) {
        cancelAnimationFrame(this.rafId);
        this.rafId = null;
      }
      if (this.observer) {
        const remaining = this.observer.takeRecords();
        if (remaining.length > 0) {
          this.pendingMutations.push(...remaining);
          this.flushMutations();
        }
        this.observer.disconnect();
        this.observer = null;
      }
      this.pendingMutations = [];
      this.isRunning = false;
    }
    /** Whether the watcher is currently observing. */
    get active() {
      return this.isRunning;
    }
    /** Temporarily pause observation without destroying the observer. */
    pause() {
      if (this.observer) {
        this.observer.disconnect();
      }
    }
    /** Resume observation after a pause. Re-observes document.body. */
    resume(root) {
      if (!this.observer || !this.isRunning) return;
      const targetNode = root || document.body;
      if (!targetNode) return;
      try {
        this.observer.observe(targetNode, {
          childList: true,
          subtree: true,
          attributes: !!this.callbacks.attributeChanged,
          attributeOldValue: !!this.callbacks.attributeChanged
        });
      } catch {
      }
    }
    /**
     * Wait for DOM mutations to settle (no new mutations for `quietPeriodMs`).
     * Resolves when the DOM is stable or rejects after `timeoutMs`.
     */
    waitForSettle(quietPeriodMs = 500, timeoutMs = 1e4) {
      return new Promise((resolve, reject) => {
        let quietTimer = null;
        let settled = false;
        const timeoutTimer = setTimeout(() => {
          cleanup();
          reject(new Error("DOM did not settle within timeout"));
        }, timeoutMs);
        const tempObserver = new MutationObserver(() => {
          if (quietTimer !== null) {
            clearTimeout(quietTimer);
          }
          quietTimer = setTimeout(() => {
            cleanup();
            resolve();
          }, quietPeriodMs);
        });
        const cleanup = () => {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutTimer);
          if (quietTimer !== null) {
            clearTimeout(quietTimer);
          }
          tempObserver.disconnect();
        };
        try {
          tempObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true
          });
        } catch {
          cleanup();
          resolve();
          return;
        }
        quietTimer = setTimeout(() => {
          cleanup();
          resolve();
        }, quietPeriodMs);
      });
    }
    // ---------------------------------------------------------------------------
    // Internal
    // ---------------------------------------------------------------------------
    scheduleFlush() {
      if (this.rafId !== null) return;
      this.rafId = requestAnimationFrame(() => {
        this.rafId = null;
        this.flushMutations();
      });
    }
    flushMutations() {
      const mutations = this.pendingMutations;
      this.pendingMutations = [];
      if (mutations.length === 0) return;
      const addedElements = [];
      const removedElements = [];
      const addedSet = /* @__PURE__ */ new Set();
      const removedSet = /* @__PURE__ */ new Set();
      for (let i = 0; i < mutations.length; i++) {
        const mutation = mutations[i];
        if (mutation.type === "childList") {
          const added = mutation.addedNodes;
          for (let j = 0; j < added.length; j++) {
            const node = added[j];
            if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node;
              if (!addedSet.has(el)) {
                addedSet.add(el);
                addedElements.push(el);
              }
              try {
                const nested = el.querySelectorAll("*");
                for (let k = 0; k < nested.length; k++) {
                  if (!addedSet.has(nested[k])) {
                    addedSet.add(nested[k]);
                    addedElements.push(nested[k]);
                  }
                }
              } catch {
              }
            }
          }
          const removed = mutation.removedNodes;
          for (let j = 0; j < removed.length; j++) {
            const node = removed[j];
            if (node.nodeType === Node.ELEMENT_NODE) {
              const el = node;
              if (!removedSet.has(el)) {
                removedSet.add(el);
                removedElements.push(el);
              }
            }
          }
        }
        if (mutation.type === "attributes" && this.callbacks.attributeChanged) {
          const target = mutation.target;
          if (target.nodeType === Node.ELEMENT_NODE) {
            try {
              this.callbacks.attributeChanged(
                target,
                mutation.attributeName || "",
                mutation.oldValue
              );
            } catch {
            }
          }
        }
      }
      const transient = /* @__PURE__ */ new Set();
      for (const el of addedSet) {
        if (removedSet.has(el)) {
          transient.add(el);
        }
      }
      if (this.callbacks.newElementsAdded) {
        const filtered = transient.size > 0 ? addedElements.filter((el) => !transient.has(el)) : addedElements;
        if (filtered.length > 0) {
          try {
            this.callbacks.newElementsAdded(filtered);
          } catch {
          }
        }
      }
      if (this.callbacks.elementsRemoved) {
        const filtered = transient.size > 0 ? removedElements.filter((el) => !transient.has(el)) : removedElements;
        if (filtered.length > 0) {
          try {
            this.callbacks.elementsRemoved(filtered);
          } catch {
          }
        }
      }
    }
  }

  const SCROLL_SPEEDS = {
    slow: 300,
    medium: 600,
    fast: 1200
  };
  const MAX_EMPTY_SCROLLS = 3;
  const DEFAULT_SETTLE_MS = 800;
  const MAX_WAIT_MS = 8e3;
  const MIN_SCROLL_INTERVAL = 100;
  class ScrollController {
    abortFlag = false;
    isScrolling = false;
    watcher;
    constructor() {
      this.watcher = new DOMChangeWatcher();
    }
    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------
    /**
     * Perform an auto-scroll sequence, waiting for new content after each step.
     * Returns a summary of the scroll session.
     */
    async scroll(options = {}) {
      if (this.isScrolling) {
        throw new Error("ScrollController: already scrolling");
      }
      this.isScrolling = true;
      this.abortFlag = false;
      const {
        itemSelector,
        scrollTarget,
        speed = "medium",
        maxSteps = 0,
        maxTimeMs = 0,
        onNewElements,
        onProgress
      } = options;
      const scrollContainer = this.findScrollContainer(scrollTarget);
      const scrollAmount = SCROLL_SPEEDS[speed] || SCROLL_SPEEDS.medium;
      let currentSpeed = scrollAmount;
      let totalNewElements = 0;
      let totalScrollDistance = 0;
      let scrollSteps = 0;
      let emptyScrolls = 0;
      let reachedEnd = false;
      const startTime = Date.now();
      const knownFingerprints = /* @__PURE__ */ new Set();
      if (itemSelector) {
        this.collectFingerprints(itemSelector, knownFingerprints);
      }
      while (!this.abortFlag) {
        if (maxSteps > 0 && scrollSteps >= maxSteps) break;
        if (maxTimeMs > 0 && Date.now() - startTime > maxTimeMs) break;
        if (this.isAtScrollEnd(scrollContainer)) {
          await this.waitForContent(DEFAULT_SETTLE_MS);
          if (this.isAtScrollEnd(scrollContainer)) {
            reachedEnd = true;
            break;
          }
        }
        const scrollBefore = this.getScrollPosition(scrollContainer);
        this.performScroll(scrollContainer, currentSpeed);
        const scrollAfter = this.getScrollPosition(scrollContainer);
        const scrollDelta = scrollAfter - scrollBefore;
        totalScrollDistance += Math.abs(scrollDelta);
        scrollSteps++;
        if (Math.abs(scrollDelta) < 1) {
          emptyScrolls++;
          if (emptyScrolls >= MAX_EMPTY_SCROLLS) {
            reachedEnd = true;
            break;
          }
          await this.waitForContent(DEFAULT_SETTLE_MS);
          continue;
        }
        const newElements = await this.waitForNewContent(
          itemSelector,
          knownFingerprints,
          scrollContainer
        );
        if (newElements.length > 0) {
          totalNewElements += newElements.length;
          emptyScrolls = 0;
          currentSpeed = Math.min(currentSpeed + 50, SCROLL_SPEEDS.fast);
          if (onNewElements) {
            try {
              onNewElements(newElements);
            } catch {
            }
          }
        } else {
          emptyScrolls++;
          currentSpeed = Math.max(currentSpeed - 100, SCROLL_SPEEDS.slow);
          if (emptyScrolls >= MAX_EMPTY_SCROLLS) {
            reachedEnd = true;
            break;
          }
        }
        if (onProgress) {
          try {
            onProgress(scrollSteps, totalNewElements);
          } catch {
          }
        }
        await this.sleep(MIN_SCROLL_INTERVAL);
      }
      this.isScrolling = false;
      return {
        newElementCount: totalNewElements,
        totalScrollDistance,
        scrollSteps,
        reachedEnd,
        aborted: this.abortFlag
      };
    }
    /**
     * Abort a currently running scroll sequence.
     */
    abort() {
      this.abortFlag = true;
    }
    /** Whether a scroll sequence is currently running. */
    get active() {
      return this.isScrolling;
    }
    /**
     * Scroll to a specific element, bringing it into view.
     */
    scrollToElement(el) {
      try {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch {
        try {
          el.scrollIntoView(true);
        } catch {
        }
      }
    }
    // -------------------------------------------------------------------------
    // Scrollable container detection
    // -------------------------------------------------------------------------
    /**
     * Find the actual scrollable container. Many sites use a scrollable div
     * rather than the window/document scroll.
     */
    findScrollContainer(targetSelector) {
      if (targetSelector) {
        try {
          const target = document.querySelector(targetSelector);
          if (target && this.isScrollable(target)) {
            return target;
          }
        } catch {
        }
      }
      const candidates = [];
      const allElements = document.querySelectorAll("*");
      for (let i = 0; i < allElements.length; i++) {
        const el = allElements[i];
        if (this.isScrollable(el)) {
          const rect = el.getBoundingClientRect();
          if (rect.height > window.innerHeight * 0.5) {
            candidates.push(el);
          }
        }
      }
      if (candidates.length > 0) {
        candidates.sort((a, b) => {
          const aRect = a.getBoundingClientRect();
          const bRect = b.getBoundingClientRect();
          const aSize = aRect.width * aRect.height;
          const bSize = bRect.width * bRect.height;
          return bSize - aSize;
        });
        const best = candidates[0];
        if (best.tagName !== "HTML" && best.tagName !== "BODY") {
          return best;
        }
      }
      return window;
    }
    /**
     * Check if an element is scrollable (has overflow content).
     */
    isScrollable(el) {
      try {
        const style = getComputedStyle(el);
        const overflowY = style.overflowY;
        const overflowX = style.overflowX;
        const hasOverflow = overflowY === "scroll" || overflowY === "auto" || overflowX === "scroll" || overflowX === "auto";
        if (!hasOverflow) return false;
        return el.scrollHeight > el.clientHeight || el.scrollWidth > el.clientWidth;
      } catch {
        return false;
      }
    }
    // -------------------------------------------------------------------------
    // Scroll operations
    // -------------------------------------------------------------------------
    performScroll(container, amount) {
      try {
        if (container === window) {
          window.scrollBy({ top: amount, behavior: "smooth" });
        } else {
          container.scrollBy({ top: amount, behavior: "smooth" });
        }
      } catch {
        if (container === window) {
          window.scrollBy(0, amount);
        } else {
          container.scrollTop += amount;
        }
      }
    }
    getScrollPosition(container) {
      if (container === window) {
        return window.scrollY || document.documentElement.scrollTop;
      }
      return container.scrollTop;
    }
    getScrollMax(container) {
      if (container === window) {
        return document.documentElement.scrollHeight - window.innerHeight;
      }
      const el = container;
      return el.scrollHeight - el.clientHeight;
    }
    isAtScrollEnd(container) {
      const pos = this.getScrollPosition(container);
      const max = this.getScrollMax(container);
      return pos >= max - 5;
    }
    // -------------------------------------------------------------------------
    // Content detection
    // -------------------------------------------------------------------------
    /**
     * Wait for new content to appear after a scroll.
     * Uses MutationObserver to detect DOM changes, then checks for new items.
     */
    async waitForNewContent(itemSelector, knownFingerprints, _scrollContainer) {
      try {
        await this.watcher.waitForSettle(DEFAULT_SETTLE_MS, MAX_WAIT_MS);
      } catch {
      }
      if (!itemSelector) {
        return [];
      }
      return this.findNewItems(itemSelector, knownFingerprints);
    }
    /**
     * Wait for any content change or a fixed time period.
     */
    waitForContent(ms) {
      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          resolve();
        }, ms);
        const tempObserver = new MutationObserver(() => {
          clearTimeout(timer);
          tempObserver.disconnect();
          setTimeout(resolve, 200);
        });
        try {
          tempObserver.observe(document.body, { childList: true, subtree: true });
        } catch {
          clearTimeout(timer);
          resolve();
        }
      });
    }
    /**
     * Find items matching the selector that are not in the known fingerprint set.
     */
    findNewItems(selector, knownFingerprints) {
      let elements;
      try {
        elements = document.querySelectorAll(selector);
      } catch {
        return [];
      }
      const newElements = [];
      for (let i = 0; i < elements.length; i++) {
        const fp = this.fingerprint(elements[i]);
        if (!knownFingerprints.has(fp)) {
          knownFingerprints.add(fp);
          newElements.push(elements[i]);
        }
      }
      return newElements;
    }
    /**
     * Collect fingerprints of all elements currently matching the selector.
     */
    collectFingerprints(selector, set) {
      try {
        const elements = document.querySelectorAll(selector);
        for (let i = 0; i < elements.length; i++) {
          set.add(this.fingerprint(elements[i]));
        }
      } catch {
      }
    }
    /**
     * Generate a lightweight fingerprint for an element to detect duplicates.
     * Uses text content snippet + structural position.
     */
    fingerprint(el) {
      const text = (el.textContent || "").trim().slice(0, 120);
      const tag = el.tagName;
      const classes = el.className ? el.className.toString().slice(0, 60) : "";
      const firstChild = el.firstElementChild;
      const childText = firstChild ? (firstChild.textContent || "").trim().slice(0, 40) : "";
      return `${tag}|${classes}|${text}|${childText}`;
    }
    // -------------------------------------------------------------------------
    // Utility
    // -------------------------------------------------------------------------
    sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
  }

  const MAX_RETRIES = 3;
  const DEFAULT_DELAY_MS = 1e3;
  class PaginationExecutor {
    aborted = false;
    scrollController;
    watcher;
    constructor() {
      this.scrollController = new ScrollController();
      this.watcher = new DOMChangeWatcher();
    }
    // -------------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------------
    /**
     * Execute the pagination strategy and yield batches of new elements.
     *
     * @param config - Pagination configuration
     * @param itemSelector - CSS selector for the items being collected
     */
    async *execute(config, itemSelector) {
      this.aborted = false;
      switch (config.mode) {
        case "auto-scroll":
          yield* this.executeAutoScroll(config, itemSelector);
          break;
        case "click-next":
          yield* this.executeClickNext(config, itemSelector);
          break;
        case "url-pattern":
          yield* this.executeUrlPattern(config, itemSelector);
          break;
        case "load-more":
          yield* this.executeLoadMore(config, itemSelector);
          break;
        case "api-intercept":
          yield* this.executeApiIntercept(config, itemSelector);
          break;
        case "manual-urls":
          yield* this.executeManualUrls(config, itemSelector);
          break;
        default:
          throw new Error(`Unknown pagination mode: ${config.mode}`);
      }
    }
    /**
     * Abort the current pagination execution.
     */
    abort() {
      this.aborted = true;
      this.scrollController.abort();
      this.watcher.stop();
    }
    // -------------------------------------------------------------------------
    // Mode 1: Auto-scroll (infinite scroll)
    // -------------------------------------------------------------------------
    async *executeAutoScroll(config, itemSelector) {
      const knownFingerprints = /* @__PURE__ */ new Set();
      this.collectFingerprints(itemSelector, knownFingerprints);
      const initialElements = this.queryAll(itemSelector);
      if (initialElements.length > 0) {
        yield {
          elements: initialElements,
          page: 1,
          isLast: false,
          sourceUrl: window.location.href
        };
      }
      let page = 1;
      const batchBuffer = [];
      const result = await this.scrollController.scroll({
        itemSelector,
        scrollTarget: config.scrollTarget,
        speed: config.scrollSpeed || "medium",
        maxSteps: config.maxPages > 0 ? config.maxPages * 5 : 0,
        onNewElements: (elements) => {
          batchBuffer.push(...elements);
        }
      });
      if (batchBuffer.length > 0) {
        page++;
        yield {
          elements: batchBuffer,
          page,
          isLast: result.reachedEnd,
          sourceUrl: window.location.href
        };
      } else if (result.reachedEnd) {
        yield {
          elements: [],
          page: page + 1,
          isLast: true,
          sourceUrl: window.location.href
        };
      }
    }
    // -------------------------------------------------------------------------
    // Mode 2: Click next button
    // -------------------------------------------------------------------------
    async *executeClickNext(config, itemSelector) {
      const nextSelector = config.selector;
      if (!nextSelector) {
        throw new Error('click-next mode requires a selector for the "Next" button');
      }
      const maxPages = config.maxPages || 50;
      const delay = config.delayMs || DEFAULT_DELAY_MS;
      const firstPageElements = this.queryAll(itemSelector);
      yield {
        elements: firstPageElements,
        page: 1,
        isLast: false,
        sourceUrl: window.location.href
      };
      for (let page = 2; page <= maxPages; page++) {
        if (this.aborted) break;
        const nextButton = this.findClickable(nextSelector);
        if (!nextButton) {
          yield { elements: [], page, isLast: true, sourceUrl: window.location.href };
          break;
        }
        const beforeCount = this.queryAll(itemSelector).length;
        let clicked = false;
        for (let attempt = 0; attempt < MAX_RETRIES && !clicked; attempt++) {
          try {
            await this.clickElement(nextButton);
            clicked = true;
          } catch {
            await this.sleep(500);
          }
        }
        if (!clicked) {
          yield { elements: [], page, isLast: true, sourceUrl: window.location.href };
          break;
        }
        await this.waitForPageChange(itemSelector, beforeCount, delay);
        if (this.aborted) break;
        const currentElements = this.queryAll(itemSelector);
        const newElements = currentElements.slice(beforeCount);
        const isLast = page >= maxPages || !this.findClickable(nextSelector);
        yield {
          elements: newElements.length > 0 ? newElements : currentElements,
          page,
          isLast,
          sourceUrl: window.location.href
        };
        if (isLast) break;
        await this.sleep(delay);
      }
    }
    // -------------------------------------------------------------------------
    // Mode 3: URL pattern
    // -------------------------------------------------------------------------
    async *executeUrlPattern(config, itemSelector) {
      const pattern = config.urlPattern;
      if (!pattern) {
        throw new Error("url-pattern mode requires a urlPattern");
      }
      const maxPages = config.maxPages || 50;
      const delay = config.delayMs || DEFAULT_DELAY_MS;
      const firstPageElements = this.queryAll(itemSelector);
      yield {
        elements: firstPageElements,
        page: 1,
        isLast: false,
        sourceUrl: window.location.href
      };
      let emptyPages = 0;
      for (let page = 2; page <= maxPages; page++) {
        if (this.aborted) break;
        const url = pattern.replace(/\{page\}/g, String(page)).replace(/\{offset\}/g, String((page - 1) * firstPageElements.length));
        try {
          const message = { type: "NAVIGATE_URL", url };
          chrome.runtime.sendMessage(message);
        } catch {
          try {
            window.location.href = url;
          } catch {
            break;
          }
        }
        await this.waitForNavigation();
        await this.sleep(delay);
        if (this.aborted) break;
        const elements = this.queryAll(itemSelector);
        if (elements.length === 0) {
          emptyPages++;
          if (emptyPages >= 2) {
            yield { elements: [], page, isLast: true, sourceUrl: url };
            break;
          }
        } else {
          emptyPages = 0;
        }
        yield {
          elements,
          page,
          isLast: page >= maxPages,
          sourceUrl: url
        };
      }
    }
    // -------------------------------------------------------------------------
    // Mode 4: Load more button
    // -------------------------------------------------------------------------
    async *executeLoadMore(config, itemSelector) {
      const loadMoreSelector = config.selector;
      if (!loadMoreSelector) {
        throw new Error('load-more mode requires a selector for the "Load More" button');
      }
      const maxPages = config.maxPages || 50;
      const delay = config.delayMs || DEFAULT_DELAY_MS;
      const knownFingerprints = /* @__PURE__ */ new Set();
      this.collectFingerprints(itemSelector, knownFingerprints);
      const firstPageElements = this.queryAll(itemSelector);
      yield {
        elements: firstPageElements,
        page: 1,
        isLast: false,
        sourceUrl: window.location.href
      };
      for (let page = 2; page <= maxPages; page++) {
        if (this.aborted) break;
        const loadMoreButton = this.findClickable(loadMoreSelector);
        if (!loadMoreButton) {
          yield { elements: [], page, isLast: true, sourceUrl: window.location.href };
          break;
        }
        this.scrollController.scrollToElement(loadMoreButton);
        await this.sleep(300);
        const beforeCount = this.queryAll(itemSelector).length;
        let clicked = false;
        for (let attempt = 0; attempt < MAX_RETRIES && !clicked; attempt++) {
          try {
            await this.clickElement(loadMoreButton);
            clicked = true;
          } catch {
            await this.sleep(500);
          }
        }
        if (!clicked) {
          yield { elements: [], page, isLast: true, sourceUrl: window.location.href };
          break;
        }
        await this.waitForPageChange(itemSelector, beforeCount, delay);
        if (this.aborted) break;
        const newElements = this.findNewItems(itemSelector, knownFingerprints);
        const isLast = page >= maxPages || !this.findClickable(loadMoreSelector);
        yield {
          elements: newElements,
          page,
          isLast,
          sourceUrl: window.location.href
        };
        if (isLast) break;
        await this.sleep(delay);
      }
    }
    // -------------------------------------------------------------------------
    // Mode 5: API intercept
    // -------------------------------------------------------------------------
    async *executeApiIntercept(config, itemSelector) {
      const endpoint = config.apiEndpoint;
      const pageParam = config.apiPageParam || "page";
      if (!endpoint) {
        throw new Error("api-intercept mode requires an apiEndpoint");
      }
      const maxPages = config.maxPages || 50;
      const delay = config.delayMs || DEFAULT_DELAY_MS;
      const firstPageElements = this.queryAll(itemSelector);
      yield {
        elements: firstPageElements,
        page: 1,
        isLast: false,
        sourceUrl: window.location.href
      };
      for (let page = 2; page <= maxPages; page++) {
        if (this.aborted) break;
        let apiUrl;
        try {
          const url = new URL(endpoint, window.location.origin);
          url.searchParams.set(pageParam, String(page));
          apiUrl = url.toString();
        } catch {
          break;
        }
        let response;
        let retries = 0;
        while (retries < MAX_RETRIES) {
          try {
            response = await fetch(apiUrl, {
              credentials: "same-origin",
              headers: { "Accept": "application/json" }
            });
            if (response.ok) break;
            retries++;
            await this.sleep(1e3 * retries);
          } catch {
            retries++;
            await this.sleep(1e3 * retries);
          }
        }
        if (!response || !response.ok) {
          yield { elements: [], page, isLast: true, sourceUrl: apiUrl };
          break;
        }
        let data;
        try {
          data = await response.json();
        } catch {
          yield { elements: [], page, isLast: true, sourceUrl: apiUrl };
          break;
        }
        const items = this.extractItemsFromApiResponse(data);
        if (items.length === 0) {
          yield { elements: [], page, isLast: true, sourceUrl: apiUrl };
          break;
        }
        await this.sleep(delay);
        const currentElements = this.queryAll(itemSelector);
        yield {
          elements: currentElements,
          page,
          isLast: page >= maxPages,
          sourceUrl: apiUrl
        };
        if (this.aborted) break;
        await this.sleep(delay);
      }
    }
    // -------------------------------------------------------------------------
    // Mode 6: Manual URLs
    // -------------------------------------------------------------------------
    async *executeManualUrls(config, itemSelector) {
      const urls = config.manualUrls;
      if (!urls || urls.length === 0) {
        throw new Error("manual-urls mode requires an array of URLs");
      }
      const delay = config.delayMs || DEFAULT_DELAY_MS;
      const maxPages = Math.min(config.maxPages || urls.length, urls.length);
      for (let i = 0; i < maxPages; i++) {
        if (this.aborted) break;
        const url = urls[i];
        if (i === 0 && window.location.href === url) {
          const elements2 = this.queryAll(itemSelector);
          yield {
            elements: elements2,
            page: 1,
            isLast: maxPages === 1,
            sourceUrl: url
          };
          continue;
        }
        try {
          const message = { type: "NAVIGATE_URL", url };
          chrome.runtime.sendMessage(message);
        } catch {
          try {
            window.location.href = url;
          } catch {
            continue;
          }
        }
        await this.waitForNavigation();
        await this.sleep(delay);
        if (this.aborted) break;
        const elements = this.queryAll(itemSelector);
        yield {
          elements,
          page: i + 1,
          isLast: i >= maxPages - 1,
          sourceUrl: url
        };
      }
    }
    // -------------------------------------------------------------------------
    // Click helpers
    // -------------------------------------------------------------------------
    /**
     * Find a clickable element matching the selector. Checks visibility and
     * disabled state.
     */
    findClickable(selector) {
      try {
        const elements = document.querySelectorAll(selector);
        for (let i = 0; i < elements.length; i++) {
          const el = elements[i];
          try {
            const style = getComputedStyle(el);
            if (style.display === "none" || style.visibility === "hidden") continue;
            if (parseFloat(style.opacity) === 0) continue;
          } catch {
            continue;
          }
          if (el.hasAttribute("disabled")) continue;
          if (el.getAttribute("aria-disabled") === "true") continue;
          return el;
        }
      } catch {
      }
      return null;
    }
    /**
     * Click an element, dispatching both mousedown/mouseup and click events
     * to handle various event handler patterns.
     */
    async clickElement(el) {
      try {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      } catch {
      }
      await this.sleep(150);
      const rect = el.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const eventInit = {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: x,
        clientY: y
      };
      el.dispatchEvent(new MouseEvent("mousedown", eventInit));
      el.dispatchEvent(new MouseEvent("mouseup", eventInit));
      el.dispatchEvent(new MouseEvent("click", eventInit));
      try {
        el.click();
      } catch {
      }
    }
    // -------------------------------------------------------------------------
    // Wait helpers
    // -------------------------------------------------------------------------
    /**
     * Wait for new items to appear after a click/navigation.
     */
    async waitForPageChange(itemSelector, beforeCount, maxWait) {
      const deadline = Date.now() + Math.max(maxWait, 3e3);
      while (Date.now() < deadline) {
        if (this.aborted) return;
        const currentCount = this.queryAll(itemSelector).length;
        if (currentCount !== beforeCount) return;
        await this.sleep(200);
      }
    }
    /**
     * Wait for a full page navigation to complete.
     */
    waitForNavigation() {
      return new Promise((resolve) => {
        if (document.readyState === "complete") {
          resolve();
          return;
        }
        const handler = () => {
          window.removeEventListener("load", handler);
          resolve();
        };
        window.addEventListener("load", handler);
        setTimeout(() => {
          window.removeEventListener("load", handler);
          resolve();
        }, 1e4);
      });
    }
    // -------------------------------------------------------------------------
    // DOM query helpers
    // -------------------------------------------------------------------------
    queryAll(selector) {
      try {
        return Array.from(document.querySelectorAll(selector));
      } catch {
        return [];
      }
    }
    collectFingerprints(selector, set) {
      const elements = this.queryAll(selector);
      for (const el of elements) {
        set.add(this.fingerprint(el));
      }
    }
    findNewItems(selector, known) {
      const elements = this.queryAll(selector);
      const newItems = [];
      for (const el of elements) {
        const fp = this.fingerprint(el);
        if (!known.has(fp)) {
          known.add(fp);
          newItems.push(el);
        }
      }
      return newItems;
    }
    fingerprint(el) {
      const text = (el.textContent || "").trim().slice(0, 120);
      const tag = el.tagName;
      return `${tag}|${text}`;
    }
    /**
     * Extract array of items from a generic API response.
     * Looks for common patterns like {data: [...]}, {results: [...]}, {items: [...]}, or just [...].
     */
    extractItemsFromApiResponse(data) {
      if (Array.isArray(data)) return data;
      if (data && typeof data === "object") {
        const obj = data;
        const keys = ["data", "results", "items", "records", "rows", "entries", "hits", "list", "content"];
        for (const key of keys) {
          if (Array.isArray(obj[key])) {
            return obj[key];
          }
        }
        if (obj.data && typeof obj.data === "object") {
          const nested = obj.data;
          for (const key of keys) {
            if (Array.isArray(nested[key])) {
              return nested[key];
            }
          }
        }
      }
      return [];
    }
    // -------------------------------------------------------------------------
    // Utility
    // -------------------------------------------------------------------------
    sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
  }

  const SKIP_TAGS = /* @__PURE__ */ new Set([
    "SCRIPT",
    "STYLE",
    "NOSCRIPT",
    "SVG",
    "LINK",
    "META",
    "HEAD",
    "BR",
    "HR"
  ]);
  class DOMWalker {
    // -------------------------------------------------------------------
    // Public API
    // -------------------------------------------------------------------
    /**
     * Walk the full DOM tree starting at `root`, invoking `callback` for every
     * Element node. Shadow roots and same-origin iframes are entered automatically.
     */
    walk(root, callback) {
      this.walkInternal(root, callback, 0);
    }
    /**
     * Collect all elements matching `selector` under `root`, including
     * shadow DOMs and same-origin iframes.
     */
    queryAll(root, selector) {
      const results = [];
      try {
        const matches = root.querySelectorAll(selector);
        for (let i = 0; i < matches.length; i++) {
          results.push(matches[i]);
        }
      } catch {
        return results;
      }
      this.walk(root, (el) => {
        if (el.shadowRoot) {
          try {
            const shadowMatches = el.shadowRoot.querySelectorAll(selector);
            for (let i = 0; i < shadowMatches.length; i++) {
              results.push(shadowMatches[i]);
            }
          } catch {
          }
        }
        return true;
      });
      const iframes = root.querySelectorAll("iframe");
      for (let i = 0; i < iframes.length; i++) {
        const doc = this.getIframeDocument(iframes[i]);
        if (doc) {
          try {
            const iframeMatches = doc.querySelectorAll(selector);
            for (let j = 0; j < iframeMatches.length; j++) {
              results.push(iframeMatches[j]);
            }
          } catch {
          }
        }
      }
      return results;
    }
    /**
     * Return a compact signature object for an element.  Two elements that
     * produce the same signature are structurally equivalent.
     */
    getElementSignature(el) {
      const text = (el.textContent || "").trim();
      return {
        tag: el.tagName.toLowerCase(),
        id: el.id || "",
        classes: Array.from(el.classList).sort(),
        depth: this.getStructuralDepth(el),
        childCount: el.children.length,
        textSnippet: text.slice(0, 80)
      };
    }
    /**
     * Return direct Element children of `el`, *including* slotted children
     * pulled from an open shadow root.
     */
    getChildren(el) {
      const children = [];
      if (el.shadowRoot) {
        const shadowChildren = el.shadowRoot.children;
        for (let i = 0; i < shadowChildren.length; i++) {
          children.push(shadowChildren[i]);
        }
      }
      const directChildren = el.children;
      for (let i = 0; i < directChildren.length; i++) {
        children.push(directChildren[i]);
      }
      return children;
    }
    /**
     * Number of ancestor elements between `el` and `<html>`.
     */
    getStructuralDepth(el) {
      let depth = 0;
      let current = el.parentNode;
      while (current && current !== document) {
        if (current.nodeType === Node.ELEMENT_NODE) {
          depth++;
        }
        current = current.parentNode;
      }
      return depth;
    }
    /**
     * Approximate visible area of `el` in px^2.  Returns 0 for invisible elements.
     */
    getVisualArea(el) {
      try {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return 0;
        return rect.width * rect.height;
      } catch {
        return 0;
      }
    }
    /**
     * Heuristic visibility check.  An element is considered visible if:
     * - It has a non-zero bounding rect
     * - Its computed `display` is not `none`
     * - Its computed `visibility` is not `hidden`
     * - Its computed `opacity` is > 0
     */
    isVisible(el) {
      try {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 && rect.height === 0) return false;
        const style = getComputedStyle(el);
        if (style.display === "none") return false;
        if (style.visibility === "hidden") return false;
        if (parseFloat(style.opacity) === 0) return false;
        return true;
      } catch {
        return false;
      }
    }
    // -------------------------------------------------------------------
    // Internal helpers
    // -------------------------------------------------------------------
    walkInternal(root, callback, startDepth) {
      const walker = document.createTreeWalker(
        root,
        NodeFilter.SHOW_ELEMENT,
        {
          acceptNode(node2) {
            const el = node2;
            if (SKIP_TAGS.has(el.tagName)) {
              return NodeFilter.FILTER_REJECT;
            }
            return NodeFilter.FILTER_ACCEPT;
          }
        }
      );
      let depth = startDepth;
      let lastParent = root;
      let node = walker.nextNode();
      while (node) {
        const el = node;
        if (el.parentNode !== lastParent) {
          depth = this.computeRelativeDepth(root, el, startDepth);
        }
        lastParent = el.parentNode;
        const result = callback(el, depth);
        if (result === false) return;
        if (el.shadowRoot) {
          this.walkInternal(el.shadowRoot, callback, depth + 1);
        }
        if (el.tagName === "IFRAME") {
          const doc = this.getIframeDocument(el);
          if (doc?.body) {
            this.walkInternal(doc.body, callback, depth + 1);
          }
        }
        node = walker.nextNode();
      }
    }
    /**
     * Compute the depth of `el` relative to `root`, offset by `base`.
     */
    computeRelativeDepth(root, el, base) {
      let depth = 0;
      let current = el.parentNode;
      while (current && current !== root) {
        depth++;
        current = current.parentNode;
      }
      return base + depth;
    }
    /**
     * Safely access an iframe's contentDocument.  Returns null for cross-origin
     * frames or any access error.
     */
    getIframeDocument(iframe) {
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc?.body) return doc;
        return null;
      } catch {
        return null;
      }
    }
  }

  const NEXT_PATTERNS = [
    "next",
    "next page",
    "siguiente",
    "suivant",
    "weiter",
    "volgende",
    "avanti",
    ">",
    ">>",
    "›",
    "»",
    "→",
    "➔",
    "next ›",
    "next »"
  ];
  const PREV_PATTERNS = [
    "prev",
    "previous",
    "back",
    "anterior",
    "précédent",
    "zurück",
    "vorige",
    "indietro",
    "<",
    "<<",
    "‹",
    "«",
    "←"
  ];
  const LOAD_MORE_PATTERNS = [
    "load more",
    "show more",
    "see more",
    "view more",
    "view all",
    "see all",
    "show all",
    "load all",
    "more results",
    "afficher plus",
    "voir plus",
    "mehr anzeigen",
    "mehr laden",
    "mostrar más",
    "ver más",
    "ver todo"
  ];
  const PAGE_PARAMS = ["page", "p", "pg", "pn", "pagenum", "pagenumber", "pageno"];
  const OFFSET_PARAMS = ["offset", "start", "from", "skip", "begin"];
  const CURSOR_PARAMS = ["cursor", "after", "next_cursor", "continuation", "token", "next_token"];
  const PAGINATION_CLASS_RE = /pag(e|ing|ination|er)|nav-page|page-nav|page-number|page-link/i;
  const PAGINATION_ROLE_RE = /navigation/i;
  function getVisibleText(el) {
    try {
      const text = el.innerText ?? el.textContent ?? "";
      return text.trim().toLowerCase();
    } catch {
      return (el.textContent ?? "").trim().toLowerCase();
    }
  }
  function isVisible(el) {
    try {
      const htmlEl = el;
      if (htmlEl.offsetParent === null && htmlEl.style?.position !== "fixed") {
        if (el.tagName !== "BODY" && el.tagName !== "HTML") {
          const style = window.getComputedStyle(el);
          if (style.display === "none" || style.visibility === "hidden") return false;
        }
      }
      if (el.hasAttribute("hidden")) return false;
      if (el.getAttribute("aria-hidden") === "true") return false;
      return true;
    } catch {
      return true;
    }
  }
  function getVerticalPosition(el) {
    try {
      const rect = el.getBoundingClientRect();
      const docHeight = document.documentElement.scrollHeight || 1;
      return (rect.top + window.scrollY) / docHeight;
    } catch {
      return 0.5;
    }
  }
  function quickSelector(el) {
    try {
      if (el.id && !/^\d+$/.test(el.id) && !el.id.startsWith("__")) {
        return `#${CSS.escape(el.id)}`;
      }
      const ariaLabel = el.getAttribute("aria-label");
      if (ariaLabel) {
        return `[aria-label="${CSS.escape(ariaLabel)}"]`;
      }
      const testId = el.getAttribute("data-testid");
      if (testId) {
        return `[data-testid="${CSS.escape(testId)}"]`;
      }
      const tag = el.tagName.toLowerCase();
      const classes = (el.className?.toString?.() ?? "").split(/\s+/).filter((c) => c.length > 2);
      const meaningful = classes.find(
        (c) => !/^(mt-|mb-|p-|m-|w-|h-|text-|bg-|flex|grid|col-|d-)/i.test(c)
      );
      if (meaningful) {
        return `${tag}.${CSS.escape(meaningful)}`;
      }
      if (el.tagName === "A") {
        const href = el.getAttribute("href");
        if (href && href.length < 200) {
          return `a[href="${CSS.escape(href)}"]`;
        }
      }
      return tag;
    } catch {
      return el.tagName?.toLowerCase() ?? "*";
    }
  }
  function safeQueryAll(doc, selectors) {
    const results = [];
    for (const selector of selectors) {
      try {
        const matches = doc.querySelectorAll(selector);
        for (let i = 0; i < matches.length; i++) {
          results.push(matches[i]);
        }
      } catch {
      }
    }
    return results;
  }
  function detectNavigationPagination(doc) {
    const results = [];
    try {
      const paginationContainers = [];
      const navs = doc.querySelectorAll("nav");
      for (let i = 0; i < navs.length; i++) {
        const nav = navs[i];
        const cls = nav.className?.toString?.() ?? "";
        const ariaLabel = nav.getAttribute("aria-label") ?? "";
        const role = nav.getAttribute("role") ?? "";
        if (PAGINATION_CLASS_RE.test(cls) || /pag/i.test(ariaLabel) || PAGINATION_ROLE_RE.test(role)) {
          paginationContainers.push(nav);
        }
      }
      const allPagElements = safeQueryAll(doc, [
        '[class*="pagination"]',
        '[class*="pager"]',
        '[class*="paging"]',
        '[class*="page-nav"]',
        '[class*="nav-page"]',
        '[role="navigation"]',
        "ul.pagination",
        ".pagination",
        ".pager"
      ]);
      for (const el of allPagElements) {
        if (!paginationContainers.includes(el)) {
          paginationContainers.push(el);
        }
      }
      const searchRoots = paginationContainers.length > 0 ? paginationContainers : [doc.body || doc.documentElement];
      for (const container of searchRoots) {
        if (!container) continue;
        const clickables = container.querySelectorAll('a, button, [role="button"]');
        let nextElement = null;
        let nextConfidence = 0;
        for (let i = 0; i < clickables.length; i++) {
          const el = clickables[i];
          if (!isVisible(el)) continue;
          const text = getVisibleText(el);
          const ariaLabel = (el.getAttribute("aria-label") ?? "").toLowerCase();
          const title = (el.getAttribute("title") ?? "").toLowerCase();
          const rel = (el.getAttribute("rel") ?? "").toLowerCase();
          const combined = `${text} ${ariaLabel} ${title}`;
          let isNext = false;
          let conf = 0;
          if (rel === "next") {
            isNext = true;
            conf = 0.95;
          } else {
            for (const pattern of NEXT_PATTERNS) {
              if (combined.includes(pattern)) {
                isNext = true;
                conf = Math.max(conf, pattern.length > 3 ? 0.85 : 0.65);
              }
            }
          }
          if (isNext) {
            let isPrev = false;
            for (const pattern of PREV_PATTERNS) {
              if (combined.includes(pattern) && !combined.includes("next")) {
                isPrev = true;
                break;
              }
            }
            if (isPrev) continue;
          }
          if (isNext && conf > nextConfidence) {
            nextConfidence = conf;
            nextElement = el;
          }
        }
        if (nextElement && nextConfidence > 0) {
          const vertPos = getVerticalPosition(nextElement);
          if (vertPos > 0.7) nextConfidence = Math.min(nextConfidence + 0.1, 1);
          if (paginationContainers.length > 0 && paginationContainers.some((c) => c.contains(nextElement))) {
            nextConfidence = Math.min(nextConfidence + 0.05, 1);
          }
          const selector = quickSelector(nextElement);
          results.push({
            mode: "click-next",
            selector,
            maxPages: 50,
            delayMs: 1e3,
            confidence: nextConfidence
          });
          if (nextElement.tagName === "A") {
            const href = nextElement.getAttribute("href");
            if (href) {
              const urlConfig = analyzeUrlForPattern(href, doc.location?.href);
              if (urlConfig) {
                results.push(urlConfig);
              }
            }
          }
        }
      }
    } catch {
    }
    return results;
  }
  function detectUrlPagination(doc) {
    const results = [];
    try {
      const currentUrl = doc.location?.href;
      if (!currentUrl) return results;
      const parsed = new URL(currentUrl);
      for (const param of PAGE_PARAMS) {
        const value = parsed.searchParams.get(param);
        if (value && /^\d+$/.test(value)) {
          const pageNum = parseInt(value, 10);
          const pattern = currentUrl.replace(
            new RegExp(`([?&])${escapeRegex(param)}=\\d+`),
            `$1${param}={page}`
          );
          results.push({
            mode: "url-pattern",
            urlPattern: pattern,
            maxPages: 50,
            delayMs: 1e3,
            confidence: 0.9,
            apiPageParam: param
          });
          break;
        }
      }
      for (const param of OFFSET_PARAMS) {
        const value = parsed.searchParams.get(param);
        if (value && /^\d+$/.test(value)) {
          const pattern = currentUrl.replace(
            new RegExp(`([?&])${escapeRegex(param)}=\\d+`),
            `$1${param}={offset}`
          );
          results.push({
            mode: "url-pattern",
            urlPattern: pattern,
            maxPages: 50,
            delayMs: 1e3,
            confidence: 0.85,
            apiPageParam: param
          });
          break;
        }
      }
      const pathMatch = parsed.pathname.match(/\/(page|p|pg)\/(\d+)\/?/i);
      if (pathMatch) {
        const pattern = currentUrl.replace(
          /\/(page|p|pg)\/\d+/i,
          `/${pathMatch[1]}/{page}`
        );
        results.push({
          mode: "url-pattern",
          urlPattern: pattern,
          maxPages: 50,
          delayMs: 1e3,
          confidence: 0.9
        });
      }
      if (results.length === 0) {
        const pageLinks = findPaginationLinks(doc, currentUrl);
        if (pageLinks) {
          results.push(pageLinks);
        }
      }
    } catch {
    }
    return results;
  }
  function analyzeUrlForPattern(href, currentUrl) {
    try {
      const base = currentUrl || href;
      const resolved = new URL(href, base);
      const resolvedStr = resolved.href;
      for (const param of PAGE_PARAMS) {
        const value = resolved.searchParams.get(param);
        if (value && /^\d+$/.test(value)) {
          const pattern = resolvedStr.replace(
            new RegExp(`([?&])${escapeRegex(param)}=\\d+`),
            `$1${param}={page}`
          );
          return {
            mode: "url-pattern",
            urlPattern: pattern,
            maxPages: 50,
            delayMs: 1e3,
            confidence: 0.8,
            apiPageParam: param
          };
        }
      }
      const pathMatch = resolved.pathname.match(/\/(page|p|pg)\/(\d+)\/?/i);
      if (pathMatch) {
        const pattern = resolvedStr.replace(
          /\/(page|p|pg)\/\d+/i,
          `/${pathMatch[1]}/{page}`
        );
        return {
          mode: "url-pattern",
          urlPattern: pattern,
          maxPages: 50,
          delayMs: 1e3,
          confidence: 0.8
        };
      }
    } catch {
    }
    return null;
  }
  function findPaginationLinks(doc, currentUrl) {
    try {
      const links = doc.querySelectorAll("a[href]");
      const numberedLinks = [];
      for (let i = 0; i < links.length; i++) {
        const link = links[i];
        const text = getVisibleText(link).trim();
        if (/^\d{1,4}$/.test(text)) {
          const num = parseInt(text, 10);
          if (num >= 1 && num <= 500) {
            const href = link.getAttribute("href");
            if (href) {
              numberedLinks.push({ href, num });
            }
          }
        }
      }
      if (numberedLinks.length < 2) return null;
      numberedLinks.sort((a, b) => a.num - b.num);
      for (let i = 0; i < numberedLinks.length - 1; i++) {
        const a = numberedLinks[i];
        const b = numberedLinks[i + 1];
        if (b.num - a.num !== 1) continue;
        try {
          const urlA = new URL(a.href, currentUrl).href;
          const urlB = new URL(b.href, currentUrl).href;
          const numStrA = a.num.toString();
          const numStrB = b.num.toString();
          const posA = urlA.lastIndexOf(numStrA);
          const posB = urlB.lastIndexOf(numStrB);
          if (posA >= 0 && posB >= 0) {
            const prefixA = urlA.substring(0, posA);
            const suffixA = urlA.substring(posA + numStrA.length);
            const prefixB = urlB.substring(0, posB);
            const suffixB = urlB.substring(posB + numStrB.length);
            if (prefixA === prefixB && suffixA === suffixB) {
              const pattern = prefixA + "{page}" + suffixA;
              return {
                mode: "url-pattern",
                urlPattern: pattern,
                maxPages: 50,
                delayMs: 1e3,
                confidence: 0.75
              };
            }
          }
        } catch {
          continue;
        }
      }
    } catch {
    }
    return null;
  }
  function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  function detectInfiniteScroll(doc) {
    const results = [];
    try {
      let confidence = 0;
      let scrollTarget;
      const sentinelSelectors = [
        "[data-loading]",
        "[data-infinite]",
        "[data-sentinel]",
        ".loading-sentinel",
        ".scroll-sentinel",
        ".infinite-scroll-trigger",
        ".infinite-loader",
        ".load-trigger",
        ".scroll-trigger",
        '[class*="sentinel"]',
        '[class*="infinite"]',
        '[class*="loading-more"]',
        '[class*="load-more-sentinel"]'
      ];
      const sentinels = safeQueryAll(doc, sentinelSelectors);
      for (const sentinel of sentinels) {
        if (isVisible(sentinel) || sentinel.hasAttribute("data-loading")) {
          const vertPos = getVerticalPosition(sentinel);
          if (vertPos > 0.6) {
            confidence = Math.max(confidence, 0.7);
            scrollTarget = quickSelector(sentinel);
          }
        }
      }
      const infiniteAttrs = doc.querySelectorAll(
        "[data-has-more], [data-next-page], [data-page], [data-offset], [data-cursor]"
      );
      if (infiniteAttrs.length > 0) {
        confidence = Math.max(confidence, 0.65);
      }
      const containers = safeQueryAll(doc, [
        "[data-infinite-scroll]",
        "[infinite-scroll]",
        "[data-scroll-pagination]",
        ".infinite-scroll",
        '[class*="infinite-scroll"]'
      ]);
      if (containers.length > 0) {
        confidence = Math.max(confidence, 0.8);
        scrollTarget = scrollTarget ?? quickSelector(containers[0]);
      }
      const spinners = safeQueryAll(doc, [
        ".spinner",
        ".loading",
        ".loader",
        '[class*="spinner"]',
        '[class*="loader"]',
        '[role="progressbar"]',
        ".sk-spinner",
        ".lds-ring",
        '[class*="loading-indicator"]'
      ]);
      for (const spinner of spinners) {
        const vertPos = getVerticalPosition(spinner);
        if (vertPos > 0.7) {
          confidence = Math.max(confidence, 0.55);
        }
      }
      const observerTargets = safeQueryAll(doc, [
        "[data-observe]",
        "[data-intersection]",
        "[data-waypoint]",
        ".waypoint",
        ".intersection-observer"
      ]);
      if (observerTargets.length > 0) {
        for (const target of observerTargets) {
          const vertPos = getVerticalPosition(target);
          if (vertPos > 0.6) {
            confidence = Math.max(confidence, 0.6);
            scrollTarget = scrollTarget ?? quickSelector(target);
          }
        }
      }
      if (confidence > 0.4) {
        results.push({
          mode: "auto-scroll",
          scrollTarget,
          scrollSpeed: "medium",
          maxPages: 50,
          delayMs: 2e3,
          confidence
        });
      }
    } catch {
    }
    return results;
  }
  function detectLoadMoreButtons(doc, listSelector) {
    const results = [];
    try {
      const clickables = doc.querySelectorAll('button, a, [role="button"], input[type="button"], input[type="submit"]');
      const candidates = [];
      for (let i = 0; i < clickables.length; i++) {
        const el = clickables[i];
        if (!isVisible(el)) continue;
        const text = getVisibleText(el);
        const ariaLabel = (el.getAttribute("aria-label") ?? "").toLowerCase();
        const title = (el.getAttribute("title") ?? "").toLowerCase();
        const combined = `${text} ${ariaLabel} ${title}`;
        for (const pattern of LOAD_MORE_PATTERNS) {
          if (combined.includes(pattern)) {
            let conf = 0.75;
            if (text.length < pattern.length + 15) conf += 0.1;
            const vertPos = getVerticalPosition(el);
            if (vertPos > 0.5) conf += 0.05;
            if (vertPos > 0.7) conf += 0.05;
            if (listSelector) ;
            candidates.push({ el, confidence: Math.min(conf, 1) });
            break;
          }
        }
      }
      if (candidates.length > 0) {
        candidates.sort((a, b) => b.confidence - a.confidence);
        const best = candidates[0];
        results.push({
          mode: "load-more",
          selector: quickSelector(best.el),
          maxPages: 50,
          delayMs: 1500,
          confidence: best.confidence
        });
      }
    } catch {
    }
    return results;
  }
  function detectApiPatterns(doc) {
    const results = [];
    try {
      const dataScripts = doc.querySelectorAll(
        'script[id="__NEXT_DATA__"], script[id="__NUXT__"], script[type="application/json"]'
      );
      for (let i = 0; i < dataScripts.length; i++) {
        const script = dataScripts[i];
        const text = script.textContent ?? "";
        if (text.length > 1e7) continue;
        try {
          const apiPatterns = text.match(/"(\/api\/[^"]+)"/g);
          if (apiPatterns) {
            for (const match of apiPatterns) {
              const endpoint = match.replace(/"/g, "");
              for (const param of [...PAGE_PARAMS, ...OFFSET_PARAMS, ...CURSOR_PARAMS]) {
                if (endpoint.includes(param)) {
                  results.push({
                    mode: "api-intercept",
                    apiEndpoint: endpoint,
                    apiPageParam: param,
                    maxPages: 50,
                    delayMs: 1e3,
                    confidence: 0.6
                  });
                  break;
                }
              }
            }
          }
        } catch {
        }
      }
      const apiStateElements = safeQueryAll(doc, [
        "[data-api-url]",
        "[data-endpoint]",
        "[data-fetch-url]",
        "[data-next-url]",
        "[data-next-page-url]",
        "[data-api]",
        "[data-source-url]"
      ]);
      for (const el of apiStateElements) {
        const apiUrl = el.getAttribute("data-api-url") ?? el.getAttribute("data-endpoint") ?? el.getAttribute("data-fetch-url") ?? el.getAttribute("data-next-url") ?? el.getAttribute("data-next-page-url") ?? el.getAttribute("data-api") ?? el.getAttribute("data-source-url");
        if (apiUrl) {
          for (const param of [...PAGE_PARAMS, ...OFFSET_PARAMS, ...CURSOR_PARAMS]) {
            if (apiUrl.includes(param)) {
              results.push({
                mode: "api-intercept",
                apiEndpoint: apiUrl,
                apiPageParam: param,
                maxPages: 50,
                delayMs: 1e3,
                confidence: 0.55
              });
              break;
            }
          }
        }
      }
      const relNext = doc.querySelector('link[rel="next"]');
      if (relNext) {
        const href = relNext.getAttribute("href");
        if (href) {
          const urlConfig = analyzeUrlForPattern(href, doc.location?.href);
          if (urlConfig) {
            urlConfig.confidence = Math.min(urlConfig.confidence + 0.1, 1);
            results.push(urlConfig);
          }
        }
      }
    } catch {
    }
    return results;
  }
  function mergeResults(configs) {
    if (configs.length === 0) return [];
    const byMode = /* @__PURE__ */ new Map();
    for (const config of configs) {
      const group = byMode.get(config.mode) ?? [];
      group.push(config);
      byMode.set(config.mode, group);
    }
    const merged = [];
    for (const [, group] of byMode) {
      group.sort((a, b) => b.confidence - a.confidence);
      if (group[0].mode === "url-pattern" && group.length > 1) {
        const seen = /* @__PURE__ */ new Set();
        for (const config of group) {
          const key = config.urlPattern ?? "";
          if (!seen.has(key)) {
            seen.add(key);
            merged.push(config);
            if (merged.length >= 3) break;
          }
        }
      } else {
        merged.push(group[0]);
      }
    }
    merged.sort((a, b) => b.confidence - a.confidence);
    return merged;
  }
  function detectPagination(doc, listSelector) {
    const allConfigs = [];
    try {
      const navConfigs = detectNavigationPagination(doc);
      allConfigs.push(...navConfigs);
    } catch {
    }
    try {
      const urlConfigs = detectUrlPagination(doc);
      allConfigs.push(...urlConfigs);
    } catch {
    }
    try {
      const scrollConfigs = detectInfiniteScroll(doc);
      allConfigs.push(...scrollConfigs);
    } catch {
    }
    try {
      const loadMoreConfigs = detectLoadMoreButtons(doc, listSelector);
      allConfigs.push(...loadMoreConfigs);
    } catch {
    }
    try {
      const apiConfigs = detectApiPatterns(doc);
      allConfigs.push(...apiConfigs);
    } catch {
    }
    return mergeResults(allConfigs);
  }

  const RE_PRICE = /^[\s]*[£$€¥₹₩₽][\s]*[\d,.]+[\s]*$|^[\s]*[\d,.]+[\s]*[£$€¥₹₩₽][\s]*$|^[\s]*[\d,.]+\s*(USD|EUR|GBP|JPY|INR|CAD|AUD|CHF|CNY|KRW)[\s]*$/i;
  const RE_PRICE_RANGE = /^[\s]*[£$€¥₹₩₽]?[\s]*[\d,.]+\s*[-–—to]+\s*[£$€¥₹₩₽]?[\s]*[\d,.]+[\s]*$/i;
  const RE_EMAIL = /^[\s]*[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+[\s]*$/;
  const RE_URL = /^[\s]*(https?:\/\/[^\s]+|www\.[^\s]+)[\s]*$/i;
  const RE_PHONE = /^[\s]*[+]?[\d\s()./-]{7,20}[\s]*$/;
  const RE_PHONE_STRICT = /^[\s]*(?:\+?1[-.\s]?)?\(?[0-9]{3}\)?[-.\s]?[0-9]{3}[-.\s]?[0-9]{4}[\s]*$|^[\s]*\+?[0-9]{1,4}[-.\s]?[0-9]{2,4}[-.\s]?[0-9]{3,4}[-.\s]?[0-9]{3,4}[\s]*$/;
  const RE_RATING_NUMERIC = /^[\s]*([0-5](?:\.\d{1,2})?)\s*(?:\/\s*5|out\s+of\s+5|stars?)?[\s]*$/i;
  const RE_RATING_STARS = /^[★☆⭐✩✪✫✬✭✮✯]+$/;
  const RE_RATING_TEXT = /^\s*\d(?:\.\d)?\s*(?:\/\s*(?:5|10))\s*$/;
  const RE_DATE_ISO = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2})?/;
  const RE_DATE_US = /^\d{1,2}\/\d{1,2}\/\d{2,4}$/;
  const RE_DATE_EU = /^\d{1,2}[-./]\d{1,2}[-./]\d{2,4}$/;
  const RE_DATE_LONG = /(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:\s*,?\s*\d{2,4})?/i;
  const RE_DATE_RELATIVE = /^\s*(?:\d+\s+(?:second|minute|hour|day|week|month|year)s?\s+ago|yesterday|today|just\s+now|last\s+\w+)\s*$/i;
  const RE_TIME_AGO = /^\s*\d+[smhdwMy]\s*(?:ago)?\s*$/;
  const RE_NUMBER = /^[\s]*[-+]?[\d,]+(?:\.\d+)?[\s]*$/;
  const RE_PERCENTAGE = /^[\s]*[-+]?[\d,.]+\s*%[\s]*$/;
  const RE_ZIPCODE = /^\s*\d{5}(?:-\d{4})?\s*$/;
  const RE_LOCATION = /^[\s]*(?:[\w\s.'-]+,\s*){1,3}[\w\s.'-]+[\s]*$/;
  const RE_LOCATION_WITH_ZIP = /(?:\d{5}(?:-\d{4})?|\b[A-Z]{2}\b.*\d{5})/;
  const RE_IMAGE_URL = /\.(jpe?g|png|gif|webp|svg|avif|bmp|ico)(?:\?.*)?$/i;
  const RULES = [
    // ---- Price ----
    {
      type: "price",
      suggestedName: "Price",
      testValue(v) {
        const trimmed = v.trim();
        if (!trimmed) return 0;
        if (RE_PRICE.test(trimmed)) return 0.95;
        if (RE_PRICE_RANGE.test(trimmed)) return 0.85;
        if (/[£$€¥₹₩₽]/.test(trimmed) && /\d/.test(trimmed)) return 0.75;
        return 0;
      },
      testElement(el) {
        const cls = el.className?.toString?.() ?? "";
        const itemprop = el.getAttribute("itemprop") ?? "";
        if (/price|cost|amount|sale/i.test(cls + itemprop)) return 0.3;
        if (el.hasAttribute("data-price") || el.hasAttribute("data-amount")) return 0.4;
        return 0;
      }
    },
    // ---- Email ----
    {
      type: "email",
      suggestedName: "Email",
      testValue(v) {
        return RE_EMAIL.test(v.trim()) ? 0.98 : 0;
      },
      testElement(el) {
        if (el.tagName === "A" && el.getAttribute("href")?.startsWith("mailto:")) return 0.5;
        const type = el.getAttribute("type");
        if (type === "email") return 0.4;
        return 0;
      }
    },
    // ---- URL ----
    {
      type: "url",
      suggestedName: "URL",
      testValue(v) {
        const trimmed = v.trim();
        if (RE_URL.test(trimmed)) return 0.95;
        if (RE_IMAGE_URL.test(trimmed)) return 0.85;
        return 0;
      },
      testElement(el) {
        if (el.tagName === "A" && el.hasAttribute("href")) return 0.5;
        if (el.tagName === "IMG" && el.hasAttribute("src")) return 0.4;
        return 0;
      }
    },
    // ---- Image ----
    {
      type: "image",
      suggestedName: "Image",
      testValue(v) {
        if (RE_IMAGE_URL.test(v.trim())) return 0.9;
        return 0;
      },
      testElement(el) {
        if (el.tagName === "IMG") return 0.8;
        if (el.tagName === "PICTURE") return 0.7;
        const bg = el.style?.backgroundImage ?? "";
        if (bg && bg !== "none" && /url\(/.test(bg)) return 0.6;
        const role = el.getAttribute("role");
        if (role === "img") return 0.5;
        return 0;
      }
    },
    // ---- Rating ----
    {
      type: "rating",
      suggestedName: "Rating",
      testValue(v) {
        const trimmed = v.trim();
        if (RE_RATING_STARS.test(trimmed)) return 0.95;
        if (RE_RATING_NUMERIC.test(trimmed)) return 0.9;
        if (RE_RATING_TEXT.test(trimmed)) return 0.85;
        return 0;
      },
      testElement(el) {
        const cls = el.className?.toString?.() ?? "";
        const itemprop = el.getAttribute("itemprop") ?? "";
        const ariaLabel = el.getAttribute("aria-label") ?? "";
        if (/rating|stars?|review-score/i.test(cls + itemprop + ariaLabel)) return 0.4;
        if (el.getAttribute("data-rating") || el.getAttribute("data-score")) return 0.5;
        return 0;
      }
    },
    // ---- Date ----
    {
      type: "date",
      suggestedName: "Date",
      testValue(v) {
        const trimmed = v.trim();
        if (RE_DATE_ISO.test(trimmed)) return 0.98;
        if (RE_DATE_LONG.test(trimmed)) return 0.9;
        if (RE_DATE_US.test(trimmed)) return 0.8;
        if (RE_DATE_EU.test(trimmed)) return 0.75;
        if (RE_DATE_RELATIVE.test(trimmed)) return 0.85;
        if (RE_TIME_AGO.test(trimmed)) return 0.8;
        return 0;
      },
      testElement(el) {
        if (el.tagName === "TIME") return 0.6;
        if (el.hasAttribute("datetime")) return 0.5;
        const itemprop = el.getAttribute("itemprop") ?? "";
        if (/date|time|published|created|updated/i.test(itemprop)) return 0.4;
        return 0;
      }
    },
    // ---- Phone ----
    {
      type: "phone",
      suggestedName: "Phone",
      testValue(v) {
        const trimmed = v.trim();
        if (RE_PHONE_STRICT.test(trimmed)) return 0.92;
        if (RE_PHONE.test(trimmed) && trimmed.replace(/\D/g, "").length >= 7) return 0.7;
        return 0;
      },
      testElement(el) {
        if (el.tagName === "A" && el.getAttribute("href")?.startsWith("tel:")) return 0.6;
        const itemprop = el.getAttribute("itemprop") ?? "";
        if (/telephone|phone|fax/i.test(itemprop)) return 0.4;
        return 0;
      }
    },
    // ---- Location ----
    {
      type: "location",
      suggestedName: "Location",
      testValue(v) {
        const trimmed = v.trim();
        if (RE_LOCATION_WITH_ZIP.test(trimmed) && trimmed.includes(",")) return 0.85;
        if (RE_ZIPCODE.test(trimmed)) return 0.5;
        if (/^[A-Z][a-z]+(?:\s[A-Z][a-z]+)*,\s*[A-Z]{2}$/.test(trimmed)) return 0.8;
        if (RE_LOCATION.test(trimmed) && trimmed.includes(",") && !/\d{4,}/.test(trimmed)) return 0.5;
        return 0;
      },
      testElement(el) {
        const itemprop = el.getAttribute("itemprop") ?? "";
        const cls = el.className?.toString?.() ?? "";
        if (/address|location|locality|region|geo/i.test(itemprop + cls)) return 0.4;
        if (el.tagName === "ADDRESS") return 0.5;
        return 0;
      }
    },
    // ---- Number ----
    {
      type: "number",
      suggestedName: "Number",
      testValue(v) {
        const trimmed = v.trim();
        if (RE_PERCENTAGE.test(trimmed)) return 0.85;
        if (RE_NUMBER.test(trimmed)) return 0.7;
        return 0;
      },
      testElement(el) {
        const type = el.getAttribute("type");
        if (type === "number") return 0.3;
        return 0;
      }
    },
    // ---- Text (fallback, always matches but with low confidence) ----
    {
      type: "text",
      suggestedName: "Text",
      testValue(_v) {
        return 0.1;
      }
    }
  ];
  const ITEMPROP_NAMES = {
    name: "Name",
    headline: "Title",
    description: "Description",
    price: "Price",
    priceCurrency: "Currency",
    ratingValue: "Rating",
    reviewCount: "Review Count",
    author: "Author",
    datePublished: "Published Date",
    dateCreated: "Created Date",
    dateModified: "Modified Date",
    image: "Image",
    url: "URL",
    telephone: "Phone",
    email: "Email",
    address: "Address",
    addressLocality: "City",
    addressRegion: "State",
    postalCode: "ZIP Code",
    brand: "Brand",
    sku: "SKU",
    availability: "Availability",
    category: "Category",
    color: "Color",
    size: "Size"
  };
  function inferNameFromElement(el) {
    if (!el) return null;
    try {
      const itemprop = el.getAttribute("itemprop");
      if (itemprop && ITEMPROP_NAMES[itemprop]) return ITEMPROP_NAMES[itemprop];
      if (itemprop) return capitalize(itemprop);
      const ariaLabel = el.getAttribute("aria-label");
      if (ariaLabel && ariaLabel.length < 30) return capitalize(ariaLabel);
      for (const attr of ["data-field", "data-col", "data-name", "data-label", "data-column"]) {
        const val = el.getAttribute(attr);
        if (val && val.length < 30) return capitalize(val);
      }
      const cls = el.className?.toString?.() ?? "";
      if (cls) {
        const meaningful = extractMeaningfulClassName(cls);
        if (meaningful) return capitalize(meaningful);
      }
      if (/^H[1-6]$/.test(el.tagName)) return "Title";
      if (el.tagName === "IMG") return "Image";
      if (el.tagName === "A" && el.hasAttribute("href")) return "Link";
      if (el.tagName === "TIME") return "Date";
      if (el.tagName === "ADDRESS") return "Address";
    } catch {
    }
    return null;
  }
  function extractMeaningfulClassName(classStr) {
    const UTILITY_PREFIXES = [
      "mt-",
      "mb-",
      "ml-",
      "mr-",
      "mx-",
      "my-",
      "pt-",
      "pb-",
      "pl-",
      "pr-",
      "px-",
      "py-",
      "p-",
      "m-",
      "w-",
      "h-",
      "min-",
      "max-",
      "text-",
      "bg-",
      "border-",
      "rounded-",
      "flex",
      "grid",
      "col-",
      "row-",
      "gap-",
      "space-",
      "justify-",
      "items-",
      "self-",
      "font-",
      "leading-",
      "tracking-",
      "opacity-",
      "shadow-",
      "ring-",
      "transition-",
      "transform",
      "translate-",
      "rotate-",
      "scale-",
      "animate-",
      "duration-",
      "overflow-",
      "z-",
      "inset-",
      "top-",
      "right-",
      "bottom-",
      "left-",
      "sr-only",
      "not-sr-only",
      "block",
      "inline",
      "hidden",
      "visible",
      "container",
      "relative",
      "absolute",
      "fixed",
      "sticky",
      "d-",
      "ms-",
      "me-",
      "ps-",
      "pe-"
      // Bootstrap 5
    ];
    const classes = classStr.split(/\s+/).filter(Boolean);
    for (const cls of classes) {
      const lower = cls.toLowerCase();
      const isUtility = UTILITY_PREFIXES.some((prefix) => lower.startsWith(prefix)) || /^[a-z]-\d/.test(lower) || // e.g., "p-4", "m-2"
      lower.length <= 2;
      if (isUtility) continue;
      if (/^(is-|has-|js-|__|--)/.test(lower)) continue;
      const bemClean = cls.replace(/--[\w-]+$/, "").replace(/__[\w-]+$/, "");
      if (bemClean.length >= 3 && !/^(sm|md|lg|xl|xs|xxl|2xl|3xl)$/.test(bemClean.toLowerCase())) {
        return bemClean.replace(/[-_]+/g, " ").trim();
      }
    }
    return null;
  }
  function capitalize(str) {
    return str.replace(/[-_]+/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2").split(/\s+/).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ").trim();
  }
  function isLikelyTitle(values, el) {
    if (!values.length) return 0;
    let score = 0;
    if (el && /^H[1-6]$/.test(el.tagName)) score += 0.5;
    const itemprop = el?.getAttribute("itemprop") ?? "";
    if (/name|headline|title/i.test(itemprop)) score += 0.4;
    const avgLen = values.reduce((sum, v) => sum + v.trim().length, 0) / values.length;
    if (avgLen >= 3 && avgLen <= 120) score += 0.3;
    else score *= 0.5;
    const unique = new Set(values.map((v) => v.trim().toLowerCase()));
    if (unique.size > 1 || values.length === 1) score += 0.1;
    return Math.min(score, 1);
  }
  function isLikelyDescription(values, el) {
    if (!values.length) return 0;
    let score = 0;
    const itemprop = el?.getAttribute("itemprop") ?? "";
    if (/description|summary|abstract|body/i.test(itemprop)) score += 0.4;
    const avgLen = values.reduce((sum, v) => sum + v.trim().length, 0) / values.length;
    if (avgLen > 100) score += 0.4;
    else if (avgLen > 50) score += 0.2;
    else score *= 0.3;
    if (el?.tagName === "P") score += 0.2;
    return Math.min(score, 1);
  }
  function classifyField(values, element) {
    const cleanValues = values.filter((v) => v != null).map((v) => String(v).trim()).filter((v) => v.length > 0);
    if (cleanValues.length === 0) {
      return { dataType: "text", suggestedName: "Text", confidence: 0.1 };
    }
    const typeScores = /* @__PURE__ */ new Map();
    for (const rule of RULES) {
      let valueScoreSum = 0;
      let matchCount = 0;
      for (const val of cleanValues) {
        const score = rule.testValue(val);
        if (score > 0) {
          valueScoreSum += score;
          matchCount++;
        }
      }
      const matchRatio = matchCount / cleanValues.length;
      if (matchRatio < 0.4 && cleanValues.length > 2 && rule.type !== "text") continue;
      const avgValueScore = matchCount > 0 ? valueScoreSum / cleanValues.length : 0;
      let elementScore = 0;
      if (element && rule.testElement) {
        try {
          elementScore = rule.testElement(element);
        } catch {
        }
      }
      const existing = typeScores.get(rule.type);
      const combined = avgValueScore + elementScore;
      if (!existing || combined > existing.totalValue + existing.totalElement) {
        typeScores.set(rule.type, {
          totalValue: avgValueScore,
          totalElement: elementScore,
          rule
        });
      }
    }
    const titleScore = isLikelyTitle(cleanValues, element);
    const descScore = isLikelyDescription(cleanValues, element);
    let bestType = "text";
    let bestScore = 0;
    let bestRule = null;
    for (const [type, data] of typeScores) {
      const combined = data.totalValue * 0.7 + data.totalElement * 0.3;
      if (combined > bestScore) {
        bestScore = combined;
        bestType = type;
        bestRule = data.rule;
      }
    }
    if (bestType === "text" || bestScore < 0.4) {
      if (titleScore > 0.5 && titleScore > descScore) {
        bestType = "text";
        bestScore = titleScore;
        const name = inferNameFromElement(element) ?? "Title";
        return {
          dataType: bestType,
          suggestedName: name,
          confidence: Math.min(bestScore, 1)
        };
      }
      if (descScore > 0.5) {
        bestType = "text";
        bestScore = descScore;
        const name = inferNameFromElement(element) ?? "Description";
        return {
          dataType: bestType,
          suggestedName: name,
          confidence: Math.min(bestScore, 1)
        };
      }
    }
    let suggestedName = bestRule?.suggestedName ?? "Text";
    const elementName = inferNameFromElement(element);
    if (elementName) {
      suggestedName = elementName;
    }
    return {
      dataType: bestType,
      suggestedName,
      confidence: Math.min(bestScore, 1)
    };
  }

  const UTILITY_PREFIXES = /* @__PURE__ */ new Set([
    "mt-",
    "mb-",
    "ml-",
    "mr-",
    "mx-",
    "my-",
    "ms-",
    "me-",
    "pt-",
    "pb-",
    "pl-",
    "pr-",
    "px-",
    "py-",
    "ps-",
    "pe-",
    "p-",
    "m-",
    "w-",
    "h-",
    "min-w-",
    "min-h-",
    "max-w-",
    "max-h-",
    "text-",
    "bg-",
    "border-",
    "rounded-",
    "shadow-",
    "ring-",
    "font-",
    "leading-",
    "tracking-",
    "opacity-",
    "flex-",
    "grid-",
    "col-",
    "row-",
    "gap-",
    "space-",
    "justify-",
    "items-",
    "self-",
    "place-",
    "content-",
    "overflow-",
    "z-",
    "inset-",
    "top-",
    "right-",
    "bottom-",
    "left-",
    "translate-",
    "rotate-",
    "scale-",
    "skew-",
    "transition-",
    "duration-",
    "ease-",
    "delay-",
    "animate-",
    "cursor-",
    "pointer-events-",
    "select-",
    "resize-",
    "fill-",
    "stroke-",
    "decoration-",
    "underline-",
    "list-",
    "aspect-",
    "break-",
    "order-",
    "grow-",
    "shrink-",
    "basis-",
    "snap-",
    "scroll-",
    "touch-",
    "will-change-",
    "accent-",
    // Bootstrap
    "d-",
    "align-",
    "float-",
    "position-",
    "visible-",
    "invisible",
    "clearfix",
    "g-",
    "gx-",
    "gy-"
  ]);
  const UTILITY_EXACT = /* @__PURE__ */ new Set([
    "flex",
    "grid",
    "block",
    "inline",
    "inline-block",
    "inline-flex",
    "inline-grid",
    "hidden",
    "visible",
    "invisible",
    "collapse",
    "static",
    "relative",
    "absolute",
    "fixed",
    "sticky",
    "container",
    "mx-auto",
    "clearfix",
    "row",
    "col",
    "table",
    "sr-only",
    "not-sr-only",
    "truncate",
    "antialiased",
    "subpixel-antialiased",
    "italic",
    "not-italic",
    "uppercase",
    "lowercase",
    "capitalize",
    "normal-case",
    "underline",
    "overline",
    "line-through",
    "no-underline",
    "break-normal",
    "break-words",
    "break-all",
    "whitespace-normal",
    "whitespace-nowrap",
    "whitespace-pre",
    "object-contain",
    "object-cover",
    "object-fill"
  ]);
  const DATA_ID_ATTRS = [
    "data-testid",
    "data-test-id",
    "data-cy",
    "data-qa",
    "data-id",
    "data-item-id",
    "data-product-id",
    "data-component",
    "data-automation-id",
    "data-e2e",
    "data-name",
    "data-type",
    "data-hook",
    "data-tracking",
    "data-asin"
    // Amazon
  ];
  function isUtilityClass(cls) {
    const lower = cls.toLowerCase();
    if (UTILITY_EXACT.has(lower)) return true;
    for (const prefix of UTILITY_PREFIXES) {
      if (lower.startsWith(prefix)) return true;
    }
    if (/^[a-z]{1,3}-\d/.test(lower)) return true;
    if (/^-?[a-z]+-\[/.test(lower)) return true;
    if (lower.length <= 1) return true;
    return false;
  }
  function getSemanticClasses(el) {
    const classList = el.className?.toString?.()?.trim();
    if (!classList) return [];
    return classList.split(/\s+/).filter((cls) => cls.length > 0 && !isUtilityClass(cls));
  }
  function cssEscape(value) {
    try {
      return CSS.escape(value);
    } catch {
      return value.replace(/([^\w-])/g, "\\$1");
    }
  }
  function getNthOfTypeIndex(el) {
    let index = 1;
    let sibling = el.previousElementSibling;
    while (sibling) {
      if (sibling.tagName === el.tagName) index++;
      sibling = sibling.previousElementSibling;
    }
    return index;
  }
  function countSameTagSiblings(el) {
    const parent = el.parentElement;
    if (!parent) return 1;
    let count = 0;
    for (let i = 0; i < parent.children.length; i++) {
      if (parent.children[i].tagName === el.tagName) count++;
    }
    return count;
  }
  function generateRelativeSelector(child, parent) {
    if (child === parent) return "";
    const semanticClasses = getSemanticClasses(child);
    const tag = child.tagName.toLowerCase();
    for (const cls of semanticClasses) {
      const selector = `.${cssEscape(cls)}`;
      try {
        const matches = parent.querySelectorAll(selector);
        if (matches.length === 1 && matches[0] === child) return selector;
      } catch {
        continue;
      }
    }
    for (const cls of semanticClasses) {
      const selector = `${tag}.${cssEscape(cls)}`;
      try {
        const matches = parent.querySelectorAll(selector);
        if (matches.length === 1 && matches[0] === child) return selector;
      } catch {
        continue;
      }
    }
    for (const attr of DATA_ID_ATTRS) {
      const value = child.getAttribute(attr);
      if (value) {
        const selector = `[${attr}="${cssEscape(value)}"]`;
        try {
          const matches = parent.querySelectorAll(selector);
          if (matches.length === 1 && matches[0] === child) return selector;
        } catch {
          continue;
        }
      }
    }
    try {
      const tagMatches = parent.querySelectorAll(tag);
      if (tagMatches.length === 1 && tagMatches[0] === child) return tag;
    } catch {
    }
    if (/^h[1-6]$/.test(tag)) {
      return tag;
    }
    const pathParts = [];
    let current = child;
    let depth = 0;
    while (current && current !== parent && depth < 4) {
      const currentTag = current.tagName.toLowerCase();
      const currentClasses = getSemanticClasses(current);
      if (currentClasses.length > 0) {
        pathParts.unshift(`${currentTag}.${cssEscape(currentClasses[0])}`);
      } else {
        const nthIndex = getNthOfTypeIndex(current);
        const sameTagCount = countSameTagSiblings(current);
        if (sameTagCount > 1) {
          pathParts.unshift(`${currentTag}:nth-of-type(${nthIndex})`);
        } else {
          pathParts.unshift(currentTag);
        }
      }
      current = current.parentElement;
      depth++;
    }
    return pathParts.join(" > ");
  }

  let highlighter = null;
  let cursorController = null;
  let scrollController = null;
  let paginationExecutor = null;
  let domWalker = null;
  function getHighlighter() {
    if (!highlighter) highlighter = new ElementHighlighter();
    return highlighter;
  }
  function getCursorController() {
    if (!cursorController) cursorController = new CursorController(getHighlighter());
    return cursorController;
  }
  function getScrollController() {
    if (!scrollController) scrollController = new ScrollController();
    return scrollController;
  }
  function getPaginationExecutor() {
    if (!paginationExecutor) paginationExecutor = new PaginationExecutor();
    return paginationExecutor;
  }
  function getDOMWalker() {
    if (!domWalker) domWalker = new DOMWalker();
    return domWalker;
  }
  const ctx = {
    state: "idle",
    config: null,
    collectedRows: [],
    currentPage: 0,
    startTime: 0,
    errors: 0,
    paginationIterator: null
  };
  function injectStyles() {
    if (document.getElementById("dataforge-styles")) return;
    const link = document.createElement("link");
    link.id = "dataforge-styles";
    link.rel = "stylesheet";
    link.href = chrome.runtime.getURL("content/overlay/styles.css");
    (document.head || document.documentElement).appendChild(link);
  }
  function handleMessage(message, _sender, sendResponse) {
    switch (message.type) {
      case "PING":
        sendResponse({ type: "PONG" });
        return false;
      case "SCAN_PAGE":
        handleScanPage(sendResponse);
        return true;
      case "SELECT_PATTERN":
        handleSelectPattern(message.patternId, sendResponse);
        return true;
      case "START_EXTRACTION":
        handleStartExtraction(message.config, sendResponse);
        return true;
      case "PAUSE_EXTRACTION":
        handlePauseExtraction(sendResponse);
        return false;
      case "RESUME_EXTRACTION":
        handleResumeExtraction(sendResponse);
        return true;
      case "STOP_EXTRACTION":
        handleStopExtraction(sendResponse);
        return false;
      case "HIGHLIGHT_ELEMENTS":
        handleHighlightElements(message.selector, sendResponse);
        return false;
      case "CLEAR_HIGHLIGHTS":
        handleClearHighlights(sendResponse);
        return false;
      case "TEST_SELECTOR":
        handleTestSelector(message.selector, sendResponse);
        return false;
      case "ACTIVATE_SELECTION_MODE":
        handleActivateSelectionMode(message.tool, sendResponse);
        return false;
      case "DEACTIVATE_SELECTION_MODE":
        handleDeactivateSelectionMode(sendResponse);
        return false;
      case "DETECT_PAGINATION":
        handleDetectPagination(sendResponse);
        return true;
      case "EXTRACT_EMAILS":
        handleExtractEmails(sendResponse);
        return true;
      case "EXTRACT_IMAGES":
        handleExtractImages(sendResponse);
        return true;
      case "EXTRACT_TEXT":
        handleExtractText(sendResponse);
        return true;
      default:
        return false;
    }
  }
  async function handleScanPage(sendResponse) {
    try {
      injectStyles();
      const patterns = runPatternSense();
      const response = { type: "SCAN_RESULT", patterns };
      sendResponse(response);
    } catch (err) {
      sendResponse({
        type: "EXTRACTION_ERROR",
        error: `Scan failed: ${err instanceof Error ? err.message : String(err)}`
      });
    }
  }
  function runPatternSense() {
    const walker = getDOMWalker();
    const candidates = /* @__PURE__ */ new Map();
    const containers = document.querySelectorAll("body *");
    for (let i = 0; i < containers.length; i++) {
      const parent = containers[i];
      const children = parent.children;
      if (children.length < 2) continue;
      const groups = /* @__PURE__ */ new Map();
      for (let j = 0; j < children.length; j++) {
        const child = children[j];
        if (!walker.isVisible(child)) continue;
        const sig = getStructuralSignature(child);
        if (!groups.has(sig)) {
          groups.set(sig, []);
        }
        groups.get(sig).push(child);
      }
      for (const [sig, elems] of groups) {
        if (elems.length < 3) continue;
        const key = `${getParentSelector(parent)}>${sig}`;
        if (!candidates.has(key) || candidates.get(key).children.length < elems.length) {
          const selector = buildGroupSelector(parent, elems[0]);
          candidates.set(key, { parent, children: elems, selector });
        }
      }
    }
    const patterns = [];
    for (const [, candidate] of candidates) {
      const { children, selector } = candidate;
      const sampleEl = children[0];
      const fields = detectFields(sampleEl);
      if (fields.length === 0) continue;
      const area = walker.getVisualArea(sampleEl);
      if (area === 0) continue;
      const confidence = calculateConfidence(children.length, fields.length, area);
      if (confidence < 0.2) continue;
      const category = classifyPattern(sampleEl, fields);
      let boundingRect = { top: 0, left: 0, width: 0, height: 0 };
      try {
        const rect = sampleEl.getBoundingClientRect();
        boundingRect = {
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        };
      } catch {
      }
      const sampleElements = [];
      const sampleCount = Math.min(3, children.length);
      for (let i = 0; i < sampleCount; i++) {
        const text = (children[i].textContent || "").trim().slice(0, 120);
        sampleElements.push(text);
      }
      patterns.push({
        id: generatePrefixedId("pat"),
        selector,
        itemCount: children.length,
        sampleElements,
        confidence,
        category,
        fields,
        boundingRect,
        visualArea: area
      });
    }
    patterns.sort((a, b) => {
      const confDiff = b.confidence - a.confidence;
      if (Math.abs(confDiff) > 0.05) return confDiff;
      return b.itemCount - a.itemCount;
    });
    return deduplicatePatterns(patterns).slice(0, 20);
  }
  function getStructuralSignature(el) {
    const tag = el.tagName;
    const classes = Array.from(el.classList).filter((c) => c.length < 30 && !/^[a-f0-9]{8,}$/.test(c)).sort().join(".");
    return classes ? `${tag}.${classes}` : tag;
  }
  function getParentSelector(el) {
    if (el.id) return `#${CSS.escape(el.id)}`;
    const tag = el.tagName.toLowerCase();
    const stableClasses = Array.from(el.classList).filter((c) => c.length < 25 && !/^[a-f0-9]{8,}$/.test(c)).slice(0, 3);
    return stableClasses.length > 0 ? `${tag}.${stableClasses.map((c) => CSS.escape(c)).join(".")}` : tag;
  }
  function buildGroupSelector(parent, sampleChild) {
    const parentPart = getParentSelector(parent);
    const childTag = sampleChild.tagName.toLowerCase();
    const stableClasses = Array.from(sampleChild.classList).filter((c) => c.length < 30 && !/^[a-f0-9]{8,}$/.test(c) && !/^_/.test(c)).slice(0, 3);
    if (stableClasses.length > 0) {
      const classPart = stableClasses.map((c) => CSS.escape(c)).join(".");
      const selector = `${parentPart} > ${childTag}.${classPart}`;
      try {
        if (document.querySelectorAll(selector).length > 0) return selector;
      } catch {
      }
    }
    return `${parentPart} > ${childTag}`;
  }
  function detectFields(sampleEl) {
    const fields = [];
    const seen = /* @__PURE__ */ new Set();
    const childElements = sampleEl.querySelectorAll("*");
    const allTargets = [sampleEl, ...Array.from(childElements)];
    for (const target of allTargets) {
      const text = getDirectText(target);
      if (text && text.length > 1 && text.length < 500) {
        const classification = classifyField([text], target);
        const name = classification.suggestedName || inferFieldName(target, classification.dataType, fields.length);
        const fieldName = name.toLowerCase().replace(/\s+/g, "_");
        if (!seen.has(fieldName)) {
          seen.add(fieldName);
          let relSelector;
          try {
            relSelector = generateRelativeSelector(target, sampleEl) || buildRelativeSelector(sampleEl, target);
          } catch {
            relSelector = buildRelativeSelector(sampleEl, target);
          }
          fields.push({
            id: generatePrefixedId("fld"),
            name: fieldName,
            relativeSelector: relSelector,
            sampleValues: [text.slice(0, 100)],
            dataType: classification.dataType,
            confidence: classification.confidence,
            enabled: true
          });
        }
      }
      if (target.tagName === "A" && target.getAttribute("href")) {
        const name = "url";
        if (!seen.has(name)) {
          seen.add(name);
          let relSelector;
          try {
            relSelector = generateRelativeSelector(target, sampleEl) || buildRelativeSelector(sampleEl, target);
          } catch {
            relSelector = buildRelativeSelector(sampleEl, target);
          }
          fields.push({
            id: generatePrefixedId("fld"),
            name,
            relativeSelector: relSelector,
            sampleValues: [target.getAttribute("href").slice(0, 100)],
            dataType: "url",
            confidence: 0.9,
            enabled: true
          });
        }
      }
      if (target.tagName === "IMG") {
        const src = target.getAttribute("src") || target.getAttribute("data-src");
        if (src) {
          const name = "image";
          if (!seen.has(name)) {
            seen.add(name);
            let relSelector;
            try {
              relSelector = generateRelativeSelector(target, sampleEl) || buildRelativeSelector(sampleEl, target);
            } catch {
              relSelector = buildRelativeSelector(sampleEl, target);
            }
            fields.push({
              id: generatePrefixedId("fld"),
              name,
              relativeSelector: relSelector,
              sampleValues: [src.slice(0, 100)],
              dataType: "image",
              confidence: 0.9,
              enabled: true
            });
          }
        }
      }
    }
    return fields.slice(0, 15);
  }
  function getDirectText(el) {
    let text = "";
    for (let i = 0; i < el.childNodes.length; i++) {
      if (el.childNodes[i].nodeType === Node.TEXT_NODE) {
        text += el.childNodes[i].textContent || "";
      }
    }
    text = text.trim();
    if (!text && el.children.length === 0) {
      text = (el.textContent || "").trim();
    }
    return text;
  }
  function inferFieldName(el, dataType, index) {
    const ariaLabel = el.getAttribute("aria-label");
    if (ariaLabel && ariaLabel.length < 30) return sanitizeFieldName(ariaLabel);
    const className = el.className;
    if (typeof className === "string") {
      const nameHints = className.match(/(?:title|name|price|rating|description|date|author|category|brand|sku)/i);
      if (nameHints) return nameHints[0].toLowerCase();
    }
    const parent = el.parentElement;
    if (parent) {
      const parentClass = parent.className;
      if (typeof parentClass === "string") {
        const parentHints = parentClass.match(/(?:title|name|price|rating|description|date|author)/i);
        if (parentHints) return parentHints[0].toLowerCase();
      }
    }
    return `${dataType}_${index + 1}`;
  }
  function sanitizeFieldName(name) {
    return name.toLowerCase().replace(/[^a-z0-9_\s]/g, "").replace(/\s+/g, "_").slice(0, 30);
  }
  function buildRelativeSelector(root, target) {
    if (root === target) return ":scope";
    if (target.id) return `#${CSS.escape(target.id)}`;
    const tag = target.tagName.toLowerCase();
    const stableClasses = Array.from(target.classList).filter((c) => c.length < 25 && !/^[a-f0-9]{8,}$/.test(c)).slice(0, 2);
    if (stableClasses.length > 0) {
      const selector = `${tag}.${stableClasses.map((c) => CSS.escape(c)).join(".")}`;
      try {
        if (root.querySelectorAll(selector).length === 1) return selector;
      } catch {
      }
    }
    const path = [];
    let current = target;
    while (current && current !== root) {
      const parent = current.parentElement;
      if (!parent) break;
      const currentTag = current.tagName.toLowerCase();
      let nthIndex = 0;
      let sameTagCount = 0;
      const siblings = parent.children;
      for (let i = 0; i < siblings.length; i++) {
        if (siblings[i].tagName === current.tagName) {
          sameTagCount++;
          if (siblings[i] === current) nthIndex = sameTagCount;
        }
      }
      if (sameTagCount > 1) {
        path.unshift(`${currentTag}:nth-of-type(${nthIndex})`);
      } else {
        path.unshift(currentTag);
      }
      current = parent;
    }
    return path.join(" > ") || tag;
  }
  function calculateConfidence(itemCount, fieldCount, area) {
    let score = 0;
    if (itemCount >= 10) score += 0.35;
    else if (itemCount >= 5) score += 0.25;
    else if (itemCount >= 3) score += 0.15;
    if (fieldCount >= 4) score += 0.3;
    else if (fieldCount >= 2) score += 0.2;
    else score += 0.1;
    if (area > 1e4) score += 0.2;
    else if (area > 2e3) score += 0.15;
    else score += 0.05;
    if (itemCount >= 5 && fieldCount >= 2) score += 0.15;
    return Math.min(1, score);
  }
  function classifyPattern(el, fields) {
    const classText = (el.className || "").toString().toLowerCase();
    el.innerHTML.toLowerCase();
    const tag = el.tagName.toLowerCase();
    const hasPrice = fields.some((f) => f.dataType === "price");
    const hasImage = fields.some((f) => f.dataType === "image");
    const hasRating = fields.some((f) => f.dataType === "rating");
    if (hasPrice && hasImage) return "product";
    if (classText.includes("product") || classText.includes("item") && hasPrice) return "product";
    if (classText.includes("review") || classText.includes("comment") || hasRating) return "review";
    if (classText.includes("article") || classText.includes("post")) return "article";
    if (classText.includes("card")) return "card";
    if (classText.includes("listing") || classText.includes("result")) return "listing";
    if (tag === "tr") return "table-row";
    if (classText.includes("feed") || classText.includes("stream")) return "feed-item";
    return "generic";
  }
  function deduplicatePatterns(patterns) {
    const result = [];
    const selectorSet = /* @__PURE__ */ new Set();
    for (const pattern of patterns) {
      const normalized = pattern.selector.replace(/\s+/g, " ").trim();
      if (selectorSet.has(normalized)) continue;
      selectorSet.add(normalized);
      let overlaps = false;
      for (const existing of result) {
        try {
          const existingEls = new Set(document.querySelectorAll(existing.selector));
          const currentEls = document.querySelectorAll(pattern.selector);
          let overlapCount = 0;
          for (let i = 0; i < currentEls.length; i++) {
            if (existingEls.has(currentEls[i])) overlapCount++;
          }
          if (overlapCount > currentEls.length * 0.5) {
            overlaps = true;
            break;
          }
        } catch {
        }
      }
      if (!overlaps) {
        result.push(pattern);
      }
    }
    return result;
  }
  async function handleSelectPattern(patternId, sendResponse) {
    try {
      injectStyles();
      const hl = getHighlighter();
      const count = hl.highlightElements(patternId);
      sendResponse({
        type: "SELECTION_CONFIRMED",
        patternId,
        selector: patternId
      });
    } catch (err) {
      sendResponse({
        type: "EXTRACTION_ERROR",
        error: `Select pattern failed: ${err instanceof Error ? err.message : String(err)}`
      });
    }
  }
  async function handleStartExtraction(config, sendResponse) {
    if (ctx.state === "running") {
      sendResponse({
        type: "EXTRACTION_ERROR",
        error: "Extraction is already running"
      });
      return;
    }
    ctx.state = "running";
    ctx.config = config;
    ctx.collectedRows = [];
    ctx.currentPage = 0;
    ctx.startTime = Date.now();
    ctx.errors = 0;
    sendResponse({ type: "PONG" });
    try {
      await runExtractionLoop(config);
    } catch (err) {
      ctx.state = "error";
      sendErrorMessage(`Extraction failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
  async function runExtractionLoop(config) {
    const { patternSelector, fields, pagination, maxItems, maxPages } = config;
    const executor = getPaginationExecutor();
    let totalItems = 0;
    let totalPages = 0;
    if (!pagination || pagination.mode === "auto-scroll" && !pagination.scrollTarget) {
      ctx.currentPage = 1;
      totalPages = 1;
      const rows = extractData(patternSelector, fields, {
        limit: maxItems,
        clean: true,
        deduplicate: true
      });
      totalItems = rows.length;
      ctx.collectedRows.push(...rows);
      sendBatch(rows);
      sendProgress(totalItems, totalPages);
    } else {
      const iterator = executor.execute(pagination, patternSelector);
      ctx.paginationIterator = iterator;
      for await (const batch of iterator) {
        if (ctx.state !== "running") {
          if (ctx.state === "paused") {
            await waitForResume();
            if (ctx.state !== "running") break;
          } else {
            break;
          }
        }
        totalPages = batch.page;
        ctx.currentPage = batch.page;
        if (batch.elements.length > 0) {
          const rows = extractData(patternSelector, fields, {
            limit: maxItems > 0 ? maxItems - totalItems : 0,
            clean: true,
            deduplicate: true
          });
          const existingIds = new Set(ctx.collectedRows.map((r) => rowFingerprint(r)));
          const newRows = rows.filter((r) => !existingIds.has(rowFingerprint(r)));
          totalItems += newRows.length;
          ctx.collectedRows.push(...newRows);
          sendBatch(newRows);
          sendProgress(totalItems, totalPages);
          if (maxItems > 0 && totalItems >= maxItems) break;
        }
        if (maxPages > 0 && totalPages >= maxPages) break;
        if (batch.isLast) break;
      }
    }
    ctx.state = "completed";
    const elapsed = Date.now() - ctx.startTime;
    const summary = {
      totalItems: ctx.collectedRows.length,
      totalPages,
      totalTime: elapsed,
      avgSpeed: ctx.collectedRows.length > 0 ? ctx.collectedRows.length / (elapsed / 1e3) : 0,
      errors: ctx.errors,
      dataSize: estimateDataSize(ctx.collectedRows)
    };
    try {
      chrome.runtime.sendMessage({
        type: "EXTRACTION_COMPLETE",
        summary
      });
    } catch {
    }
  }
  function rowFingerprint(row) {
    const vals = Object.values(row.data).map((v) => String(v ?? "")).join("|");
    return vals;
  }
  function sendBatch(rows) {
    if (rows.length === 0) return;
    try {
      chrome.runtime.sendMessage({
        type: "EXTRACTION_BATCH",
        rows
      });
    } catch {
    }
  }
  function sendProgress(items, pages) {
    const elapsed = Date.now() - ctx.startTime;
    const speed = items > 0 ? items / (elapsed / 1e3) : 0;
    const maxItems = ctx.config?.maxItems || 0;
    const estimatedRemaining = maxItems > 0 && speed > 0 ? (maxItems - items) / speed * 1e3 : 0;
    const progress = {
      items,
      pages,
      elapsed,
      speed,
      errors: ctx.errors,
      estimatedRemaining
    };
    try {
      chrome.runtime.sendMessage({
        type: "EXTRACTION_PROGRESS",
        data: progress
      });
    } catch {
    }
  }
  function sendErrorMessage(error) {
    ctx.errors++;
    try {
      chrome.runtime.sendMessage({
        type: "EXTRACTION_ERROR",
        error,
        url: window.location.href
      });
    } catch {
    }
  }
  function estimateDataSize(rows) {
    try {
      return new Blob([JSON.stringify(rows)]).size;
    } catch {
      const avgFields = rows.length > 0 ? Object.keys(rows[0].data).length : 0;
      return rows.length * avgFields * 100;
    }
  }
  let resumeResolver = null;
  function waitForResume() {
    return new Promise((resolve) => {
      resumeResolver = resolve;
    });
  }
  function handlePauseExtraction(sendResponse) {
    if (ctx.state === "running") {
      ctx.state = "paused";
      getScrollController().abort();
    }
    sendResponse({ type: "PONG" });
  }
  function handleResumeExtraction(sendResponse) {
    if (ctx.state === "paused") {
      ctx.state = "running";
      if (resumeResolver) {
        resumeResolver();
        resumeResolver = null;
      }
    }
    sendResponse({ type: "PONG" });
  }
  function handleStopExtraction(sendResponse) {
    ctx.state = "idle";
    ctx.paginationIterator = null;
    getPaginationExecutor().abort();
    getScrollController().abort();
    if (resumeResolver) {
      resumeResolver();
      resumeResolver = null;
    }
    sendResponse({ type: "PONG" });
  }
  function handleHighlightElements(selector, sendResponse) {
    injectStyles();
    getHighlighter().highlightElements(selector);
    sendResponse({ type: "PONG" });
  }
  function handleClearHighlights(sendResponse) {
    getHighlighter().clearAll();
    sendResponse({ type: "PONG" });
  }
  function handleTestSelector(selector, sendResponse) {
    let matchCount = 0;
    const sampleValues = [];
    try {
      const elements = document.querySelectorAll(selector);
      matchCount = elements.length;
      const sampleCount = Math.min(5, elements.length);
      for (let i = 0; i < sampleCount; i++) {
        const text = (elements[i].textContent || "").trim().slice(0, 100);
        sampleValues.push(text);
      }
    } catch {
    }
    sendResponse({
      type: "SELECTOR_TEST_RESULT",
      matchCount,
      sampleValues
    });
  }
  function handleActivateSelectionMode(tool, sendResponse) {
    injectStyles();
    getCursorController().activate(tool);
    sendResponse({ type: "PONG" });
  }
  function handleDeactivateSelectionMode(sendResponse) {
    getCursorController().deactivate();
    sendResponse({ type: "PONG" });
  }
  async function handleDetectPagination(sendResponse) {
    try {
      const configs = detectPagination(document);
      sendResponse({
        type: "PAGINATION_RESULT",
        configs
      });
    } catch (err) {
      sendResponse({
        type: "EXTRACTION_ERROR",
        error: `Pagination detection failed: ${err instanceof Error ? err.message : String(err)}`
      });
    }
  }
  async function handleExtractEmails(sendResponse) {
    try {
      const emails = /* @__PURE__ */ new Set();
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const bodyText = document.body.textContent || "";
      const textMatches = bodyText.match(emailRegex);
      if (textMatches) {
        for (const email of textMatches) {
          emails.add(email.toLowerCase());
        }
      }
      const mailtoLinks = document.querySelectorAll('a[href^="mailto:"]');
      for (let i = 0; i < mailtoLinks.length; i++) {
        const href = mailtoLinks[i].getAttribute("href");
        if (href) {
          const email = href.replace("mailto:", "").split("?")[0].trim().toLowerCase();
          if (emailRegex.test(email)) {
            emails.add(email);
          }
          emailRegex.lastIndex = 0;
        }
      }
      const htmlSource = document.body.innerHTML;
      const htmlMatches = htmlSource.match(emailRegex);
      if (htmlMatches) {
        for (const email of htmlMatches) {
          emails.add(email.toLowerCase());
        }
      }
      const rows = Array.from(emails).map((email) => ({
        id: generatePrefixedId("row"),
        data: { email },
        sourceUrl: window.location.href,
        extractedAt: Date.now()
      }));
      sendResponse({
        type: "EXTRACTION_BATCH",
        rows
      });
    } catch (err) {
      sendResponse({
        type: "EXTRACTION_ERROR",
        error: `Email extraction failed: ${err instanceof Error ? err.message : String(err)}`
      });
    }
  }
  async function handleExtractImages(sendResponse) {
    try {
      const images = /* @__PURE__ */ new Map();
      const baseUrl = window.location.href;
      const imgElements = document.querySelectorAll("img");
      for (let i = 0; i < imgElements.length; i++) {
        const img = imgElements[i];
        const src = img.src || img.getAttribute("data-src") || img.getAttribute("data-lazy-src") || "";
        if (!src || src.startsWith("data:image/svg") || src.includes("pixel") || src.includes("spacer")) continue;
        const resolvedSrc = resolveUrl(src, baseUrl);
        if (!images.has(resolvedSrc)) {
          images.set(resolvedSrc, {
            src: resolvedSrc,
            alt: img.alt || "",
            width: img.naturalWidth || img.width || 0,
            height: img.naturalHeight || img.height || 0
          });
        }
      }
      const allElements = document.querySelectorAll("*");
      for (let i = 0; i < allElements.length; i++) {
        try {
          const style = getComputedStyle(allElements[i]);
          const bgImage = style.backgroundImage;
          if (bgImage && bgImage !== "none") {
            const match = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
            if (match && !match[1].startsWith("data:image/svg")) {
              const resolvedSrc = resolveUrl(match[1], baseUrl);
              if (!images.has(resolvedSrc)) {
                images.set(resolvedSrc, {
                  src: resolvedSrc,
                  alt: "",
                  width: 0,
                  height: 0
                });
              }
            }
          }
        } catch {
        }
      }
      const sources = document.querySelectorAll("picture source[srcset]");
      for (let i = 0; i < sources.length; i++) {
        const srcset = sources[i].getAttribute("srcset") || "";
        const entries = srcset.split(",");
        for (const entry of entries) {
          const url = entry.trim().split(/\s+/)[0];
          if (url) {
            const resolvedSrc = resolveUrl(url, baseUrl);
            if (!images.has(resolvedSrc)) {
              images.set(resolvedSrc, {
                src: resolvedSrc,
                alt: "",
                width: 0,
                height: 0
              });
            }
          }
        }
      }
      const rows = Array.from(images.values()).map((img) => ({
        id: generatePrefixedId("row"),
        data: {
          src: img.src,
          alt: img.alt,
          width: img.width,
          height: img.height
        },
        sourceUrl: window.location.href,
        extractedAt: Date.now()
      }));
      sendResponse({
        type: "EXTRACTION_BATCH",
        rows
      });
    } catch (err) {
      sendResponse({
        type: "EXTRACTION_ERROR",
        error: `Image extraction failed: ${err instanceof Error ? err.message : String(err)}`
      });
    }
  }
  function resolveUrl(url, baseUrl) {
    if (!url) return "";
    if (url.startsWith("http://") || url.startsWith("https://") || url.startsWith("data:")) return url;
    if (url.startsWith("//")) {
      try {
        return new URL(baseUrl).protocol + url;
      } catch {
        return "https:" + url;
      }
    }
    try {
      return new URL(url, baseUrl).href;
    } catch {
      return url;
    }
  }
  async function handleExtractText(sendResponse) {
    try {
      const walker = getDOMWalker();
      const textBlocks = [];
      walker.walk(document.body, (el, depth) => {
        if (!walker.isVisible(el)) return true;
        let directText = "";
        for (let i = 0; i < el.childNodes.length; i++) {
          if (el.childNodes[i].nodeType === Node.TEXT_NODE) {
            directText += el.childNodes[i].textContent || "";
          }
        }
        directText = directText.trim();
        if (directText.length > 0) {
          textBlocks.push({
            tag: el.tagName.toLowerCase(),
            text: directText,
            depth
          });
        }
        return true;
      });
      const rows = textBlocks.filter((block) => block.text.length > 0).map((block) => ({
        id: generatePrefixedId("row"),
        data: {
          tag: block.tag,
          text: block.text,
          depth: block.depth
        },
        sourceUrl: window.location.href,
        extractedAt: Date.now()
      }));
      sendResponse({
        type: "EXTRACTION_BATCH",
        rows
      });
    } catch (err) {
      sendResponse({
        type: "EXTRACTION_ERROR",
        error: `Text extraction failed: ${err instanceof Error ? err.message : String(err)}`
      });
    }
  }
  chrome.runtime.onMessage.addListener(handleMessage);
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", injectStyles, { once: true });
  } else {
    injectStyles();
  }

})();
