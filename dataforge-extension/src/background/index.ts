/**
 * DataForge — Background Service Worker Entry Point.
 *
 * This is the main entry point for the Manifest V3 service worker.
 * It initializes all background subsystems:
 *
 * 1. ExtractionManager — job queue and extraction coordination
 * 2. TabManager — multi-tab extraction for bulk/page extractor
 * 3. NetworkMonitor — XHR/fetch interception for API pattern detection
 * 4. Scheduler — chrome.alarms-based recurring extractions
 * 5. MessageRouter — central message hub between content/sidepanel/background
 *
 * The service worker can be terminated and restarted at any time by
 * Chrome. All subsystems persist their critical state to chrome.storage
 * (session for ephemeral, local for persistent) and rehydrate on restart.
 *
 * Event registrations (chrome.runtime.onInstalled, chrome.action.onClicked,
 * chrome.tabs.onRemoved, etc.) must happen synchronously at the top level
 * of the service worker — they cannot be deferred to async init.
 */

import { ExtractionManager } from './extraction-manager';
import { TabManager } from './tab-manager';
import { NetworkMonitor } from './network-monitor';
import {
  initScheduler,
  onExtractionTrigger,
  onBroadcast as schedulerOnBroadcast,
} from './scheduler';
import { initMessageRouter, broadcastMessage } from './message-router';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const EXTENSION_NAME = 'DataForge';
const WELCOME_URL = 'https://dataforge.dev/welcome';
const UPDATE_URL = 'https://dataforge.dev/changelog';

// ---------------------------------------------------------------------------
// Singleton instances (created synchronously, initialized async)
// ---------------------------------------------------------------------------

const extractionManager = new ExtractionManager();
const tabManager = new TabManager();
const networkMonitor = new NetworkMonitor();

// ---------------------------------------------------------------------------
// Side panel configuration
// ---------------------------------------------------------------------------

// Register side panel behavior: clicking the extension icon opens the side panel.
// This must be called synchronously at the top level.
try {
  chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true });
} catch (err) {
  console.warn(`[${EXTENSION_NAME}] Failed to set side panel behavior:`, err);
}

// ---------------------------------------------------------------------------
// chrome.runtime.onInstalled — first install / update
// ---------------------------------------------------------------------------

chrome.runtime.onInstalled.addListener((details) => {
  switch (details.reason) {
    case 'install':
      handleFirstInstall();
      break;

    case 'update':
      handleUpdate(details.previousVersion);
      break;

    default:
      // 'chrome_update' or 'shared_module_update' — no action needed
      break;
  }
});

function handleFirstInstall(): void {
  console.log(`[${EXTENSION_NAME}] First install — initializing defaults.`);

  // Store a flag indicating this is a fresh install
  chrome.storage.local.set({
    df_installed_at: Date.now(),
    df_version: chrome.runtime.getManifest().version,
  }).catch((err) => {
    console.warn(`[${EXTENSION_NAME}] Failed to save install metadata:`, err);
  });

  // Open the welcome page in a new tab
  chrome.tabs.create({ url: WELCOME_URL }).catch((err) => {
    console.warn(`[${EXTENSION_NAME}] Failed to open welcome page:`, err);
  });
}

function handleUpdate(previousVersion: string | undefined): void {
  const currentVersion = chrome.runtime.getManifest().version;
  console.log(
    `[${EXTENSION_NAME}] Updated from ${previousVersion ?? 'unknown'} to ${currentVersion}.`,
  );

  // Store updated version
  chrome.storage.local.set({
    df_version: currentVersion,
    df_updated_at: Date.now(),
    df_previous_version: previousVersion ?? null,
  }).catch((err) => {
    console.warn(`[${EXTENSION_NAME}] Failed to save update metadata:`, err);
  });

  // Show a notification about the update (if notifications are enabled)
  chrome.storage.local.get('df_settings').then((result) => {
    const settings = result['df_settings'] as { general?: { notificationsEnabled?: boolean } } | undefined;
    const notificationsEnabled = settings?.general?.notificationsEnabled ?? true;

    if (notificationsEnabled && previousVersion !== currentVersion) {
      chrome.notifications.create(`df_update_${currentVersion}`, {
        type: 'basic',
        iconUrl: chrome.runtime.getURL('icons/icon128.png'),
        title: `${EXTENSION_NAME} Updated`,
        message: `Updated to v${currentVersion}. Click to see what's new.`,
        priority: 1,
      }).catch(() => {
        // Notifications permission may not be granted
      });
    }
  }).catch(() => {
    // Storage read failure — non-critical
  });
}

