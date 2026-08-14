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
    url.searchParams.set("connection_limit", "15");
    url.searchParams.set("pool_timeout", "5");
    changed = true;

    if (changed) {
      process.env.DATABASE_URL = url.toString();
      console.log("Database Access Layer: Enabled Prisma PgBouncer mode for Supabase pooler.");
    }
  } catch (error) {
    console.warn("Database Access Layer: Could not inspect DATABASE_URL for PgBouncer mode.", error);
  }
};

if (!process.env.DATABASE_URL) {
  const vercelDb = process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;
  if (vercelDb) process.env.DATABASE_URL = vercelDb;
}

normalizePrismaDatabaseUrl();
const rawUrl = process.env.DATABASE_URL || "";
const isPostgresUrl = rawUrl.startsWith("postgresql://") || rawUrl.startsWith("postgres://");
export const isDbConnected = !!rawUrl && isPostgresUrl;
let prismaInstance = null;

if (isDbConnected) {
  try {
    const { PrismaClient } = await import("@prisma/client");
    prismaInstance = globalThis.__prismaClient || new PrismaClient();
    if (process.env.NODE_ENV !== "production") globalThis.__prismaClient = prismaInstance;
    console.log("Database Access Layer: Prisma client initialized.");
  } catch (err) {
    console.error("Database Access Layer: Failed to load Prisma Client:", err);
    throw err;
  }
} else {
  throw new Error("Database Access Layer: DATABASE_URL is not set or not a valid PostgreSQL string. Complete Supabase database URL is required.");
}

export const prisma = prismaInstance;
