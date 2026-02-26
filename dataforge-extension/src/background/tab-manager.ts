/**
 * TabManager — Multi-tab extraction coordination.
 *
 * Opens new tabs for Page Extractor bulk mode, manages a configurable
 * concurrent tab limit (1–5), injects content scripts into new tabs,
 * and coordinates extraction across all managed tabs.
 *
 * Manifest V3 safe — stateless between service-worker restarts.
 * Active tab state is recovered by querying chrome.tabs on init.
 */

import type { ExtractionConfig, Row, ExtractionSummary } from '../types/extraction';
import type { Message } from '../types/messages';
import { generatePrefixedId } from '../utils/id';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TabState = 'pending' | 'loading' | 'ready' | 'extracting' | 'done' | 'error';

export interface ManagedTab {
  id: string;
  tabId: number | null;
  url: string;
  state: TabState;
  createdAt: number;
  error: string | null;
  rows: Row[];
}

export interface TabManagerConfig {
  concurrentTabs: number;
  delayBetweenTabsMs: number;
  contentScriptPath: string;
  timeoutMs: number;
}

interface TabTask {
  id: string;
  url: string;
  config: ExtractionConfig;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_CONFIG: TabManagerConfig = {
  concurrentTabs: 2,
  delayBetweenTabsMs: 1500,
  contentScriptPath: 'content/index.js',
  timeoutMs: 60_000,
};

const MIN_CONCURRENT = 1;
const MAX_CONCURRENT = 5;
const MIN_DELAY_MS = 500;
const STORAGE_KEY = 'df_tab_manager_state';

// ---------------------------------------------------------------------------
// TabManager
// ---------------------------------------------------------------------------

export class TabManager {
  private config: TabManagerConfig;
  private managedTabs: Map<string, ManagedTab> = new Map();
  private taskQueue: TabTask[] = [];
  private activeExtractions: Set<string> = new Set();
  private tabIdToManagedId: Map<number, string> = new Map();
  private broadcastFn: ((message: Message) => void) | null = null;
  private isProcessing = false;
  private disposed = false;

  // Timers tracked for cleanup
  private pendingTimers: Set<ReturnType<typeof setTimeout>> = new Set();

  constructor(config?: Partial<TabManagerConfig>) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.config.concurrentTabs = this.clampConcurrent(this.config.concurrentTabs);
    if (this.config.delayBetweenTabsMs < MIN_DELAY_MS) {
      this.config.delayBetweenTabsMs = MIN_DELAY_MS;
    }
  }

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  /** Restore state from storage after service worker restart. */
  async init(): Promise<void> {
    try {
      const stored = await chrome.storage.session.get(STORAGE_KEY);
      const state = stored[STORAGE_KEY] as {
        managedTabs?: ManagedTab[];
        taskQueue?: TabTask[];
      } | undefined;

      if (state?.managedTabs) {
        for (const tab of state.managedTabs) {
          // Verify the tab still exists
          if (tab.tabId !== null) {
            try {
              await chrome.tabs.get(tab.tabId);
              this.managedTabs.set(tab.id, tab);
              this.tabIdToManagedId.set(tab.tabId, tab.id);
              if (tab.state === 'extracting') {
                this.activeExtractions.add(tab.id);
              }
            } catch {
              // Tab no longer exists — mark as error
              tab.state = 'error';
              tab.error = 'Tab lost during service worker restart';
              tab.tabId = null;
              this.managedTabs.set(tab.id, tab);
            }
          }
        }
      }

      if (state?.taskQueue) {
        this.taskQueue = state.taskQueue;
      }

      // Resume processing if there are pending tasks
      if (this.taskQueue.length > 0) {
        this.processQueue();
      }
    } catch (err) {
      console.warn('[TabManager] Failed to restore state:', err);
    }

    // Listen for tab removal
    chrome.tabs.onRemoved.addListener(this.onTabRemoved);
    chrome.tabs.onUpdated.addListener(this.onTabUpdated);
  }

  /** Clean up all managed tabs and listeners. */
  dispose(): void {
    this.disposed = true;

    for (const timer of this.pendingTimers) {
      clearTimeout(timer);
    }
    this.pendingTimers.clear();

    chrome.tabs.onRemoved.removeListener(this.onTabRemoved);
    chrome.tabs.onUpdated.removeListener(this.onTabUpdated);

    this.managedTabs.clear();
    this.tabIdToManagedId.clear();
    this.taskQueue = [];
    this.activeExtractions.clear();
    this.persist();
  }

  /** Register a callback for broadcasting messages to the sidepanel. */
  onBroadcast(fn: (message: Message) => void): void {
    this.broadcastFn = fn;
  }

  // -----------------------------------------------------------------------
  // Configuration
  // -----------------------------------------------------------------------

  /** Update the concurrent tab limit (clamped to 1–5). */
  setConcurrentTabs(count: number): void {
    this.config.concurrentTabs = this.clampConcurrent(count);
    this.processQueue();
  }

  /** Update delay between tab opens in milliseconds. */
  setDelay(delayMs: number): void {
    this.config.delayBetweenTabsMs = Math.max(MIN_DELAY_MS, delayMs);
  }