// Handle clicks on update notifications → open changelog
chrome.notifications.onClicked.addListener((notificationId) => {
  if (notificationId.startsWith('df_update_')) {
    chrome.tabs.create({ url: UPDATE_URL }).catch(() => {
      // Best effort
    });
    chrome.notifications.clear(notificationId).catch(() => {
      // Best effort
    });
  }
});

// ---------------------------------------------------------------------------
// chrome.action.onClicked — extension icon click
// ---------------------------------------------------------------------------

// Note: With openPanelOnActionClick = true, clicking the action icon
// automatically opens the side panel. This handler is a fallback for
// environments where sidePanel.setPanelBehavior is not supported.
chrome.action.onClicked.addListener(async (tab) => {
  try {
    if (chrome.sidePanel?.open) {
      await chrome.sidePanel.open({ tabId: tab.id });
    }
  } catch (err) {
    console.warn(`[${EXTENSION_NAME}] Failed to open side panel on action click:`, err);
  }
});

// ---------------------------------------------------------------------------
// Tab lifecycle events
// ---------------------------------------------------------------------------

chrome.tabs.onRemoved.addListener((tabId) => {
  extractionManager.handleTabClosed(tabId);
  // TabManager handles this internally via its own listener
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'loading' && changeInfo.url) {
    extractionManager.handleTabNavigated(tabId);
  }
});

// ---------------------------------------------------------------------------
// Async initialization
// ---------------------------------------------------------------------------

/**
 * Initialize all subsystems asynchronously.
 * This is called immediately but does not block event listener registration.
 */
async function initializeSubsystems(): Promise<void> {
  try {
    // Wire up broadcast functions so subsystems can push messages to the sidepanel
    extractionManager.onBroadcast(broadcastMessage);
    tabManager.onBroadcast(broadcastMessage);
    schedulerOnBroadcast(broadcastMessage);

    // Initialize subsystems in parallel
    await Promise.all([
      extractionManager.init(),
      tabManager.init(),
      networkMonitor.init(),
      initScheduler(),
    ]);

    // Set up message router with all dependencies
    initMessageRouter({
      extractionManager,
      networkMonitor,
      tabManager,
    });

    // Register the scheduler's extraction trigger callback.
    // When a scheduled alarm fires, this creates a new tab, injects the
    // content script, and starts extraction.
    onExtractionTrigger(async (config, url, _scheduleId) => {
      try {
        // Open a new tab for the scheduled extraction
        const tab = await chrome.tabs.create({ url, active: false });
        if (!tab.id) {
          return false;
        }

        // Wait for the tab to load
        await waitForTabComplete(tab.id);

        // Inject content script
        await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content/index.js'],
        });

        // Small delay for content script initialization
        await delay(500);

        // Create the extraction job
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

// ---------------------------------------------------------------------------
// Utility
// ---------------------------------------------------------------------------

/**
 * Wait for a tab to complete loading (with timeout).
 */
function waitForTabComplete(tabId: number, timeoutMs = 30_000): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    let settled = false;

    const timer = setTimeout(() => {
      if (!settled) {
        settled = true;
        chrome.tabs.onUpdated.removeListener(listener);
        reject(new Error(`Tab ${tabId} load timeout after ${timeoutMs}ms`));
      }
    }, timeoutMs);

    const listener = (
      updatedTabId: number,
      changeInfo: chrome.tabs.TabChangeInfo,
    ) => {
      if (updatedTabId === tabId && changeInfo.status === 'complete' && !settled) {
        settled = true;
        clearTimeout(timer);
        chrome.tabs.onUpdated.removeListener(listener);
        resolve();
      }
    };

    chrome.tabs.onUpdated.addListener(listener);

    // Check if already loaded
    chrome.tabs.get(tabId).then((tab) => {
      if (tab.status === 'complete' && !settled) {
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

/**
 * Simple delay promise.
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ---------------------------------------------------------------------------
// Start initialization
// ---------------------------------------------------------------------------

initializeSubsystems();
