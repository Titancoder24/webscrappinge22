/**
 * Storage layer for DataForge.
 *
 * Three tiers:
 * 1. IndexedDB  — Large datasets (extracted data tables, row data).
 * 2. chrome.storage.local — Persistent settings and metadata (survives restart).
 * 3. chrome.storage.session — Ephemeral state (cleared when browser closes).
 *
 * Database: "DataForgeDB", version 1
 * Object stores:
 *   - "tables"  — TableMeta objects keyed by `id`
 *   - "rows"    — Row[] arrays keyed by `tableId`
 */

import type { TableMeta } from '../types/table';
import type { Row } from '../types/extraction';
import {
  storageLocalGet,
  storageLocalSet,
  storageLocalRemove,
  storageSessionGet,
  storageSessionSet,
  storageSessionRemove,
} from './chrome-api';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DB_NAME = 'DataForgeDB';
const DB_VERSION = 1;
const STORE_TABLES = 'tables';
const STORE_ROWS = 'rows';

// ---------------------------------------------------------------------------
// IndexedDB singleton
// ---------------------------------------------------------------------------

let dbInstance: IDBDatabase | null = null;
let dbInitPromise: Promise<IDBDatabase> | null = null;

/**
 * Initialize (or return the existing) IndexedDB connection.
 *
 * Creates the database and object stores on first run or version upgrade.
 * Handles corruption by deleting and re-creating the database.
 */
export function initDB(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }
  if (dbInitPromise) {
    return dbInitPromise;
  }

  dbInitPromise = new Promise<IDBDatabase>((resolve, reject) => {
    let request: IDBOpenDBRequest;

    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch (err) {
      dbInitPromise = null;
      reject(new Error(`Failed to open IndexedDB: ${String(err)}`));
      return;
    }

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORE_TABLES)) {
        db.createObjectStore(STORE_TABLES, { keyPath: 'id' });
      }

      if (!db.objectStoreNames.contains(STORE_ROWS)) {
        db.createObjectStore(STORE_ROWS);
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Handle unexpected close (corruption, user clearing storage, etc.)
      db.onclose = () => {
        dbInstance = null;
        dbInitPromise = null;
      };

      db.onerror = () => {
        dbInstance = null;
        dbInitPromise = null;
      };

      dbInstance = db;
      resolve(db);
    };

    request.onerror = () => {
      dbInitPromise = null;
      reject(new Error(`IndexedDB open error: ${request.error?.message ?? 'Unknown error'}`));
    };

    request.onblocked = () => {
      dbInitPromise = null;
      reject(new Error('IndexedDB open blocked — close other tabs using DataForge'));
    };
  });

  return dbInitPromise;
}

/**
 * Delete the entire database. Useful for recovery from corruption.
 */
export function deleteDB(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      dbInstance.close();
      dbInstance = null;
      dbInitPromise = null;
    }

    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () =>
      reject(new Error(`Failed to delete database: ${request.error?.message ?? 'Unknown'}`));
    request.onblocked = () =>
      reject(new Error('Database deletion blocked — close other tabs'));
  });
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function withTransaction<T>(
  storeNames: string | string[],
  mode: IDBTransactionMode,
  operation: (tx: IDBTransaction) => IDBRequest<T>,
): Promise<T> {
  return initDB().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        let tx: IDBTransaction;
        try {
          tx = db.transaction(storeNames, mode);
        } catch (err) {
          reject(new Error(`Transaction error: ${String(err)}`));
          return;
        }

        tx.onerror = () => {
          reject(new Error(`Transaction failed: ${tx.error?.message ?? 'Unknown'}`));
        };

        try {
          const request = operation(tx);
          request.onsuccess = () => resolve(request.result);
          request.onerror = () =>
            reject(new Error(`Request failed: ${request.error?.message ?? 'Unknown'}`));
        } catch (err) {
          reject(new Error(`Operation error: ${String(err)}`));
        }
      }),
  );
}

