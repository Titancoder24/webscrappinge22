/**
 * DataForge Background Service Worker
 * Coordinates extraction jobs, scheduling, tab management, and message routing.
 * Runs as a Manifest V3 service worker (no DOM access).
 */

// ============================================================
// STATE
// ============================================================
const state = {
  activeExtractions: new Map(), // tabId -> extraction state
  scheduledJobs: [],
  networkLog: new Map(), // tabId -> recent requests
};

// ============================================================
// SIDE PANEL MANAGEMENT
// ============================================================
chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true }).catch(() => {});

chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ tabId: tab.id }).catch(() => {});
});

// ============================================================
// MESSAGE ROUTER
// ============================================================
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handler = messageHandlers[message.type];
  if (handler) {
    const result = handler(message, sender);
    if (result instanceof Promise) {
      result.then(sendResponse).catch(err => sendResponse({ error: err.message }));
      return true; // async
    }
    if (result !== undefined) sendResponse(result);
  }
  return false;
});

const messageHandlers = {
  // Relay messages from sidepanel to content script
  SCAN_PAGE: async (msg, sender) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return { error: 'No active tab' };
    return chrome.tabs.sendMessage(tab.id, msg);
  },

  SELECT_PATTERN: async (msg) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return { error: 'No active tab' };
    return chrome.tabs.sendMessage(tab.id, msg);
  },

  HIGHLIGHT_ELEMENTS: async (msg) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    return chrome.tabs.sendMessage(tab.id, msg);
  },

  CLEAR_HIGHLIGHTS: async (msg) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    return chrome.tabs.sendMessage(tab.id, msg);
  },

  TEST_SELECTOR: async (msg) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return { error: 'No active tab' };
    return chrome.tabs.sendMessage(tab.id, msg);
  },

  START_EXTRACTION: async (msg) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return { error: 'No active tab' };
    state.activeExtractions.set(tab.id, {
      status: 'running',
      startTime: Date.now(),
      config: msg.config,
      itemCount: 0,
      pageCount: 0,
    });
    return chrome.tabs.sendMessage(tab.id, msg);
  },

  PAUSE_EXTRACTION: async (msg) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    const ext = state.activeExtractions.get(tab.id);
    if (ext) ext.status = 'paused';
    return chrome.tabs.sendMessage(tab.id, msg);
  },

  RESUME_EXTRACTION: async (msg) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    const ext = state.activeExtractions.get(tab.id);
    if (ext) ext.status = 'running';
    return chrome.tabs.sendMessage(tab.id, msg);
  },

  STOP_EXTRACTION: async (msg) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    state.activeExtractions.delete(tab.id);
    return chrome.tabs.sendMessage(tab.id, msg);
  },

  // Relay messages from content script to sidepanel
  EXTRACTION_PROGRESS: (msg, sender) => {
    const ext = state.activeExtractions.get(sender.tab?.id);
    if (ext) {
      ext.itemCount = msg.data?.items || ext.itemCount;
      ext.pageCount = msg.data?.pages || ext.pageCount;
    }
    broadcastToSidePanel(msg);
  },

  EXTRACTION_ROW: (msg, sender) => {
    broadcastToSidePanel(msg);
  },

  EXTRACTION_BATCH: (msg, sender) => {
    broadcastToSidePanel(msg);
  },

  EXTRACTION_COMPLETE: (msg, sender) => {
    state.activeExtractions.delete(sender.tab?.id);
    broadcastToSidePanel(msg);
    // Show notification
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title: 'DataForge — Extraction Complete',
      message: `Extracted ${msg.summary?.totalItems || 0} items successfully.`,
    }).catch(() => {});
  },

  EXTRACTION_ERROR: (msg, sender) => {
    broadcastToSidePanel(msg);
  },

  SCAN_RESULT: (msg, sender) => {
    broadcastToSidePanel(msg);
  },

  SELECTION_CONFIRMED: (msg, sender) => {
    broadcastToSidePanel(msg);
  },

  SELECTOR_TEST_RESULT: (msg, sender) => {
    broadcastToSidePanel(msg);
  },

  // Content script injection for specific pages
  INJECT_CONTENT_SCRIPT: async (msg) => {
    const tabId = msg.tabId;
    if (!tabId) return { error: 'No tabId' };
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        files: [
          'content/engines/pattern-sense.js',
          'content/engines/selector-forge.js',
          'content/engines/page-sense.js',
          'content/engines/type-sense.js',
          'content/engines/clean-sense.js',
          'content/content.js',
        ],
      });
      return { success: true };
    } catch (e) {
      return { error: e.message };
    }
  },

  // Navigate to URL in active tab
  NAVIGATE_URL: async (msg) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    await chrome.tabs.update(tab.id, { url: msg.url });
  },

  // Webhook push
  WEBHOOK_PUSH: async (msg) => {
    try {
      const response = await fetch(msg.config.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(msg.config.headers || {}),
        },
        body: JSON.stringify(msg.data),
      });
      return { success: response.ok, status: response.status };
    } catch (e) {
      return { error: e.message };
    }
  },

  // Schedule extraction
  SCHEDULE_EXTRACTION: async (msg) => {
    const { config } = msg;
    const alarmName = `dataforge_schedule_${Date.now()}`;
    const job = { alarmName, config, createdAt: Date.now() };

    state.scheduledJobs.push(job);

    // Save to storage
    const stored = await chrome.storage.local.get('scheduledJobs');
    const jobs = stored.scheduledJobs || [];
    jobs.push(job);
    await chrome.storage.local.set({ scheduledJobs: jobs });

    // Create alarm
    const periodInMinutes = config.intervalMinutes || 60;
    await chrome.alarms.create(alarmName, {
      delayInMinutes: periodInMinutes,
      periodInMinutes,
    });

    return { success: true, alarmName };
  },

  GET_SCHEDULED_JOBS: async () => {
    const stored = await chrome.storage.local.get('scheduledJobs');
    return { jobs: stored.scheduledJobs || [] };
  },

  DELETE_SCHEDULED_JOB: async (msg) => {
    await chrome.alarms.clear(msg.alarmName);
    const stored = await chrome.storage.local.get('scheduledJobs');
    const jobs = (stored.scheduledJobs || []).filter(j => j.alarmName !== msg.alarmName);
    await chrome.storage.local.set({ scheduledJobs: jobs });
    state.scheduledJobs = state.scheduledJobs.filter(j => j.alarmName !== msg.alarmName);
    return { success: true };
  },

  // Storage operations for sidepanel
  SAVE_TO_STORAGE: async (msg) => {
    await chrome.storage.local.set({ [msg.key]: msg.value });
    return { success: true };
  },

  GET_FROM_STORAGE: async (msg) => {
    const result = await chrome.storage.local.get(msg.key);
    return { value: result[msg.key] };
  },

  // Get active tab info
  GET_ACTIVE_TAB: async () => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab ? { id: tab.id, url: tab.url, title: tab.title } : null;
  },

  // Activate selection mode on content script
  ACTIVATE_SELECTION: async (msg) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return { error: 'No active tab' };
    return chrome.tabs.sendMessage(tab.id, { type: 'ACTIVATE_SELECTION', mode: msg.mode });
  },

  DEACTIVATE_SELECTION: async (msg) => {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;
    return chrome.tabs.sendMessage(tab.id, { type: 'DEACTIVATE_SELECTION' });
  },

  // Email extraction (crawl from background)
  START_EMAIL_CRAWL: async (msg) => {
    const { urls, maxDepth = 1, delay = 1000 } = msg;
    // Process will be handled in content script for each page
    return { started: true, urlCount: urls.length };
  },

  // Bulk page extraction
  START_BULK_EXTRACTION: async (msg) => {
    const { urls, selectors, delay = 1000 } = msg;
    return { started: true, urlCount: urls.length };
  },
};

