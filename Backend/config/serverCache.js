// ─── Express Smart Lifecycle Server Cache ─────────────────────────────────────
const cacheStore = new Map();

// Lifecycle TTL Constants (in seconds)
export const CACHE_TTL = {
  PRODUCTS: 600,         // 10 minutes (frequently updated by admin/stock)
  CMS_CONTENT: 43200,    // 12 hours (static homepage, story, legal text)
  MEDIA_IMAGES: 1209600, // 14 days (1-2 weeks for uploaded media URLs)
  SECURITY_LOGS: 2592000 // 30 days (1 month for audit logs cleanup)
};

/**
 * Set cache item with custom or category-based TTL
 */
export const setServerCache = (key, data, ttlSeconds = CACHE_TTL.PRODUCTS) => {
  const expiresAt = Date.now() + ttlSeconds * 1000;
  cacheStore.set(key, { data, expiresAt, createdAt: Date.now() });
};

/**
 * Retrieve cached item if not expired
 */
export const getServerCache = (key) => {
  const item = cacheStore.get(key);
  if (!item) return null;
  if (Date.now() > item.expiresAt) {
    cacheStore.delete(key);
    return null;
  }
  return item.data;
};

/**
 * Targeted prefix invalidation (e.g. only clear 'products_' without touching CMS or images)
 */
export const clearServerCache = (prefix = "") => {
  if (!prefix) {
    cacheStore.clear();
    return;
  }
  for (const key of cacheStore.keys()) {
    if (key.startsWith(prefix)) {
      cacheStore.delete(key);
    }
  }
};

/**
 * Background Garbage Collector (Garbage Collection Cron)
 * Runs every 10 minutes to clean ONLY expired items smoothly without wiping valid active cache.
 */
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    let cleanedCount = 0;
    for (const [key, item] of cacheStore.entries()) {
      if (now > item.expiresAt) {
        cacheStore.delete(key);
        cleanedCount++;
      }
    }
    if (cleanedCount > 0) {
      console.log(`🧹 [Server Cache GC] Automatically cleaned ${cleanedCount} expired cache items.`);
    }
  }, 10 * 60 * 1000);
}
