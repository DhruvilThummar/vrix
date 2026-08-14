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

const inMemoryCarts = new Map();
const inMemoryWishlists = new Map();

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
    count: async () => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.redeemCode.count();
        } catch (e) {}
      }
      if (supabase) {
        try {
          const { count } = await supabase.from("redeem_codes").select("*", { count: "exact", head: true });
          if (typeof count === "number") return count;
        } catch (e) {}
      }
      const all = await db.redeemCodes.findMany();
      return all.length;
    },
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

  deliveryStaff: {
    findMany: async (args) => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.deliveryStaff.findMany(args || { orderBy: { createdAt: "desc" } });
        } catch (e) {}
      }
      if (supabase) {
        try {
          const { data } = await supabase.from("delivery_staff").select("*").order("created_at", { ascending: false });
          if (Array.isArray(data)) return data;
        } catch (e) {}
      }
      return [];
    },
    findUnique: async ({ where }) => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.deliveryStaff.findUnique({ where });
        } catch (e) {}
      }
      if (supabase) {
        try {
          const { data } = await supabase.from("delivery_staff").select("*").eq("email", where?.email).maybeSingle();
          if (data) return data;
        } catch (e) {}
      }
      return null;
    },
    create: async (args) => {
      const data = args?.data || args;
      if (isDbConnected && prisma) {
        try {
          return await prisma.deliveryStaff.create({ data });
        } catch (e) {}
      }
      if (supabase) {
        try {
          const { data: res } = await supabase.from("delivery_staff").insert([data]).select().single();
          if (res) return res;
        } catch (e) {}
      }
      return data;
    },
    update: async ({ where, data }) => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.deliveryStaff.update({ where, data });
        } catch (e) {}
      }
      if (supabase) {
        try {
          const { data: res } = await supabase.from("delivery_staff").update(data).eq("email", where?.email).select().single();
          if (res) return res;
        } catch (e) {}
      }
      return { email: where?.email, ...data };
    },
    delete: async ({ where }) => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.deliveryStaff.delete({ where });
        } catch (e) {}
      }
      if (supabase) {
        try {
          await supabase.from("delivery_staff").delete().eq("email", where?.email);
        } catch (e) {}
      }
      return true;
    },
    count: async () => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.deliveryStaff.count();
        } catch (e) {}
      }
      return 0;
    }
  },

  diamondEducation: {
    findMany: async (args) => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.diamondEducation.findMany(args || { orderBy: { createdAt: "desc" } });
        } catch (e) {}
      }
      if (supabase) {
        try {
          let query = supabase.from("diamond_education").select("*").order("created_at", { ascending: false });
          if (args?.where?.isPublished !== undefined) {
            query = query.eq("is_published", args.where.isPublished);
          }
          const { data } = await query;
          if (Array.isArray(data)) return data;
        } catch (e) {}
      }
      return [];
    },
    findUnique: async ({ where }) => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.diamondEducation.findUnique({ where });
        } catch (e) {}
      }
      if (supabase) {
        try {
          let query = supabase.from("diamond_education").select("*");
          if (where?.id) query = query.eq("id", where.id);
          else if (where?.slug) query = query.eq("slug", where.slug);
          const { data } = await query.maybeSingle();
          if (data) return data;
        } catch (e) {}
      }
      return null;
    },
    create: async (args) => {
      const data = args?.data || args;
      if (isDbConnected && prisma) {
        try {
          return await prisma.diamondEducation.create({ data });
        } catch (e) {}
      }
      if (supabase) {
        try {
          const { data: res } = await supabase.from("diamond_education").insert([data]).select().single();
          if (res) return res;
        } catch (e) {}
      }
      return data;
    },
    update: async ({ where, data }) => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.diamondEducation.update({ where, data });
        } catch (e) {}
      }
      if (supabase) {
        try {
          const { data: res } = await supabase.from("diamond_education").update(data).eq("id", where?.id).select().single();
          if (res) return res;
        } catch (e) {}
      }
      return { id: where?.id, ...data };
    },
    delete: async ({ where }) => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.diamondEducation.delete({ where });
        } catch (e) {}
      }
      if (supabase) {
        try {
          await supabase.from("diamond_education").delete().eq("id", where?.id);
        } catch (e) {}
      }
      return true;
    },
    count: async () => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.diamondEducation.count();
        } catch (e) {}
      }
      return 0;
    }
  },

  cookieConsent: {
    create: async ({ data }) => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.cookieConsent.create({ data });
        } catch (e) {}
      }
      return data;
    },
    findFirst: async ({ where }) => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.cookieConsent.findFirst({ where });
        } catch (e) {}
      }
      return null;
    }
  },

  bespokeSettings: {
    findUnique: async ({ where }) => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.bespokeSettings.findUnique({ where });
        } catch (e) {}
      }
      return null;
    },
    upsert: async ({ where, update, create }) => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.bespokeSettings.upsert({ where, update, create });
        } catch (e) {}
      }
      return create;
    }
  },
  bespokeOption: {
    findMany: async (args) => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.bespokeOption.findMany(args);
        } catch (e) {}
      }
      return [];
    },
    create: async ({ data }) => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.bespokeOption.create({ data });
        } catch (e) {}
      }
      return data;
    },
    update: async ({ where, data }) => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.bespokeOption.update({ where, data });
        } catch (e) {}
      }
      return data;
    },
    delete: async ({ where }) => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.bespokeOption.delete({ where });
        } catch (e) {}
      }
      return true;
    }
  },
  bespokeVariant: {
    findMany: async (args) => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.bespokeVariant.findMany(args);
        } catch (e) {}
      }
      return [];
    },
    upsert: async ({ where, update, create }) => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.bespokeVariant.upsert({ where, update, create });
        } catch (e) {}
      }
      return create;
    },
    delete: async ({ where }) => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.bespokeVariant.delete({ where });
        } catch (e) {}
      }
      return true;
    }
  },

  repairRequest: {
    create: async ({ data }) => {
      if (isDbConnected && prisma) {
        try {
          return await prisma.repairRequest.create({ data });
        } catch (e) {}
      }
      return data;
    }
  },

  carts: {
    findMany: async () => Array.from(inMemoryCarts.values()),
    findUnique: async ({ where }) => {
      const email = String(where?.userEmail || where?.email || "").trim().toLowerCase();
      return inMemoryCarts.get(email) || null;
    },
    upsert: async ({ where, create, update }) => {
      const email = String(where?.userEmail || create?.userEmail || "").trim().toLowerCase();
      const record = { userEmail: email, items: update?.items || create?.items || [], updatedAt: new Date() };
      inMemoryCarts.set(email, record);
      return record;
    }
  },

  wishlists: {
    findMany: async () => Array.from(inMemoryWishlists.values()),
    findUnique: async ({ where }) => {
      const email = String(where?.userEmail || where?.email || "").trim().toLowerCase();
      return inMemoryWishlists.get(email) || null;
    },
    upsert: async ({ where, create, update }) => {
      const email = String(where?.userEmail || create?.userEmail || "").trim().toLowerCase();
      const record = { userEmail: email, items: update?.items || create?.items || [], updatedAt: new Date() };
      inMemoryWishlists.set(email, record);
      return record;
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
db.cookieConsents = db.cookieConsent;