function broadcastToSidePanel(message) {
  chrome.runtime.sendMessage(message).catch(() => {
    // Side panel might not be open
  });
}

// ============================================================
// ALARM HANDLER (Scheduled Extractions)
// ============================================================
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (!alarm.name.startsWith('dataforge_schedule_')) return;

  const stored = await chrome.storage.local.get('scheduledJobs');
  const jobs = stored.scheduledJobs || [];
  const job = jobs.find(j => j.alarmName === alarm.name);
  if (!job) return;

  // Open the target URL and run extraction
  try {
    const tab = await chrome.tabs.create({ url: job.config.url, active: false });
    // Wait for page load
    chrome.tabs.onUpdated.addListener(function listener(tabId, info) {
      if (tabId === tab.id && info.status === 'complete') {
        chrome.tabs.onUpdated.removeListener(listener);
        // Inject content scripts and start extraction
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: [
            'content/engines/pattern-sense.js',
            'content/engines/selector-forge.js',
            'content/engines/page-sense.js',
            'content/engines/type-sense.js',
            'content/engines/clean-sense.js',
            'content/content.js',
          ],
        }).then(() => {
          setTimeout(() => {
            chrome.tabs.sendMessage(tab.id, {
              type: 'START_EXTRACTION',
              config: job.config.extractionConfig,
            });
          }, 1000);
        });
      }
    });
  } catch (e) {
    console.error('Scheduled extraction failed:', e);
  }
});

// ============================================================
// TAB MANAGEMENT
// ============================================================
chrome.tabs.onRemoved.addListener((tabId) => {
  state.activeExtractions.delete(tabId);
  state.networkLog.delete(tabId);
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  // Notify sidepanel of tab change
  broadcastToSidePanel({ type: 'TAB_CHANGED', tabId: activeInfo.tabId });
});

// ============================================================
// INSTALLATION
// ============================================================
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    // Set default settings
    chrome.storage.local.set({
      settings: {
        extractionDelay: 500,
        maxConcurrentTabs: 2,
        respectRobotsTxt: true,
        autoClean: true,
        animationsEnabled: true,
        notificationsEnabled: true,
        defaultExportFormat: 'csv',
        maxItemsPerExtraction: 10000,
        scrollSpeed: 'medium',
        theme: 'dark',
      },
      history: [],
      templates: [],
      scheduledJobs: [],
    });
  }
});

console.log('DataForge background service worker loaded.');
