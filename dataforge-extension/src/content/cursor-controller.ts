/**
 * CursorController – Smart cursor behavior during element selection mode.
 *
 * When active, changes the cursor to a crosshair with a pulsing ring,
 * highlights the element under the cursor, shows a floating tooltip with
 * pattern detection info, and fires ELEMENT_CLICKED on click.
 */

import type { Message } from '../types/messages';
import { ElementHighlighter } from './element-highlighter';

/** Minimum interval between hover detections (ms). */
const HOVER_THROTTLE_MS = 80;

/** Tags to skip when identifying the target element. */
const SKIP_TAGS = new Set([
  'HTML', 'BODY', 'SCRIPT', 'STYLE', 'NOSCRIPT', 'SVG', 'HEAD',
  'META', 'LINK', 'BR', 'HR',
]);

/** DataForge's own overlay class names to ignore during selection. */
const DATAFORGE_PREFIX = 'dataforge-';

export class CursorController {
  private active = false;
  private tool = '';
  private highlighter: ElementHighlighter;
  private currentTarget: Element | null = null;

  // DOM elements for cursor UI
  private cursorRing: HTMLDivElement | null = null;
  private tooltip: HTMLDivElement | null = null;
  private dimOverlay: HTMLDivElement | null = null;

  // Bound event handlers
  private boundMouseMove: ((e: MouseEvent) => void) | null = null;
  private boundClick: ((e: MouseEvent) => void) | null = null;
  private boundKeyDown: ((e: KeyboardEvent) => void) | null = null;

  // Throttle state
  private lastHoverTime = 0;
  private pendingHoverRaf: number | null = null;

