import { prisma, isDbConnected } from "../config/prismaClient.js";
import { supabase } from "../config/supabaseClient.js";

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
    if (isDbConnected && prisma) {
      try {
        const res = await withTimeout(prisma.cmsSetting.findUnique({ where: { key } }), 600);
        if (res && res.value !== undefined) return res.value;
      } catch (err) {}
    }
    if (supabase) {
      try {
        const { data, error } = await supabase.from("cms_settings").select("value").eq("key", key).maybeSingle();
        if (!error && data && data.value !== undefined) return data.value;
      } catch (e) {}
    }
    return null;
  },

  update: async (key, value) => {
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
    const result = {};
    if (isDbConnected && prisma) {
      try {
        const rows = await withTimeout(prisma.cmsSetting.findMany(), 800);
        if (Array.isArray(rows)) {
          for (const row of rows) {
            result[row.key] = row.value;
          }
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
          }
          return result;
        }
      } catch (e) {}
    }
    return result;
  }
};