function isQuotaExceededError(err: unknown): boolean {
  if (err instanceof DOMException) {
    return (
      err.name === 'QuotaExceededError' ||
      err.code === 22 ||
      err.name === 'NS_ERROR_DOM_QUOTA_REACHED'
    );
  }
  return false;
}

function wrapStorageError(err: unknown, context: string): Error {
  if (isQuotaExceededError(err)) {
    return new Error(`Storage quota exceeded while ${context}. Free up space or delete old tables.`);
  }
  if (err instanceof Error) {
    return new Error(`${context}: ${err.message}`);
  }
  return new Error(`${context}: ${String(err)}`);
}

// ---------------------------------------------------------------------------
// Table metadata operations (IndexedDB "tables" store)
// ---------------------------------------------------------------------------

/**
 * Save or update table metadata.
 */
export async function saveTable(table: TableMeta): Promise<void> {
  try {
    await withTransaction(STORE_TABLES, 'readwrite', (tx) =>
      tx.objectStore(STORE_TABLES).put(table),
    );
  } catch (err) {
    throw wrapStorageError(err, 'saving table metadata');
  }
}

/**
 * Load a single table's metadata by ID.
 * Returns `null` if the table does not exist.
 */
export async function loadTable(tableId: string): Promise<TableMeta | null> {
  try {
    const result = await withTransaction(STORE_TABLES, 'readonly', (tx) =>
      tx.objectStore(STORE_TABLES).get(tableId),
    );
    return (result as TableMeta) ?? null;
  } catch (err) {
    throw wrapStorageError(err, `loading table "${tableId}"`);
  }
}

/**
 * Delete a table and its associated rows.
 */
export async function deleteTable(tableId: string): Promise<void> {
  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_TABLES, STORE_ROWS], 'readwrite');

      tx.onerror = () =>
        reject(new Error(`Delete transaction failed: ${tx.error?.message ?? 'Unknown'}`));

      tx.objectStore(STORE_TABLES).delete(tableId);
      tx.objectStore(STORE_ROWS).delete(tableId);

      tx.oncomplete = () => resolve();
    });
  } catch (err) {
    throw wrapStorageError(err, `deleting table "${tableId}"`);
  }
}

/**
 * List all table metadata entries, sorted by `updatedAt` descending.
 */
export async function listTables(): Promise<TableMeta[]> {
  try {
    const result = await withTransaction(STORE_TABLES, 'readonly', (tx) =>
      tx.objectStore(STORE_TABLES).getAll(),
    );
    const tables = (result as TableMeta[]) ?? [];
    tables.sort((a, b) => b.updatedAt - a.updatedAt);
    return tables;
  } catch (err) {
    throw wrapStorageError(err, 'listing tables');
  }
}

// ---------------------------------------------------------------------------
// Row data operations (IndexedDB "rows" store, keyed by tableId)
// ---------------------------------------------------------------------------

/**
 * Save all rows for a given table (replaces existing rows).
 */
export async function saveRows(tableId: string, rows: Row[]): Promise<void> {
  try {
    await withTransaction(STORE_ROWS, 'readwrite', (tx) =>
      tx.objectStore(STORE_ROWS).put(rows, tableId),
    );
  } catch (err) {
    throw wrapStorageError(err, `saving rows for table "${tableId}"`);
  }
}

/**
 * Load all rows for a given table.
 * Returns an empty array if no rows exist.
 */
export async function loadRows(tableId: string): Promise<Row[]> {
  try {
    const result = await withTransaction(STORE_ROWS, 'readonly', (tx) =>
      tx.objectStore(STORE_ROWS).get(tableId),
    );
    return (result as Row[]) ?? [];
  } catch (err) {
    throw wrapStorageError(err, `loading rows for table "${tableId}"`);
  }
}

/**
 * Append rows to an existing table's row data.
 * If the table has no existing rows, creates a new entry.
 */
