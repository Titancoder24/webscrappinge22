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

  const STORAGE_KEY_JOBS = "df_extraction_jobs";
  const STORAGE_KEY_QUEUE = "df_extraction_queue";
  const MAX_CONCURRENT_JOBS = 1;
  class ExtractionManager {
    /** In-memory map of active jobs, rehydrated from storage on init. */
    jobs = /* @__PURE__ */ new Map();
    /** FIFO queue of jobs waiting to run. */
    queue = [];
    /** Callback invoked when state should be forwarded to the sidepanel. */
    broadcastFn = null;
    // -----------------------------------------------------------------------
    // Lifecycle
    // -----------------------------------------------------------------------
    /** Restore state from storage (call once on service-worker start). */
    async init() {
      try {
        const stored = await chrome.storage.session.get([STORAGE_KEY_JOBS, STORAGE_KEY_QUEUE]);
        const jobsArray = stored[STORAGE_KEY_JOBS] ?? [];
        const queueArray = stored[STORAGE_KEY_QUEUE] ?? [];
        for (const job of jobsArray) {
          if (job.status === "running") {
            job.status = "paused";
          }
          this.jobs.set(job.id, job);
        }
        this.queue = queueArray;
      } catch (err) {
        console.warn("[ExtractionManager] Failed to restore state from storage:", err);
      }
    }
    /** Register a broadcast callback so the manager can push updates. */
    onBroadcast(fn) {
      this.broadcastFn = fn;
    }
    // -----------------------------------------------------------------------
    // Job creation
    // -----------------------------------------------------------------------
    /** Create and enqueue a new extraction job. Returns the job id. */
    createJob(config, tabId, originUrl) {
      const id = generatePrefixedId("job", 16);
      const job = {
        id,
        config,
        status: "queued",
        tabId,
        originUrl,
        createdAt: Date.now(),
        startedAt: null,
        completedAt: null,
        progress: {
          items: 0,
          pages: 0,
          elapsed: 0,
          speed: 0,
          errors: 0,
          estimatedRemaining: 0
        },
        rows: [],
        error: null
      };
      this.jobs.set(id, job);
      this.queue.push({ id, config, tabId, originUrl });
      this.persist();
      this.processQueue();
      return id;
    }
    // -----------------------------------------------------------------------
    // Job control
    // -----------------------------------------------------------------------
    /** Start (or resume) the given job. Sends START_EXTRACTION to the tab. */
    async startJob(jobId) {
      const job = this.jobs.get(jobId);
      if (!job) {
        console.warn(`[ExtractionManager] Job ${jobId} not found`);
        return;
      }
      if (job.status !== "queued" && job.status !== "paused") {
        console.warn(`[ExtractionManager] Cannot start job in status "${job.status}"`);
        return;
      }
      job.status = "running";
      job.startedAt = job.startedAt ?? Date.now();
      this.persist();
      try {
        await this.sendToTab(job.tabId, {
          type: "START_EXTRACTION",
          config: job.config
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`[ExtractionManager] Failed to send START_EXTRACTION to tab ${job.tabId}:`, msg);
        job.status = "failed";
        job.error = `Failed to communicate with tab: ${msg}`;
        job.completedAt = Date.now();
        this.persist();
        this.broadcast({ type: "EXTRACTION_ERROR", error: job.error });
        this.processQueue();
      }
    }
    /** Pause a running job. */
    async pauseJob(jobId) {
      const job = this.jobs.get(jobId);
      if (!job || job.status !== "running") return;
      job.status = "paused";
      this.persist();
      try {
        await this.sendToTab(job.tabId, { type: "PAUSE_EXTRACTION" });
      } catch {
      }
      this.broadcast({ type: "EXTRACTION_PROGRESS", data: job.progress });
    }
    /** Resume a paused job. */
    async resumeJob(jobId) {
      const job = this.jobs.get(jobId);
      if (!job || job.status !== "paused") return;
      job.status = "running";
      this.persist();
      try {
        await this.sendToTab(job.tabId, { type: "RESUME_EXTRACTION" });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        job.status = "failed";
        job.error = `Tab lost during pause: ${msg}`;
        job.completedAt = Date.now();
        this.persist();
        this.broadcast({ type: "EXTRACTION_ERROR", error: job.error });
        this.processQueue();
      }
    }
    /** Stop a running or paused job. */
    async stopJob(jobId) {
      const job = this.jobs.get(jobId);
      if (!job) return;
      if (job.status !== "running" && job.status !== "paused" && job.status !== "queued") return;
      const wasRunning = job.status === "running";
      job.status = "stopped";
      job.completedAt = Date.now();
      this.persist();
      this.queue = this.queue.filter((q) => q.id !== jobId);
      if (wasRunning) {
        try {
          await this.sendToTab(job.tabId, { type: "STOP_EXTRACTION" });
        } catch {
        }
      }
      this.broadcastSummary(job);
      this.processQueue();
    }
    // -----------------------------------------------------------------------
    // Event handlers (called by message-router)
    // -----------------------------------------------------------------------
    /** Handle a progress update from a content script. */
    handleProgress(tabId, data) {
      const job = this.findRunningJobForTab(tabId);
      if (!job) return;
      job.progress = data;
      this.persist();
      this.broadcast({ type: "EXTRACTION_PROGRESS", data });
    }
    /** Handle a single extracted row from a content script. */
    handleRow(tabId, row) {
      const job = this.findRunningJobForTab(tabId);
      if (!job) return;
      job.rows.push(row);
      job.progress.items = job.rows.length;
      this.persist();
      this.broadcast({ type: "EXTRACTION_ROW", row });
    }
    /** Handle a batch of extracted rows. */
    handleBatch(tabId, rows) {
      const job = this.findRunningJobForTab(tabId);
      if (!job) return;
      job.rows.push(...rows);
      job.progress.items = job.rows.length;
      this.persist();
      this.broadcast({ type: "EXTRACTION_BATCH", rows });
    }
    /** Handle extraction completion from a content script. */
    handleComplete(tabId, summary) {
      const job = this.findRunningJobForTab(tabId);
      if (!job) return;
      job.status = "completed";
      job.completedAt = Date.now();
      this.persist();
      this.broadcast({ type: "EXTRACTION_COMPLETE", summary });
      this.archiveJob(job);
      this.processQueue();
    }
    /** Handle extraction error from a content script. */
    handleError(tabId, error, url) {
      const job = this.findRunningJobForTab(tabId);
      if (!job) return;
      job.progress.errors += 1;
      if (job.progress.errors >= 5) {
        job.status = "failed";
        job.error = error;
        job.completedAt = Date.now();
        this.processQueue();
      }
      this.persist();
      this.broadcast({ type: "EXTRACTION_ERROR", error, url });
    }
    // -----------------------------------------------------------------------
    // Tab lifecycle
    // -----------------------------------------------------------------------
    /** Called when a tab is closed. Cleans up any job running on that tab. */
    handleTabClosed(tabId) {
      for (const job of this.jobs.values()) {
        if (job.tabId === tabId && (job.status === "running" || job.status === "paused")) {
          job.status = "failed";
          job.error = "Tab was closed during extraction";
          job.completedAt = Date.now();
          this.broadcast({ type: "EXTRACTION_ERROR", error: job.error });
        }
      }
      this.persist();
      this.processQueue();
    }
    /** Called when a tab navigates away. Pauses any running job on that tab. */
    handleTabNavigated(tabId) {
      for (const job of this.jobs.values()) {
        if (job.tabId === tabId && job.status === "running") {
          const navModes = /* @__PURE__ */ new Set(["url-pattern", "manual-urls"]);
          if (!navModes.has(job.config.pagination.mode)) {
            job.status = "paused";
            this.broadcast({ type: "EXTRACTION_PROGRESS", data: job.progress });
          }
        }
      }
      this.persist();
    }
    // -----------------------------------------------------------------------
    // Queries
    // -----------------------------------------------------------------------
    getJob(jobId) {
      return this.jobs.get(jobId);
    }
    getRunningJobs() {
      return [...this.jobs.values()].filter((j) => j.status === "running");
    }
    getAllJobs() {
      return [...this.jobs.values()];
    }
    getJobForTab(tabId) {
      return this.findRunningJobForTab(tabId) ?? this.findJobForTab(tabId);
    }
    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------
    findRunningJobForTab(tabId) {
      for (const job of this.jobs.values()) {
        if (job.tabId === tabId && (job.status === "running" || job.status === "paused")) {
          return job;
        }
      }
      return void 0;
    }
    findJobForTab(tabId) {
      let latest;
      for (const job of this.jobs.values()) {
        if (job.tabId === tabId) {
          if (!latest || job.createdAt > latest.createdAt) {
            latest = job;
          }
        }
      }
      return latest;
    }
    /** Try to dequeue and start the next job if capacity permits. */
    processQueue() {
      const runningCount = this.getRunningJobs().length;
      if (runningCount >= MAX_CONCURRENT_JOBS || this.queue.length === 0) return;
      const next = this.queue.shift();
      if (!next) return;
      const job = this.jobs.get(next.id);
      if (!job || job.status !== "queued") {
        this.processQueue();
        return;
      }
      this.startJob(next.id).catch((err) => {
        console.error("[ExtractionManager] processQueue startJob failed:", err);
      });
    }
    /** Persist current state to chrome.storage.session. */
    persist() {
      const jobsArray = [...this.jobs.values()];
      chrome.storage.session.set({
        [STORAGE_KEY_JOBS]: jobsArray,
        [STORAGE_KEY_QUEUE]: this.queue
      }).catch((err) => {
        console.warn("[ExtractionManager] Failed to persist state:", err);
      });
    }
    /** Archive a completed job into chrome.storage.local for history. */
    archiveJob(job) {
      const archiveEntry = {
        id: job.id,
        originUrl: job.originUrl,
        status: job.status,
        totalItems: job.rows.length,
        createdAt: job.createdAt,
        completedAt: job.completedAt
      };
      chrome.storage.local.get("df_job_history").then((result) => {
        const history = result["df_job_history"] ?? [];
        history.unshift(archiveEntry);
        if (history.length > 100) history.length = 100;
        return chrome.storage.local.set({ df_job_history: history });
      }).catch((err) => {
        console.warn("[ExtractionManager] Failed to archive job:", err);
      });
    }
    /** Send a message to a tab, swallowing errors if the tab no longer exists. */
    async sendToTab(tabId, message) {
      try {
        await chrome.tabs.sendMessage(tabId, message);
      } catch (err) {
        throw err;
      }
    }
    /** Broadcast a message to the sidepanel via the registered callback. */
    broadcast(message) {
      if (this.broadcastFn) {
        try {
          this.broadcastFn(message);
        } catch (err) {
          console.warn("[ExtractionManager] Broadcast failed:", err);
        }
      }
    }
    /** Build and broadcast a summary for a completed/stopped job. */
    broadcastSummary(job) {
      const elapsed = (job.completedAt ?? Date.now()) - (job.startedAt ?? job.createdAt);
      const summary = {
        totalItems: job.rows.length,
        totalPages: job.progress.pages,
        totalTime: elapsed,
        avgSpeed: elapsed > 0 ? job.rows.length / (elapsed / 1e3) : 0,
        errors: job.progress.errors,
        dataSize: JSON.stringify(job.rows).length
      };
      this.broadcast({ type: "EXTRACTION_COMPLETE", summary });
    }
  }

  const DEFAULT_CONFIG = {
    concurrentTabs: 2,
    delayBetweenTabsMs: 1500,
    contentScriptPath: "content/index.js",
    timeoutMs: 6e4
  };
  const MIN_CONCURRENT = 1;
  const MAX_CONCURRENT = 5;
  const MIN_DELAY_MS = 500;
  const STORAGE_KEY$1 = "df_tab_manager_state";
  class TabManager {
    config;
    managedTabs = /* @__PURE__ */ new Map();
    taskQueue = [];
    activeExtractions = /* @__PURE__ */ new Set();
    tabIdToManagedId = /* @__PURE__ */ new Map();
    broadcastFn = null;
    isProcessing = false;
    disposed = false;
    // Timers tracked for cleanup
    pendingTimers = /* @__PURE__ */ new Set();
    constructor(config) {
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
    async init() {
      try {
        const stored = await chrome.storage.session.get(STORAGE_KEY$1);
        const state = stored[STORAGE_KEY$1];
        if (state?.managedTabs) {
          for (const tab of state.managedTabs) {
            if (tab.tabId !== null) {
              try {
                await chrome.tabs.get(tab.tabId);
                this.managedTabs.set(tab.id, tab);
                this.tabIdToManagedId.set(tab.tabId, tab.id);
                if (tab.state === "extracting") {
                  this.activeExtractions.add(tab.id);
                }
              } catch {
                tab.state = "error";
                tab.error = "Tab lost during service worker restart";
                tab.tabId = null;
                this.managedTabs.set(tab.id, tab);
              }
            }
          }
        }
        if (state?.taskQueue) {
          this.taskQueue = state.taskQueue;
        }
        if (this.taskQueue.length > 0) {
          this.processQueue();
        }
      } catch (err) {
        console.warn("[TabManager] Failed to restore state:", err);
      }
      chrome.tabs.onRemoved.addListener(this.onTabRemoved);
      chrome.tabs.onUpdated.addListener(this.onTabUpdated);
    }
    /** Clean up all managed tabs and listeners. */
    dispose() {
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
    onBroadcast(fn) {
      this.broadcastFn = fn;
    }
    // -----------------------------------------------------------------------
    // Configuration
    // -----------------------------------------------------------------------
    /** Update the concurrent tab limit (clamped to 1–5). */
    setConcurrentTabs(count) {
      this.config.concurrentTabs = this.clampConcurrent(count);
      this.processQueue();
    }
    /** Update delay between tab opens in milliseconds. */
    setDelay(delayMs) {
      this.config.delayBetweenTabsMs = Math.max(MIN_DELAY_MS, delayMs);
    }
    getConcurrentTabs() {
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
    enqueueBatch(urls, config) {
      const batchId = generatePrefixedId("batch", 12);
      for (const url of urls) {
        const taskId = generatePrefixedId("task", 12);
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
    async openAndExtract(url, config) {
      const managedId = generatePrefixedId("mtab", 12);
      const managed = {
        id: managedId,
        tabId: null,
        url,
        state: "pending",
        createdAt: Date.now(),
        error: null,
        rows: []
      };
      this.managedTabs.set(managedId, managed);
      try {
        managed.state = "loading";
        this.persist();
        const tab = await chrome.tabs.create({ url, active: false });
        if (!tab.id) {
          throw new Error("Failed to create tab: no tab ID returned");
        }
        managed.tabId = tab.id;
        this.tabIdToManagedId.set(tab.id, managedId);
        this.persist();
        await this.waitForTabLoad(tab.id);
        if (this.disposed) return managedId;
        managed.state = "ready";
        this.persist();
        await this.injectContentScript(tab.id);
        await this.delay(300);
        if (this.disposed) return managedId;
        managed.state = "extracting";
        this.activeExtractions.add(managedId);
        this.persist();
        await chrome.tabs.sendMessage(tab.id, {
          type: "START_EXTRACTION",
          config
        });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        managed.state = "error";
        managed.error = msg;
        this.activeExtractions.delete(managedId);
        this.persist();
        this.broadcast({
          type: "EXTRACTION_ERROR",
          error: `Tab extraction failed for ${url}: ${msg}`,
          url
        });
      }
      return managedId;
    }
    // -----------------------------------------------------------------------
    // Event handlers (called by message-router or ExtractionManager)
    // -----------------------------------------------------------------------
    /** Handle extracted rows from a managed tab. */
    handleRows(tabId, rows) {
      const managed = this.getManagedByTabId(tabId);
      if (!managed) return;
      managed.rows.push(...rows);
      this.persist();
    }
    /** Handle extraction completion from a managed tab. */
    handleComplete(tabId) {
      const managed = this.getManagedByTabId(tabId);
      if (!managed) return;
      managed.state = "done";
      this.activeExtractions.delete(managed.id);
      this.persist();
      this.scheduleTimeout(() => {
        if (managed.tabId !== null) {
          chrome.tabs.remove(managed.tabId).catch(() => {
          });
        }
        this.processQueue();
      }, 500);
    }
    /** Handle extraction error from a managed tab. */
    handleError(tabId, error) {
      const managed = this.getManagedByTabId(tabId);
      if (!managed) return;
      managed.state = "error";
      managed.error = error;
      this.activeExtractions.delete(managed.id);
      this.persist();
      this.processQueue();
    }
    // -----------------------------------------------------------------------
    // Queries
    // -----------------------------------------------------------------------
    getManagedTab(managedId) {
      return this.managedTabs.get(managedId);
    }
    getManagedByTabId(tabId) {
      const managedId = this.tabIdToManagedId.get(tabId);
      if (!managedId) return void 0;
      return this.managedTabs.get(managedId);
    }
    isManagedTab(tabId) {
      return this.tabIdToManagedId.has(tabId);
    }
    getActiveCount() {
      return this.activeExtractions.size;
    }
    getQueueLength() {
      return this.taskQueue.length;
    }
    getAllManagedTabs() {
      return [...this.managedTabs.values()];
    }
    // -----------------------------------------------------------------------
    // Tab lifecycle listeners (bound as arrow functions for safe removal)
    // -----------------------------------------------------------------------
    onTabRemoved = (tabId) => {
      const managedId = this.tabIdToManagedId.get(tabId);
      if (!managedId) return;
      const managed = this.managedTabs.get(managedId);
      if (!managed) return;
      this.tabIdToManagedId.delete(tabId);
      if (managed.state === "extracting" || managed.state === "loading" || managed.state === "ready") {
        managed.state = "error";
        managed.error = "Tab was closed unexpectedly";
        managed.tabId = null;
        this.activeExtractions.delete(managedId);
        this.persist();
        this.broadcast({
          type: "EXTRACTION_ERROR",
          error: `Managed tab closed during extraction: ${managed.url}`,
          url: managed.url
        });
        this.processQueue();
      }
    };
    onTabUpdated = (tabId, changeInfo) => {
      if (changeInfo.status !== "complete") return;
      const managedId = this.tabIdToManagedId.get(tabId);
      if (!managedId) return;
      const managed = this.managedTabs.get(managedId);
      if (!managed) return;
      if (managed.state === "extracting") ;
    };
    // -----------------------------------------------------------------------
    // Private helpers
    // -----------------------------------------------------------------------
    /** Process the task queue, opening tabs up to the concurrency limit. */
    processQueue() {
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
              console.error("[TabManager] Failed to open and extract:", err);
            });
          }
        }, chainDelay);
        chainDelay += this.config.delayBetweenTabsMs;
      }
      this.scheduleTimeout(() => {
        this.isProcessing = false;
        if (this.taskQueue.length > 0) {
          this.processQueue();
        }
      }, chainDelay);
    }
    /** Wait for a tab to finish loading. Times out after config.timeoutMs. */
    waitForTabLoad(tabId) {
      return new Promise((resolve, reject) => {
        let settled = false;
        let timer;
        const listener = (updatedTabId, changeInfo) => {
          if (updatedTabId !== tabId || changeInfo.status !== "complete") return;
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          this.pendingTimers.delete(timer);
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        };
        chrome.tabs.onUpdated.addListener(listener);
        chrome.tabs.get(tabId).then((tab) => {
          if (tab.status === "complete" && !settled) {
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
    async injectContentScript(tabId) {
      try {
        await chrome.scripting.executeScript({
          target: { tabId },
          files: [this.config.contentScriptPath]
        });
      } catch (err) {
        throw new Error(
          `Failed to inject content script into tab ${tabId}: ${err instanceof Error ? err.message : String(err)}`
        );
      }
    }
    /** Persist state to chrome.storage.session. */
    persist() {
      const state = {
        managedTabs: [...this.managedTabs.values()],
        taskQueue: this.taskQueue
      };
      chrome.storage.session.set({ [STORAGE_KEY$1]: state }).catch((err) => {
        console.warn("[TabManager] Failed to persist state:", err);
      });
    }
    /** Broadcast a message via the registered callback. */
    broadcast(message) {
      if (this.broadcastFn) {
        try {
          this.broadcastFn(message);
        } catch (err) {
          console.warn("[TabManager] Broadcast failed:", err);
        }
      }
    }
    /** Create a delay promise with cleanup tracking. */
    delay(ms) {
      return new Promise((resolve) => {
        const timer = setTimeout(() => {
          this.pendingTimers.delete(timer);
          resolve();
        }, ms);
        this.pendingTimers.add(timer);
      });
    }
    /** Schedule a timeout with cleanup tracking. */
    scheduleTimeout(fn, ms) {
      const timer = setTimeout(() => {
        this.pendingTimers.delete(timer);
        fn();
      }, ms);
      this.pendingTimers.add(timer);
    }
    /** Clamp concurrent tab count to valid range. */
    clampConcurrent(count) {
      return Math.max(MIN_CONCURRENT, Math.min(MAX_CONCURRENT, Math.floor(count)));
    }
  }

  const STORAGE_KEY = "df_network_monitor";
  const MAX_REQUESTS_PER_GROUP = 50;
  const MAX_GROUPS = 100;
  const MAX_TOTAL_REQUESTS = 500;
  const STALE_THRESHOLD_MS = 10 * 60 * 1e3;
  const PAGE_PARAM_NAMES = /* @__PURE__ */ new Set([
    "page",
    "p",
    "pg",
    "pagenum",
    "pagenumber",
    "page_num",
    "page_number"
  ]);
  const OFFSET_PARAM_NAMES = /* @__PURE__ */ new Set([
    "offset",
    "start",
    "skip",
    "from",
    "begin"
  ]);
  const LIMIT_PARAM_NAMES = /* @__PURE__ */ new Set([
    "limit",
    "count",
    "size",
    "per_page",
    "perpage",
    "pagesize",
    "page_size",
    "num",
    "length"
  ]);
  const CURSOR_PARAM_NAMES = /* @__PURE__ */ new Set([
    "cursor",
    "after",
    "before",
    "next",
    "next_cursor",
    "nextcursor",
    "continuation",
    "token",
    "next_token",
    "page_token",
    "scroll_id"
  ]);
  class NetworkMonitor {
    /** Grouped request accumulators, keyed by baseUrl. */
    groups = /* @__PURE__ */ new Map();
    /** Flat list of all captured requests for the monitored tab. */
    allRequests = [];
    /** Tab ID currently being monitored (null = monitor all). */
    monitoredTabId = null;
    /** Detected API patterns from analysis. */
    detectedPatterns = [];
    /** Whether the monitor is actively listening. */
    active = false;
    /** Listener references for cleanup. */
    beforeRequestListener = null;
    completedListener = null;
    // -----------------------------------------------------------------------
    // Lifecycle
    // -----------------------------------------------------------------------
    /** Restore state from storage after service worker restart. */
    async init() {
      try {
        const stored = await chrome.storage.session.get(STORAGE_KEY);
        const state = stored[STORAGE_KEY];
        if (state) {
          this.monitoredTabId = state.monitoredTabId ?? null;
          if (state.allRequests) {
            const now = Date.now();
            this.allRequests = state.allRequests.filter(
              (r) => now - r.timestamp < STALE_THRESHOLD_MS
            );
            this.rebuildGroups();
          }
          if (state.active) {
            this.startListening();
          }
        }
      } catch (err) {
        console.warn("[NetworkMonitor] Failed to restore state:", err);
      }
    }
    /** Start monitoring requests for a specific tab. */
    startMonitoring(tabId) {
      this.monitoredTabId = tabId;
      this.clearRequests();
      this.startListening();
      this.persist();
    }
    /** Stop monitoring and clean up listeners. */
    stopMonitoring() {
      this.stopListening();
      this.monitoredTabId = null;
      this.persist();
    }
    /** Dispose the monitor entirely. */
    dispose() {
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
    startListening() {
      if (this.active) return;
      this.active = true;
      if (typeof chrome.webRequest === "undefined") {
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
      const filter = {
        urls: ["<all_urls>"],
        types: ["xmlhttprequest"]
      };
      chrome.webRequest.onBeforeRequest.addListener(
        this.beforeRequestListener,
        filter
      );
      chrome.webRequest.onCompleted.addListener(
        this.completedListener,
        filter
      );
    }
    stopListening() {
      if (!this.active) return;
      this.active = false;
      if (this.beforeRequestListener) {
        try {
          chrome.webRequest.onBeforeRequest.removeListener(this.beforeRequestListener);
        } catch {
        }
        this.beforeRequestListener = null;
      }
      if (this.completedListener) {
        try {
          chrome.webRequest.onCompleted.removeListener(this.completedListener);
        } catch {
        }
        this.completedListener = null;
      }
    }
    // -----------------------------------------------------------------------
    // Request handlers
    // -----------------------------------------------------------------------
    onBeforeRequest(details) {
      if (this.monitoredTabId !== null && details.tabId !== this.monitoredTabId) {
        return;
      }
      if (details.tabId < 0) return;
      const url = details.url;
      if (url.startsWith("data:") || url.startsWith("blob:") || url.startsWith("chrome-extension:")) {
        return;
      }
      const parsed = this.parseUrl(url);
      if (!parsed) return;
      const request = {
        id: `${details.requestId}`,
        url,
        method: details.method,
        tabId: details.tabId,
        timestamp: details.timeStamp,
        type: details.type,
        statusCode: null,
        parsedParams: parsed.params,
        responseSize: null
      };
      this.addRequest(request, parsed.baseUrl);
    }
    onRequestCompleted(details) {
      if (this.monitoredTabId !== null && details.tabId !== this.monitoredTabId) {
        return;
      }
      const requestId = `${details.requestId}`;
      const existing = this.allRequests.find((r) => r.id === requestId);
      if (existing) {
        existing.statusCode = details.statusCode;
      }
    }
    // -----------------------------------------------------------------------
    // Request storage
    // -----------------------------------------------------------------------
    addRequest(request, baseUrl) {
      if (this.allRequests.length >= MAX_TOTAL_REQUESTS) {
        const removed = this.allRequests.splice(0, 50);
        for (const r of removed) {
          const parsed = this.parseUrl(r.url);
          if (parsed) {
            const group2 = this.groups.get(parsed.baseUrl);
            if (group2) {
              group2.requests = group2.requests.filter((gr) => gr.id !== r.id);
              if (group2.requests.length === 0) {
                this.groups.delete(parsed.baseUrl);
              }
            }
          }
        }
      }
      this.allRequests.push(request);
      let group = this.groups.get(baseUrl);
      if (!group) {
        if (this.groups.size >= MAX_GROUPS) {
          const oldestKey = this.groups.keys().next().value;
          if (oldestKey !== void 0) {
            this.groups.delete(oldestKey);
          }
        }
        group = {
          baseUrl,
          method: request.method,
          requests: []
        };
        this.groups.set(baseUrl, group);
      }
      if (group.requests.length >= MAX_REQUESTS_PER_GROUP) {
        group.requests.shift();
      }
      group.requests.push(request);
      this.persist();
    }
    clearRequests() {
      this.allRequests = [];
      this.groups.clear();
      this.detectedPatterns = [];
    }
    rebuildGroups() {
      this.groups.clear();
      for (const request of this.allRequests) {
        const parsed = this.parseUrl(request.url);
        if (!parsed) continue;
        let group = this.groups.get(parsed.baseUrl);
        if (!group) {
          group = {
            baseUrl: parsed.baseUrl,
            method: request.method,
            requests: []
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
    analyzePatterns() {
      this.detectedPatterns = [];
      for (const group of this.groups.values()) {
        if (group.requests.length < 2) continue;
        const patterns = this.analyzeGroup(group);
        this.detectedPatterns.push(...patterns);
      }
      this.detectedPatterns.sort((a, b) => b.confidence - a.confidence);
      return this.detectedPatterns;
    }
    /** Get the most recently detected patterns without re-analyzing. */
    getDetectedPatterns() {
      return this.detectedPatterns;
    }
    /** Get all captured requests for the monitored tab. */
    getCapturedRequests() {
      return [...this.allRequests];
    }
    /** Get grouped requests. */
    getRequestGroups() {
      return [...this.groups.values()];
    }
    // -----------------------------------------------------------------------
    // Group analysis
    // -----------------------------------------------------------------------
    analyzeGroup(group) {
      const patterns = [];
      const paramValues = /* @__PURE__ */ new Map();
      for (const request of group.requests) {
        for (const [key, value] of Object.entries(request.parsedParams)) {
          const existing = paramValues.get(key) ?? [];
          existing.push(value);
          paramValues.set(key, existing);
        }
      }
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
        if (this.areSequentialIntegers(values) && values.length >= 2) {
          const result = this.detectPageNumberPattern(group, param, values);
          if (result) {
            result.confidence *= 0.6;
            patterns.push(result);
          }
        }
      }
      return patterns;
    }
    detectPageNumberPattern(group, paramName, values) {
      const numericValues = values.map(Number).filter((n) => !isNaN(n));
      if (numericValues.length < 2) return null;
      const sorted = [...numericValues].sort((a, b) => a - b);
      let isSequential = true;
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] - sorted[i - 1] !== 1) {
          isSequential = false;
          break;
        }
      }
      const confidence = isSequential ? Math.min(0.95, 0.6 + numericValues.length * 0.1) : 0.3;
      return {
        baseUrl: group.baseUrl,
        method: group.method,
        paginationType: "page-number",
        paramName,
        values,
        confidence,
        suggestedConfig: {
          mode: "api-intercept",
          apiEndpoint: group.baseUrl,
          apiPageParam: paramName,
          confidence
        }
      };
    }
    detectOffsetPattern(group, paramName, values, allParams) {
      const numericValues = values.map(Number).filter((n) => !isNaN(n));
      if (numericValues.length < 2) return null;
      const sorted = [...numericValues].sort((a, b) => a - b);
      const steps = /* @__PURE__ */ new Set();
      for (let i = 1; i < sorted.length; i++) {
        steps.add(sorted[i] - sorted[i - 1]);
      }
      let detectedLimit = null;
      for (const [param, vals] of allParams) {
        if (LIMIT_PARAM_NAMES.has(param.toLowerCase())) {
          const limitValues = vals.map(Number).filter((n) => !isNaN(n));
          if (limitValues.length > 0) {
            const counts = /* @__PURE__ */ new Map();
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
      const isConsistentStep = steps.size === 1;
      const stepMatchesLimit = detectedLimit !== null && steps.has(detectedLimit);
      let confidence = 0.4;
      if (isConsistentStep) confidence = 0.7;
      if (stepMatchesLimit) confidence = 0.9;
      confidence = Math.min(0.95, confidence + numericValues.length * 0.05);
      return {
        baseUrl: group.baseUrl,
        method: group.method,
        paginationType: "offset-limit",
        paramName,
        values,
        confidence,
        suggestedConfig: {
          mode: "api-intercept",
          apiEndpoint: group.baseUrl,
          apiPageParam: paramName,
          confidence
        }
      };
    }
    detectCursorPattern(group, paramName, values) {
      if (values.length < 2) return null;
      const nonNumericCount = values.filter((v) => isNaN(Number(v))).length;
      const avgLength = values.reduce((sum, v) => sum + v.length, 0) / values.length;
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
        paginationType: "cursor",
        paramName,
        values,
        confidence,
        suggestedConfig: {
          mode: "api-intercept",
          apiEndpoint: group.baseUrl,
          apiPageParam: paramName,
          confidence
        }
      };
    }
    // -----------------------------------------------------------------------
    // URL parsing
    // -----------------------------------------------------------------------
    parseUrl(url) {
      try {
        const parsed = new URL(url);
        const baseUrl = `${parsed.origin}${parsed.pathname}`;
        const params = {};
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
    areSequentialIntegers(values) {
      const nums = values.map(Number).filter((n) => !isNaN(n) && Number.isInteger(n));
      if (nums.length < 2 || nums.length !== values.length) return false;
      const sorted = [...nums].sort((a, b) => a - b);
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] - sorted[i - 1] !== 1) return false;
      }
      return true;
    }
    /** Persist state to chrome.storage.session. */
    persist() {
      const state = {
        monitoredTabId: this.monitoredTabId,
        allRequests: this.allRequests,
        active: this.active
      };
      chrome.storage.session.set({ [STORAGE_KEY]: state }).catch((err) => {
        console.warn("[NetworkMonitor] Failed to persist state:", err);
      });
    }
  }

  const ALARM_PREFIX = "df_schedule_";
  const STORAGE_KEY_SCHEDULES = "df_schedules";
  const STORAGE_KEY_HISTORY = "df_schedule_history";
  const MIN_INTERVAL_MINUTES = 1;
  const MAX_HISTORY_ENTRIES = 500;
  const MAX_CONSECUTIVE_FAILURES = 5;
  let schedules = /* @__PURE__ */ new Map();
  let extractionTrigger = null;
  let initialized = false;
  async function initScheduler() {
    if (initialized) return;
    initialized = true;
    try {
      const stored = await chrome.storage.local.get(STORAGE_KEY_SCHEDULES);
      const configs = stored[STORAGE_KEY_SCHEDULES] ?? [];
      for (const config of configs) {
        schedules.set(config.id, config);
      }
    } catch (err) {
      console.warn("[Scheduler] Failed to restore schedules from storage:", err);
    }
    chrome.alarms.onAlarm.addListener(onAlarmFired);
    await reconcileAlarms();
  }
  function onExtractionTrigger(fn) {
    extractionTrigger = fn;
  }
  function onBroadcast(fn) {
  }
  async function scheduleExtraction(config, intervalMinutes, url, name) {
    const id = generatePrefixedId("sched", 12);
    const clampedInterval = Math.max(MIN_INTERVAL_MINUTES, Math.round(intervalMinutes));
    const now = Date.now();
    const schedule = {
      id,
      name: `Schedule ${id}`,
      extractionConfig: config,
      url,
      intervalMinutes: clampedInterval,
      enabled: true,
      createdAt: now,
      updatedAt: now,
      lastRunAt: null,
      nextRunAt: now + clampedInterval * 6e4,
      runCount: 0,
      consecutiveFailures: 0,
      maxConsecutiveFailures: MAX_CONSECUTIVE_FAILURES
    };
    schedules.set(id, schedule);
    await persistSchedules();
    await createAlarmForSchedule(schedule);
    return id;
  }
  async function onAlarmFired(alarm) {
    if (!alarm.name.startsWith(ALARM_PREFIX)) return;
    const scheduleId = alarm.name.slice(ALARM_PREFIX.length);
    const schedule = schedules.get(scheduleId);
    if (!schedule) {
      try {
        await chrome.alarms.clear(alarm.name);
      } catch {
      }
      return;
    }
    if (!schedule.enabled) {
      return;
    }
    if (schedule.consecutiveFailures >= schedule.maxConsecutiveFailures) {
      console.warn(
        `[Scheduler] Schedule ${scheduleId} disabled after ${schedule.consecutiveFailures} consecutive failures.`
      );
      schedule.enabled = false;
      schedule.updatedAt = Date.now();
      schedule.nextRunAt = null;
      try {
        await chrome.alarms.clear(alarm.name);
      } catch {
      }
      await persistSchedules();
      await addHistoryEntry({
        scheduleId,
        runAt: Date.now(),
        completedAt: Date.now(),
        status: "skipped",
        itemsExtracted: 0,
        error: `Auto-disabled after ${schedule.maxConsecutiveFailures} consecutive failures`
      });
      return;
    }
    const runAt = Date.now();
    if (!extractionTrigger) {
      console.warn("[Scheduler] No extraction trigger registered — skipping alarm");
      await addHistoryEntry({
        scheduleId,
        runAt,
        completedAt: Date.now(),
        status: "skipped",
        itemsExtracted: 0,
        error: "No extraction trigger registered"
      });
      return;
    }
    try {
      const started = await extractionTrigger(
        schedule.extractionConfig,
        schedule.url,
        scheduleId
      );
      if (started) {
        schedule.lastRunAt = runAt;
        schedule.runCount += 1;
        schedule.consecutiveFailures = 0;
        schedule.nextRunAt = runAt + schedule.intervalMinutes * 6e4;
        schedule.updatedAt = Date.now();
        await persistSchedules();
        await addHistoryEntry({
          scheduleId,
          runAt,
          completedAt: null,
          // Will be updated when extraction completes
          status: "success",
          itemsExtracted: 0,
          error: null
        });
      } else {
        schedule.consecutiveFailures += 1;
        schedule.updatedAt = Date.now();
        await persistSchedules();
        await addHistoryEntry({
          scheduleId,
          runAt,
          completedAt: Date.now(),
          status: "skipped",
          itemsExtracted: 0,
          error: "Browser unavailable or extraction could not be started"
        });
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`[Scheduler] Extraction trigger failed for schedule ${scheduleId}:`, errorMsg);
      schedule.consecutiveFailures += 1;
      schedule.updatedAt = Date.now();
      await persistSchedules();
      await addHistoryEntry({
        scheduleId,
        runAt,
        completedAt: Date.now(),
        status: "failure",
        itemsExtracted: 0,
        error: errorMsg
      });
    }
  }
  function alarmName(scheduleId) {
    return `${ALARM_PREFIX}${scheduleId}`;
  }
  async function createAlarmForSchedule(schedule) {
    const name = alarmName(schedule.id);
    try {
      chrome.alarms.create(name, {
        delayInMinutes: schedule.intervalMinutes,
        periodInMinutes: schedule.intervalMinutes
      });
      schedule.nextRunAt = Date.now() + schedule.intervalMinutes * 6e4;
    } catch (err) {
      console.error(`[Scheduler] Failed to create alarm for schedule ${schedule.id}:`, err);
      throw err;
    }
  }
  async function reconcileAlarms() {
    try {
      const alarms = await chrome.alarms.getAll();
      const alarmMap = /* @__PURE__ */ new Map();
      for (const alarm of alarms) {
        if (alarm.name.startsWith(ALARM_PREFIX)) {
          alarmMap.set(alarm.name, alarm);
        }
      }
      for (const schedule of schedules.values()) {
        const name = alarmName(schedule.id);
        if (schedule.enabled && !alarmMap.has(name)) {
          await createAlarmForSchedule(schedule);
        }
        alarmMap.delete(name);
      }
      for (const orphanName of alarmMap.keys()) {
        try {
          await chrome.alarms.clear(orphanName);
        } catch {
        }
      }
    } catch (err) {
      console.warn("[Scheduler] Failed to reconcile alarms:", err);
    }
  }
  async function persistSchedules() {
    try {
      const configArray = [...schedules.values()];
      await chrome.storage.local.set({ [STORAGE_KEY_SCHEDULES]: configArray });
    } catch (err) {
      console.warn("[Scheduler] Failed to persist schedules:", err);
    }
  }
  async function addHistoryEntry(entry) {
    try {
      const stored = await chrome.storage.local.get(STORAGE_KEY_HISTORY);
      const history = stored[STORAGE_KEY_HISTORY] ?? [];
      history.unshift(entry);
      if (history.length > MAX_HISTORY_ENTRIES) {
        history.length = MAX_HISTORY_ENTRIES;
      }
      await chrome.storage.local.set({ [STORAGE_KEY_HISTORY]: history });
    } catch (err) {
      console.warn("[Scheduler] Failed to add history entry:", err);
    }
  }

  let deps = null;
  let listenerRegistered = false;
  function initMessageRouter(dependencies) {
    deps = dependencies;
    if (listenerRegistered) return;
    listenerRegistered = true;
    chrome.runtime.onMessage.addListener(
      (rawMessage, sender, sendResponse) => {
        if (!isValidMessage(rawMessage)) {
          return void 0;
        }
        const message = rawMessage;
        const ctx = { message, sender, sendResponse };
        const isAsync = routeMessage(ctx);
        return isAsync ? true : void 0;
      }
    );
  }
  function isValidMessage(raw) {
    return typeof raw === "object" && raw !== null && "type" in raw && typeof raw.type === "string";
  }
  function routeMessage(ctx) {
    const { message, sender } = ctx;
    switch (message.type) {
      case "SCAN_PAGE":
        return handleScanPage(ctx);
      case "SCAN_RESULT":
        return handleScanResult(ctx);
      case "SELECT_PATTERN":
        return forwardToActiveTab(ctx);
      case "SELECTION_CONFIRMED":
        return broadcastToRuntime(ctx);
      case "START_EXTRACTION":
        return handleStartExtraction(ctx);
      case "PAUSE_EXTRACTION":
        return handlePauseExtraction();
      case "RESUME_EXTRACTION":
        return handleResumeExtraction();
      case "STOP_EXTRACTION":
        return handleStopExtraction();
      case "EXTRACTION_PROGRESS":
        return handleExtractionProgress(ctx);
      case "EXTRACTION_ROW":
        return handleExtractionRow(ctx);
      case "EXTRACTION_BATCH":
        return handleExtractionBatch(ctx);
      case "EXTRACTION_COMPLETE":
        return handleExtractionComplete(ctx);
      case "EXTRACTION_ERROR":
        return handleExtractionError(ctx);
      case "HIGHLIGHT_ELEMENTS":
      case "CLEAR_HIGHLIGHTS":
      case "TEST_SELECTOR":
      case "ACTIVATE_SELECTION_MODE":
      case "DEACTIVATE_SELECTION_MODE":
      case "DETECT_PAGINATION":
      case "EXTRACT_EMAILS":
      case "EXTRACT_IMAGES":
      case "EXTRACT_TEXT":
        return forwardToActiveTab(ctx);
      case "SELECTOR_TEST_RESULT":
      case "PAGINATION_RESULT":
      case "ELEMENT_CLICKED":
        return broadcastToRuntime(ctx);
      case "NAVIGATE_URL":
        return handleNavigateUrl(ctx);
      case "WEBHOOK_PUSH":
        return handleWebhookPush(ctx);
      case "SCHEDULE_EXTRACTION":
        return handleScheduleExtraction(ctx);
      case "PING":
        ctx.sendResponse({ type: "PONG" });
        return false;
      case "PONG":
        return false;
      default: {
        console.warn("[MessageRouter] Unhandled message type:", message.type);
        return false;
      }
    }
  }
  function handleScanPage(ctx) {
    getActiveTabId().then((tabId) => {
      if (tabId === null) {
        ctx.sendResponse({ type: "SCAN_RESULT", patterns: [] });
        return;
      }
      return chrome.tabs.sendMessage(tabId, ctx.message);
    }).then((response) => {
      if (response) {
        ctx.sendResponse(response);
      }
    }).catch((err) => {
      console.error("[MessageRouter] SCAN_PAGE forward failed:", err);
      ctx.sendResponse({ type: "SCAN_RESULT", patterns: [] });
    });
    return true;
  }
  function handleScanResult(ctx) {
    broadcastToRuntime(ctx);
    return false;
  }
  function handleStartExtraction(ctx) {
    if (!deps) return false;
    const { config } = ctx.message;
    getActiveTabId().then(async (tabId) => {
      if (tabId === null) {
        ctx.sendResponse({ success: false, error: "No active tab" });
        return;
      }
      const tab = await chrome.tabs.get(tabId);
      const url = tab.url ?? "unknown";
      const jobId = deps.extractionManager.createJob(config, tabId, url);
      ctx.sendResponse({ success: true, jobId });
    }).catch((err) => {
      console.error("[MessageRouter] START_EXTRACTION failed:", err);
      ctx.sendResponse({
        success: false,
        error: err instanceof Error ? err.message : String(err)
      });
    });
    return true;
  }
  function handlePauseExtraction(ctx) {
    if (!deps) return false;
    const runningJobs = deps.extractionManager.getRunningJobs();
    for (const job of runningJobs) {
      deps.extractionManager.pauseJob(job.id).catch((err) => {
        console.error("[MessageRouter] Failed to pause job:", err);
      });
    }
    return false;
  }
  function handleResumeExtraction(ctx) {
    if (!deps) return false;
    const allJobs = deps.extractionManager.getAllJobs();
    for (const job of allJobs) {
      if (job.status === "paused") {
        deps.extractionManager.resumeJob(job.id).catch((err) => {
          console.error("[MessageRouter] Failed to resume job:", err);
        });
      }
    }
    return false;
  }
  function handleStopExtraction(ctx) {
    if (!deps) return false;
    const allJobs = deps.extractionManager.getAllJobs();
    for (const job of allJobs) {
      if (job.status === "running" || job.status === "paused" || job.status === "queued") {
        deps.extractionManager.stopJob(job.id).catch((err) => {
          console.error("[MessageRouter] Failed to stop job:", err);
        });
      }
    }
    return false;
  }
  function handleExtractionProgress(ctx) {
    if (!deps) return false;
    const tabId = ctx.sender.tab?.id;
    if (tabId === void 0) return false;
    const { data } = ctx.message;
    deps.extractionManager.handleProgress(tabId, data);
    if (deps.tabManager.isManagedTab(tabId)) ;
    return false;
  }
  function handleExtractionRow(ctx) {
    if (!deps) return false;
    const tabId = ctx.sender.tab?.id;
    if (tabId === void 0) return false;
    const { row } = ctx.message;
    deps.extractionManager.handleRow(tabId, row);
    if (deps.tabManager.isManagedTab(tabId)) {
      deps.tabManager.handleRows(tabId, [row]);
    }
    return false;
  }
  function handleExtractionBatch(ctx) {
    if (!deps) return false;
    const tabId = ctx.sender.tab?.id;
    if (tabId === void 0) return false;
    const { rows } = ctx.message;
    deps.extractionManager.handleBatch(tabId, rows);
    if (deps.tabManager.isManagedTab(tabId)) {
      deps.tabManager.handleRows(tabId, rows);
    }
    return false;
  }
  function handleExtractionComplete(ctx) {
    if (!deps) return false;
    const tabId = ctx.sender.tab?.id;
    if (tabId === void 0) return false;
    const { summary } = ctx.message;
    deps.extractionManager.handleComplete(tabId, summary);
    if (deps.tabManager.isManagedTab(tabId)) {
      deps.tabManager.handleComplete(tabId);
    }
    return false;
  }
  function handleExtractionError(ctx) {
    if (!deps) return false;
    const tabId = ctx.sender.tab?.id;
    if (tabId === void 0) return false;
    const { error, url } = ctx.message;
    deps.extractionManager.handleError(tabId, error, url);
    if (deps.tabManager.isManagedTab(tabId)) {
      deps.tabManager.handleError(tabId, error);
    }
    return false;
  }
  function handleNavigateUrl(ctx) {
    const { url } = ctx.message;
    try {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        ctx.sendResponse({ success: false, error: "Only http and https URLs are supported" });
        return true;
      }
    } catch {
      ctx.sendResponse({ success: false, error: "Invalid URL" });
      return true;
    }
    chrome.tabs.create({ url, active: true }).then((tab) => {
      ctx.sendResponse({ success: true, tabId: tab.id });
    }).catch((err) => {
      console.error("[MessageRouter] NAVIGATE_URL failed:", err);
      ctx.sendResponse({
        success: false,
        error: err instanceof Error ? err.message : String(err)
      });
    });
    return true;
  }
  function handleWebhookPush(ctx) {
    const { data, url, headers } = ctx.message;
    try {
      const parsed = new URL(url);
      if (!["http:", "https:"].includes(parsed.protocol)) {
        ctx.sendResponse({ success: false, error: "Only http and https webhook URLs are supported" });
        return true;
      }
    } catch {
      ctx.sendResponse({ success: false, error: "Invalid webhook URL" });
      return true;
    }
    fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...headers
      },
      body: JSON.stringify({ rows: data, timestamp: Date.now() })
    }).then(async (response) => {
      if (!response.ok) {
        const text = await response.text().catch(() => "");
        ctx.sendResponse({
          success: false,
          error: `Webhook returned ${response.status}: ${text.slice(0, 200)}`
        });
      } else {
        ctx.sendResponse({ success: true, status: response.status });
      }
    }).catch((err) => {
      console.error("[MessageRouter] WEBHOOK_PUSH failed:", err);
      ctx.sendResponse({
        success: false,
        error: err instanceof Error ? err.message : String(err)
      });
    });
    return true;
  }
  function handleScheduleExtraction(ctx) {
    const { config, interval } = ctx.message;
    getActiveTabId().then(async (tabId) => {
      let url = "unknown";
      if (tabId !== null) {
        try {
          const tab = await chrome.tabs.get(tabId);
          url = tab.url ?? "unknown";
        } catch {
        }
      }
      const scheduleId = await scheduleExtraction(config, interval, url);
      ctx.sendResponse({ success: true, scheduleId });
    }).catch((err) => {
      console.error("[MessageRouter] SCHEDULE_EXTRACTION failed:", err);
      ctx.sendResponse({
        success: false,
        error: err instanceof Error ? err.message : String(err)
      });
    });
    return true;
  }
  function forwardToActiveTab(ctx) {
    getActiveTabId().then((tabId) => {
      if (tabId === null) {
        ctx.sendResponse({ error: "No active tab found" });
        return;
      }
      return chrome.tabs.sendMessage(tabId, ctx.message);
    }).then((response) => {
      if (response !== void 0) {
        ctx.sendResponse(response);
      }
    }).catch((err) => {
      console.error(`[MessageRouter] Forward to active tab failed for ${ctx.message.type}:`, err);
      ctx.sendResponse({ error: err instanceof Error ? err.message : String(err) });
    });
    return true;
  }
  function broadcastToRuntime(ctx) {
    chrome.runtime.sendMessage(ctx.message).catch(() => {
    });
    return false;
  }
  async function getActiveTabId() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      return tab?.id ?? null;
    } catch {
      return null;
    }
  }
  function broadcastMessage(message) {
    chrome.runtime.sendMessage(message).catch(() => {
    });
  }

  const EXTENSION_NAME = "DataForge";
  const WELCOME_URL = "https://dataforge.dev/welcome";
  const UPDATE_URL = "https://dataforge.dev/changelog";
  const extractionManager = new ExtractionManager();
  const tabManager = new TabManager();
  const networkMonitor = new NetworkMonitor();
  try {
    chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
  } catch (err) {
    console.warn(`[${EXTENSION_NAME}] Failed to set side panel behavior:`, err);
  }
  chrome.runtime.onInstalled.addListener((details) => {
    switch (details.reason) {
      case "install":
        handleFirstInstall();
        break;
      case "update":
        handleUpdate(details.previousVersion);
        break;
    }
  });
  function handleFirstInstall() {
    console.log(`[${EXTENSION_NAME}] First install — initializing defaults.`);
    chrome.storage.local.set({
      df_installed_at: Date.now(),
      df_version: chrome.runtime.getManifest().version
    }).catch((err) => {
      console.warn(`[${EXTENSION_NAME}] Failed to save install metadata:`, err);
    });
    chrome.tabs.create({ url: WELCOME_URL }).catch((err) => {
      console.warn(`[${EXTENSION_NAME}] Failed to open welcome page:`, err);
    });
  }
  function handleUpdate(previousVersion) {
    const currentVersion = chrome.runtime.getManifest().version;
    console.log(
      `[${EXTENSION_NAME}] Updated from ${previousVersion ?? "unknown"} to ${currentVersion}.`
    );
    chrome.storage.local.set({
      df_version: currentVersion,
      df_updated_at: Date.now(),
      df_previous_version: previousVersion ?? null
    }).catch((err) => {
      console.warn(`[${EXTENSION_NAME}] Failed to save update metadata:`, err);
    });
    chrome.storage.local.get("df_settings").then((result) => {
      const settings = result["df_settings"];
      const notificationsEnabled = settings?.general?.notificationsEnabled ?? true;
      if (notificationsEnabled && previousVersion !== currentVersion) {
        chrome.notifications.create(`df_update_${currentVersion}`, {
          type: "basic",
          iconUrl: chrome.runtime.getURL("icons/icon128.png"),
          title: `${EXTENSION_NAME} Updated`,
          message: `Updated to v${currentVersion}. Click to see what's new.`,
          priority: 1
        }).catch(() => {
        });
      }
    }).catch(() => {
    });
  }
  chrome.notifications.onClicked.addListener((notificationId) => {
    if (notificationId.startsWith("df_update_")) {
      chrome.tabs.create({ url: UPDATE_URL }).catch(() => {
      });
      chrome.notifications.clear(notificationId).catch(() => {
      });
    }
  });
  chrome.action.onClicked.addListener(async (tab) => {
    try {
      if (chrome.sidePanel?.open) {
        await chrome.sidePanel.open({ tabId: tab.id });
      }
    } catch (err) {
      console.warn(`[${EXTENSION_NAME}] Failed to open side panel on action click:`, err);
    }
  });
  chrome.tabs.onRemoved.addListener((tabId) => {
    extractionManager.handleTabClosed(tabId);
  });
  chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
    if (changeInfo.status === "loading" && changeInfo.url) {
      extractionManager.handleTabNavigated(tabId);
    }
  });
  async function initializeSubsystems() {
    try {
      extractionManager.onBroadcast(broadcastMessage);
      tabManager.onBroadcast(broadcastMessage);
      onBroadcast(broadcastMessage);
      await Promise.all([
        extractionManager.init(),
        tabManager.init(),
        networkMonitor.init(),
        initScheduler()
      ]);
      initMessageRouter({
        extractionManager,
        networkMonitor,
        tabManager
      });
      onExtractionTrigger(async (config, url, _scheduleId) => {
        try {
          const tab = await chrome.tabs.create({ url, active: false });
          if (!tab.id) {
            return false;
          }
          await waitForTabComplete(tab.id);
          await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content/index.js"]
          });
          await delay(500);
          extractionManager.createJob(config, tab.id, url);
          return true;
        } catch (err) {
          console.error(`[${EXTENSION_NAME}] Scheduled extraction trigger failed:`, err);
          return false;
        }
      });
      console.log(`[${EXTENSION_NAME}] All subsystems initialized successfully.`);
    } catch (err) {
      console.error(`[${EXTENSION_NAME}] Subsystem initialization failed:`, err);
    }
  }
  function waitForTabComplete(tabId, timeoutMs = 3e4) {
    return new Promise((resolve, reject) => {
      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          chrome.tabs.onUpdated.removeListener(listener);
          reject(new Error(`Tab ${tabId} load timeout after ${timeoutMs}ms`));
        }
      }, timeoutMs);
      const listener = (updatedTabId, changeInfo) => {
        if (updatedTabId === tabId && changeInfo.status === "complete" && !settled) {
          settled = true;
          clearTimeout(timer);
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      };
      chrome.tabs.onUpdated.addListener(listener);
      chrome.tabs.get(tabId).then((tab) => {
        if (tab.status === "complete" && !settled) {
          settled = true;
          clearTimeout(timer);
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      }).catch((err) => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          chrome.tabs.onUpdated.removeListener(listener);
          reject(err);
        }
      });
    });
  }
  function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  initializeSubsystems();

})();
