import { supabase } from "./config/supabaseClient.js";
import { prisma, isDbConnected } from "./config/prismaClient.js";
import { productService } from "./services/productService.js";
import { cmsService } from "./services/cmsService.js";
import { userService } from "./services/userService.js";

export { supabase, prisma };

export async function ensureTablesExist() {
  return true;
}

export async function migrateIfNeeded() {
  return true;
}

export const db = {
  isConnected: () => isDbConnected || !!supabase,

  products: productService,
  cms: cmsService,
  users: userService,

  journal: {
    findMany: async () => {
      if (isDbConnected && prisma) {
        try {
          const res = await prisma.journal.findMany({ orderBy: { createdAt: "desc" } });
          if (Array.isArray(res)) return res;
        } catch (e) {}
      }
      if (supabase) {
        try {
          const { data } = await supabase.from("journal").select("*").order("created_at", { ascending: false });
          if (Array.isArray(data)) return data;
        } catch (e) {}
      }
      return [];
    },
    create: async (data) => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.journal.create({ data });
        } catch (e) {}
      }
      if (supabase) {
        try {
          const { data: res } = await supabase.from("journal").insert([data]).select().single();
          if (res) return res;
        } catch (e) {}
      }
      return data;
    }
  },

  payments: {
    findMany: async () => {
      if (isDbConnected && prisma) {
        try {
          const res = await prisma.payment.findMany({ orderBy: { createdAt: "desc" } });
          if (Array.isArray(res)) return res;
        } catch (e) {}
      }
      if (supabase) {
        try {
          const { data } = await supabase.from("payments").select("*").order("created_at", { ascending: false });
          if (Array.isArray(data)) return data;
        } catch (e) {}
      }
      return [];
    },
    create: async (data) => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.payment.create({ data });
        } catch (e) {}
      }
      if (supabase) {
        try {
          const { data: res } = await supabase.from("payments").insert([data]).select().single();
          if (res) return res;
        } catch (e) {}
      }
      return data;
    }
  },

  otps: {
    findMany: async () => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.verificationOtp.findMany({ orderBy: { createdAt: "desc" } });
        } catch (e) {}
      }
      return [];
    },
    create: async (data) => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.verificationOtp.create({ data });
        } catch (e) {}
      }
      return data;
    }
  },

  securityLogs: {
    findMany: async () => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.securityLog.findMany({ orderBy: { createdAt: "desc" } });
        } catch (e) {}
      }
      return [];
    },
    create: async (data) => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.securityLog.create({ data });
        } catch (e) {}
      }
      return data;
    }
  }
};