export async function appendRows(tableId: string, newRows: Row[]): Promise<void> {
  if (newRows.length === 0) return;

  try {
    const db = await initDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_ROWS, 'readwrite');
      const store = tx.objectStore(STORE_ROWS);

      tx.onerror = () =>
        reject(new Error(`Append rows transaction failed: ${tx.error?.message ?? 'Unknown'}`));

      const getRequest = store.get(tableId);
      getRequest.onsuccess = () => {
        const existing = (getRequest.result as Row[] | undefined) ?? [];
        const merged = [...existing, ...newRows];
        const putRequest = store.put(merged, tableId);
        putRequest.onerror = () =>
          reject(new Error(`Failed to put rows: ${putRequest.error?.message ?? 'Unknown'}`));
      };
      getRequest.onerror = () =>
        reject(new Error(`Failed to get existing rows: ${getRequest.error?.message ?? 'Unknown'}`));

      tx.oncomplete = () => resolve();
    });
  } catch (err) {
    throw wrapStorageError(err, `appending rows for table "${tableId}"`);
  }
}

/**
 * Delete rows for a given table without removing the table metadata.
 */
export async function deleteRows(tableId: string): Promise<void> {
  try {
    await withTransaction(STORE_ROWS, 'readwrite', (tx) =>
      tx.objectStore(STORE_ROWS).delete(tableId),
    );
  } catch (err) {
    throw wrapStorageError(err, `deleting rows for table "${tableId}"`);
  }
}

// ---------------------------------------------------------------------------
// chrome.storage.local — Settings & persistent metadata
// ---------------------------------------------------------------------------

/**
 * Save a value to chrome.storage.local under the given key.
 */
export async function saveSetting<T>(key: string, value: T): Promise<void> {
  try {
    await storageLocalSet({ [key]: value });
  } catch (err) {
    throw wrapStorageError(err, `saving setting "${key}"`);
  }
}

/**
 * Load a value from chrome.storage.local.
 * Returns `defaultValue` if the key does not exist.
 */
export async function loadSetting<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const result = await storageLocalGet<Record<string, T>>([key]);
    return key in result ? result[key] : defaultValue;
  } catch (err) {
    throw wrapStorageError(err, `loading setting "${key}"`);
  }
}

/**
 * Remove a setting from chrome.storage.local.
 */
export async function removeSetting(key: string): Promise<void> {
  try {
    await storageLocalRemove(key);
  } catch (err) {
    throw wrapStorageError(err, `removing setting "${key}"`);
  }
}

// ---------------------------------------------------------------------------
// chrome.storage.session — Ephemeral state
// ---------------------------------------------------------------------------

/**
 * Save ephemeral state to chrome.storage.session.
 * This data is cleared when the browser session ends.
 */
export async function saveSessionState<T>(key: string, value: T): Promise<void> {
  try {
    await storageSessionSet({ [key]: value });
  } catch (err) {
    throw wrapStorageError(err, `saving session state "${key}"`);
  }
}

/**
 * Load ephemeral state from chrome.storage.session.
 * Returns `defaultValue` if the key does not exist.
 */
export async function loadSessionState<T>(key: string, defaultValue: T): Promise<T> {
  try {
    const result = await storageSessionGet<Record<string, T>>([key]);
    return key in result ? result[key] : defaultValue;
  } catch (err) {
    throw wrapStorageError(err, `loading session state "${key}"`);
  }
}

/**
 * Remove ephemeral state from chrome.storage.session.
 */
export async function removeSessionState(key: string): Promise<void> {
  try {
    await storageSessionRemove(key);
  } catch (err) {
    throw wrapStorageError(err, `removing session state "${key}"`);
  }
}

// ---------------------------------------------------------------------------
// Storage usage estimation
// ---------------------------------------------------------------------------

/**
 * Estimate how much storage the extension is using.
 * Uses the StorageManager API when available.
 */
export async function estimateStorageUsage(): Promise<{
  usage: number;
  quota: number;
  percentUsed: number;
} | null> {
  if (typeof navigator !== 'undefined' && navigator.storage?.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const usage = estimate.usage ?? 0;
      const quota = estimate.quota ?? 0;
      return {
        usage,
        quota,
        percentUsed: quota > 0 ? (usage / quota) * 100 : 0,
      };
    } catch {
      return null;
    }
  }
  return null;
}
