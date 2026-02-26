/**
 * MessageRouter — Chrome message passing hub.
 *
 * Central listener for chrome.runtime.onMessage that routes messages
 * between content scripts, the side panel, and background handlers.
 * All messages are typed using the Message union from types/messages.
 *
 * Routing rules:
 * - SCAN_PAGE / SCAN_RESULT: forwarded between sidepanel <-> content script
 * - START_EXTRACTION / PAUSE / RESUME / STOP: forwarded to content + manager
 * - EXTRACTION_PROGRESS / ROW / BATCH / COMPLETE / ERROR: content -> sidepanel + manager
 * - NAVIGATE_URL: opens a new tab
 * - WEBHOOK_PUSH: makes fetch requests from the background
 * - SCHEDULE_EXTRACTION: sets up chrome.alarms via the scheduler
 * - HIGHLIGHT_ELEMENTS / CLEAR_HIGHLIGHTS / TEST_SELECTOR / etc.: forwarded to content
 * - PING/PONG: health check
 *
 * Manifest V3 compatible — the router is a pure function-based module
 * with no persistent state. The service worker can be restarted at any
 * time; the router simply re-registers its listener.
 */

import type { Message } from '../types/messages';
import type { ExtractionConfig, ExtractionProgress, ExtractionSummary, Row } from '../types/extraction';
import type { ExtractionManager } from './extraction-manager';
import type { NetworkMonitor } from './network-monitor';
import type { TabManager } from './tab-manager';
import {
  scheduleExtraction as schedulerScheduleExtraction,
} from './scheduler';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MessageRouterDeps {
  extractionManager: ExtractionManager;
  networkMonitor: NetworkMonitor;
  tabManager: TabManager;
}

interface MessageContext {
  message: Message;
  sender: chrome.runtime.MessageSender;
  sendResponse: (response?: unknown) => void;
}

// ---------------------------------------------------------------------------
// Module state
// ---------------------------------------------------------------------------

let deps: MessageRouterDeps | null = null;
let listenerRegistered = false;

// ---------------------------------------------------------------------------
// Initialization
// ---------------------------------------------------------------------------

/**
 * Initialize the message router.
 * Registers the chrome.runtime.onMessage listener and wires up
 * references to the extraction manager, network monitor, and tab manager.
 */
export function initMessageRouter(dependencies: MessageRouterDeps): void {
  deps = dependencies;

  if (listenerRegistered) return;
  listenerRegistered = true;

  chrome.runtime.onMessage.addListener(
    (
      rawMessage: unknown,
      sender: chrome.runtime.MessageSender,
      sendResponse: (response?: unknown) => void,
    ): boolean | undefined => {
      // Validate that the message has a type field
      if (!isValidMessage(rawMessage)) {
        return undefined;
      }

      const message = rawMessage as Message;
      const ctx: MessageContext = { message, sender, sendResponse };

      // Route the message — returns true if the response will be sent
      // asynchronously (required by chrome.runtime.onMessage contract).
      const isAsync = routeMessage(ctx);
      return isAsync ? true : undefined;
    },
  );
}

// ---------------------------------------------------------------------------
// Message validation
// ---------------------------------------------------------------------------

