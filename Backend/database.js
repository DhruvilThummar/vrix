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
  cmsSettings: cmsService,
  users: userService,

  notifications: {
    findMany: async () => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.notification.findMany({ orderBy: { createdAt: "desc" }, take: 50 });
        } catch (e) {}
      }
      if (supabase) {
        try {
          const { data } = await supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(50);
          if (Array.isArray(data)) return data;
        } catch (e) {}
      }
      return [];
    },
    update: async ({ where, data }) => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.notification.update({ where, data });
        } catch (e) {}
      }
      if (supabase) {
        try {
          const { data: res } = await supabase.from("notifications").update(data).eq("id", where?.id).select().single();
          if (res) return res;
        } catch (e) {}
      }
      return { id: where?.id, ...data };
    },
    updateMany: async ({ data }) => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.notification.updateMany({ data });
        } catch (e) {}
      }
      if (supabase) {
        try {
          await supabase.from("notifications").update(data).neq("id", "00000000-0000-0000-0000-000000000000");
        } catch (e) {}
      }
      return { count: 0 };
    },
    deleteMany: async () => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.notification.deleteMany();
        } catch (e) {}
      }
      if (supabase) {
        try {
          await supabase.from("notifications").delete().neq("id", "00000000-0000-0000-0000-000000000000");
        } catch (e) {}
      }
      return { count: 0 };
    }
  },

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
    findFirst: async ({ where }) => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.verificationOtp.findFirst({ where });
        } catch (e) {}
      }
      return null;
    },
    create: async (data) => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.verificationOtp.create({ data });
        } catch (e) {}
      }
      return data;
    },
    delete: async ({ where }) => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.verificationOtp.delete({ where });
        } catch (e) {}
      }
      return true;
    },
    deleteMany: async ({ where } = {}) => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.verificationOtp.deleteMany({ where });
        } catch (e) {}
      }
      return { count: 0 };
    }
  },

  redeemCodes: {
    findMany: async () => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.redeemCode.findMany({ orderBy: { createdAt: "desc" } });
        } catch (e) {}
      }
      return [];
    },
    findUnique: async ({ where }) => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.redeemCode.findUnique({ where });
        } catch (e) {}
      }
      return null;
    },
    create: async ({ data }) => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.redeemCode.create({ data });
        } catch (e) {}
      }
      return data;
    },
    update: async ({ where, data }) => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.redeemCode.update({ where, data });
        } catch (e) {}
      }
      return { id: where?.code, ...data };
    },
    delete: async ({ where }) => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.redeemCode.delete({ where });
        } catch (e) {}
      }
      return true;
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

db.verificationOtps = db.otps;
