import { prisma, isDbConnected } from "../config/prismaClient.js";
import { supabase } from "../config/supabaseClient.js";

const cmsCache = new Map();
const CMS_TTL_MS = 60000; // 60-second high-speed in-memory cache TTL

const withTimeout = (promise, ms) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`CMS Microservice query timed out after ${ms}ms`)), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
};

export const cmsService = {
  get: async (key) => {
    const cached = cmsCache.get(key);
    if (cached && Date.now() - cached.ts < CMS_TTL_MS) {
      return cached.val;
    }

    let val = null;
    if (isDbConnected && prisma) {
      try {
        const res = await withTimeout(prisma.cmsSetting.findUnique({ where: { key } }), 500);
        if (res && res.value !== undefined) val = res.value;
      } catch (err) {}
    }
    if (val === null && supabase) {
      try {
        const { data, error } = await supabase.from("cms_settings").select("value").eq("key", key).maybeSingle();
        if (!error && data && data.value !== undefined) val = data.value;
      } catch (e) {}
    }

    if (val !== null) {
      cmsCache.set(key, { val, ts: Date.now() });
    }
    return val;
  },

  findUnique: async ({ where }) => {
    const key = where?.key;
    if (!key) return null;
    return await cmsService.get(key);
  },

  findMany: async () => {
    return await cmsService.publicAll();
  },

  upsert: async ({ where, update, create }) => {
    const key = where?.key;
    const value = update?.value || create?.value;
    if (!key) return null;
    return await cmsService.update(key, value);
  },

  update: async (key, value) => {
    cmsCache.set(key, { val: value, ts: Date.now() });
    let result = value;
    if (isDbConnected && prisma) {
      try {
        const res = await prisma.cmsSetting.upsert({
          where: { key },
          update: { value },
          create: { key, value },
        });
        result = res.value;
      } catch (err) {}
    }
    if (supabase) {
      try {
        await supabase.from("cms_settings").upsert({ key, value, updated_at: new Date().toISOString() });
      } catch (e) {}
    }
    return result;
  },

  publicAll: async () => {
    const cachedAll = cmsCache.get("__ALL__");
    if (cachedAll && Date.now() - cachedAll.ts < CMS_TTL_MS) {
      return cachedAll.val;
    }

    const result = {};
    if (isDbConnected && prisma) {
      try {
        const rows = await withTimeout(prisma.cmsSetting.findMany(), 600);
        if (Array.isArray(rows)) {
          for (const row of rows) {
            result[row.key] = row.value;
            cmsCache.set(row.key, { val: row.value, ts: Date.now() });
          }
          cmsCache.set("__ALL__", { val: result, ts: Date.now() });
          return result;
        }
      } catch (err) {}
    }
    if (supabase) {
      try {
        const { data, error } = await supabase.from("cms_settings").select("key, value");
        if (!error && Array.isArray(data)) {
          for (const row of data) {
            result[row.key] = row.value;
            cmsCache.set(row.key, { val: row.value, ts: Date.now() });
          }
          cmsCache.set("__ALL__", { val: result, ts: Date.now() });
          return result;
        }
      } catch (e) {}
    }
    return result;
  },
};
