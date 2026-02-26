/**
 * NetworkMonitor — API interception via chrome.webRequest.
 *
 * Monitors XHR and fetch requests made by the active tab, detects
 * pagination patterns (sequential page params, offset/limit, cursor
 * tokens), and stores recent request patterns for the PageSense API
 * intercept mode.
 *
 * Manifest V3 compatible — uses chrome.webRequest.onBeforeRequest and
 * chrome.webRequest.onCompleted. State is ephemeral and stored in
 * chrome.storage.session to survive service-worker restarts.
 *
 * Note: chrome.webRequest in MV3 requires the "webRequest" permission
 * (read-only observation). Blocking/modification requires
 * declarativeNetRequest, which we do not need here.
 */

import type { PaginationConfig } from '../types/extraction';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CapturedRequest {
  id: string;
  url: string;
  method: string;
  tabId: number;
  timestamp: number;
  type: string;
  statusCode: number | null;
  parsedParams: Record<string, string>;
  responseSize: number | null;
}

export interface DetectedApiPattern {
  baseUrl: string;
  method: string;
  paginationType: 'page-number' | 'offset-limit' | 'cursor' | 'unknown';
  paramName: string;
  values: string[];
  confidence: number;
  suggestedConfig: Partial<PaginationConfig>;
}

interface RequestAccumulator {
  /** URL origin+pathname without query params, used as grouping key. */
  baseUrl: string;
  method: string;
  requests: CapturedRequest[];
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'df_network_monitor';
const MAX_REQUESTS_PER_GROUP = 50;
const MAX_GROUPS = 100;
const MAX_TOTAL_REQUESTS = 500;
const STALE_THRESHOLD_MS = 10 * 60 * 1000; // 10 minutes

/** Common pagination parameter names. */
const PAGE_PARAM_NAMES = new Set([
  'page', 'p', 'pg', 'pagenum', 'pagenumber', 'page_num', 'page_number',
]);

const OFFSET_PARAM_NAMES = new Set([
  'offset', 'start', 'skip', 'from', 'begin',
]);

const LIMIT_PARAM_NAMES = new Set([
  'limit', 'count', 'size', 'per_page', 'perpage', 'pagesize', 'page_size', 'num', 'length',
]);

const CURSOR_PARAM_NAMES = new Set([
  'cursor', 'after', 'before', 'next', 'next_cursor', 'nextcursor',
  'continuation', 'token', 'next_token', 'page_token', 'scroll_id',
]);

// ---------------------------------------------------------------------------
// NetworkMonitor
// ---------------------------------------------------------------------------

export class NetworkMonitor {
  /** Grouped request accumulators, keyed by baseUrl. */
  private groups: Map<string, RequestAccumulator> = new Map();

  /** Flat list of all captured requests for the monitored tab. */
  private allRequests: CapturedRequest[] = [];

  /** Tab ID currently being monitored (null = monitor all). */
  private monitoredTabId: number | null = null;

  /** Detected API patterns from analysis. */
  private detectedPatterns: DetectedApiPattern[] = [];

  /** Whether the monitor is actively listening. */
  private active = false;

  /** Listener references for cleanup. */
  private beforeRequestListener: ((
    details: chrome.webRequest.WebRequestBodyDetails,
  ) => void) | null = null;

  private completedListener: ((
    details: chrome.webRequest.WebResponseCacheDetails,
  ) => void) | null = null;

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  /** Restore state from storage after service worker restart. */
  async init(): Promise<void> {
    try {
      const stored = await chrome.storage.session.get(STORAGE_KEY);
      const state = stored[STORAGE_KEY] as {
        monitoredTabId?: number | null;
        allRequests?: CapturedRequest[];
        active?: boolean;
      } | undefined;

      if (state) {
        this.monitoredTabId = state.monitoredTabId ?? null;
        if (state.allRequests) {
          // Filter out stale requests
          const now = Date.now();
          this.allRequests = state.allRequests.filter(
            (r) => now - r.timestamp < STALE_THRESHOLD_MS,
          );
          this.rebuildGroups();
        }
        if (state.active) {
          this.startListening();
        }
      }
    } catch (err) {
      console.warn('[NetworkMonitor] Failed to restore state:', err);
    }
  }

  /** Start monitoring requests for a specific tab. */
  startMonitoring(tabId: number): void {
    this.monitoredTabId = tabId;
    this.clearRequests();
    this.startListening();
    this.persist();
  }