  getConcurrentTabs(): number {
    return this.config.concurrentTabs;
  }

  // -----------------------------------------------------------------------
  // Bulk extraction
  // -----------------------------------------------------------------------

  /**
   * Enqueue a list of URLs for extraction.
   * Each URL will be opened in a new tab, have the content script injected,
   * and then extraction will be started with the provided config.
   *
   * Returns the batch ID for tracking.
   */
  enqueueBatch(urls: string[], config: ExtractionConfig): string {
    const batchId = generatePrefixedId('batch', 12);

    for (const url of urls) {
      const taskId = generatePrefixedId('task', 12);
      this.taskQueue.push({ id: taskId, url, config });
    }

    this.persist();
    this.processQueue();
    return batchId;
  }

  /**
   * Open a single tab, inject the content script, and start extraction.
   * Returns the managed tab ID.
   */
  async openAndExtract(url: string, config: ExtractionConfig): Promise<string> {
    const managedId = generatePrefixedId('mtab', 12);
    const managed: ManagedTab = {
      id: managedId,
      tabId: null,
      url,
      state: 'pending',
      createdAt: Date.now(),
      error: null,
      rows: [],
    };
    this.managedTabs.set(managedId, managed);

    try {
      managed.state = 'loading';
      this.persist();

      const tab = await chrome.tabs.create({ url, active: false });
      if (!tab.id) {
        throw new Error('Failed to create tab: no tab ID returned');
      }

      managed.tabId = tab.id;
      this.tabIdToManagedId.set(tab.id, managedId);
      this.persist();

      // Wait for the tab to complete loading
      await this.waitForTabLoad(tab.id);

      if (this.disposed) return managedId;

      // Inject content script
      managed.state = 'ready';
      this.persist();
      await this.injectContentScript(tab.id);

      // Small delay to let the content script initialize
      await this.delay(300);

      if (this.disposed) return managedId;

      // Start extraction
      managed.state = 'extracting';
      this.activeExtractions.add(managedId);
      this.persist();

      await chrome.tabs.sendMessage(tab.id, {
        type: 'START_EXTRACTION',
        config,
      } satisfies Message);

    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      managed.state = 'error';
      managed.error = msg;
      this.activeExtractions.delete(managedId);
      this.persist();
      this.broadcast({
        type: 'EXTRACTION_ERROR',
        error: `Tab extraction failed for ${url}: ${msg}`,
        url,
      });
    }

    return managedId;
  }

  // -----------------------------------------------------------------------
  // Event handlers (called by message-router or ExtractionManager)
  // -----------------------------------------------------------------------

  /** Handle extracted rows from a managed tab. */
  handleRows(tabId: number, rows: Row[]): void {
    const managed = this.getManagedByTabId(tabId);
    if (!managed) return;

    managed.rows.push(...rows);
    this.persist();
  }

  /** Handle extraction completion from a managed tab. */
  handleComplete(tabId: number): void {
    const managed = this.getManagedByTabId(tabId);
    if (!managed) return;

    managed.state = 'done';
    this.activeExtractions.delete(managed.id);
    this.persist();

    // Close the tab after a brief delay
    this.scheduleTimeout(() => {
      if (managed.tabId !== null) {
        chrome.tabs.remove(managed.tabId).catch(() => {
          // Tab may already be closed
        });
      }
      this.processQueue();
    }, 500);
  }

  /** Handle extraction error from a managed tab. */
  handleError(tabId: number, error: string): void {
    const managed = this.getManagedByTabId(tabId);
    if (!managed) return;

    managed.state = 'error';
    managed.error = error;
    this.activeExtractions.delete(managed.id);
    this.persist();
    this.processQueue();
  }

  // -----------------------------------------------------------------------
  // Queries
  // -----------------------------------------------------------------------

  getManagedTab(managedId: string): ManagedTab | undefined {
    return this.managedTabs.get(managedId);
  }

  getManagedByTabId(tabId: number): ManagedTab | undefined {
    const managedId = this.tabIdToManagedId.get(tabId);
    if (!managedId) return undefined;
    return this.managedTabs.get(managedId);
  }

  isManagedTab(tabId: number): boolean {
    return this.tabIdToManagedId.has(tabId);
  }

  getActiveCount(): number {
    return this.activeExtractions.size;
  }

  getQueueLength(): number {
    return this.taskQueue.length;
  }

  getAllManagedTabs(): ManagedTab[] {
    return [...this.managedTabs.values()];
  }

  // -----------------------------------------------------------------------
  // Tab lifecycle listeners (bound as arrow functions for safe removal)
  // -----------------------------------------------------------------------

  private onTabRemoved = (tabId: number): void => {
    const managedId = this.tabIdToManagedId.get(tabId);
    if (!managedId) return;

    const managed = this.managedTabs.get(managedId);
    if (!managed) return;

    this.tabIdToManagedId.delete(tabId);

    if (managed.state === 'extracting' || managed.state === 'loading' || managed.state === 'ready') {
      managed.state = 'error';
      managed.error = 'Tab was closed unexpectedly';
      managed.tabId = null;
      this.activeExtractions.delete(managedId);
      this.persist();
      this.broadcast({
        type: 'EXTRACTION_ERROR',
        error: `Managed tab closed during extraction: ${managed.url}`,
        url: managed.url,
      });
      this.processQueue();
    }
  };

