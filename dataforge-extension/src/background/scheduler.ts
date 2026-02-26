/**
 * Scheduler — chrome.alarms-based extraction scheduling.
 *
 * Schedules extraction jobs to repeat at configurable intervals using
 * chrome.alarms API (minimum 1-minute intervals enforced by Chrome).
 * Schedule configurations and job history are persisted to
 * chrome.storage.local so they survive service-worker restarts and
 * browser restarts.
 *
 * Manifest V3 compatible — relies entirely on chrome.alarms for
 * timing, which Chrome manages even when the service worker is
 * terminated.
 */

import type { ExtractionConfig } from '../types/extraction';
import type { Message } from '../types/messages';
import { generatePrefixedId } from '../utils/id';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScheduleConfig {
  id: string;
  name: string;
  extractionConfig: ExtractionConfig;
  url: string;
  intervalMinutes: number;
  enabled: boolean;
  createdAt: number;
  updatedAt: number;
  lastRunAt: number | null;
  nextRunAt: number | null;
  runCount: number;
  consecutiveFailures: number;
  maxConsecutiveFailures: number;
}

export interface ScheduleHistoryEntry {
  scheduleId: string;
  runAt: number;
  completedAt: number | null;
  status: 'success' | 'failure' | 'skipped';
  itemsExtracted: number;
  error: string | null;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALARM_PREFIX = 'df_schedule_';
const STORAGE_KEY_SCHEDULES = 'df_schedules';
const STORAGE_KEY_HISTORY = 'df_schedule_history';
const MIN_INTERVAL_MINUTES = 1; // Chrome enforces this minimum
const MAX_HISTORY_ENTRIES = 500;
const MAX_CONSECUTIVE_FAILURES = 5;

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

/** In-memory cache of schedules, synced with chrome.storage.local. */
let schedules: Map<string, ScheduleConfig> = new Map();

/** Callback to trigger an extraction when an alarm fires. */
let extractionTrigger: ((config: ExtractionConfig, url: string, scheduleId: string) => Promise<boolean>) | null = null;

/** Callback to broadcast messages to the sidepanel. */
let broadcastFn: ((message: Message) => void) | null = null;

/** Whether the scheduler has been initialized. */
let initialized = false;

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

/**
 * Initialize the scheduler. Must be called once on service-worker start.
 * Restores schedule configs from storage and registers the alarm listener.
 */
export async function initScheduler(): Promise<void> {
  if (initialized) return;
  initialized = true;

  // Restore schedules from storage
  try {
    const stored = await chrome.storage.local.get(STORAGE_KEY_SCHEDULES);
    const configs: ScheduleConfig[] = stored[STORAGE_KEY_SCHEDULES] ?? [];

    for (const config of configs) {
      schedules.set(config.id, config);
    }
  } catch (err) {
    console.warn('[Scheduler] Failed to restore schedules from storage:', err);
  }

  // Register alarm listener
  chrome.alarms.onAlarm.addListener(onAlarmFired);

  // Verify that all enabled schedules have corresponding alarms
  await reconcileAlarms();
}

/**
 * Register the callback that will be invoked to execute an extraction
 * when a schedule fires.
 *
 * The callback should return `true` if the extraction was started
 * successfully, or `false` if it could not be started (e.g., browser
 * busy, tab unavailable).
 */
export function onExtractionTrigger(
  fn: (config: ExtractionConfig, url: string, scheduleId: string) => Promise<boolean>,
): void {
  extractionTrigger = fn;
}

/**
 * Register a broadcast callback for sending messages to the sidepanel.
 */
export function onBroadcast(fn: (message: Message) => void): void {
  broadcastFn = fn;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Create and start a new scheduled extraction.
 *
 * @param config - The extraction configuration to use.
 * @param intervalMinutes - Repeat interval in minutes (minimum 1).
 * @param url - The URL to extract from.
 * @param name - Optional human-readable name for the schedule.
 * @returns The new schedule's ID.
 */
export async function scheduleExtraction(
  config: ExtractionConfig,
  intervalMinutes: number,
  url: string,
  name?: string,
): Promise<string> {
  const id = generatePrefixedId('sched', 12);
  const clampedInterval = Math.max(MIN_INTERVAL_MINUTES, Math.round(intervalMinutes));
  const now = Date.now();

  const schedule: ScheduleConfig = {
    id,
    name: name ?? `Schedule ${id}`,
    extractionConfig: config,
    url,
    intervalMinutes: clampedInterval,
    enabled: true,
    createdAt: now,
    updatedAt: now,
    lastRunAt: null,
    nextRunAt: now + clampedInterval * 60_000,
    runCount: 0,
    consecutiveFailures: 0,
    maxConsecutiveFailures: MAX_CONSECUTIVE_FAILURES,
  };

  schedules.set(id, schedule);
  await persistSchedules();

  // Create the Chrome alarm
  await createAlarmForSchedule(schedule);

  return id;
}

/**
 * Cancel and remove a scheduled extraction.
 *
 * @param id - The schedule ID to cancel.
 * @returns `true` if the schedule was found and removed.
 */
export async function cancelSchedule(id: string): Promise<boolean> {
  const schedule = schedules.get(id);
  if (!schedule) return false;

  schedules.delete(id);

  // Clear the Chrome alarm
  try {
    await chrome.alarms.clear(alarmName(id));
  } catch (err) {
    console.warn(`[Scheduler] Failed to clear alarm for schedule ${id}:`, err);
  }

  await persistSchedules();
  return true;
}

/**
 * Pause a schedule (disable without deleting).
 */
export async function pauseSchedule(id: string): Promise<boolean> {
  const schedule = schedules.get(id);
  if (!schedule) return false;

  schedule.enabled = false;
  schedule.updatedAt = Date.now();
  schedule.nextRunAt = null;

  try {
    await chrome.alarms.clear(alarmName(id));
  } catch {
    // Alarm may not exist
  }

  await persistSchedules();
  return true;
}

/**
 * Resume a paused schedule.
 */
export async function resumeSchedule(id: string): Promise<boolean> {
  const schedule = schedules.get(id);
  if (!schedule) return false;

  schedule.enabled = true;
  schedule.updatedAt = Date.now();
  schedule.consecutiveFailures = 0;

  await createAlarmForSchedule(schedule);
  await persistSchedules();
  return true;
}

/**
 * Update the interval of an existing schedule.
 */
export async function updateScheduleInterval(id: string, intervalMinutes: number): Promise<boolean> {
  const schedule = schedules.get(id);
  if (!schedule) return false;

  const clampedInterval = Math.max(MIN_INTERVAL_MINUTES, Math.round(intervalMinutes));
  schedule.intervalMinutes = clampedInterval;
  schedule.updatedAt = Date.now();

  if (schedule.enabled) {
    // Recreate the alarm with the new interval
    try {
      await chrome.alarms.clear(alarmName(id));
    } catch {
      // May not exist
    }
    await createAlarmForSchedule(schedule);
  }

  await persistSchedules();
  return true;
}

/**
 * Get all schedules.
 */
export function getSchedules(): ScheduleConfig[] {
  return [...schedules.values()].sort((a, b) => b.createdAt - a.createdAt);
}

/**
 * Get a single schedule by ID.
 */
export function getSchedule(id: string): ScheduleConfig | undefined {
  return schedules.get(id);
}

/**
 * Get schedule history entries, optionally filtered by schedule ID.
 */
export async function getScheduleHistory(
  scheduleId?: string,
  limit = 50,
): Promise<ScheduleHistoryEntry[]> {
  try {
    const stored = await chrome.storage.local.get(STORAGE_KEY_HISTORY);
    const history: ScheduleHistoryEntry[] = stored[STORAGE_KEY_HISTORY] ?? [];

    let filtered = scheduleId
      ? history.filter((h) => h.scheduleId === scheduleId)
      : history;

    // Most recent first, limited
    filtered = filtered
      .sort((a, b) => b.runAt - a.runAt)
      .slice(0, limit);

    return filtered;
  } catch (err) {
    console.warn('[Scheduler] Failed to load history:', err);
    return [];
  }
}

// ---------------------------------------------------------------------------
// Alarm handler
// ---------------------------------------------------------------------------

async function onAlarmFired(alarm: chrome.alarms.Alarm): Promise<void> {
  // Only handle our alarms
  if (!alarm.name.startsWith(ALARM_PREFIX)) return;

  const scheduleId = alarm.name.slice(ALARM_PREFIX.length);
  const schedule = schedules.get(scheduleId);

  if (!schedule) {
    // Orphan alarm — clean it up
    try {
      await chrome.alarms.clear(alarm.name);
    } catch {
      // Best effort
    }
    return;
  }

  if (!schedule.enabled) {
    return;
  }

  // Check if too many consecutive failures — auto-disable
  if (schedule.consecutiveFailures >= schedule.maxConsecutiveFailures) {
    console.warn(
      `[Scheduler] Schedule ${scheduleId} disabled after ${schedule.consecutiveFailures} consecutive failures.`,
    );
    schedule.enabled = false;
    schedule.updatedAt = Date.now();
    schedule.nextRunAt = null;

    try {
      await chrome.alarms.clear(alarm.name);
    } catch {
      // Best effort
    }

    await persistSchedules();
    await addHistoryEntry({
      scheduleId,
      runAt: Date.now(),
      completedAt: Date.now(),
      status: 'skipped',
      itemsExtracted: 0,
      error: `Auto-disabled after ${schedule.maxConsecutiveFailures} consecutive failures`,
    });
    return;
  }

  const runAt = Date.now();

  // Try to run the extraction
  if (!extractionTrigger) {
    console.warn('[Scheduler] No extraction trigger registered — skipping alarm');
    await addHistoryEntry({
      scheduleId,
      runAt,
      completedAt: Date.now(),
      status: 'skipped',
      itemsExtracted: 0,
      error: 'No extraction trigger registered',
    });
    return;
  }

  try {
    const started = await extractionTrigger(
      schedule.extractionConfig,
      schedule.url,
      scheduleId,
    );

    if (started) {
      schedule.lastRunAt = runAt;
      schedule.runCount += 1;
      schedule.consecutiveFailures = 0;
      schedule.nextRunAt = runAt + schedule.intervalMinutes * 60_000;
      schedule.updatedAt = Date.now();

      await persistSchedules();
      await addHistoryEntry({
        scheduleId,
        runAt,
        completedAt: null, // Will be updated when extraction completes
        status: 'success',
        itemsExtracted: 0,
        error: null,
      });
    } else {
      schedule.consecutiveFailures += 1;
      schedule.updatedAt = Date.now();

      await persistSchedules();
      await addHistoryEntry({
        scheduleId,
        runAt,
        completedAt: Date.now(),
        status: 'skipped',
        itemsExtracted: 0,
        error: 'Browser unavailable or extraction could not be started',
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
      status: 'failure',
      itemsExtracted: 0,
      error: errorMsg,
    });
  }
}

// ---------------------------------------------------------------------------
// Public: mark extraction result (called by ExtractionManager)
// ---------------------------------------------------------------------------

/**
 * Record the result of a scheduled extraction after it completes.
 * Called by the ExtractionManager when an extraction tied to a schedule finishes.
 */
export async function recordScheduleResult(
  scheduleId: string,
  success: boolean,
  itemsExtracted: number,
  error?: string,
): Promise<void> {
  const schedule = schedules.get(scheduleId);
  if (!schedule) return;

  if (success) {
    schedule.consecutiveFailures = 0;
  } else {
    schedule.consecutiveFailures += 1;
  }
  schedule.updatedAt = Date.now();
  await persistSchedules();

  // Update the most recent history entry for this schedule
  try {
    const stored = await chrome.storage.local.get(STORAGE_KEY_HISTORY);
    const history: ScheduleHistoryEntry[] = stored[STORAGE_KEY_HISTORY] ?? [];

    // Find the most recent pending entry for this schedule
    const entry = history.find(
      (h) => h.scheduleId === scheduleId && h.completedAt === null,
    );
    if (entry) {
      entry.completedAt = Date.now();
      entry.status = success ? 'success' : 'failure';
      entry.itemsExtracted = itemsExtracted;
      entry.error = error ?? null;
      await chrome.storage.local.set({ [STORAGE_KEY_HISTORY]: history });
    }
  } catch (err) {
    console.warn('[Scheduler] Failed to update history entry:', err);
  }
}

// ---------------------------------------------------------------------------
// Alarm management
// ---------------------------------------------------------------------------

function alarmName(scheduleId: string): string {
  return `${ALARM_PREFIX}${scheduleId}`;
}

async function createAlarmForSchedule(schedule: ScheduleConfig): Promise<void> {
  const name = alarmName(schedule.id);

  try {
    // chrome.alarms.create uses periodInMinutes for repeating alarms
    // and delayInMinutes for the first fire
    chrome.alarms.create(name, {
      delayInMinutes: schedule.intervalMinutes,
      periodInMinutes: schedule.intervalMinutes,
    });

    schedule.nextRunAt = Date.now() + schedule.intervalMinutes * 60_000;
  } catch (err) {
    console.error(`[Scheduler] Failed to create alarm for schedule ${schedule.id}:`, err);
    throw err;
  }
}

/**
 * Ensure that all enabled schedules have a corresponding Chrome alarm,
 * and remove alarms for schedules that no longer exist or are disabled.
 */
async function reconcileAlarms(): Promise<void> {
  try {
    const alarms = await chrome.alarms.getAll();
    const alarmMap = new Map<string, chrome.alarms.Alarm>();

    for (const alarm of alarms) {
      if (alarm.name.startsWith(ALARM_PREFIX)) {
        alarmMap.set(alarm.name, alarm);
      }
    }

    // Create missing alarms for enabled schedules
    for (const schedule of schedules.values()) {
      const name = alarmName(schedule.id);
      if (schedule.enabled && !alarmMap.has(name)) {
        await createAlarmForSchedule(schedule);
      }
      // Remove from map so we know which orphans are left
      alarmMap.delete(name);
    }

    // Clear orphan alarms (schedule was deleted while service worker was down)
    for (const orphanName of alarmMap.keys()) {
      try {
        await chrome.alarms.clear(orphanName);
      } catch {
        // Best effort
      }
    }
  } catch (err) {
    console.warn('[Scheduler] Failed to reconcile alarms:', err);
  }
}

// ---------------------------------------------------------------------------
// Persistence
// ---------------------------------------------------------------------------

async function persistSchedules(): Promise<void> {
  try {
    const configArray = [...schedules.values()];
    await chrome.storage.local.set({ [STORAGE_KEY_SCHEDULES]: configArray });
  } catch (err) {
    console.warn('[Scheduler] Failed to persist schedules:', err);
  }
}

async function addHistoryEntry(entry: ScheduleHistoryEntry): Promise<void> {
  try {
    const stored = await chrome.storage.local.get(STORAGE_KEY_HISTORY);
    const history: ScheduleHistoryEntry[] = stored[STORAGE_KEY_HISTORY] ?? [];

    history.unshift(entry);

    // Trim history to max entries
    if (history.length > MAX_HISTORY_ENTRIES) {
      history.length = MAX_HISTORY_ENTRIES;
    }

    await chrome.storage.local.set({ [STORAGE_KEY_HISTORY]: history });
  } catch (err) {
    console.warn('[Scheduler] Failed to add history entry:', err);
  }
}