  /** Stop monitoring and clean up listeners. */
  stopMonitoring(): void {
    this.stopListening();
    this.monitoredTabId = null;
    this.persist();
  }

  /** Dispose the monitor entirely. */
  dispose(): void {
    this.stopListening();
    this.groups.clear();
    this.allRequests = [];
    this.detectedPatterns = [];
    this.monitoredTabId = null;
    this.active = false;
  }

  // -----------------------------------------------------------------------
  // Listener setup
  // -----------------------------------------------------------------------

  private startListening(): void {
    if (this.active) return;
    this.active = true;

    // We need to verify that chrome.webRequest is available (requires permission)
    if (typeof chrome.webRequest === 'undefined') {
      console.warn('[NetworkMonitor] chrome.webRequest not available. Ensure "webRequest" permission is declared.');
      this.active = false;
      return;
    }

    this.beforeRequestListener = (details) => {
      this.onBeforeRequest(details);
    };

    this.completedListener = (details) => {
      this.onRequestCompleted(details);
    };

    const filter: chrome.webRequest.RequestFilter = {
      urls: ['<all_urls>'],
      types: ['xmlhttprequest'],
    };

    chrome.webRequest.onBeforeRequest.addListener(
      this.beforeRequestListener,
      filter,
    );

    chrome.webRequest.onCompleted.addListener(
      this.completedListener,
      filter,
    );
  }

  private stopListening(): void {
    if (!this.active) return;
    this.active = false;

    if (this.beforeRequestListener) {
      try {
        chrome.webRequest.onBeforeRequest.removeListener(this.beforeRequestListener);
      } catch {
        // Listener may already be removed
      }
      this.beforeRequestListener = null;
    }

    if (this.completedListener) {
      try {
        chrome.webRequest.onCompleted.removeListener(this.completedListener);
      } catch {
        // Listener may already be removed
      }
      this.completedListener = null;
    }
  }

  // -----------------------------------------------------------------------
  // Request handlers
  // -----------------------------------------------------------------------

  private onBeforeRequest(details: chrome.webRequest.WebRequestBodyDetails): void {
    // Filter by monitored tab
    if (this.monitoredTabId !== null && details.tabId !== this.monitoredTabId) {
      return;
    }

    // Skip extension-internal requests
    if (details.tabId < 0) return;

    const url = details.url;

    // Skip data URIs, blob URIs, extension URIs
    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('chrome-extension:')) {
      return;
    }

    const parsed = this.parseUrl(url);
    if (!parsed) return;

    const request: CapturedRequest = {
      id: `${details.requestId}`,
      url,
      method: details.method,
      tabId: details.tabId,
      timestamp: details.timeStamp,
      type: details.type,
      statusCode: null,
      parsedParams: parsed.params,
      responseSize: null,
    };

    this.addRequest(request, parsed.baseUrl);
  }

  private onRequestCompleted(details: chrome.webRequest.WebResponseCacheDetails): void {
    if (this.monitoredTabId !== null && details.tabId !== this.monitoredTabId) {
      return;
    }

    // Update the corresponding request with status code and response size
    const requestId = `${details.requestId}`;
    const existing = this.allRequests.find((r) => r.id === requestId);
    if (existing) {
      existing.statusCode = details.statusCode;
      // Note: response body size is not directly available from webRequest in MV3.
      // We record what we can.
    }
  }

  // -----------------------------------------------------------------------
  // Request storage
  // -----------------------------------------------------------------------

  private addRequest(request: CapturedRequest, baseUrl: string): void {
    // Enforce total limit
    if (this.allRequests.length >= MAX_TOTAL_REQUESTS) {
      // Remove oldest requests
      const removed = this.allRequests.splice(0, 50);
      // Also clean up groups
      for (const r of removed) {
        const parsed = this.parseUrl(r.url);
        if (parsed) {
          const group = this.groups.get(parsed.baseUrl);
          if (group) {
            group.requests = group.requests.filter((gr) => gr.id !== r.id);
            if (group.requests.length === 0) {
              this.groups.delete(parsed.baseUrl);
            }
          }
        }
      }
    }

    this.allRequests.push(request);

    // Group by base URL
    let group = this.groups.get(baseUrl);
    if (!group) {
      // Enforce group limit
      if (this.groups.size >= MAX_GROUPS) {
        // Remove the oldest group
        const oldestKey = this.groups.keys().next().value;
        if (oldestKey !== undefined) {
          this.groups.delete(oldestKey);
        }
      }

      group = {
        baseUrl,
        method: request.method,
        requests: [],
      };
      this.groups.set(baseUrl, group);
    }

    // Enforce per-group limit
    if (group.requests.length >= MAX_REQUESTS_PER_GROUP) {
      group.requests.shift();
    }

    group.requests.push(request);
    this.persist();
  }

