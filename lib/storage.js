/**
 * DataForge Storage Utilities
 * Wrappers around chrome.storage and IndexedDB.
 */
(function () {
  'use strict';

  const DB_NAME = 'DataForge';
  const DB_VERSION = 1;
  const STORE_NAME = 'tables';

  let dbInstance = null;

  function openDB() {
    return new Promise((resolve, reject) => {
      if (dbInstance) return resolve(dbInstance);

      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        }
      };
      request.onsuccess = (event) => {
        dbInstance = event.target.result;
        resolve(dbInstance);
      };
      request.onerror = () => reject(request.error);
    });
  }

  window.DataForgeStorage = {
    async saveTable(id, rows, columns, meta = {}) {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put({
          id,
          rows,
          columns,
          ...meta,
          updatedAt: Date.now(),
        });
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    },

    async loadTable(id) {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).get(id);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    },

    async deleteTable(id) {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).delete(id);
        tx.oncomplete = resolve;
        tx.onerror = () => reject(tx.error);
      });
    },

    async listTables() {
      const db = await openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const req = tx.objectStore(STORE_NAME).getAllKeys();
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });
    },

    // Chrome storage helpers
    async get(key) {
      return new Promise((resolve) => {
        chrome.storage.local.get(key, (result) => {
          resolve(result[key]);
        });
      });
    },

    async set(key, value) {
      return chrome.storage.local.set({ [key]: value });
    },

    async remove(key) {
      return chrome.storage.local.remove(key);
    },
  };
})();
