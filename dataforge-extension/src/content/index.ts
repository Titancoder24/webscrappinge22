/**
 * DataForge Content Script – Entry Point
 *
 * Runs on every matched web page. Sets up a Chrome runtime message listener,
 * initialises engines lazily (only when first needed), and manages an
 * extraction state machine that coordinates highlighting, selection,
 * data extraction, scrolling, and pagination.
 */

import type { Message } from '../types/messages';
import type {
  DetectedField,
  DetectedPattern,
  ExtractionConfig,
  ExtractionProgress,
  ExtractionSummary,
  Row,
} from '../types/extraction';

import { generatePrefixedId } from '../utils/id';
import { ElementHighlighter } from './element-highlighter';
import { CursorController } from './cursor-controller';
import { extractData } from './data-extractor';
import { ScrollController } from './scroll-controller';
import { PaginationExecutor } from './pagination-executor';
import { DOMWalker } from './dom-walker';
import { DOMChangeWatcher } from './mutation-observer';
import { detectPagination as pageSenseDetect } from './engines/page-sense';
import { classifyField } from './engines/type-sense';
import { generateRelativeSelector } from './engines/selector-forge';

// ---------------------------------------------------------------------------
// Extraction state machine
// ---------------------------------------------------------------------------

type ExtractionState = 'idle' | 'selecting' | 'configuring' | 'running' | 'paused' | 'completed' | 'error';

interface ExtractionContext {
  state: ExtractionState;
  config: ExtractionConfig | null;
  collectedRows: Row[];
  currentPage: number;
  startTime: number;
  errors: number;
  paginationIterator: AsyncGenerator | null;
}

// ---------------------------------------------------------------------------
// Lazy-initialised engines (created on first use)
// ---------------------------------------------------------------------------

let highlighter: ElementHighlighter | null = null;
let cursorController: CursorController | null = null;
let scrollController: ScrollController | null = null;
let paginationExecutor: PaginationExecutor | null = null;
let domWalker: DOMWalker | null = null;
let domWatcher: DOMChangeWatcher | null = null;

function getHighlighter(): ElementHighlighter {
  if (!highlighter) highlighter = new ElementHighlighter();
  return highlighter;
}

function getCursorController(): CursorController {
  if (!cursorController) cursorController = new CursorController(getHighlighter());
  return cursorController;
}

function getScrollController(): ScrollController {
  if (!scrollController) scrollController = new ScrollController();
  return scrollController;
}

function getPaginationExecutor(): PaginationExecutor {
  if (!paginationExecutor) paginationExecutor = new PaginationExecutor();
  return paginationExecutor;
}

function getDOMWalker(): DOMWalker {
  if (!domWalker) domWalker = new DOMWalker();
  return domWalker;
}

function getDOMWatcher(): DOMChangeWatcher {
  if (!domWatcher) domWatcher = new DOMChangeWatcher();
  return domWatcher;
}

// ---------------------------------------------------------------------------
// Extraction state
// ---------------------------------------------------------------------------

const ctx: ExtractionContext = {
  state: 'idle',
  config: null,
  collectedRows: [],
  currentPage: 0,
  startTime: 0,
  errors: 0,
  paginationIterator: null,
};

// ---------------------------------------------------------------------------
// Inject overlay styles
// ---------------------------------------------------------------------------

function injectStyles(): void {
  if (document.getElementById('dataforge-styles')) return;

  const link = document.createElement('link');
  link.id = 'dataforge-styles';
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('content/overlay/styles.css');
  (document.head || document.documentElement).appendChild(link);
}

// ---------------------------------------------------------------------------
// Message handler
// ---------------------------------------------------------------------------