  constructor(highlighter?: ElementHighlighter) {
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
  activate(tool: string): void {
    if (this.active) {
      this.deactivate();
    }

    this.active = true;
    this.tool = tool;

    // Add the crosshair cursor class to the document
    document.documentElement.classList.add('dataforge-cursor-active');

    // Create the cursor ring
    this.cursorRing = document.createElement('div');
    this.cursorRing.className = 'dataforge-cursor-ring';
    document.documentElement.appendChild(this.cursorRing);

    // Create the tooltip
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'dataforge-tooltip';
    this.tooltip.innerHTML = '<span class="dataforge-tooltip__icon"></span><span class="dataforge-tooltip__text"></span>';
    document.documentElement.appendChild(this.tooltip);

    // Create the dim overlay
    this.dimOverlay = document.createElement('div');
    this.dimOverlay.className = 'dataforge-dim';
    document.documentElement.appendChild(this.dimOverlay);
    requestAnimationFrame(() => {
      if (this.dimOverlay) {
        this.dimOverlay.classList.add('dataforge-dim--active');
      }
    });

    // Bind event listeners
    this.boundMouseMove = (e: MouseEvent) => this.onMouseMove(e);
    this.boundClick = (e: MouseEvent) => this.onClick(e);
    this.boundKeyDown = (e: KeyboardEvent) => this.onKeyDown(e);

    document.addEventListener('mousemove', this.boundMouseMove, { passive: true, capture: true });
    document.addEventListener('click', this.boundClick, { capture: true });
    document.addEventListener('keydown', this.boundKeyDown, { capture: true });
  }

  /**
   * Deactivate selection mode and clean up all UI elements.
   */
  deactivate(): void {
    if (!this.active) return;

    this.active = false;
    this.currentTarget = null;

    // Remove cursor class
    document.documentElement.classList.remove('dataforge-cursor-active');

    // Remove UI elements
    if (this.cursorRing) {
      this.cursorRing.remove();
      this.cursorRing = null;
    }
    if (this.tooltip) {
      this.tooltip.remove();
      this.tooltip = null;
    }
    if (this.dimOverlay) {
      this.dimOverlay.classList.remove('dataforge-dim--active');
      // Wait for fade-out transition
      const dim = this.dimOverlay;
      setTimeout(() => dim.remove(), 300);
      this.dimOverlay = null;
    }

    // Remove event listeners
    if (this.boundMouseMove) {
      document.removeEventListener('mousemove', this.boundMouseMove, { capture: true } as EventListenerOptions);
      this.boundMouseMove = null;
    }
    if (this.boundClick) {
      document.removeEventListener('click', this.boundClick, { capture: true } as EventListenerOptions);
      this.boundClick = null;
    }
    if (this.boundKeyDown) {
      document.removeEventListener('keydown', this.boundKeyDown, { capture: true } as EventListenerOptions);
      this.boundKeyDown = null;
    }

    if (this.pendingHoverRaf !== null) {
      cancelAnimationFrame(this.pendingHoverRaf);
      this.pendingHoverRaf = null;
    }

    // Clear highlights
    this.highlighter.clearAll();
  }

  /** Whether selection mode is currently active. */
  get isActive(): boolean {
    return this.active;
  }

  // -------------------------------------------------------------------------
  // Event handlers
  // -------------------------------------------------------------------------

  private onMouseMove(e: MouseEvent): void {
    if (!this.active) return;

    // Update cursor ring position
    if (this.cursorRing) {
      this.cursorRing.style.left = `${e.clientX}px`;
      this.cursorRing.style.top = `${e.clientY}px`;
    }

    // Throttle hover detection
    const now = Date.now();
    if (now - this.lastHoverTime < HOVER_THROTTLE_MS) {
      return;
    }
    this.lastHoverTime = now;

    // Determine the element under the cursor
    const target = this.getTargetElement(e.clientX, e.clientY);

    if (target === this.currentTarget) return;

    // Remove highlight from previous target
    if (this.currentTarget) {
      this.highlighter.removeSingle(this.currentTarget);
    }

    this.currentTarget = target;

    if (!target) {
      this.hideTooltip();
      return;
    }

    // Highlight the new target
    this.highlighter.highlightSingle(target, 'hover');

    // Show tooltip with pattern info
    this.updateTooltip(target, e.clientX, e.clientY);
  }

  private onClick(e: MouseEvent): void {
    if (!this.active) return;

    // Prevent default link navigation, form submission, etc.
    e.preventDefault();
    e.stopPropagation();
    e.stopImmediatePropagation();

    const target = this.getTargetElement(e.clientX, e.clientY);
    if (!target) return;

    // Highlight with "selected" styling
    this.highlighter.highlightSingle(target, 'selected');

    // Create shockwave animation
    this.createShockwave(e.clientX, e.clientY);

    // Generate a selector for the clicked element
    const selector = this.generateSelector(target);
    const patternId = this.detectPatternId(target);

    // Send the ELEMENT_CLICKED message
    const message: Message = {
      type: 'ELEMENT_CLICKED',
      selector,
      patternId,
    };

    try {
      chrome.runtime.sendMessage(message);
    } catch {
      // Content script may have been disconnected
    }
  }

  private onKeyDown(e: KeyboardEvent): void {
    if (!this.active) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      this.deactivate();

      // Notify the extension that selection mode was cancelled
      try {
        const message: Message = { type: 'DEACTIVATE_SELECTION_MODE' };
        chrome.runtime.sendMessage(message);
      } catch {
        // ignore
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
  private getTargetElement(x: number, y: number): Element | null {
    // Temporarily hide our overlays to get the real element underneath
    const overlayElements = document.querySelectorAll(
      '.dataforge-overlay, .dataforge-cursor-ring, .dataforge-tooltip, .dataforge-dim'
    );
    const origDisplay: string[] = [];
    for (let i = 0; i < overlayElements.length; i++) {
      const el = overlayElements[i] as HTMLElement;
      origDisplay.push(el.style.display);
      el.style.display = 'none';
    }

    let rawTarget: Element | null = null;
    try {
      rawTarget = document.elementFromPoint(x, y);
    } catch {
      // elementFromPoint can fail in some edge cases
    }

    // Restore overlay display
    for (let i = 0; i < overlayElements.length; i++) {
      (overlayElements[i] as HTMLElement).style.display = origDisplay[i];
    }

    if (!rawTarget) return null;

    // Walk up to find a meaningful target
    let target: Element | null = rawTarget;
    while (target) {
      // Skip DataForge's own elements
      if (this.isDataForgeElement(target)) {
        target = target.parentElement;
        continue;
      }

      // Skip uninteresting tags
      if (SKIP_TAGS.has(target.tagName)) {
        target = target.parentElement;
        continue;
      }

      // Found a good target
      break;
    }

    return target;
  }

  private isDataForgeElement(el: Element): boolean {
    const id = el.id || '';
    const className = el.className || '';

    if (typeof className === 'string') {
      return id.startsWith(DATAFORGE_PREFIX) || className.includes(DATAFORGE_PREFIX);
    }
    return id.startsWith(DATAFORGE_PREFIX);
  }

  // -------------------------------------------------------------------------
  // Tooltip
  // -------------------------------------------------------------------------

  private updateTooltip(el: Element, mouseX: number, mouseY: number): void {
    if (!this.tooltip) return;

    // Quick pattern detection: find siblings with same tag/class structure
    const info = this.quickPatternDetect(el);

    const textSpan = this.tooltip.querySelector('.dataforge-tooltip__text');
    if (textSpan) {
      textSpan.innerHTML = info.label;
    }

    // Position tooltip near the cursor but offset so it doesn't overlap
    const offsetX = 16;
    const offsetY = 20;
    let tooltipX = mouseX + offsetX;
    let tooltipY = mouseY + offsetY;

    // Keep tooltip within viewport
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
    this.tooltip.classList.add('dataforge-tooltip--visible');
  }

  private hideTooltip(): void {
    if (this.tooltip) {
      this.tooltip.classList.remove('dataforge-tooltip--visible');
    }
  }

  // -------------------------------------------------------------------------
  // Quick pattern detection (lightweight)
  // -------------------------------------------------------------------------

  private quickPatternDetect(el: Element): { count: number; label: string } {
    const parent = el.parentElement;
    if (!parent) {
      return { count: 1, label: `&lt;${el.tagName.toLowerCase()}&gt;` };
    }

    // Count siblings with the same tag and similar class structure
    const tag = el.tagName;
    const classKey = this.getClassSignature(el);
    let count = 0;

    const siblings = parent.children;
    for (let i = 0; i < siblings.length; i++) {
      if (siblings[i].tagName === tag && this.getClassSignature(siblings[i]) === classKey) {
        count++;
      }
    }

    // Try to classify the pattern
    const category = this.classifyElement(el, count);

    if (count > 1) {
      return {
        count,
        label: `<span class="dataforge-tooltip__count">${count}</span> ${category} detected`,
      };
    }

    // Single element - try going up one level
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
          label: `List: <span class="dataforge-tooltip__count">${parentCount}</span> ${parentCategory}`,
        };
      }
    }

    return {
      count: 1,
      label: `&lt;${el.tagName.toLowerCase()}&gt; element`,
    };
  }

