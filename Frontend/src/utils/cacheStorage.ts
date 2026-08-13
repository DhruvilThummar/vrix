"use client";

const DB_NAME = "vrix_client_cache";
const DB_VERSION = 1;
const STORE_NAME = "api_cache";

function openDB(): Promise<IDBDatabase | null> {
  if (typeof window === "undefined" || !("indexedDB" in window)) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    try {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: any) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = (event: any) => {
        resolve(event.target.result);
      };

      request.onerror = () => {
        resolve(null);
      };
    } catch (e) {
      resolve(null);
    }
  });
}

export async function getClientCache<T = any>(key: string): Promise<T | null> {
  if (typeof window === "undefined") return null;

  try {
    const db = await openDB();
    if (db) {
      const data = await new Promise<T | null>((resolve) => {
        try {
          const tx = db.transaction(STORE_NAME, "readonly");
          const store = tx.objectStore(STORE_NAME);
          const req = store.get(key);
          req.onsuccess = () => {
            if (req.result && req.result.expiresAt > Date.now()) {
              resolve(req.result.value);
            } else {
              resolve(null);
            }
          };
          req.onerror = () => resolve(null);
        } catch (err) {
          resolve(null);
        }
      });
      if (data !== null) return data;
    }
  } catch (err) {
    // Fallback to localStorage
  }

  // Fallback to localStorage
  try {
    const raw = localStorage.getItem(`vrix_cache_${key}`);
    if (raw) {
      const item = JSON.parse(raw);
      if (item.expiresAt > Date.now()) {
        return item.value as T;
      }
      localStorage.removeItem(`vrix_cache_${key}`);
    }
  } catch (e) {}

  return null;
}

export async function setClientCache(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
  if (typeof window === "undefined" || !value) return;

  const expiresAt = Date.now() + ttlSeconds * 1000;
  const payload = { value, expiresAt, cachedAt: new Date().toISOString() };

  try {
    const db = await openDB();
    if (db) {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.put(payload, key);
    }
  } catch (e) {}

  try {
    localStorage.setItem(`vrix_cache_${key}`, JSON.stringify(payload));
  } catch (e) {}
}

/**
 * Pre-caches product images into browser memory cache for instant visual load
 */
export function precacheImages(urls: string[]) {
  if (typeof window === "undefined" || !Array.isArray(urls)) return;
  
  const uniqueUrls = Array.from(new Set(urls.filter((u) => typeof u === "string" && u.startsWith("http")))).slice(0, 15);
  
  setTimeout(() => {
    uniqueUrls.forEach((url) => {
      const img = new window.Image();
      img.src = url;
    });
  }, 100);
}