function handleMessage(
  message: Message,
  _sender: chrome.runtime.MessageSender,
  sendResponse: (response?: unknown) => void,
): boolean {
  // Many handlers are async, so we return true to keep the message port open
  // and call sendResponse when the operation completes.
  switch (message.type) {
    case 'PING':
      sendResponse({ type: 'PONG' });
      return false;

    case 'SCAN_PAGE':
      handleScanPage(sendResponse);
      return true;

    case 'SELECT_PATTERN':
      handleSelectPattern(message.patternId, sendResponse);
      return true;

    case 'START_EXTRACTION':
      handleStartExtraction(message.config, sendResponse);
      return true;

    case 'PAUSE_EXTRACTION':
      handlePauseExtraction(sendResponse);
      return false;

    case 'RESUME_EXTRACTION':
      handleResumeExtraction(sendResponse);
      return true;

    case 'STOP_EXTRACTION':
      handleStopExtraction(sendResponse);
      return false;

    case 'HIGHLIGHT_ELEMENTS':
      handleHighlightElements(message.selector, sendResponse);
      return false;

    case 'CLEAR_HIGHLIGHTS':
      handleClearHighlights(sendResponse);
      return false;

    case 'TEST_SELECTOR':
      handleTestSelector(message.selector, sendResponse);
      return false;

    case 'ACTIVATE_SELECTION_MODE':
      handleActivateSelectionMode(message.tool, sendResponse);
      return false;

    case 'DEACTIVATE_SELECTION_MODE':
      handleDeactivateSelectionMode(sendResponse);
      return false;

    case 'DETECT_PAGINATION':
      handleDetectPagination(sendResponse);
      return true;

    case 'EXTRACT_EMAILS':
      handleExtractEmails(sendResponse);
      return true;

    case 'EXTRACT_IMAGES':
      handleExtractImages(sendResponse);
      return true;

    case 'EXTRACT_TEXT':
      handleExtractText(sendResponse);
      return true;

    default:
      return false;
  }
}

// ---------------------------------------------------------------------------
// SCAN_PAGE – Run PatternSense to detect repeating element patterns
// ---------------------------------------------------------------------------