function isValidMessage(raw: unknown): boolean {
  return (
    typeof raw === 'object' &&
    raw !== null &&
    'type' in raw &&
    typeof (raw as Record<string, unknown>).type === 'string'
  );
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

/**
 * Route a message to the appropriate handler.
 * Returns `true` if the handler sends the response asynchronously.
 */
function routeMessage(ctx: MessageContext): boolean {
  const { message, sender } = ctx;

  switch (message.type) {
    // -----------------------------------------------------------------
    // Page scanning: sidepanel -> content -> sidepanel
    // -----------------------------------------------------------------
    case 'SCAN_PAGE':
      return handleScanPage(ctx);

    case 'SCAN_RESULT':
      return handleScanResult(ctx);

    // -----------------------------------------------------------------
    // Pattern selection: sidepanel -> content
    // -----------------------------------------------------------------
    case 'SELECT_PATTERN':
      return forwardToActiveTab(ctx);

    case 'SELECTION_CONFIRMED':
      return broadcastToRuntime(ctx);

    // -----------------------------------------------------------------
    // Extraction control: sidepanel -> background -> content
    // -----------------------------------------------------------------
    case 'START_EXTRACTION':
      return handleStartExtraction(ctx);

    case 'PAUSE_EXTRACTION':
      return handlePauseExtraction(ctx);

    case 'RESUME_EXTRACTION':
      return handleResumeExtraction(ctx);

    case 'STOP_EXTRACTION':
      return handleStopExtraction(ctx);

    // -----------------------------------------------------------------
    // Extraction data: content -> background -> sidepanel
    // -----------------------------------------------------------------
    case 'EXTRACTION_PROGRESS':
      return handleExtractionProgress(ctx);

    case 'EXTRACTION_ROW':
      return handleExtractionRow(ctx);

    case 'EXTRACTION_BATCH':
      return handleExtractionBatch(ctx);

    case 'EXTRACTION_COMPLETE':
      return handleExtractionComplete(ctx);

    case 'EXTRACTION_ERROR':
      return handleExtractionError(ctx);

    // -----------------------------------------------------------------
    // DOM interaction: sidepanel -> content
    // -----------------------------------------------------------------
    case 'HIGHLIGHT_ELEMENTS':
    case 'CLEAR_HIGHLIGHTS':
    case 'TEST_SELECTOR':
    case 'ACTIVATE_SELECTION_MODE':
    case 'DEACTIVATE_SELECTION_MODE':
    case 'DETECT_PAGINATION':
    case 'EXTRACT_EMAILS':
    case 'EXTRACT_IMAGES':
    case 'EXTRACT_TEXT':
      return forwardToActiveTab(ctx);

    // -----------------------------------------------------------------
    // DOM interaction results: content -> sidepanel
    // -----------------------------------------------------------------
    case 'SELECTOR_TEST_RESULT':
    case 'PAGINATION_RESULT':
    case 'ELEMENT_CLICKED':
      return broadcastToRuntime(ctx);

    // -----------------------------------------------------------------
    // Navigation: sidepanel -> background
    // -----------------------------------------------------------------
    case 'NAVIGATE_URL':
      return handleNavigateUrl(ctx);

    // -----------------------------------------------------------------
    // Webhooks: sidepanel -> background
    // -----------------------------------------------------------------
    case 'WEBHOOK_PUSH':
      return handleWebhookPush(ctx);

    // -----------------------------------------------------------------
    // Scheduling: sidepanel -> background
    // -----------------------------------------------------------------
    case 'SCHEDULE_EXTRACTION':
      return handleScheduleExtraction(ctx);

    // -----------------------------------------------------------------
    // Health check
    // -----------------------------------------------------------------
    case 'PING':
      ctx.sendResponse({ type: 'PONG' });
      return false;

    case 'PONG':
      // Ignore — this is a response, not a request
      return false;

    default: {
      console.warn('[MessageRouter] Unhandled message type:', (message as Record<string, unknown>).type);
      return false;
    }
  }
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

function handleScanPage(ctx: MessageContext): boolean {
  // Forward SCAN_PAGE from sidepanel to the active tab's content script
  getActiveTabId()
    .then((tabId) => {
      if (tabId === null) {
        ctx.sendResponse({ type: 'SCAN_RESULT', patterns: [] });
        return;
      }
      return chrome.tabs.sendMessage(tabId, ctx.message);
    })
    .then((response) => {
      if (response) {
        ctx.sendResponse(response);
      }
    })
    .catch((err) => {
      console.error('[MessageRouter] SCAN_PAGE forward failed:', err);
      ctx.sendResponse({ type: 'SCAN_RESULT', patterns: [] });
    });
  return true;
}

function handleScanResult(ctx: MessageContext): boolean {
  // Forward SCAN_RESULT from content script to the sidepanel
  broadcastToRuntime(ctx);
  return false;
}

function handleStartExtraction(ctx: MessageContext): boolean {
  if (!deps) return false;

  const { config } = ctx.message as { type: 'START_EXTRACTION'; config: ExtractionConfig };

  getActiveTabId()
    .then(async (tabId) => {
      if (tabId === null) {
        ctx.sendResponse({ success: false, error: 'No active tab' });
        return;
      }

      // Get the tab URL for the job record
      const tab = await chrome.tabs.get(tabId);
      const url = tab.url ?? 'unknown';

      // Create and start the job via ExtractionManager
      const jobId = deps!.extractionManager.createJob(config, tabId, url);
      ctx.sendResponse({ success: true, jobId });
    })
    .catch((err) => {
      console.error('[MessageRouter] START_EXTRACTION failed:', err);
      ctx.sendResponse({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    });

  return true;
}

function handlePauseExtraction(ctx: MessageContext): boolean {
  if (!deps) return false;

  const runningJobs = deps.extractionManager.getRunningJobs();
  for (const job of runningJobs) {
    deps.extractionManager.pauseJob(job.id).catch((err) => {
      console.error('[MessageRouter] Failed to pause job:', err);
    });
  }
  return false;
}

function handleResumeExtraction(ctx: MessageContext): boolean {
  if (!deps) return false;

  const allJobs = deps.extractionManager.getAllJobs();
  for (const job of allJobs) {
    if (job.status === 'paused') {
      deps.extractionManager.resumeJob(job.id).catch((err) => {
        console.error('[MessageRouter] Failed to resume job:', err);
      });
    }
  }
  return false;
}

function handleStopExtraction(ctx: MessageContext): boolean {
  if (!deps) return false;

  const allJobs = deps.extractionManager.getAllJobs();
  for (const job of allJobs) {
    if (job.status === 'running' || job.status === 'paused' || job.status === 'queued') {
      deps.extractionManager.stopJob(job.id).catch((err) => {
        console.error('[MessageRouter] Failed to stop job:', err);
      });
    }
  }
  return false;
}

function handleExtractionProgress(ctx: MessageContext): boolean {
  if (!deps) return false;

  const tabId = ctx.sender.tab?.id;
  if (tabId === undefined) return false;

  const { data } = ctx.message as { type: 'EXTRACTION_PROGRESS'; data: ExtractionProgress };
  deps.extractionManager.handleProgress(tabId, data);

  // Also check if this is a managed tab
  if (deps.tabManager.isManagedTab(tabId)) {
    // Progress is already being tracked by ExtractionManager
  }

  return false;
}

function handleExtractionRow(ctx: MessageContext): boolean {
  if (!deps) return false;

  const tabId = ctx.sender.tab?.id;
  if (tabId === undefined) return false;

  const { row } = ctx.message as { type: 'EXTRACTION_ROW'; row: Row };
  deps.extractionManager.handleRow(tabId, row);

  if (deps.tabManager.isManagedTab(tabId)) {
    deps.tabManager.handleRows(tabId, [row]);
  }

  return false;
}

function handleExtractionBatch(ctx: MessageContext): boolean {
  if (!deps) return false;

  const tabId = ctx.sender.tab?.id;
  if (tabId === undefined) return false;

  const { rows } = ctx.message as { type: 'EXTRACTION_BATCH'; rows: Row[] };
  deps.extractionManager.handleBatch(tabId, rows);

  if (deps.tabManager.isManagedTab(tabId)) {
    deps.tabManager.handleRows(tabId, rows);
  }

  return false;
}

function handleExtractionComplete(ctx: MessageContext): boolean {
  if (!deps) return false;

  const tabId = ctx.sender.tab?.id;
  if (tabId === undefined) return false;

  const { summary } = ctx.message as { type: 'EXTRACTION_COMPLETE'; summary: ExtractionSummary };
  deps.extractionManager.handleComplete(tabId, summary);

  if (deps.tabManager.isManagedTab(tabId)) {
    deps.tabManager.handleComplete(tabId);
  }

  return false;
}

function handleExtractionError(ctx: MessageContext): boolean {
  if (!deps) return false;

  const tabId = ctx.sender.tab?.id;
  if (tabId === undefined) return false;

  const { error, url } = ctx.message as { type: 'EXTRACTION_ERROR'; error: string; url?: string };
  deps.extractionManager.handleError(tabId, error, url);

  if (deps.tabManager.isManagedTab(tabId)) {
    deps.tabManager.handleError(tabId, error);
  }

  return false;
}

function handleNavigateUrl(ctx: MessageContext): boolean {
  const { url } = ctx.message as { type: 'NAVIGATE_URL'; url: string };

  // Validate URL
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      ctx.sendResponse({ success: false, error: 'Only http and https URLs are supported' });
      return true;
    }
  } catch {
    ctx.sendResponse({ success: false, error: 'Invalid URL' });
    return true;
  }

  chrome.tabs.create({ url, active: true })
    .then((tab) => {
      ctx.sendResponse({ success: true, tabId: tab.id });
    })
    .catch((err) => {
      console.error('[MessageRouter] NAVIGATE_URL failed:', err);
      ctx.sendResponse({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    });

  return true;
}

function handleWebhookPush(ctx: MessageContext): boolean {
  const { data, url, headers } = ctx.message as {
    type: 'WEBHOOK_PUSH';
    data: Row[];
    url: string;
    headers: Record<string, string>;
  };

  // Validate webhook URL
  try {
    const parsed = new URL(url);
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      ctx.sendResponse({ success: false, error: 'Only http and https webhook URLs are supported' });
      return true;
    }
  } catch {
    ctx.sendResponse({ success: false, error: 'Invalid webhook URL' });
    return true;
  }

  // Send the data via fetch from the service worker (avoids CORS issues
  // that content scripts would face)
  fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    body: JSON.stringify({ rows: data, timestamp: Date.now() }),
  })
    .then(async (response) => {
      if (!response.ok) {
        const text = await response.text().catch(() => '');
        ctx.sendResponse({
          success: false,
          error: `Webhook returned ${response.status}: ${text.slice(0, 200)}`,
        });
      } else {
        ctx.sendResponse({ success: true, status: response.status });
      }
    })
    .catch((err) => {
      console.error('[MessageRouter] WEBHOOK_PUSH failed:', err);
      ctx.sendResponse({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    });

  return true;
}

function handleScheduleExtraction(ctx: MessageContext): boolean {
  const { config, interval } = ctx.message as {
    type: 'SCHEDULE_EXTRACTION';
    config: ExtractionConfig;
    interval: number;
  };

  // Get the current URL for the schedule
  getActiveTabId()
    .then(async (tabId) => {
      let url = 'unknown';
      if (tabId !== null) {
        try {
          const tab = await chrome.tabs.get(tabId);
          url = tab.url ?? 'unknown';
        } catch {
          // Tab may not exist
        }
      }

      const scheduleId = await schedulerScheduleExtraction(config, interval, url);
      ctx.sendResponse({ success: true, scheduleId });
    })
    .catch((err) => {
      console.error('[MessageRouter] SCHEDULE_EXTRACTION failed:', err);
      ctx.sendResponse({
        success: false,
        error: err instanceof Error ? err.message : String(err),
      });
    });

  return true;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Forward a message to the content script in the active tab.
 * Returns true (async response).
 */
function forwardToActiveTab(ctx: MessageContext): boolean {
  getActiveTabId()
    .then((tabId) => {
      if (tabId === null) {
        ctx.sendResponse({ error: 'No active tab found' });
        return;
      }
      return chrome.tabs.sendMessage(tabId, ctx.message);
    })
    .then((response) => {
      if (response !== undefined) {
        ctx.sendResponse(response);
      }
    })
    .catch((err) => {
      console.error(`[MessageRouter] Forward to active tab failed for ${ctx.message.type}:`, err);
      ctx.sendResponse({ error: err instanceof Error ? err.message : String(err) });
    });

  return true;
}

/**
 * Broadcast a message to all extension contexts (sidepanel, popup, etc.)
 * by sending it via chrome.runtime.sendMessage.
 * Returns false (synchronous — fire and forget).
 */
function broadcastToRuntime(ctx: MessageContext): boolean {
  // chrome.runtime.sendMessage sends to all extension pages except the sender
  chrome.runtime.sendMessage(ctx.message).catch(() => {
    // No receivers — this is normal if the sidepanel is not open
  });
  return false;
}

/**
 * Get the active tab ID in the current window.
 */
async function getActiveTabId(): Promise<number | null> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab?.id ?? null;
  } catch {
    return null;
  }
}

/**
 * Broadcast a message from the background to all extension contexts.
 * This is used by ExtractionManager and TabManager via their broadcastFn.
 */
export function broadcastMessage(message: Message): void {
  chrome.runtime.sendMessage(message).catch(() => {
    // No receivers — sidepanel may not be open
  });
}
