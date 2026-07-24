import { fileURLToPath } from "url";
import fsDirect from "fs";
import pathDirect from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = pathDirect.dirname(__filename);
const DB_PATH = pathDirect.join(__dirname, "data", "db.json");

const normalizePrismaDatabaseUrl = () => {
  const rawUrl = process.env.DATABASE_URL;
  if (!rawUrl) return;

  try {
    const url = new URL(rawUrl);
    const isSupabasePooler =
      url.hostname.includes("pooler.supabase.com") ||
      url.port === "6543" ||
      rawUrl.toLowerCase().includes("pgbouncer");

    if (!isSupabasePooler) return;

    let changed = false;
    if (!url.searchParams.has("pgbouncer")) {
      url.searchParams.set("pgbouncer", "true");
      changed = true;
    }
    if (!url.searchParams.has("connection_limit")) {
      url.searchParams.set("connection_limit", "1");
      changed = true;
    }

    if (changed) {
      process.env.DATABASE_URL = url.toString();
      console.log("Database Access Layer: Enabled Prisma PgBouncer mode for Supabase pooler.");
    }
  } catch (error) {
    console.warn("Database Access Layer: Could not inspect DATABASE_URL for PgBouncer mode.", error);
  }
};

// Local DB Helpers
const readLocalDb = () => {
  try {
    const data = fsDirect.readFileSync(DB_PATH, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading local db.json fallback:", error);
    return {};
  }
};

const writeLocalDb = (data) => {
  try {
    fsDirect.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Error writing to local db.json fallback:", error);
    return false;
  }
};

// Check if DATABASE_URL is configured
normalizePrismaDatabaseUrl();
const isDbConnected = !!process.env.DATABASE_URL;
let prisma = null;

if (isDbConnected) {
  try {
    const { PrismaClient } = await import("@prisma/client");
    prisma = new PrismaClient();
    console.log("Database Access Layer: Prisma client initialized.");
  } catch (err) {
    console.error("Database Access Layer: Failed to load Prisma Client, falling back to db.json", err);
  }
} else {
  console.log("Database Access Layer: DATABASE_URL not set. Falling back to local db.json.");
}

const productSelect = {
  id: true,
  title: true,
  material: true,
  type: true,
  price: true,
  image: true,
  images: true,
  description: true,
  alt: true,
  collection: true,
  stock: true,
  isVisible: true,
  isVrixPlusExclusive: true,
  vrixPlusPrice: true,
  createdAt: true,
};

const productSelectWithoutImages = Object.fromEntries(
  Object.entries(productSelect).filter(([key]) => key !== "images")
);

const isMissingProductImagesColumnError = (error) => {
  const message = String(error?.message || "");
  return message.includes("products.images") || (error?.code === "P2022" && message.includes("images"));
};

const withImageGalleryFallback = (product) => (
  product && !("images" in product)
    ? { ...product, images: product.image ? [product.image] : [] }
    : product
);

const stripProductImages = (data = {}) => {
  const { images, ...rest } = data;
  return rest;
};

const runProductQuery = async (queryWithImages, queryWithoutImages) => {
  try {
    return await queryWithImages();
  } catch (error) {
    if (!isMissingProductImagesColumnError(error)) throw error;
    const result = await queryWithoutImages();
    return Array.isArray(result)
      ? result.map(withImageGalleryFallback)
      : withImageGalleryFallback(result);
  }
};

// Unified export
export const db = {
  // Check connection status
  isConnected: () => isDbConnected && prisma !== null,

  // CMS Settings Key-Value Store
  cmsSettings: {
    findUnique: async ({ where: { key } }) => {
      if (db.isConnected()) {
        const row = await prisma.cmsSetting.findUnique({ where: { key } });
        return row ? row.value : null;
      } else {
        const localData = readLocalDb();
        return localData[key] || null;
      }
    },
    upsert: async ({ where: { key }, update, create }) => {
      if (db.isConnected()) {
        const row = await prisma.cmsSetting.upsert({
          where: { key },
          update: { value: update.value },
          create: { key, value: create.value }
        });
        return row.value;
      } else {
        const localData = readLocalDb();
        localData[key] = update.value;
        writeLocalDb(localData);
        return localData[key];
      }
    },
    findMany: async () => {
      if (db.isConnected()) {
        const rows = await prisma.cmsSetting.findMany();
        return rows.reduce((acc, row) => {
          acc[row.key] = row.value;
          return acc;
        }, {});
      } else {
        const localData = readLocalDb();
        const { products, journal, securityLogs, payments, otps, redeemCodes, users, ...cms } = localData;
        return cms;
      }
    }
  },

  // Products
  products: {
    findMany: async () => {
      if (db.isConnected()) {
        return await runProductQuery(
          () => prisma.product.findMany({
            orderBy: { createdAt: "desc" },
            select: productSelect
          }),
          () => prisma.product.findMany({
            orderBy: { createdAt: "desc" },
            select: productSelectWithoutImages
          })
        );
      } else {
        const localData = readLocalDb();
        return localData.products || [];
      }
    },
    findUnique: async ({ where: { id } }) => {
      if (db.isConnected()) {
        return await runProductQuery(
          () => prisma.product.findUnique({ where: { id }, select: productSelect }),
          () => prisma.product.findUnique({ where: { id }, select: productSelectWithoutImages })
        );
      } else {
        const localData = readLocalDb();
        return (localData.products || []).find(p => p.id === id) || null;
      }
    },
    exists: async ({ where: { id } }) => {
      if (db.isConnected()) {
        return !!(await prisma.product.findUnique({ where: { id }, select: { id: true } }));
      } else {
        const localData = readLocalDb();
        return (localData.products || []).some(p => p.id === id);
      }
    },
    create: async ({ data }) => {
      if (db.isConnected()) {
        return await runProductQuery(
          () => prisma.product.create({ data, select: productSelect }),
          () => prisma.product.create({ data: stripProductImages(data), select: productSelectWithoutImages })
        );
      } else {
        const localData = readLocalDb();
        localData.products = localData.products || [];
        localData.products.push(data);
        writeLocalDb(localData);
        return data;
      }
    },
    update: async ({ where: { id }, data }) => {
      if (db.isConnected()) {
        return await runProductQuery(
          () => prisma.product.update({ where: { id }, data, select: productSelect }),
          () => prisma.product.update({ where: { id }, data: stripProductImages(data), select: productSelectWithoutImages })
        );
      } else {
        const localData = readLocalDb();
        localData.products = localData.products || [];
        const index = localData.products.findIndex(p => p.id === id);
        if (index !== -1) {
          localData.products[index] = { ...localData.products[index], ...data };
          writeLocalDb(localData);
          return localData.products[index];
        }
        throw new Error(`Product with ID ${id} not found`);
      }
    },
    delete: async ({ where: { id } }) => {
      if (db.isConnected()) {
        return await prisma.product.delete({ where: { id }, select: { id: true } });
      } else {
        const localData = readLocalDb();
        localData.products = localData.products || [];
        const initialLength = localData.products.length;
        localData.products = localData.products.filter(p => p.id !== id);
        if (localData.products.length < initialLength) {
          writeLocalDb(localData);
          return { id };
        }
        throw new Error(`Product with ID ${id} not found`);
      }
    }
  },

  // Journal
  journal: {
    findMany: async () => {
      if (db.isConnected()) {
        return await prisma.journal.findMany({
          orderBy: { createdAt: "desc" }
        });
      } else {
        const localData = readLocalDb();
        return localData.journal || [];
      }
    },
    create: async ({ data }) => {
      if (db.isConnected()) {
        return await prisma.journal.create({ data });
      } else {
        const localData = readLocalDb();
        localData.journal = localData.journal || [];
        localData.journal.unshift(data);
        writeLocalDb(localData);
        return data;
      }
    },
    update: async ({ where: { id }, data }) => {
      if (db.isConnected()) {
        return await prisma.journal.update({ where: { id }, data });
      } else {
        const localData = readLocalDb();
        localData.journal = localData.journal || [];
        const index = localData.journal.findIndex(j => j.id === id);
        if (index !== -1) {
          localData.journal[index] = { ...localData.journal[index], ...data };
          writeLocalDb(localData);
          return localData.journal[index];
        }
        throw new Error(`Article with ID ${id} not found`);
      }
    },
    delete: async ({ where: { id } }) => {
      if (db.isConnected()) {
        return await prisma.journal.delete({ where: { id } });
      } else {
        const localData = readLocalDb();
        localData.journal = localData.journal || [];
        const initialLength = localData.journal.length;
        localData.journal = localData.journal.filter(j => j.id !== id);
        if (localData.journal.length < initialLength) {
          writeLocalDb(localData);
          return { id };
        }
        throw new Error(`Article with ID ${id} not found`);
      }
    }
  },

  // Security Logs
  securityLogs: {
    findMany: async () => {
      if (db.isConnected()) {
        const logs = await prisma.securityLog.findMany({
          orderBy: { timestamp: "desc" }
        });
        return logs.map(l => ({
          timestamp: l.timestamp.toISOString().replace("T", " ").substring(0, 19) + " UTC",
          event: l.event,
          user: l.userEmail,
          status: l.status
        }));
      } else {
        const localData = readLocalDb();
        return localData.securityLogs || [];
      }
    },
    create: async ({ data }) => {
      if (db.isConnected()) {
        const log = await prisma.securityLog.create({
          data: {
            event: data.event,
            userEmail: data.user,
            status: data.status
          }
        });
        return {
          timestamp: log.timestamp.toISOString().replace("T", " ").substring(0, 19) + " UTC",
          event: log.event,
          user: log.userEmail,
          status: log.status
        };
      } else {
        const localData = readLocalDb();
        localData.securityLogs = localData.securityLogs || [];
        const newLog = {
          timestamp: new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC",
          event: data.event,
          user: data.user,
          status: data.status
        };
        localData.securityLogs.unshift(newLog);
        writeLocalDb(localData);
        return newLog;
      }
    }
  },

  // Payments
  payments: {
    findMany: async () => {
      if (db.isConnected()) {
        return await prisma.payment.findMany({
          orderBy: { createdAt: "desc" }
        });
      } else {
        const localData = readLocalDb();
        return localData.payments || [];
      }
    },
    create: async ({ data }) => {
      if (db.isConnected()) {
        return await prisma.payment.create({ data });
      } else {
        const localData = readLocalDb();
        localData.payments = localData.payments || [];
        const record = {
          id: Math.random().toString(36).substring(2, 15),
          createdAt: new Date().toISOString(),
          ...data
        };
        localData.payments.unshift(record);
        writeLocalDb(localData);
        return record;
      }
    },
    update: async ({ where: { orderId }, data }) => {
      if (db.isConnected()) {
        return await prisma.payment.update({ where: { orderId }, data });
      } else {
        const localData = readLocalDb();
        localData.payments = localData.payments || [];
        const index = localData.payments.findIndex(p => p.orderId === orderId);
        if (index !== -1) {
          localData.payments[index] = { ...localData.payments[index], ...data };
          writeLocalDb(localData);
          return localData.payments[index];
        }
        throw new Error(`Payment with orderId ${orderId} not found`);
      }
    }
  },

  // Users / Customers
  users: {
    findMany: async () => {
      const { readFileSync } = await import("fs");
      try {
        const raw = readFileSync(pathDirect.join(__dirname, "data", "db.json"), "utf8");
        const local = JSON.parse(raw);
        return local.users || [];
      } catch (err) {
        return [];
      }
    },
    findUnique: async ({ where: { email } }) => {
      const { readFileSync } = await import("fs");
      try {
        const raw = readFileSync(pathDirect.join(__dirname, "data", "db.json"), "utf8");
        const local = JSON.parse(raw);
        local.users = local.users || [];
        return local.users.find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
      } catch (err) {
        return null;
      }
    },
    create: async ({ data }) => {
      const { readFileSync, writeFileSync } = await import("fs");
      const dbFile = pathDirect.join(__dirname, "data", "db.json");
      const raw = readFileSync(dbFile, "utf8");
      const local = JSON.parse(raw);
      local.users = local.users || [];
      const record = {
        createdAt: new Date().toISOString(),
        ...data
      };
      local.users.push(record);
      writeFileSync(dbFile, JSON.stringify(local, null, 2), "utf8");
      return record;
    },
    update: async ({ where: { email }, data }) => {
      const { readFileSync, writeFileSync } = await import("fs");
      const dbFile = pathDirect.join(__dirname, "data", "db.json");
      const raw = readFileSync(dbFile, "utf8");
      const local = JSON.parse(raw);
      local.users = local.users || [];
      const index = local.users.findIndex(u => u.email.toLowerCase() === email.toLowerCase());
      if (index !== -1) {
        local.users[index] = { ...local.users[index], ...data };
        writeFileSync(dbFile, JSON.stringify(local, null, 2), "utf8");
        return local.users[index];
      }
      throw new Error(`User with email ${email} not found`);
    }
  },

  // Verification OTPs
  verificationOtps: {
    create: async ({ data }) => {
      if (db.isConnected()) {
        return await prisma.verificationOtp.create({ data });
      } else {
        const localData = readLocalDb();
        localData.otps = localData.otps || [];
        const record = {
          id: Math.random().toString(36).substring(2, 15),
          createdAt: new Date().toISOString(),
          ...data
        };
        localData.otps.push(record);
        writeLocalDb(localData);
        return record;
      }
    },
    findFirst: async ({ where }) => {
      if (db.isConnected()) {
        return await prisma.verificationOtp.findFirst({ where });
      } else {
        const localData = readLocalDb();
        const otps = localData.otps || [];
        return otps.find(otp => {
          return Object.entries(where).every(([k, v]) => otp[k] === v);
        }) || null;
      }
    },
    delete: async ({ where: { id } }) => {
      if (db.isConnected()) {
        return await prisma.verificationOtp.delete({ where: { id } });
      } else {
        const localData = readLocalDb();
        localData.otps = localData.otps || [];
        localData.otps = localData.otps.filter(otp => otp.id !== id);
        writeLocalDb(localData);
        return { id };
      }
    },
    deleteMany: async ({ where }) => {
      if (db.isConnected()) {
        return await prisma.verificationOtp.deleteMany({ where });
      } else {
        const localData = readLocalDb();
        localData.otps = localData.otps || [];
        const initialLength = localData.otps.length;
        localData.otps = localData.otps.filter(otp => {
          return !Object.entries(where).every(([k, v]) => otp[k] === v);
        });
        writeLocalDb(localData);
        return { count: initialLength - localData.otps.length };
      }
    }
  },

  // Redeem Codes
  redeemCodes: {
    findMany: async () => {
      if (db.isConnected()) {
        return await prisma.redeemCode.findMany({
          orderBy: { createdAt: "desc" }
        });
      } else {
        const localData = readLocalDb();
        return localData.redeemCodes || [];
      }
    },
    count: async () => {
      if (db.isConnected()) {
        return await prisma.redeemCode.count();
      } else {
        const localData = readLocalDb();
        return (localData.redeemCodes || []).length;
      }
    },
    findUnique: async ({ where: { code } }) => {
      if (db.isConnected()) {
        return await prisma.redeemCode.findUnique({ where: { code } });
      } else {
        const localData = readLocalDb();
        const codes = localData.redeemCodes || [];
        return codes.find(c => c.code.toUpperCase() === code.toUpperCase()) || null;
      }
    },
    create: async ({ data }) => {
      if (db.isConnected()) {
        return await prisma.redeemCode.create({ data });
      } else {
        const localData = readLocalDb();
        localData.redeemCodes = localData.redeemCodes || [];
        const record = {
          createdAt: new Date().toISOString(),
          isActive: true,
          ...data
        };
        localData.redeemCodes.push(record);
        writeLocalDb(localData);
        return record;
      }
    },
    update: async ({ where: { code }, data }) => {
      if (db.isConnected()) {
        return await prisma.redeemCode.update({ where: { code }, data });
      } else {
        const localData = readLocalDb();
        localData.redeemCodes = localData.redeemCodes || [];
        const index = localData.redeemCodes.findIndex(c => c.code.toUpperCase() === code.toUpperCase());
        if (index !== -1) {
          localData.redeemCodes[index] = { ...localData.redeemCodes[index], ...data };
          writeLocalDb(localData);
          return localData.redeemCodes[index];
        }
        throw new Error(`RedeemCode ${code} not found`);
      }
    },
    delete: async ({ where: { code } }) => {
      if (db.isConnected()) {
        return await prisma.redeemCode.delete({ where: { code } });
      } else {
        const localData = readLocalDb();
        localData.redeemCodes = localData.redeemCodes || [];
        localData.redeemCodes = localData.redeemCodes.filter(c => c.code.toUpperCase() !== code.toUpperCase());
        writeLocalDb(localData);
        return { code };
      }
    }
  },

  // Delivery Staff
  deliveryStaff: {
    findMany: async () => {
      if (db.isConnected()) {
        return await prisma.deliveryStaff.findMany({
          orderBy: { createdAt: "desc" }
        });
      } else {
        const localData = readLocalDb();
        return localData.deliveryStaff || [];
      }
    },
    findUnique: async ({ where: { email } }) => {
      if (db.isConnected()) {
        return await prisma.deliveryStaff.findUnique({ where: { email } });
      } else {
        const localData = readLocalDb();
        return (localData.deliveryStaff || []).find(s => s.email === email) || null;
      }
    },
    create: async ({ data }) => {
      if (db.isConnected()) {
        return await prisma.deliveryStaff.create({ data });
      } else {
        const localData = readLocalDb();
        localData.deliveryStaff = localData.deliveryStaff || [];
        // Ensure no duplicate emails locally
        if (localData.deliveryStaff.some(s => s.email === data.email)) {
          throw new Error(`Staff with email ${data.email} already exists`);
        }
        const record = {
          createdAt: new Date().toISOString(),
          ...data
        };
        localData.deliveryStaff.push(record);
        writeLocalDb(localData);
        return record;
      }
    },
    delete: async ({ where: { email } }) => {
      if (db.isConnected()) {
        return await prisma.deliveryStaff.delete({ where: { email } });
      } else {
        const localData = readLocalDb();
        localData.deliveryStaff = localData.deliveryStaff || [];
        localData.deliveryStaff = localData.deliveryStaff.filter(s => s.email !== email);
        writeLocalDb(localData);
        return { email };
      }
    }
  }
};

export async function migrateIfNeeded() {
  // Always seed local db.json fallback with default staff
  try {
    if (process.env.VERCEL) {
      console.log("Database Access Layer: Skipping local db.json fallback seed on Vercel.");
    } else {
      const localData = readLocalDb();
      let updatedLocal = false;
      if (!localData.deliveryStaff || localData.deliveryStaff.length === 0) {
        localData.deliveryStaff = [
          { email: "manager@vrix.com", name: "VRIX Manager", role: "manager", createdAt: new Date().toISOString() },
          { email: "agent@vrix.com", name: "VRIX Agent", role: "agent", createdAt: new Date().toISOString() },
          { email: "dhruv@vrix.com", name: "Dhruv Agent", role: "agent", createdAt: new Date().toISOString() }
        ];
        updatedLocal = true;
      }
      if (updatedLocal) {
        writeLocalDb(localData);
        console.log("Database Access Layer: Seeded local fallback delivery staff.");
      }
    }
  } catch (err) {
    console.error("Database Access Layer: Failed to seed local delivery staff:", err);
  }

  if (!db.isConnected()) return;

  try {
    await prisma.$executeRawUnsafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "images" JSONB');
    await prisma.$executeRawUnsafe('ALTER TABLE "redeem_codes" ADD COLUMN IF NOT EXISTS "description" TEXT');
    await prisma.$executeRawUnsafe('ALTER TABLE "redeem_codes" ADD COLUMN IF NOT EXISTS "min_subtotal" DOUBLE PRECISION');
    await prisma.$executeRawUnsafe('ALTER TABLE "redeem_codes" ADD COLUMN IF NOT EXISTS "usage_limit" INTEGER');
    await prisma.$executeRawUnsafe('ALTER TABLE "redeem_codes" ADD COLUMN IF NOT EXISTS "used_count" INTEGER DEFAULT 0');
    await prisma.$executeRawUnsafe('ALTER TABLE "redeem_codes" ADD COLUMN IF NOT EXISTS "expiry_date" TEXT');

    const productCount = await prisma.product.count();
    if (productCount === 0) {
      console.log("Database Access Layer: Postgres is empty. Seeding from db.json...");
      const localData = readLocalDb();

      // Seed CMS Settings
      const cmsKeys = ["homepage", "story", "legal", "navigation", "brand", "features", "collections", "vrix_plus", "api_settings", "announcement_bar", "gift_wrapping", "metal_types", "currency_settings", "shipping_settings"];
      for (const key of cmsKeys) {
        if (localData[key]) {
          await prisma.cmsSetting.upsert({
            where: { key },
            update: { value: localData[key] },
            create: { key, value: localData[key] }
          });
        }
      }

      // Seed Products
      if (Array.isArray(localData.products)) {
        for (const p of localData.products) {
          await prisma.product.create({
            data: {
              id: p.id,
              title: p.title,
              material: p.material,
              type: p.type,
              price: Number(p.price),
              image: p.image,
              images: Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []),
              description: p.description || "",
              alt: p.alt || "",
              collection: p.collection || ""
            }
          });
        }
      }

      // Seed Journal
      if (Array.isArray(localData.journal)) {
        for (const j of localData.journal) {
          await prisma.journal.create({
            data: {
              id: j.id,
              title: j.title,
              excerpt: j.excerpt || "",
              content: j.content,
              image: j.image,
              date: j.date || "",
              readTime: j.readTime || ""
            }
          });
        }
      }

      // Seed Security Logs
      if (Array.isArray(localData.securityLogs)) {
        for (const log of localData.securityLogs) {
          let dateVal = new Date();
          if (log.timestamp) {
            dateVal = new Date(log.timestamp.replace(" UTC", ""));
          }
          await prisma.securityLog.create({
            data: {
              timestamp: dateVal,
              event: log.event,
              userEmail: log.user || "",
              status: log.status
            }
          });
        }
      }

      // Seed Default Redeem Codes
      await prisma.redeemCode.create({
        data: {
          code: "VRIX20",
          discount: 20,
          type: "percentage"
        }
      });
      await prisma.redeemCode.create({
        data: {
          code: "WELCOME10",
          discount: 10,
          type: "fixed"
        }
      });

      console.log("Database Access Layer: Seeding completed successfully.");
    }

    // Seed delivery staff in Postgres if missing
    const staffCount = await prisma.deliveryStaff.count();
    if (staffCount === 0) {
      console.log("Database Access Layer: Seeding default delivery staff in Postgres...");
      await prisma.deliveryStaff.create({ data: { email: "manager@vrix.com", name: "VRIX Manager", role: "manager" } });
      await prisma.deliveryStaff.create({ data: { email: "agent@vrix.com", name: "VRIX Agent", role: "agent" } });
      await prisma.deliveryStaff.create({ data: { email: "dhruv@vrix.com", name: "Dhruv Agent", role: "agent" } });
    }
  } catch (error) {
    console.error("Database Access Layer: Migration/seeding failed:", error);
  }
}