async function handleScanPage(sendResponse: (resp: unknown) => void): Promise<void> {
  try {
    injectStyles();
    const patterns = runPatternSense();

    const response: Message = { type: 'SCAN_RESULT', patterns };
    sendResponse(response);
  } catch (err) {
    sendResponse({
      type: 'EXTRACTION_ERROR',
      error: `Scan failed: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}

/**
 * PatternSense – Detect repeating element patterns in the DOM.
 *
 * Strategy: Walk the DOM, group children by tag+class signature, score
 * groups by item count, field richness, and visual area.
 */
function runPatternSense(): DetectedPattern[] {
  const walker = getDOMWalker();
  const candidates: Map<string, { parent: Element; children: Element[]; selector: string }> = new Map();

  // Walk all container elements and find groups of similar children
  const containers = document.querySelectorAll('body *');
  for (let i = 0; i < containers.length; i++) {
    const parent = containers[i];
    const children = parent.children;
    if (children.length < 2) continue;

    // Group children by tag+class signature
    const groups = new Map<string, Element[]>();
    for (let j = 0; j < children.length; j++) {
      const child = children[j];
      if (!walker.isVisible(child)) continue;

      const sig = getStructuralSignature(child);
      if (!groups.has(sig)) {
        groups.set(sig, []);
      }
      groups.get(sig)!.push(child);
    }

    // Keep groups with 3+ similar children
    for (const [sig, elems] of groups) {
      if (elems.length < 3) continue;

      const key = `${getParentSelector(parent)}>${sig}`;
      if (!candidates.has(key) || candidates.get(key)!.children.length < elems.length) {
        const selector = buildGroupSelector(parent, elems[0]);
        candidates.set(key, { parent, children: elems, selector });
      }
    }
  }

  // Score and rank candidates
  const patterns: DetectedPattern[] = [];
  for (const [, candidate] of candidates) {
    const { children, selector } = candidate;
    const sampleEl = children[0];

    // Detect fields within each item
    const fields = detectFields(sampleEl);
    if (fields.length === 0) continue;

    // Calculate visual area
    const area = walker.getVisualArea(sampleEl);
    if (area === 0) continue;

    // Calculate confidence score
    const confidence = calculateConfidence(children.length, fields.length, area);
    if (confidence < 0.2) continue;

    // Classify the pattern
    const category = classifyPattern(sampleEl, fields);

    // Get bounding rect
    let boundingRect = { top: 0, left: 0, width: 0, height: 0 };
    try {
      const rect = sampleEl.getBoundingClientRect();
      boundingRect = {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      };
    } catch {
      // ignore
    }

    // Collect sample HTML snippets
    const sampleElements: string[] = [];
    const sampleCount = Math.min(3, children.length);
    for (let i = 0; i < sampleCount; i++) {
      const text = (children[i].textContent || '').trim().slice(0, 120);
      sampleElements.push(text);
    }

    patterns.push({
      id: generatePrefixedId('pat'),
      selector,
      itemCount: children.length,
      sampleElements,
      confidence,
      category,
      fields,
      boundingRect,
      visualArea: area,
    });
  }

  // Sort by confidence (highest first), then by item count
  patterns.sort((a, b) => {
    const confDiff = b.confidence - a.confidence;
    if (Math.abs(confDiff) > 0.05) return confDiff;
    return b.itemCount - a.itemCount;
  });

  // Deduplicate overlapping patterns (keep the higher-confidence one)
  return deduplicatePatterns(patterns).slice(0, 20);
}

function getStructuralSignature(el: Element): string {
  const tag = el.tagName;
  const classes = Array.from(el.classList)
    .filter(c => c.length < 30 && !/^[a-f0-9]{8,}$/.test(c))
    .sort()
    .join('.');
  return classes ? `${tag}.${classes}` : tag;
}

function getParentSelector(el: Element): string {
  if (el.id) return `#${CSS.escape(el.id)}`;
  const tag = el.tagName.toLowerCase();
  const stableClasses = Array.from(el.classList)
    .filter(c => c.length < 25 && !/^[a-f0-9]{8,}$/.test(c))
    .slice(0, 3);
  return stableClasses.length > 0
    ? `${tag}.${stableClasses.map(c => CSS.escape(c)).join('.')}`
    : tag;
}

function buildGroupSelector(parent: Element, sampleChild: Element): string {
  const parentPart = getParentSelector(parent);
  const childTag = sampleChild.tagName.toLowerCase();
  const stableClasses = Array.from(sampleChild.classList)
    .filter(c => c.length < 30 && !/^[a-f0-9]{8,}$/.test(c) && !/^_/.test(c))
    .slice(0, 3);

  if (stableClasses.length > 0) {
    const classPart = stableClasses.map(c => CSS.escape(c)).join('.');
    const selector = `${parentPart} > ${childTag}.${classPart}`;
    try {
      if (document.querySelectorAll(selector).length > 0) return selector;
    } catch {
      // fallback
    }
  }

  return `${parentPart} > ${childTag}`;
}

function detectFields(sampleEl: Element): DetectedField[] {
  const fields: DetectedField[] = [];
  const seen = new Set<string>();

  // Walk through child elements looking for data-bearing nodes
  const childElements = sampleEl.querySelectorAll('*');
  const allTargets = [sampleEl, ...Array.from(childElements)];

  for (const target of allTargets) {
    // Text content fields
    const text = getDirectText(target);
    if (text && text.length > 1 && text.length < 500) {
      // Use TypeSense for accurate field classification
      const classification = classifyField([text], target);
      const name = classification.suggestedName || inferFieldName(target, classification.dataType, fields.length);
      const fieldName = name.toLowerCase().replace(/\s+/g, '_');

      if (!seen.has(fieldName)) {
        seen.add(fieldName);
        // Use SelectorForge for robust relative selectors
        let relSelector: string;
        try {
          relSelector = generateRelativeSelector(target, sampleEl) || buildRelativeSelector(sampleEl, target);
        } catch {
          relSelector = buildRelativeSelector(sampleEl, target);
        }

        fields.push({
          id: generatePrefixedId('fld'),
          name: fieldName,
          relativeSelector: relSelector,
          sampleValues: [text.slice(0, 100)],
          dataType: classification.dataType,
          confidence: classification.confidence,
          enabled: true,
        });
      }
    }

    // Link fields
    if (target.tagName === 'A' && target.getAttribute('href')) {
      const name = 'url';
      if (!seen.has(name)) {
        seen.add(name);
        let relSelector: string;
        try {
          relSelector = generateRelativeSelector(target, sampleEl) || buildRelativeSelector(sampleEl, target);
        } catch {
          relSelector = buildRelativeSelector(sampleEl, target);
        }
        fields.push({
          id: generatePrefixedId('fld'),
          name,
          relativeSelector: relSelector,
          sampleValues: [target.getAttribute('href')!.slice(0, 100)],
          dataType: 'url',
          confidence: 0.9,
          enabled: true,
        });
      }
    }

    // Image fields
    if (target.tagName === 'IMG') {
      const src = target.getAttribute('src') || target.getAttribute('data-src');
      if (src) {
        const name = 'image';
        if (!seen.has(name)) {
          seen.add(name);
          let relSelector: string;
          try {
            relSelector = generateRelativeSelector(target, sampleEl) || buildRelativeSelector(sampleEl, target);
          } catch {
            relSelector = buildRelativeSelector(sampleEl, target);
          }
          fields.push({
            id: generatePrefixedId('fld'),
            name,
            relativeSelector: relSelector,
            sampleValues: [src.slice(0, 100)],
            dataType: 'image',
            confidence: 0.9,
            enabled: true,
          });
        }
      }
    }
  }

  return fields.slice(0, 15); // Cap at 15 fields
}

function getDirectText(el: Element): string {
  // Get only the direct text of this element, not its children's text
  let text = '';
  for (let i = 0; i < el.childNodes.length; i++) {
    if (el.childNodes[i].nodeType === Node.TEXT_NODE) {
      text += el.childNodes[i].textContent || '';
    }
  }
  text = text.trim();

  // If no direct text, use full textContent for leaf nodes
  if (!text && el.children.length === 0) {
    text = (el.textContent || '').trim();
  }

  return text;
}


function inferFieldName(el: Element, dataType: string, index: number): string {
  // Try aria-label
  const ariaLabel = el.getAttribute('aria-label');
  if (ariaLabel && ariaLabel.length < 30) return sanitizeFieldName(ariaLabel);

  // Try class-based naming
  const className = el.className;
  if (typeof className === 'string') {
    const nameHints = className.match(/(?:title|name|price|rating|description|date|author|category|brand|sku)/i);
    if (nameHints) return nameHints[0].toLowerCase();
  }

  // Try parent element hints
  const parent = el.parentElement;
  if (parent) {
    const parentClass = parent.className;
    if (typeof parentClass === 'string') {
      const parentHints = parentClass.match(/(?:title|name|price|rating|description|date|author)/i);
      if (parentHints) return parentHints[0].toLowerCase();
    }
  }

  // Fall back to data type + index
  return `${dataType}_${index + 1}`;
}

function sanitizeFieldName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9_\s]/g, '')
    .replace(/\s+/g, '_')
    .slice(0, 30);
}