  private onTabUpdated = (
    tabId: number,
    changeInfo: chrome.tabs.TabChangeInfo,
  ): void => {
    if (changeInfo.status !== 'complete') return;

    const managedId = this.tabIdToManagedId.get(tabId);
    if (!managedId) return;

    const managed = this.managedTabs.get(managedId);
    if (!managed) return;

    // If the tab finished loading and we have a pending load resolver,
    // the waitForTabLoad promise will resolve via its own listener.
    // This handler is for detecting unexpected navigations.
    if (managed.state === 'extracting') {
      // The page navigated while extraction was in progress.
      // This could be intentional (pagination) or accidental.
      // We let the content script handle this — if it is re-injected it
      // will detect whether extraction should continue.
    }
  };

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  /** Process the task queue, opening tabs up to the concurrency limit. */
  private processQueue(): void {
    if (this.disposed || this.isProcessing || this.taskQueue.length === 0) return;

    const available = this.config.concurrentTabs - this.activeExtractions.size;
    if (available <= 0) return;

    this.isProcessing = true;

    const tasksToRun = this.taskQueue.splice(0, available);
    this.persist();

    let chainDelay = 0;
    for (const task of tasksToRun) {
      this.scheduleTimeout(() => {
        if (!this.disposed) {
          this.openAndExtract(task.url, task.config).catch((err) => {
            console.error('[TabManager] Failed to open and extract:', err);
          });
        }
      }, chainDelay);
      chainDelay += this.config.delayBetweenTabsMs;
    }

    // Allow processing again after all tabs have been opened
    this.scheduleTimeout(() => {
      this.isProcessing = false;
      // Check if more tasks appeared while we were processing
      if (this.taskQueue.length > 0) {
        this.processQueue();
      }
    }, chainDelay);
  }

  /** Wait for a tab to finish loading. Times out after config.timeoutMs. */
  private waitForTabLoad(tabId: number): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      let settled = false;
      let timer: ReturnType<typeof setTimeout>;

      const listener = (
        updatedTabId: number,
        changeInfo: chrome.tabs.TabChangeInfo,
      ) => {
        if (updatedTabId !== tabId || changeInfo.status !== 'complete') return;
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        this.pendingTimers.delete(timer);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      };

      chrome.tabs.onUpdated.addListener(listener);

      // Check if already loaded
      chrome.tabs.get(tabId).then((tab) => {
        if (tab.status === 'complete' && !settled) {
          settled = true;
          chrome.tabs.onUpdated.removeListener(listener);
          clearTimeout(timer);
          this.pendingTimers.delete(timer);
          resolve();
        }
      }).catch((err) => {
        if (!settled) {
          settled = true;
          chrome.tabs.onUpdated.removeListener(listener);
          clearTimeout(timer);
          this.pendingTimers.delete(timer);
          reject(new Error(`Tab ${tabId} no longer exists: ${String(err)}`));
        }
      });

      timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          chrome.tabs.onUpdated.removeListener(listener);
          this.pendingTimers.delete(timer);
          reject(new Error(`Tab ${tabId} load timeout after ${this.config.timeoutMs}ms`));
        }
      }, this.config.timeoutMs);
      this.pendingTimers.add(timer);
    });
  }

  /** Inject the content script into a tab. */
  private async injectContentScript(tabId: number): Promise<void> {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: [this.config.contentScriptPath],
      });
    } catch (err) {
      throw new Error(
        `Failed to inject content script into tab ${tabId}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  /** Persist state to chrome.storage.session. */
  private persist(): void {
    const state = {
      managedTabs: [...this.managedTabs.values()],
      taskQueue: this.taskQueue,
    };
    chrome.storage.session.set({ [STORAGE_KEY]: state }).catch((err) => {
      console.warn('[TabManager] Failed to persist state:', err);
    });
  }

  /** Broadcast a message via the registered callback. */
  private broadcast(message: Message): void {
    if (this.broadcastFn) {
      try {
        this.broadcastFn(message);
      } catch (err) {
        console.warn('[TabManager] Broadcast failed:', err);
      }
    }
  }

  /** Create a delay promise with cleanup tracking. */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
      const timer = setTimeout(() => {
        this.pendingTimers.delete(timer);
        resolve();
      }, ms);
      this.pendingTimers.add(timer);
    });
  }

  /** Schedule a timeout with cleanup tracking. */
  private scheduleTimeout(fn: () => void, ms: number): void {
    const timer = setTimeout(() => {
      this.pendingTimers.delete(timer);
      fn();
    }, ms);
    this.pendingTimers.add(timer);
  }

  /** Clamp concurrent tab count to valid range. */
  private clampConcurrent(count: number): number {
    return Math.max(MIN_CONCURRENT, Math.min(MAX_CONCURRENT, Math.floor(count)));
  }
}
