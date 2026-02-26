/**
 * ExtractionManager — Job queue and execution coordinator.
 *
 * Manages the full lifecycle of extraction jobs: create, start, pause,
 * resume, stop. Coordinates multi-tab extraction via TabManager and
 * persists job state to chrome.storage so that the service worker can
 * be restarted without losing context.
 *
 * Manifest V3 safe — all state that must survive termination is kept
 * in chrome.storage.session (ephemeral) or chrome.storage.local
 * (persistent).
 */

import type {
  ExtractionConfig,
  ExtractionProgress,
  ExtractionSummary,
  ExtractionStatus,
  Row,
} from '../types/extraction';
import type { Message } from '../types/messages';
import { generatePrefixedId } from '../utils/id';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type JobStatus = 'queued' | 'running' | 'paused' | 'completed' | 'failed' | 'stopped';

export interface ExtractionJob {
  id: string;
  config: ExtractionConfig;
  status: JobStatus;
  tabId: number;
  originUrl: string;
  createdAt: number;
  startedAt: number | null;
  completedAt: number | null;
  progress: ExtractionProgress;
  rows: Row[];
  error: string | null;
}

interface JobQueueEntry {
  id: string;
  config: ExtractionConfig;
  tabId: number;
  originUrl: string;
}

const STORAGE_KEY_JOBS = 'df_extraction_jobs';
const STORAGE_KEY_QUEUE = 'df_extraction_queue';
const MAX_CONCURRENT_JOBS = 1; // Sequential by default; TabManager handles tab-level parallelism

// ---------------------------------------------------------------------------
// ExtractionManager
// ---------------------------------------------------------------------------

export class ExtractionManager {
  /** In-memory map of active jobs, rehydrated from storage on init. */
  private jobs: Map<string, ExtractionJob> = new Map();

  /** FIFO queue of jobs waiting to run. */
  private queue: JobQueueEntry[] = [];

  /** Callback invoked when state should be forwarded to the sidepanel. */
  private broadcastFn: ((message: Message) => void) | null = null;

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  /** Restore state from storage (call once on service-worker start). */
  async init(): Promise<void> {
    try {
      const stored = await chrome.storage.session.get([STORAGE_KEY_JOBS, STORAGE_KEY_QUEUE]);
      const jobsArray: ExtractionJob[] = stored[STORAGE_KEY_JOBS] ?? [];
      const queueArray: JobQueueEntry[] = stored[STORAGE_KEY_QUEUE] ?? [];

      for (const job of jobsArray) {
        // If the service worker was killed mid-extraction, mark running jobs as paused
        if (job.status === 'running') {
          job.status = 'paused';
        }
        this.jobs.set(job.id, job);
      }

      this.queue = queueArray;
    } catch (err) {
      console.warn('[ExtractionManager] Failed to restore state from storage:', err);
    }
  }

  /** Register a broadcast callback so the manager can push updates. */
  onBroadcast(fn: (message: Message) => void): void {
    this.broadcastFn = fn;
  }

  // -----------------------------------------------------------------------
  // Job creation
  // -----------------------------------------------------------------------

  /** Create and enqueue a new extraction job. Returns the job id. */
  createJob(config: ExtractionConfig, tabId: number, originUrl: string): string {
    const id = generatePrefixedId('job', 16);

    const job: ExtractionJob = {
      id,
      config,
      status: 'queued',
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
        estimatedRemaining: 0,
      },
      rows: [],
      error: null,
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
  async startJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) {
      console.warn(`[ExtractionManager] Job ${jobId} not found`);
      return;
    }

    if (job.status !== 'queued' && job.status !== 'paused') {
      console.warn(`[ExtractionManager] Cannot start job in status "${job.status}"`);
      return;
    }

    job.status = 'running';
    job.startedAt = job.startedAt ?? Date.now();
    this.persist();

    try {
      await this.sendToTab(job.tabId, {
        type: 'START_EXTRACTION',
        config: job.config,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`[ExtractionManager] Failed to send START_EXTRACTION to tab ${job.tabId}:`, msg);
      job.status = 'failed';
      job.error = `Failed to communicate with tab: ${msg}`;
      job.completedAt = Date.now();
      this.persist();
      this.broadcast({ type: 'EXTRACTION_ERROR', error: job.error });
      this.processQueue();
    }
  }