  private clearRequests(): void {
    this.allRequests = [];
    this.groups.clear();
    this.detectedPatterns = [];
  }

  private rebuildGroups(): void {
    this.groups.clear();
    for (const request of this.allRequests) {
      const parsed = this.parseUrl(request.url);
      if (!parsed) continue;

      let group = this.groups.get(parsed.baseUrl);
      if (!group) {
        group = {
          baseUrl: parsed.baseUrl,
          method: request.method,
          requests: [],
        };
        this.groups.set(parsed.baseUrl, group);
      }
      group.requests.push(request);
    }
  }

  // -----------------------------------------------------------------------
  // Pattern detection
  // -----------------------------------------------------------------------

  /**
   * Analyze captured requests and detect pagination patterns.
   * Returns detected patterns sorted by confidence (highest first).
   */
  analyzePatterns(): DetectedApiPattern[] {
    this.detectedPatterns = [];

    for (const group of this.groups.values()) {
      if (group.requests.length < 2) continue;

      const patterns = this.analyzeGroup(group);
      this.detectedPatterns.push(...patterns);
    }

    // Sort by confidence descending
    this.detectedPatterns.sort((a, b) => b.confidence - a.confidence);
    return this.detectedPatterns;
  }

  /** Get the most recently detected patterns without re-analyzing. */
  getDetectedPatterns(): DetectedApiPattern[] {
    return this.detectedPatterns;
  }

  /** Get all captured requests for the monitored tab. */
  getCapturedRequests(): CapturedRequest[] {
    return [...this.allRequests];
  }

  /** Get grouped requests. */
  getRequestGroups(): RequestAccumulator[] {
    return [...this.groups.values()];
  }

  // -----------------------------------------------------------------------
  // Group analysis
  // -----------------------------------------------------------------------

  private analyzeGroup(group: RequestAccumulator): DetectedApiPattern[] {
    const patterns: DetectedApiPattern[] = [];

    // Collect all parameter names and their values across requests
    const paramValues: Map<string, string[]> = new Map();

    for (const request of group.requests) {
      for (const [key, value] of Object.entries(request.parsedParams)) {
        const existing = paramValues.get(key) ?? [];
        existing.push(value);
        paramValues.set(key, existing);
      }
    }

    // Check for page number patterns
    for (const [param, values] of paramValues) {
      const lowerParam = param.toLowerCase();

      if (PAGE_PARAM_NAMES.has(lowerParam)) {
        const result = this.detectPageNumberPattern(group, param, values);
        if (result) patterns.push(result);
        continue;
      }

      if (OFFSET_PARAM_NAMES.has(lowerParam)) {
        const result = this.detectOffsetPattern(group, param, values, paramValues);
        if (result) patterns.push(result);
        continue;
      }

      if (CURSOR_PARAM_NAMES.has(lowerParam)) {
        const result = this.detectCursorPattern(group, param, values);
        if (result) patterns.push(result);
        continue;
      }

      // Heuristic: if all values are sequential integers, it might be a page param
      if (this.areSequentialIntegers(values) && values.length >= 2) {
        const result = this.detectPageNumberPattern(group, param, values);
        if (result) {
          result.confidence *= 0.6; // Lower confidence for unnamed params
          patterns.push(result);
        }
      }
    }

    return patterns;
  }