function buildRelativeSelector(root: Element, target: Element): string {
  if (root === target) return ':scope';

  // Try ID
  if (target.id) return `#${CSS.escape(target.id)}`;

  // Try tag + class
  const tag = target.tagName.toLowerCase();
  const stableClasses = Array.from(target.classList)
    .filter(c => c.length < 25 && !/^[a-f0-9]{8,}$/.test(c))
    .slice(0, 2);

  if (stableClasses.length > 0) {
    const selector = `${tag}.${stableClasses.map(c => CSS.escape(c)).join('.')}`;
    try {
      if (root.querySelectorAll(selector).length === 1) return selector;
    } catch {
      // fallback
    }
  }

  // Try nth-of-type path
  const path: string[] = [];
  let current: Element | null = target;
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

  return path.join(' > ') || tag;
}

function calculateConfidence(itemCount: number, fieldCount: number, area: number): number {
  let score = 0;

  // Item count contributes to confidence
  if (itemCount >= 10) score += 0.35;
  else if (itemCount >= 5) score += 0.25;
  else if (itemCount >= 3) score += 0.15;

  // Field richness
  if (fieldCount >= 4) score += 0.30;
  else if (fieldCount >= 2) score += 0.20;
  else score += 0.10;

  // Visual area (larger items = more meaningful)
  if (area > 10000) score += 0.20;
  else if (area > 2000) score += 0.15;
  else score += 0.05;

  // Bonus for moderate-to-high item counts
  if (itemCount >= 5 && fieldCount >= 2) score += 0.15;

  return Math.min(1.0, score);
}

function classifyPattern(
  el: Element,
  fields: DetectedField[],
): DetectedPattern['category'] {
  const classText = (el.className || '').toString().toLowerCase();
  const html = el.innerHTML.toLowerCase();
  const tag = el.tagName.toLowerCase();
  const hasPrice = fields.some(f => f.dataType === 'price');
  const hasImage = fields.some(f => f.dataType === 'image');
  const hasRating = fields.some(f => f.dataType === 'rating');

  if (hasPrice && hasImage) return 'product';
  if (classText.includes('product') || classText.includes('item') && hasPrice) return 'product';
  if (classText.includes('review') || classText.includes('comment') || hasRating) return 'review';
  if (classText.includes('article') || classText.includes('post')) return 'article';
  if (classText.includes('card')) return 'card';
  if (classText.includes('listing') || classText.includes('result')) return 'listing';
  if (tag === 'tr') return 'table-row';
  if (classText.includes('feed') || classText.includes('stream')) return 'feed-item';

  return 'generic';
}