  /** Pause a running job. */
  async pauseJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'running') return;

    job.status = 'paused';
    this.persist();

    try {
      await this.sendToTab(job.tabId, { type: 'PAUSE_EXTRACTION' });
    } catch {
      // Tab may have been closed — we've already recorded the pause locally
    }

    this.broadcast({ type: 'EXTRACTION_PROGRESS', data: job.progress });
  }

  /** Resume a paused job. */
  async resumeJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'paused') return;

    job.status = 'running';
    this.persist();

    try {
      await this.sendToTab(job.tabId, { type: 'RESUME_EXTRACTION' });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      job.status = 'failed';
      job.error = `Tab lost during pause: ${msg}`;
      job.completedAt = Date.now();
      this.persist();
      this.broadcast({ type: 'EXTRACTION_ERROR', error: job.error });
      this.processQueue();
    }
  }

  /** Stop a running or paused job. */
  async stopJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;
    if (job.status !== 'running' && job.status !== 'paused' && job.status !== 'queued') return;

    const wasRunning = job.status === 'running';
    job.status = 'stopped';
    job.completedAt = Date.now();
    this.persist();

    // Remove from queue if queued
    this.queue = this.queue.filter((q) => q.id !== jobId);

    if (wasRunning) {
      try {
        await this.sendToTab(job.tabId, { type: 'STOP_EXTRACTION' });
      } catch {
        // Tab may already be gone
      }
    }

    this.broadcastSummary(job);
    this.processQueue();
  }

  // -----------------------------------------------------------------------
  // Event handlers (called by message-router)
  // -----------------------------------------------------------------------

  /** Handle a progress update from a content script. */
  handleProgress(tabId: number, data: ExtractionProgress): void {
    const job = this.findRunningJobForTab(tabId);
    if (!job) return;

    job.progress = data;
    this.persist();
    this.broadcast({ type: 'EXTRACTION_PROGRESS', data });
  }

  /** Handle a single extracted row from a content script. */
  handleRow(tabId: number, row: Row): void {
    const job = this.findRunningJobForTab(tabId);
    if (!job) return;

    job.rows.push(row);
    job.progress.items = job.rows.length;
    this.persist();
    this.broadcast({ type: 'EXTRACTION_ROW', row });
  }

  /** Handle a batch of extracted rows. */
  handleBatch(tabId: number, rows: Row[]): void {
    const job = this.findRunningJobForTab(tabId);
    if (!job) return;

    job.rows.push(...rows);
    job.progress.items = job.rows.length;
    this.persist();
    this.broadcast({ type: 'EXTRACTION_BATCH', rows });
  }

  /** Handle extraction completion from a content script. */
  handleComplete(tabId: number, summary: ExtractionSummary): void {
    const job = this.findRunningJobForTab(tabId);
    if (!job) return;

    job.status = 'completed';
    job.completedAt = Date.now();
    this.persist();
    this.broadcast({ type: 'EXTRACTION_COMPLETE', summary });
    this.archiveJob(job);
    this.processQueue();
  }

  /** Handle extraction error from a content script. */
  handleError(tabId: number, error: string, url?: string): void {
    const job = this.findRunningJobForTab(tabId);
    if (!job) return;

    job.progress.errors += 1;

    // Only mark as failed if the error count exceeds a threshold
    if (job.progress.errors >= 5) {
      job.status = 'failed';
      job.error = error;
      job.completedAt = Date.now();
      this.processQueue();
    }

    this.persist();
    this.broadcast({ type: 'EXTRACTION_ERROR', error, url });
  }

  // -----------------------------------------------------------------------
  // Tab lifecycle
  // -----------------------------------------------------------------------

  /** Called when a tab is closed. Cleans up any job running on that tab. */
  handleTabClosed(tabId: number): void {
    for (const job of this.jobs.values()) {
      if (job.tabId === tabId && (job.status === 'running' || job.status === 'paused')) {
        job.status = 'failed';
        job.error = 'Tab was closed during extraction';
        job.completedAt = Date.now();
        this.broadcast({ type: 'EXTRACTION_ERROR', error: job.error });
      }
    }
    this.persist();
    this.processQueue();
  }

  /** Called when a tab navigates away. Pauses any running job on that tab. */
  handleTabNavigated(tabId: number): void {
    for (const job of this.jobs.values()) {
      if (job.tabId === tabId && job.status === 'running') {
        // Only pause if the pagination mode doesn't involve navigation
        const navModes = new Set(['url-pattern', 'manual-urls']);
        if (!navModes.has(job.config.pagination.mode)) {
          job.status = 'paused';
          this.broadcast({ type: 'EXTRACTION_PROGRESS', data: job.progress });
        }
      }
    }
    this.persist();
  }

  // -----------------------------------------------------------------------
  // Queries
  // -----------------------------------------------------------------------

  getJob(jobId: string): ExtractionJob | undefined {
    return this.jobs.get(jobId);
  }

  getRunningJobs(): ExtractionJob[] {
    return [...this.jobs.values()].filter((j) => j.status === 'running');
  }

  getAllJobs(): ExtractionJob[] {
    return [...this.jobs.values()];
  }

  getJobForTab(tabId: number): ExtractionJob | undefined {
    return this.findRunningJobForTab(tabId) ?? this.findJobForTab(tabId);
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  private findRunningJobForTab(tabId: number): ExtractionJob | undefined {
    for (const job of this.jobs.values()) {
      if (job.tabId === tabId && (job.status === 'running' || job.status === 'paused')) {
        return job;
      }
    }
    return undefined;
  }

  private findJobForTab(tabId: number): ExtractionJob | undefined {
    // Return the most recent job for this tab
    let latest: ExtractionJob | undefined;
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
  private processQueue(): void {
    const runningCount = this.getRunningJobs().length;
    if (runningCount >= MAX_CONCURRENT_JOBS || this.queue.length === 0) return;

    const next = this.queue.shift();
    if (!next) return;

    // Verify the job still exists and is queued
    const job = this.jobs.get(next.id);
    if (!job || job.status !== 'queued') {
      // Skip and try next
      this.processQueue();
      return;
    }

    this.startJob(next.id).catch((err) => {
      console.error('[ExtractionManager] processQueue startJob failed:', err);
    });
  }

  /** Persist current state to chrome.storage.session. */
  private persist(): void {
    const jobsArray = [...this.jobs.values()];
    chrome.storage.session.set({
      [STORAGE_KEY_JOBS]: jobsArray,
      [STORAGE_KEY_QUEUE]: this.queue,
    }).catch((err) => {
      console.warn('[ExtractionManager] Failed to persist state:', err);
    });
  }

  /** Archive a completed job into chrome.storage.local for history. */
  private archiveJob(job: ExtractionJob): void {
    const archiveEntry = {
      id: job.id,
      originUrl: job.originUrl,
      status: job.status,
      totalItems: job.rows.length,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    };

    chrome.storage.local.get('df_job_history').then((result) => {
      const history: unknown[] = result['df_job_history'] ?? [];
      history.unshift(archiveEntry);
      // Keep only last 100 entries
      if (history.length > 100) history.length = 100;
      return chrome.storage.local.set({ df_job_history: history });
    }).catch((err) => {
      console.warn('[ExtractionManager] Failed to archive job:', err);
    });
  }

  /** Send a message to a tab, swallowing errors if the tab no longer exists. */
  private async sendToTab(tabId: number, message: Message): Promise<void> {
    try {
      await chrome.tabs.sendMessage(tabId, message);
    } catch (err) {
      // Re-throw so callers can handle tab-gone scenarios
      throw err;
    }
  }

  /** Broadcast a message to the sidepanel via the registered callback. */
  private broadcast(message: Message): void {
    if (this.broadcastFn) {
      try {
        this.broadcastFn(message);
      } catch (err) {
        console.warn('[ExtractionManager] Broadcast failed:', err);
      }
    }
  }

  /** Build and broadcast a summary for a completed/stopped job. */
  private broadcastSummary(job: ExtractionJob): void {
    const elapsed = (job.completedAt ?? Date.now()) - (job.startedAt ?? job.createdAt);
    const summary: ExtractionSummary = {
      totalItems: job.rows.length,
      totalPages: job.progress.pages,
      totalTime: elapsed,
      avgSpeed: elapsed > 0 ? (job.rows.length / (elapsed / 1000)) : 0,
      errors: job.progress.errors,
      dataSize: JSON.stringify(job.rows).length,
    };
    this.broadcast({ type: 'EXTRACTION_COMPLETE', summary });
  }
}