  private detectPageNumberPattern(
    group: RequestAccumulator,
    paramName: string,
    values: string[],
  ): DetectedApiPattern | null {
    const numericValues = values.map(Number).filter((n) => !isNaN(n));
    if (numericValues.length < 2) return null;

    // Check if values form a sequence (1,2,3... or 0,1,2...)
    const sorted = [...numericValues].sort((a, b) => a - b);
    let isSequential = true;
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] !== 1) {
        isSequential = false;
        break;
      }
    }

    const confidence = isSequential
      ? Math.min(0.95, 0.6 + (numericValues.length * 0.1))
      : 0.3;

    return {
      baseUrl: group.baseUrl,
      method: group.method,
      paginationType: 'page-number',
      paramName,
      values,
      confidence,
      suggestedConfig: {
        mode: 'api-intercept',
        apiEndpoint: group.baseUrl,
        apiPageParam: paramName,
        confidence,
      },
    };
  }

  private detectOffsetPattern(
    group: RequestAccumulator,
    paramName: string,
    values: string[],
    allParams: Map<string, string[]>,
  ): DetectedApiPattern | null {
    const numericValues = values.map(Number).filter((n) => !isNaN(n));
    if (numericValues.length < 2) return null;

    // Try to detect a consistent step size
    const sorted = [...numericValues].sort((a, b) => a - b);
    const steps = new Set<number>();
    for (let i = 1; i < sorted.length; i++) {
      steps.add(sorted[i] - sorted[i - 1]);
    }

    // Check if there is a matching limit parameter
    let detectedLimit: number | null = null;
    for (const [param, vals] of allParams) {
      if (LIMIT_PARAM_NAMES.has(param.toLowerCase())) {
        const limitValues = vals.map(Number).filter((n) => !isNaN(n));
        if (limitValues.length > 0) {
          // Most common limit value
          const counts = new Map<number, number>();
          for (const v of limitValues) {
            counts.set(v, (counts.get(v) ?? 0) + 1);
          }
          let maxCount = 0;
          for (const [val, count] of counts) {
            if (count > maxCount) {
              maxCount = count;
              detectedLimit = val;
            }
          }
        }
      }
    }

    // Consistent step matching a detected limit is high confidence
    const isConsistentStep = steps.size === 1;
    const stepMatchesLimit = detectedLimit !== null && steps.has(detectedLimit);

    let confidence = 0.4;
    if (isConsistentStep) confidence = 0.7;
    if (stepMatchesLimit) confidence = 0.9;

    confidence = Math.min(0.95, confidence + (numericValues.length * 0.05));

    return {
      baseUrl: group.baseUrl,
      method: group.method,
      paginationType: 'offset-limit',
      paramName,
      values,
      confidence,
      suggestedConfig: {
        mode: 'api-intercept',
        apiEndpoint: group.baseUrl,
        apiPageParam: paramName,
        confidence,
      },
    };
  }

  private detectCursorPattern(
    group: RequestAccumulator,
    paramName: string,
    values: string[],
  ): DetectedApiPattern | null {
    if (values.length < 2) return null;

    // Cursor tokens are typically non-numeric, long strings
    const nonNumericCount = values.filter((v) => isNaN(Number(v))).length;
    const avgLength = values.reduce((sum, v) => sum + v.length, 0) / values.length;

    // All unique values (cursors should not repeat for sequential pages)
    const uniqueValues = new Set(values);
    const allUnique = uniqueValues.size === values.length;

    let confidence = 0.4;
    if (nonNumericCount > values.length * 0.5) confidence += 0.2;
    if (avgLength > 10) confidence += 0.1;
    if (allUnique) confidence += 0.15;
    confidence = Math.min(0.9, confidence);

    return {
      baseUrl: group.baseUrl,
      method: group.method,
      paginationType: 'cursor',
      paramName,
      values,
      confidence,
      suggestedConfig: {
        mode: 'api-intercept',
        apiEndpoint: group.baseUrl,
        apiPageParam: paramName,
        confidence,
      },
    };
  }

  // -----------------------------------------------------------------------
  // URL parsing
  // -----------------------------------------------------------------------

  private parseUrl(url: string): { baseUrl: string; params: Record<string, string> } | null {
    try {
      const parsed = new URL(url);
      const baseUrl = `${parsed.origin}${parsed.pathname}`;
      const params: Record<string, string> = {};
      for (const [key, value] of parsed.searchParams) {
        params[key] = value;
      }
      return { baseUrl, params };
    } catch {
      return null;
    }
  }

  // -----------------------------------------------------------------------
  // Utility
  // -----------------------------------------------------------------------

  private areSequentialIntegers(values: string[]): boolean {
    const nums = values.map(Number).filter((n) => !isNaN(n) && Number.isInteger(n));
    if (nums.length < 2 || nums.length !== values.length) return false;

    const sorted = [...nums].sort((a, b) => a - b);
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] - sorted[i - 1] !== 1) return false;
    }
    return true;
  }

  /** Persist state to chrome.storage.session. */
  private persist(): void {
    const state = {
      monitoredTabId: this.monitoredTabId,
      allRequests: this.allRequests,
      active: this.active,
    };
    chrome.storage.session.set({ [STORAGE_KEY]: state }).catch((err) => {
      console.warn('[NetworkMonitor] Failed to persist state:', err);
    });
  }
}
