import fs from "fs";
import path from "url";
import { fileURLToPath } from "url";
import fsDirect from "fs";
import pathDirect from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = pathDirect.dirname(__filename);
const DB_PATH = pathDirect.join(__dirname, "data", "db.json");

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
        const { products, journal, securityLogs, payments, otps, redeemCodes, ...cms } = localData;
        return cms;
      }
    }
  },

  // Products
  products: {
    findMany: async () => {
      if (db.isConnected()) {
        return await prisma.product.findMany({
          orderBy: { createdAt: "desc" }
        });
      } else {
        const localData = readLocalDb();
        return localData.products || [];
      }
    },
    findUnique: async ({ where: { id } }) => {
      if (db.isConnected()) {
        return await prisma.product.findUnique({ where: { id } });
      } else {
        const localData = readLocalDb();
        return (localData.products || []).find(p => p.id === id) || null;
      }
    },
    create: async ({ data }) => {
      if (db.isConnected()) {
        return await prisma.product.create({ data });
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
        return await prisma.product.update({ where: { id }, data });
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
        return await prisma.product.delete({ where: { id } });
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
  }
};

export async function migrateIfNeeded() {
  if (!db.isConnected()) return;

  try {
    const productCount = await prisma.product.count();
    if (productCount === 0) {
      console.log("Database Access Layer: Postgres is empty. Seeding from db.json...");
      const localData = readLocalDb();

      // Seed CMS Settings
      const cmsKeys = ["homepage", "story", "legal", "navigation", "brand", "features", "collections"];
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
    } else {
      console.log("Database Access Layer: Database is already seeded.");
    }
  } catch (error) {
    console.error("Database Access Layer: Migration/seeding failed:", error);
  }
}