  /**
   * Generate a simple class-based signature for quick comparison.
   */
  private getClassSignature(el: Element): string {
    const classes = Array.from(el.classList).sort();
    return classes.join('.');
  }

  /**
   * Attempt to classify what kind of content an element represents.
   */
  private classifyElement(el: Element, count: number): string {
    const tag = el.tagName.toLowerCase();
    const classText = (el.className || '').toLowerCase();
    const html = el.innerHTML || '';

    // Check for specific patterns
    if (classText.includes('product') || classText.includes('item') && html.includes('price')) {
      return 'products';
    }
    if (classText.includes('review') || classText.includes('comment') || classText.includes('testimonial')) {
      return 'reviews';
    }
    if (classText.includes('article') || classText.includes('post') || classText.includes('story')) {
      return 'articles';
    }
    if (classText.includes('card')) {
      return 'cards';
    }
    if (tag === 'tr') {
      return 'rows';
    }
    if (tag === 'li') {
      return count > 5 ? 'items' : 'items';
    }
    if (classText.includes('listing') || classText.includes('result')) {
      return 'listings';
    }

    return 'items';
  }

  // -------------------------------------------------------------------------
  // Selector generation
  // -------------------------------------------------------------------------

  /**
   * Generate a CSS selector for the given element.
   * Tries data attributes > id > semantic classes > structural path.
   */
  private generateSelector(el: Element): string {
    // Strategy 1: ID-based selector
    if (el.id && !el.id.match(/^\d/) && !el.id.includes(':')) {
      const idSelector = `#${CSS.escape(el.id)}`;
      if (this.isUniqueSelector(idSelector)) {
        return idSelector;
      }
    }

    // Strategy 2: Data attribute selector
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

    // Strategy 3: Tag + class combination
    const tag = el.tagName.toLowerCase();
    const stableClasses = this.getStableClasses(el);

    if (stableClasses.length > 0) {
      const classSelector = `${tag}.${stableClasses.map(c => CSS.escape(c)).join('.')}`;
      try {
        const count = document.querySelectorAll(classSelector).length;
        if (count >= 1) {
          return classSelector;
        }
      } catch {
        // Invalid selector
      }
    }

    // Strategy 4: Structural path (nth-child)
    return this.buildStructuralPath(el);
  }

  private getDataAttributes(el: Element): string[] {
    const attrs: string[] = [];
    const names = el.getAttributeNames();
    for (const name of names) {
      if (name.startsWith('data-') && !name.includes('random') && !name.includes('uid')) {
        attrs.push(name);
      }
    }
    return attrs;
  }

  private getStableClasses(el: Element): string[] {
    const classes: string[] = [];
    for (let i = 0; i < el.classList.length; i++) {
      const cls = el.classList[i];
      // Skip classes that look auto-generated (hashes, long random strings)
      if (cls.length > 30) continue;
      if (/^[a-z]{1,3}-[a-f0-9]{6,}$/i.test(cls)) continue;
      if (/^[a-f0-9]{8,}$/.test(cls)) continue;
      if (/^_/.test(cls)) continue;
      classes.push(cls);
    }
    return classes;
  }

  private buildStructuralPath(el: Element): string {
    const segments: string[] = [];
    let current: Element | null = el;
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

    return segments.join(' > ');
  }

  private isUniqueSelector(selector: string): boolean {
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
  private detectPatternId(el: Element): string {
    const parent = el.parentElement;
    if (!parent) return '';

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
      // Build a pattern selector
      const stableClasses = this.getStableClasses(el);
      if (stableClasses.length > 0) {
        return `${tag.toLowerCase()}.${stableClasses.join('.')}`;
      }
      return tag.toLowerCase();
    }

    return '';
  }

  // -------------------------------------------------------------------------
  // Shockwave animation
  // -------------------------------------------------------------------------

  private createShockwave(x: number, y: number): void {
    const shockwave = document.createElement('div');
    shockwave.className = 'dataforge-shockwave';
    shockwave.style.left = `${x}px`;
    shockwave.style.top = `${y}px`;
    document.documentElement.appendChild(shockwave);

    // Remove after animation completes
    setTimeout(() => {
      shockwave.remove();
    }, 600);
  }
}
