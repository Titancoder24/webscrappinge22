/**
 * Type-safe wrappers around Chrome Extension APIs.
 *
 * All callback-based APIs are promisified. Every wrapper includes
 * error handling that converts chrome.runtime.lastError into rejected
 * promises with descriptive messages.
 */

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getLastError(): string | null {
  return chrome.runtime.lastError?.message ?? null;
}

function rejectOnError<T>(resolve: (v: T) => void, reject: (e: Error) => void) {
  return (result: T) => {
    const err = getLastError();
    if (err) {
      reject(new Error(`Chrome API error: ${err}`));
    } else {
      resolve(result);
    }
  };
}

// ---------------------------------------------------------------------------
// chrome.runtime
// ---------------------------------------------------------------------------

export function sendRuntimeMessage<T = unknown>(message: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage(message, rejectOnError<T>(resolve, reject));
  });
}

export function getExtensionURL(path: string): string {
  return chrome.runtime.getURL(path);
}

export function getManifest(): chrome.runtime.Manifest {
  return chrome.runtime.getManifest();
}

export function onMessage(
  handler: (
    message: unknown,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response?: unknown) => void,
  ) => boolean | void,
): () => void {
  chrome.runtime.onMessage.addListener(handler);
  return () => chrome.runtime.onMessage.removeListener(handler);
}

// ---------------------------------------------------------------------------
// chrome.tabs
// ---------------------------------------------------------------------------

export function getActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const err = getLastError();
      if (err) {
        reject(new Error(`Chrome tabs query error: ${err}`));
      } else {
        resolve(tabs[0]);
      }
    });
  });
}

export function getTab(tabId: number): Promise<chrome.tabs.Tab> {
  return new Promise((resolve, reject) => {
    chrome.tabs.get(tabId, rejectOnError(resolve, reject));
  });
}

export function sendTabMessage<T = unknown>(tabId: number, message: unknown): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, rejectOnError<T>(resolve, reject));
  });
}

export function createTab(options: chrome.tabs.CreateProperties): Promise<chrome.tabs.Tab> {
  return new Promise((resolve, reject) => {
    chrome.tabs.create(options, rejectOnError(resolve, reject));
  });
}

export function updateTab(
  tabId: number,
  updates: chrome.tabs.UpdateProperties,
): Promise<chrome.tabs.Tab | undefined> {
  return new Promise((resolve, reject) => {
    chrome.tabs.update(tabId, updates, rejectOnError(resolve, reject));
  });
}

export function executeScript(
  tabId: number,
  details: chrome.scripting.ScriptInjection,
): Promise<chrome.scripting.InjectionResult[]> {
  return chrome.scripting.executeScript({ ...details, target: { tabId } });
}

// ---------------------------------------------------------------------------
// chrome.storage.local
// ---------------------------------------------------------------------------

export function storageLocalGet<T = Record<string, unknown>>(
  keys: string | string[],
): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get(keys, (items) => {
      const err = getLastError();
      if (err) {
        reject(new Error(`Storage local get error: ${err}`));
      } else {
        resolve(items as T);
      }
    });
  });
}

export function storageLocalSet(items: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set(items, () => {
      const err = getLastError();
      if (err) {
        reject(new Error(`Storage local set error: ${err}`));
      } else {
        resolve();
      }
    });
  });
}

export function storageLocalRemove(keys: string | string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.remove(keys, () => {
      const err = getLastError();
      if (err) {
        reject(new Error(`Storage local remove error: ${err}`));
      } else {
        resolve();
      }
    });
  });
}

export function storageLocalClear(): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.clear(() => {
      const err = getLastError();
      if (err) {
        reject(new Error(`Storage local clear error: ${err}`));
      } else {
        resolve();
      }
    });
  });
}

export function onStorageChanged(
  handler: (changes: { [key: string]: chrome.storage.StorageChange }, area: string) => void,
): () => void {
  chrome.storage.onChanged.addListener(handler);
  return () => chrome.storage.onChanged.removeListener(handler);
}

// ---------------------------------------------------------------------------
// chrome.storage.session
// ---------------------------------------------------------------------------

export function storageSessionGet<T = Record<string, unknown>>(
  keys: string | string[],
): Promise<T> {
  return new Promise((resolve, reject) => {
    chrome.storage.session.get(keys, (items) => {
      const err = getLastError();
      if (err) {
        reject(new Error(`Storage session get error: ${err}`));
      } else {
        resolve(items as T);
      }
    });
  });
}

export function storageSessionSet(items: Record<string, unknown>): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.session.set(items, () => {
      const err = getLastError();
      if (err) {
        reject(new Error(`Storage session set error: ${err}`));
      } else {
        resolve();
      }
    });
  });
}

export function storageSessionRemove(keys: string | string[]): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.session.remove(keys, () => {
      const err = getLastError();
      if (err) {
        reject(new Error(`Storage session remove error: ${err}`));
      } else {
        resolve();
      }
    });
  });
}

// ---------------------------------------------------------------------------
// chrome.alarms
// ---------------------------------------------------------------------------

export function createAlarm(name: string, alarmInfo: chrome.alarms.AlarmCreateInfo): void {
  chrome.alarms.create(name, alarmInfo);
}

export function clearAlarm(name: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    chrome.alarms.clear(name, (wasCleared) => {
      const err = getLastError();
      if (err) {
        reject(new Error(`Alarms clear error: ${err}`));
      } else {
        resolve(wasCleared);
      }
    });
  });
}

export function getAlarm(name: string): Promise<chrome.alarms.Alarm | undefined> {
  return new Promise((resolve, reject) => {
    chrome.alarms.get(name, (alarm) => {
      const err = getLastError();
      if (err) {
        reject(new Error(`Alarms get error: ${err}`));
      } else {
        resolve(alarm);
      }
    });
  });
}

export function onAlarm(handler: (alarm: chrome.alarms.Alarm) => void): () => void {
  chrome.alarms.onAlarm.addListener(handler);
  return () => chrome.alarms.onAlarm.removeListener(handler);
}

// ---------------------------------------------------------------------------
// chrome.downloads
// ---------------------------------------------------------------------------

export function download(
  options: chrome.downloads.DownloadOptions,
): Promise<number> {
  return new Promise((resolve, reject) => {
    chrome.downloads.download(options, (downloadId) => {
      const err = getLastError();
      if (err) {
        reject(new Error(`Download error: ${err}`));
      } else {
        resolve(downloadId);
      }
    });
  });
}

/**
 * Convenience: download a Blob as a file.
 */
export function downloadBlob(blob: Blob, filename: string): Promise<number> {
  const url = URL.createObjectURL(blob);
  return download({ url, filename, saveAs: true }).finally(() => {
    URL.revokeObjectURL(url);
  });
}

// ---------------------------------------------------------------------------
// chrome.notifications
// ---------------------------------------------------------------------------

export function createNotification(
  id: string,
  options: chrome.notifications.NotificationOptions<true>,
): Promise<string> {
  return new Promise((resolve, reject) => {
    chrome.notifications.create(id, options, (notificationId) => {
      const err = getLastError();
      if (err) {
        reject(new Error(`Notification error: ${err}`));
      } else {
        resolve(notificationId);
      }
    });
  });
}

export function clearNotification(id: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    chrome.notifications.clear(id, (wasCleared) => {
      const err = getLastError();
      if (err) {
        reject(new Error(`Clear notification error: ${err}`));
      } else {
        resolve(wasCleared);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// Utility: check if running in extension context
// ---------------------------------------------------------------------------

export function isExtensionContext(): boolean {
  return typeof chrome !== 'undefined' && !!chrome.runtime?.id;
}