function deduplicatePatterns(patterns: DetectedPattern[]): DetectedPattern[] {
  const result: DetectedPattern[] = [];
  const selectorSet = new Set<string>();

  for (const pattern of patterns) {
    // Normalize the selector for comparison
    const normalized = pattern.selector.replace(/\s+/g, ' ').trim();
    if (selectorSet.has(normalized)) continue;
    selectorSet.add(normalized);

    // Also check for overlapping elements
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
        // ignore
      }
    }

    if (!overlaps) {
      result.push(pattern);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// SELECT_PATTERN – Highlight the selected pattern's elements
// ---------------------------------------------------------------------------

async function handleSelectPattern(
  patternId: string,
  sendResponse: (resp: unknown) => void,
): Promise<void> {
  try {
    injectStyles();
    // PatternId is passed from the scan results; we need to find the selector.
    // In a full implementation PatternSense would cache detected patterns.
    // For now we use the patternId as a selector if it looks like one,
    // or we acknowledge the selection.
    const hl = getHighlighter();
    const count = hl.highlightElements(patternId);

    sendResponse({
      type: 'SELECTION_CONFIRMED',
      patternId,
      selector: patternId,
    } satisfies Message);
  } catch (err) {
    sendResponse({
      type: 'EXTRACTION_ERROR',
      error: `Select pattern failed: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}

// ---------------------------------------------------------------------------
// START_EXTRACTION – Begin the extraction loop
// ---------------------------------------------------------------------------

async function handleStartExtraction(
  config: ExtractionConfig,
  sendResponse: (resp: unknown) => void,
): Promise<void> {
  if (ctx.state === 'running') {
    sendResponse({
      type: 'EXTRACTION_ERROR',
      error: 'Extraction is already running',
    });
    return;
  }

  // Initialize extraction context
  ctx.state = 'running';
  ctx.config = config;
  ctx.collectedRows = [];
  ctx.currentPage = 0;
  ctx.startTime = Date.now();
  ctx.errors = 0;

  sendResponse({ type: 'PONG' }); // Acknowledge start

  try {
    await runExtractionLoop(config);
  } catch (err) {
    ctx.state = 'error';
    sendErrorMessage(`Extraction failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function runExtractionLoop(config: ExtractionConfig): Promise<void> {
  const { patternSelector, fields, pagination, maxItems, maxPages } = config;
  const executor = getPaginationExecutor();
  let totalItems = 0;
  let totalPages = 0;

  // If no pagination, just extract current page
  if (!pagination || pagination.mode === 'auto-scroll' && !pagination.scrollTarget) {
    ctx.currentPage = 1;
    totalPages = 1;

    const rows = extractData(patternSelector, fields, {
      limit: maxItems,
      clean: true,
      deduplicate: true,
    });

    totalItems = rows.length;
    ctx.collectedRows.push(...rows);

    // Send rows in batches
    sendBatch(rows);
    sendProgress(totalItems, totalPages);
  } else {
    // Paginated extraction
    const iterator = executor.execute(pagination, patternSelector);
    ctx.paginationIterator = iterator;

    for await (const batch of iterator) {
      if (ctx.state !== 'running') {
        // Check for pause
        if (ctx.state === 'paused') {
          await waitForResume();
          if (ctx.state !== 'running') break;
        } else {
          break;
        }
      }

      totalPages = batch.page;
      ctx.currentPage = batch.page;

      if (batch.elements.length > 0) {
        // Extract data from this batch of elements
        const rows = extractData(patternSelector, fields, {
          limit: maxItems > 0 ? maxItems - totalItems : 0,
          clean: true,
          deduplicate: true,
        });

        // Filter out rows we've already collected
        const existingIds = new Set(ctx.collectedRows.map(r => rowFingerprint(r)));
        const newRows = rows.filter(r => !existingIds.has(rowFingerprint(r)));

        totalItems += newRows.length;
        ctx.collectedRows.push(...newRows);

        sendBatch(newRows);
        sendProgress(totalItems, totalPages);

        // Check item limit
        if (maxItems > 0 && totalItems >= maxItems) break;
      }

      // Check page limit
      if (maxPages > 0 && totalPages >= maxPages) break;
      if (batch.isLast) break;
    }
  }

  // Extraction complete
  ctx.state = 'completed';
  const elapsed = Date.now() - ctx.startTime;

  const summary: ExtractionSummary = {
    totalItems: ctx.collectedRows.length,
    totalPages,
    totalTime: elapsed,
    avgSpeed: ctx.collectedRows.length > 0 ? (ctx.collectedRows.length / (elapsed / 1000)) : 0,
    errors: ctx.errors,
    dataSize: estimateDataSize(ctx.collectedRows),
  };

  try {
    chrome.runtime.sendMessage({
      type: 'EXTRACTION_COMPLETE',
      summary,
    } satisfies Message);
  } catch {
    // Content script disconnected
  }
}

function rowFingerprint(row: Row): string {
  const vals = Object.values(row.data).map(v => String(v ?? '')).join('|');
  return vals;
}

function sendBatch(rows: Row[]): void {
  if (rows.length === 0) return;

  try {
    chrome.runtime.sendMessage({
      type: 'EXTRACTION_BATCH',
      rows,
    } satisfies Message);
  } catch {
    // ignore
  }
}

function sendProgress(items: number, pages: number): void {
  const elapsed = Date.now() - ctx.startTime;
  const speed = items > 0 ? items / (elapsed / 1000) : 0;
  const maxItems = ctx.config?.maxItems || 0;
  const estimatedRemaining = maxItems > 0 && speed > 0
    ? ((maxItems - items) / speed) * 1000
    : 0;

  const progress: ExtractionProgress = {
    items,
    pages,
    elapsed,
    speed,
    errors: ctx.errors,
    estimatedRemaining,
  };

  try {
    chrome.runtime.sendMessage({
      type: 'EXTRACTION_PROGRESS',
      data: progress,
    } satisfies Message);
  } catch {
    // ignore
  }
}

function sendErrorMessage(error: string): void {
  ctx.errors++;
  try {
    chrome.runtime.sendMessage({
      type: 'EXTRACTION_ERROR',
      error,
      url: window.location.href,
    } satisfies Message);
  } catch {
    // ignore
  }
}

function estimateDataSize(rows: Row[]): number {
  try {
    return new Blob([JSON.stringify(rows)]).size;
  } catch {
    // Rough estimate: 100 bytes per field per row
    const avgFields = rows.length > 0 ? Object.keys(rows[0].data).length : 0;
    return rows.length * avgFields * 100;
  }
}

// ---------------------------------------------------------------------------
// PAUSE / RESUME / STOP
// ---------------------------------------------------------------------------

let resumeResolver: (() => void) | null = null;

function waitForResume(): Promise<void> {
  return new Promise(resolve => {
    resumeResolver = resolve;
  });
}

function handlePauseExtraction(sendResponse: (resp: unknown) => void): void {
  if (ctx.state === 'running') {
    ctx.state = 'paused';
    getScrollController().abort();
  }
  sendResponse({ type: 'PONG' });
}

function handleResumeExtraction(sendResponse: (resp: unknown) => void): void {
  if (ctx.state === 'paused') {
    ctx.state = 'running';
    if (resumeResolver) {
      resumeResolver();
      resumeResolver = null;
    }
  }
  sendResponse({ type: 'PONG' });
}

function handleStopExtraction(sendResponse: (resp: unknown) => void): void {
  ctx.state = 'idle';
  ctx.paginationIterator = null;

  getPaginationExecutor().abort();
  getScrollController().abort();

  if (resumeResolver) {
    resumeResolver();
    resumeResolver = null;
  }

  sendResponse({ type: 'PONG' });
}

// ---------------------------------------------------------------------------
// HIGHLIGHT_ELEMENTS / CLEAR_HIGHLIGHTS
// ---------------------------------------------------------------------------

function handleHighlightElements(selector: string, sendResponse: (resp: unknown) => void): void {
  injectStyles();
  const count = getHighlighter().highlightElements(selector);
  sendResponse({ type: 'PONG' });
}

function handleClearHighlights(sendResponse: (resp: unknown) => void): void {
  getHighlighter().clearAll();
  sendResponse({ type: 'PONG' });
}

// ---------------------------------------------------------------------------
// TEST_SELECTOR
// ---------------------------------------------------------------------------

function handleTestSelector(selector: string, sendResponse: (resp: unknown) => void): void {
  let matchCount = 0;
  const sampleValues: string[] = [];

  try {
    const elements = document.querySelectorAll(selector);
    matchCount = elements.length;

    const sampleCount = Math.min(5, elements.length);
    for (let i = 0; i < sampleCount; i++) {
      const text = (elements[i].textContent || '').trim().slice(0, 100);
      sampleValues.push(text);
    }
  } catch {
    // Invalid selector – return 0 matches
  }

  sendResponse({
    type: 'SELECTOR_TEST_RESULT',
    matchCount,
    sampleValues,
  } satisfies Message);
}

// ---------------------------------------------------------------------------
// ACTIVATE / DEACTIVATE SELECTION MODE
// ---------------------------------------------------------------------------

function handleActivateSelectionMode(tool: string, sendResponse: (resp: unknown) => void): void {
  injectStyles();
  getCursorController().activate(tool);
  sendResponse({ type: 'PONG' });
}

function handleDeactivateSelectionMode(sendResponse: (resp: unknown) => void): void {
  getCursorController().deactivate();
  sendResponse({ type: 'PONG' });
}

// ---------------------------------------------------------------------------
// DETECT_PAGINATION – Run PageSense to detect pagination patterns
// ---------------------------------------------------------------------------

async function handleDetectPagination(sendResponse: (resp: unknown) => void): Promise<void> {
  try {
    // Delegate to the full PageSense engine for comprehensive detection
    const configs = pageSenseDetect(document);

    sendResponse({
      type: 'PAGINATION_RESULT',
      configs,
    } satisfies Message);
  } catch (err) {
    sendResponse({
      type: 'EXTRACTION_ERROR',
      error: `Pagination detection failed: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}


// ---------------------------------------------------------------------------
// EXTRACT_EMAILS – Dedicated email extraction
// ---------------------------------------------------------------------------

async function handleExtractEmails(sendResponse: (resp: unknown) => void): Promise<void> {
  try {
    const emails = new Set<string>();
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;

    // Extract from page text
    const bodyText = document.body.textContent || '';
    const textMatches = bodyText.match(emailRegex);
    if (textMatches) {
      for (const email of textMatches) {
        emails.add(email.toLowerCase());
      }
    }

    // Extract from mailto links
    const mailtoLinks = document.querySelectorAll('a[href^="mailto:"]');
    for (let i = 0; i < mailtoLinks.length; i++) {
      const href = mailtoLinks[i].getAttribute('href');
      if (href) {
        const email = href.replace('mailto:', '').split('?')[0].trim().toLowerCase();
        if (emailRegex.test(email)) {
          emails.add(email);
        }
        // Reset regex lastIndex
        emailRegex.lastIndex = 0;
      }
    }

    // Extract from HTML source (catches obfuscated emails in attributes)
    const htmlSource = document.body.innerHTML;
    const htmlMatches = htmlSource.match(emailRegex);
    if (htmlMatches) {
      for (const email of htmlMatches) {
        emails.add(email.toLowerCase());
      }
    }

    // Build rows
    const rows: Row[] = Array.from(emails).map(email => ({
      id: generatePrefixedId('row'),
      data: { email },
      sourceUrl: window.location.href,
      extractedAt: Date.now(),
    }));

    sendResponse({
      type: 'EXTRACTION_BATCH',
      rows,
    } satisfies Message);
  } catch (err) {
    sendResponse({
      type: 'EXTRACTION_ERROR',
      error: `Email extraction failed: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}

// ---------------------------------------------------------------------------
// EXTRACT_IMAGES – Detect all images on the page
// ---------------------------------------------------------------------------

async function handleExtractImages(sendResponse: (resp: unknown) => void): Promise<void> {
  try {
    const images = new Map<string, { src: string; alt: string; width: number; height: number }>();
    const baseUrl = window.location.href;

    // Collect <img> elements
    const imgElements = document.querySelectorAll('img');
    for (let i = 0; i < imgElements.length; i++) {
      const img = imgElements[i] as HTMLImageElement;
      const src = img.src || img.getAttribute('data-src') || img.getAttribute('data-lazy-src') || '';
      if (!src || src.startsWith('data:image/svg') || src.includes('pixel') || src.includes('spacer')) continue;

      const resolvedSrc = resolveUrl(src, baseUrl);
      if (!images.has(resolvedSrc)) {
        images.set(resolvedSrc, {
          src: resolvedSrc,
          alt: img.alt || '',
          width: img.naturalWidth || img.width || 0,
          height: img.naturalHeight || img.height || 0,
        });
      }
    }

    // Collect background images
    const allElements = document.querySelectorAll('*');
    for (let i = 0; i < allElements.length; i++) {
      try {
        const style = getComputedStyle(allElements[i]);
        const bgImage = style.backgroundImage;
        if (bgImage && bgImage !== 'none') {
          const match = bgImage.match(/url\(["']?([^"')]+)["']?\)/);
          if (match && !match[1].startsWith('data:image/svg')) {
            const resolvedSrc = resolveUrl(match[1], baseUrl);
            if (!images.has(resolvedSrc)) {
              images.set(resolvedSrc, {
                src: resolvedSrc,
                alt: '',
                width: 0,
                height: 0,
              });
            }
          }
        }
      } catch {
        // ignore
      }
    }

    // Collect <source> elements within <picture>
    const sources = document.querySelectorAll('picture source[srcset]');
    for (let i = 0; i < sources.length; i++) {
      const srcset = sources[i].getAttribute('srcset') || '';
      const entries = srcset.split(',');
      for (const entry of entries) {
        const url = entry.trim().split(/\s+/)[0];
        if (url) {
          const resolvedSrc = resolveUrl(url, baseUrl);
          if (!images.has(resolvedSrc)) {
            images.set(resolvedSrc, {
              src: resolvedSrc,
              alt: '',
              width: 0,
              height: 0,
            });
          }
        }
      }
    }

    // Build rows
    const rows: Row[] = Array.from(images.values()).map(img => ({
      id: generatePrefixedId('row'),
      data: {
        src: img.src,
        alt: img.alt,
        width: img.width,
        height: img.height,
      },
      sourceUrl: window.location.href,
      extractedAt: Date.now(),
    }));

    sendResponse({
      type: 'EXTRACTION_BATCH',
      rows,
    } satisfies Message);
  } catch (err) {
    sendResponse({
      type: 'EXTRACTION_ERROR',
      error: `Image extraction failed: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}

function resolveUrl(url: string, baseUrl: string): string {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
  if (url.startsWith('//')) {
    try {
      return new URL(baseUrl).protocol + url;
    } catch {
      return 'https:' + url;
    }
  }
  try {
    return new URL(url, baseUrl).href;
  } catch {
    return url;
  }
}

// ---------------------------------------------------------------------------
// EXTRACT_TEXT – Extract all visible text from the page
// ---------------------------------------------------------------------------

async function handleExtractText(sendResponse: (resp: unknown) => void): Promise<void> {
  try {
    const walker = getDOMWalker();
    const textBlocks: { tag: string; text: string; depth: number }[] = [];

    walker.walk(document.body, (el: Element, depth: number) => {
      // Skip hidden elements
      if (!walker.isVisible(el)) return true;

      // Get direct text of this element
      let directText = '';
      for (let i = 0; i < el.childNodes.length; i++) {
        if (el.childNodes[i].nodeType === Node.TEXT_NODE) {
          directText += el.childNodes[i].textContent || '';
        }
      }
      directText = directText.trim();

      if (directText.length > 0) {
        textBlocks.push({
          tag: el.tagName.toLowerCase(),
          text: directText,
          depth,
        });
      }
      return true;
    });

    // Build rows: each significant text block becomes a row
    const rows: Row[] = textBlocks
      .filter(block => block.text.length > 0)
      .map(block => ({
        id: generatePrefixedId('row'),
        data: {
          tag: block.tag,
          text: block.text,
          depth: block.depth,
        },
        sourceUrl: window.location.href,
        extractedAt: Date.now(),
      }));

    sendResponse({
      type: 'EXTRACTION_BATCH',
      rows,
    } satisfies Message);
  } catch (err) {
    sendResponse({
      type: 'EXTRACTION_ERROR',
      error: `Text extraction failed: ${err instanceof Error ? err.message : String(err)}`,
    });
  }
}

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

// Register the message listener
chrome.runtime.onMessage.addListener(handleMessage);

// Inject styles eagerly so that highlights are ready when needed
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', injectStyles, { once: true });
} else {
  injectStyles();
}
