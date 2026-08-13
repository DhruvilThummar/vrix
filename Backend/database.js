import { fileURLToPath } from "url";
import fsDirect from "fs";
import pathDirect from "path";
import { createClient } from "@supabase/supabase-js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = pathDirect.dirname(__filename);
const DB_PATH = pathDirect.join(__dirname, "data", "db.json");

// Use service-role key so the backend Supabase client bypasses Row Level Security.
// This is safe — database.js is server-only code, never sent to the browser.
const supabaseUrl = process.env.SUPABASE_URL || "https://snvifoikeixkgrdkgyme.supabase.co";
const supabaseServiceKey =
  process.env.SUPABASE_SECRET_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNudmlmb2lrZWl4a2dyZGtneW1lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5OTA0NjIsImV4cCI6MjA5ODU2NjQ2Mn0.H-mxdmhjHGg0RVF35ifWIvYgGRBS3oMgq08dGE3bbTw";
export const supabase = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey, { auth: { persistSession: false } })
  : null;

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
      url.searchParams.set("connection_limit", "5");
      changed = true;
    }
    if (!url.searchParams.has("pool_timeout")) {
      url.searchParams.set("pool_timeout", "30");
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

// Local DB Helpers (Only used for initial data seeding if db.json exists on disk)
const readLocalDb = () => {
  try {
    if (fsDirect.existsSync(DB_PATH)) {
      const data = fsDirect.readFileSync(DB_PATH, "utf8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.error("Error reading local db.json seeding file:", error);
  }
  return {};
};

const writeLocalDb = (data) => {
  // Disable writing to local files as Supabase DB is the source of truth
  return true;
};

// Check if DATABASE_URL is configured and valid for PostgreSQL
if (!process.env.DATABASE_URL) {
  const vercelDb = process.env.POSTGRES_PRISMA_URL || process.env.POSTGRES_URL || process.env.POSTGRES_URL_NON_POOLING;
  if (vercelDb) process.env.DATABASE_URL = vercelDb;
}

normalizePrismaDatabaseUrl();
const rawUrl = process.env.DATABASE_URL || "";
const isPostgresUrl = rawUrl.startsWith("postgresql://") || rawUrl.startsWith("postgres://");
const isDbConnected = !!rawUrl && isPostgresUrl;
let prisma = null;

if (isDbConnected) {
  try {
    const { PrismaClient } = await import("@prisma/client");
    prisma = globalThis.__prismaClient || new PrismaClient();
    if (process.env.NODE_ENV !== "production") globalThis.__prismaClient = prisma;
    console.log("Database Access Layer: Prisma client initialized.");
  } catch (err) {
    console.error("Database Access Layer: Failed to load Prisma Client:", err);
    throw err;
  }
} else {
  throw new Error("Database Access Layer: DATABASE_URL is not set or not a valid PostgreSQL string. Complete Supabase database URL is required.");
}

let tablesCreated = false;
export async function ensureTablesExist() {
  if (!prisma) return;
  try {
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "users" ("email" TEXT PRIMARY KEY, "name" TEXT, "phone" TEXT, "password" TEXT, "is_vrix_plus_member" BOOLEAN DEFAULT false, "vrix_plus_joined_date" TEXT, "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`).catch(e => console.warn("Notice: users table creation issue:", e.message));
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "cms_settings" ("key" TEXT PRIMARY KEY, "value" JSONB NOT NULL, "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`).catch(() => { });
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "products" ("id" TEXT PRIMARY KEY, "title" TEXT NOT NULL, "subtitle" TEXT, "material" TEXT, "type" TEXT NOT NULL, "price" DOUBLE PRECISION NOT NULL, "original_price" DOUBLE PRECISION, "image" TEXT NOT NULL, "images" JSONB, "description" TEXT, "alt" TEXT, "sku" TEXT, "collection" TEXT, "stock" INTEGER DEFAULT 999, "is_visible" BOOLEAN DEFAULT true, "is_vrix_plus_exclusive" BOOLEAN DEFAULT false, "vrix_plus_price" DOUBLE PRECISION, "layout_style" TEXT DEFAULT '2x2', "engraving_options" JSONB, "gift_note_options" JSONB, "weight" TEXT, "dimensions" TEXT, "available_sizes" JSONB, "variants" JSONB, "tags" JSONB, "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`).catch(() => { });
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "journal" ("id" TEXT PRIMARY KEY, "title" TEXT NOT NULL, "excerpt" TEXT, "content" TEXT NOT NULL, "image" TEXT NOT NULL, "date" TEXT, "read_time" TEXT, "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`).catch(() => { });
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "delivery_staff" ("email" TEXT PRIMARY KEY, "name" TEXT NOT NULL, "role" TEXT NOT NULL, "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`).catch(() => { });
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "redeem_codes" ("code" TEXT PRIMARY KEY, "discount" DOUBLE PRECISION NOT NULL, "type" TEXT DEFAULT 'percentage', "is_active" BOOLEAN DEFAULT true, "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "description" TEXT, "min_subtotal" DOUBLE PRECISION, "usage_limit" INTEGER, "used_count" INTEGER DEFAULT 0, "expiry_date" TEXT);`).catch(() => { });
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "security_logs" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "timestamp" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "event" TEXT NOT NULL, "user_email" TEXT, "status" TEXT NOT NULL);`).catch(() => { });
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "payments" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "order_id" TEXT UNIQUE NOT NULL, "payment_id" TEXT, "signature" TEXT, "amount" DOUBLE PRECISION NOT NULL, "currency" TEXT DEFAULT 'INR', "status" TEXT DEFAULT 'created', "user_email" TEXT, "customer_name" TEXT, "customer_phone" TEXT, "address" TEXT, "city" TEXT, "postal_code" TEXT, "assigned_agent" TEXT);`).catch(() => { });
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "verification_otps" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "email" TEXT NOT NULL, "otp" TEXT NOT NULL, "expires_at" TIMESTAMP NOT NULL, "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`).catch(() => { });
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "notifications" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "type" TEXT NOT NULL, "title" TEXT NOT NULL, "message" TEXT NOT NULL, "is_read" BOOLEAN DEFAULT false, "user_email" TEXT, "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`).catch(() => { });
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "addresses" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "user_email" TEXT NOT NULL REFERENCES "users"("email") ON DELETE CASCADE, "label" TEXT NOT NULL DEFAULT 'Home', "full_name" TEXT NOT NULL, "phone" TEXT, "address" TEXT NOT NULL, "apartment" TEXT, "city" TEXT NOT NULL, "state" TEXT, "postal_code" TEXT NOT NULL, "country" TEXT NOT NULL DEFAULT 'IN', "is_default" BOOLEAN NOT NULL DEFAULT false, "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP);`).catch(() => { });
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "wishlist_stock_alerts" ("id" UUID PRIMARY KEY DEFAULT gen_random_uuid(), "user_email" TEXT NOT NULL REFERENCES "users"("email") ON DELETE CASCADE, "product_id" TEXT NOT NULL REFERENCES "products"("id") ON DELETE CASCADE, "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP, "last_notified_at" TIMESTAMP, UNIQUE("user_email", "product_id"));`).catch(() => { });

    // Structural migrations for missing columns
    await prisma.$executeRawUnsafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "images" JSONB;').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_visible" BOOLEAN DEFAULT true;').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_vrix_plus_exclusive" BOOLEAN DEFAULT false;').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "vrix_plus_price" DOUBLE PRECISION;').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "engraving_options" JSONB;').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "gift_note_options" JSONB;').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "weight" TEXT;').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "dimensions" TEXT;').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "available_sizes" JSONB;').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "subtitle" TEXT;').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "variants" JSONB;').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "original_price" DOUBLE PRECISION;').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "sku" TEXT;').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "layout_style" TEXT DEFAULT \'2x2\';').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "tags" JSONB;').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "subtitle" TEXT;').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "variants" JSONB;').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "comparison_options" JSONB;').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "gift_options" JSONB;').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "delivery_policy" TEXT;').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "care_guide" TEXT;').catch(() => { });

    await prisma.$executeRawUnsafe('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_vrix_plus_member" BOOLEAN DEFAULT false;').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "vrix_plus_joined_date" TEXT;').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT \'customer\';').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "date_of_birth" TEXT;').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "estimated_delivery_date" TIMESTAMP;').catch(() => { });

    // Database Performance Indexing
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "idx_users_email" ON "users" ("email");').catch(() => { });
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "idx_users_phone" ON "users" ("phone");').catch(() => { });
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "idx_verification_otps_email_otp" ON "verification_otps" ("email", "otp");').catch(() => { });
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "idx_verification_otps_expires_at" ON "verification_otps" ("expires_at");').catch(() => { });
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "idx_security_logs_user_email" ON "security_logs" ("user_email");').catch(() => { });
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "idx_products_is_visible" ON "products" ("is_visible");').catch(() => { });
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "idx_payments_order_id" ON "payments" ("order_id");').catch(() => { });
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "idx_notifications_created_at" ON "notifications" ("created_at" DESC);').catch(() => { });
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "idx_notifications_is_read" ON "notifications" ("is_read");').catch(() => { });
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "idx_addresses_user_email" ON "addresses" ("user_email");').catch(() => { });
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "idx_wishlist_stock_alerts_product" ON "wishlist_stock_alerts" ("product_id");').catch(() => { });

    // Bespoke Atelier tables
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "bespoke_settings" (
      "id" TEXT PRIMARY KEY DEFAULT 'default',
      "headline" TEXT DEFAULT 'Bespoke Atelier Estimate',
      "slogan" TEXT DEFAULT 'THE SIGNATURE COLLECTION',
      "subtitle" TEXT DEFAULT 'Crafted to your exact specifications. Begin building your legacy piece.',
      "introParagraph" TEXT DEFAULT 'Our master goldsmiths work directly with you in our atelier to craft bespoke, made-to-order creations.',
      "disclaimerText" TEXT DEFAULT 'Final quote verified during 1-on-1 consultation with our lead master craftsman.',
      "consultationCtaText" TEXT DEFAULT 'Book Atelier Consultation',
      "craftingTimeline" TEXT DEFAULT '3 – 4 Weeks',
      "base_min_price" DOUBLE PRECISION DEFAULT 65000,
      "base_max_price" DOUBLE PRECISION DEFAULT 180000,
      "is_enabled" BOOLEAN DEFAULT true,
      "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`).catch(() => { });

    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "bespoke_options" (
      "id" TEXT PRIMARY KEY,
      "category" TEXT NOT NULL,
      "name" TEXT NOT NULL,
      "code" TEXT NOT NULL,
      "color_hex" TEXT,
      "image_url" TEXT,
      "price_multiplier" DOUBLE PRECISION DEFAULT 1.0,
      "price_addition" DOUBLE PRECISION DEFAULT 0,
      "sort_order" INTEGER DEFAULT 0,
      "is_enabled" BOOLEAN DEFAULT true,
      "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`).catch(() => { });

    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "bespoke_variants" (
      "id" TEXT PRIMARY KEY,
      "silhouette" TEXT NOT NULL,
      "metal" TEXT NOT NULL,
      "stone_shape" TEXT,
      "image_url" TEXT NOT NULL,
      "price_modifier" DOUBLE PRECISION DEFAULT 1.0,
      "is_available" BOOLEAN DEFAULT true,
      "created_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      "updated_at" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );`).catch(() => { });

    tablesCreated = true;
  } catch (e) {
    console.error("ensureTablesExist error:", e.message);
  }
}

const productSelect = {
  id: true,
  title: true,
  subtitle: true,
  material: true,
  type: true,
  price: true,
  originalPrice: true,
  image: true,
  images: true,
  description: true,
  alt: true,
  sku: true,
  collection: true,
  stock: true,
  isVisible: true,
  isVrixPlusExclusive: true,
  vrixPlusPrice: true,
  layoutStyle: true,
  engravingOptions: true,
  giftNoteOptions: true,
  weight: true,
  dimensions: true,
  availableSizes: true,
  variants: true,
  comparisonOptions: true,
  giftOptions: true,
  deliveryPolicy: true,
  careGuide: true,
  tags: true,
  createdAt: true,
};

const productSelectWithoutImages = {
  id: true,
  title: true,
  subtitle: true,
  material: true,
  type: true,
  price: true,
  image: true,
  description: true,
  alt: true,
  collection: true,
  stock: true,
  createdAt: true,
};

// Converts camelCase data object properties to PostgreSQL snake_case column names for direct Supabase queries
const toPgProductData = (data = {}) => {
  const pgData = {};
  if (data.id !== undefined) pgData.id = data.id;
  if (data.title !== undefined) pgData.title = data.title;
  if (data.subtitle !== undefined) pgData.subtitle = data.subtitle;
  if (data.material !== undefined) pgData.material = data.material;
  if (data.type !== undefined) pgData.type = data.type;
  if (data.price !== undefined) pgData.price = data.price;
  if (data.originalPrice !== undefined) pgData.original_price = data.originalPrice;
  if (data.image !== undefined) pgData.image = data.image;
  if (data.images !== undefined) pgData.images = data.images;
  if (data.description !== undefined) pgData.description = data.description;
  if (data.alt !== undefined) pgData.alt = data.alt;
  if (data.sku !== undefined) pgData.sku = data.sku;
  if (data.collection !== undefined) pgData.collection = data.collection;
  if (data.stock !== undefined) pgData.stock = data.stock;
  if (data.isVisible !== undefined) pgData.is_visible = data.isVisible;
  if (data.isVrixPlusExclusive !== undefined) pgData.is_vrix_plus_exclusive = data.isVrixPlusExclusive;
  if (data.vrixPlusPrice !== undefined) pgData.vrix_plus_price = data.vrixPlusPrice;
  if (data.layoutStyle !== undefined) pgData.layout_style = data.layoutStyle;
  if (data.engravingOptions !== undefined) pgData.engraving_options = data.engravingOptions;
  if (data.giftNoteOptions !== undefined) pgData.gift_note_options = data.giftNoteOptions;
  if (data.weight !== undefined) pgData.weight = data.weight;
  if (data.dimensions !== undefined) pgData.dimensions = data.dimensions;
  if (data.availableSizes !== undefined) pgData.available_sizes = data.availableSizes;
  if (data.variants !== undefined) pgData.variants = data.variants;
  if (data.comparisonOptions !== undefined) pgData.comparison_options = data.comparisonOptions;
  if (data.giftOptions !== undefined) pgData.gift_options = data.giftOptions;
  if (data.deliveryPolicy !== undefined) pgData.delivery_policy = data.deliveryPolicy;
  if (data.careGuide !== undefined) pgData.care_guide = data.careGuide;
  if (data.tags !== undefined) pgData.tags = data.tags;
  return pgData;
};

const withProductDefaults = (product) => {
  if (!product) return product;
  return {
    ...product,
    images: Array.isArray(product.images) ? product.images : (product.image ? [product.image] : []),
    isVisible: product.isVisible !== undefined ? product.isVisible : (product.is_visible !== undefined ? product.is_visible : true),
    isVrixPlusExclusive: product.isVrixPlusExclusive !== undefined ? !!product.isVrixPlusExclusive : !!product.is_vrix_plus_exclusive,
    vrixPlusPrice: product.vrixPlusPrice ?? product.vrix_plus_price ?? null,
    originalPrice: product.originalPrice ?? product.original_price ?? null,
    layoutStyle: product.layoutStyle || product.layout_style || "2x2",
    sku: product.sku || "",
    engravingOptions: product.engravingOptions || product.engraving_options || { enabled: false, limit: 25, price: 0 },
    giftNoteOptions: product.giftNoteOptions || product.gift_note_options || { enabled: false, limit: 150, price: 0 },
    weight: product.weight || "",
    dimensions: product.dimensions || "",
    availableSizes: Array.isArray(product.availableSizes) ? product.availableSizes : (Array.isArray(product.available_sizes) ? product.available_sizes : []),
    variants: Array.isArray(product.variants) ? product.variants : [],
    comparisonOptions: product.comparisonOptions || product.comparison_options || { worthIndex: 5, hardness: 5, shine: 5, styleRating: 5 },
    giftOptions: product.giftOptions || product.gift_options || { wrappingPrice: 0, showCustomBox: false, packagingNote: "" },
    deliveryPolicy: product.deliveryPolicy || product.delivery_policy || "We accept returns within 30 days of receipt in original, unworn condition. Engraved items are final sale.",
    careGuide: product.careGuide || product.care_guide || "Avoid contact with harsh chemicals, perfumes, and lotions. Store in the provided VRIX pouch when not in use. Clean gently with a soft polishing cloth.",
    tags: Array.isArray(product.tags) ? product.tags : [],
  };
};

const runProductQuery = async (queryWithImages, queryWithoutImages) => {
  try {
    const res = await queryWithImages();
    return Array.isArray(res) ? res.map(withProductDefaults) : withProductDefaults(res);
  } catch (error) {
    if (prisma) {
      try {
        await ensureTablesExist();
        const res = await queryWithImages();
        return Array.isArray(res) ? res.map(withProductDefaults) : withProductDefaults(res);
      } catch (retryErr) {
        // Safe fallback using basic select if columns are missing in DB
      }
    }
    if (queryWithoutImages) {
      try {
        const res = await queryWithoutImages();
        return Array.isArray(res) ? res.map(withProductDefaults) : withProductDefaults(res);
      } catch (e) { }
    }
    throw error;
  }
};

// withTimeout: wraps a promise with a timeout, rejects if too slow
const withTimeout = (promise, ms) => {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`DB query timed out after ${ms}ms`)), ms);
    promise.then(
      (val) => { clearTimeout(timer); resolve(val); },
      (err) => { clearTimeout(timer); reject(err); }
    );
  });
};

const userMemoryMap = new Map();
const syncUserToMemory = (user) => {
  if (user && user.email) {
    userMemoryMap.set(String(user.email).toLowerCase().trim(), user);
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
        try {
          const row = await prisma.cmsSetting.findUnique({ where: { key } });
          return row ? row.value : null;
        } catch (err) {
          console.error(`Prisma cmsSettings.findUnique(${key}) failed:`, err.message);
          if (supabase) {
            const { data, error } = await supabase.from("cms_settings").select("value").eq("key", key).maybeSingle();
            if (!error && data) return data.value;
          }
          const localData = readLocalDb();
          return localData[key] || null;
        }
      } else {
        if (supabase) {
          const { data, error } = await supabase.from("cms_settings").select("value").eq("key", key).maybeSingle();
          if (!error && data) return data.value;
        }
        const localData = readLocalDb();
        return localData[key] || null;
      }
    },
    upsert: async ({ where: { key }, update, create }) => {
      if (db.isConnected()) {
        try {
          const row = await prisma.cmsSetting.upsert({
            where: { key },
            update: { value: update.value },
            create: { key, value: create.value }
          });
          return row.value;
        } catch (err) {
          console.error(`Prisma cmsSettings.upsert(${key}) failed:`, err.message);
          if (supabase) {
            const { data, error } = await supabase.from("cms_settings").upsert({ key, value: update.value }).select("value").single();
            if (!error && data) return data.value;
          }
          const localData = readLocalDb();
          localData[key] = update.value;
          writeLocalDb(localData);
          return localData[key];
        }
      } else {
        if (supabase) {
          const { data, error } = await supabase.from("cms_settings").upsert({ key, value: update.value }).select("value").single();
          if (!error && data) return data.value;
        }
        const localData = readLocalDb();
        localData[key] = update.value;
        writeLocalDb(localData);
        return localData[key];
      }
    },
    findMany: async () => {
      if (db.isConnected()) {
        try {
          const rows = await prisma.cmsSetting.findMany();
          return rows.reduce((acc, row) => {
            acc[row.key] = row.value;
            return acc;
          }, {});
        } catch (err) {
          console.error("Prisma cmsSettings.findMany failed:", err.message);
          if (supabase) {
            const { data, error } = await supabase.from("cms_settings").select("*");
            if (!error && data) {
              return data.reduce((acc, row) => {
                acc[row.key] = row.value;
                return acc;
              }, {});
            }
          }
          const localData = readLocalDb();
          const { products, journal, securityLogs, payments, otps, redeemCodes, users, ...cms } = localData;
          return cms;
        }
      } else {
        if (supabase) {
          const { data, error } = await supabase.from("cms_settings").select("*");
          if (!error && data) {
            return data.reduce((acc, row) => {
              acc[row.key] = row.value;
              return acc;
            }, {});
          }
        }
        const localData = readLocalDb();
        const { products, journal, securityLogs, payments, otps, redeemCodes, users, ...cms } = localData;
        return cms;
      }
    }
  },

  products: {
    findMany: async () => {
      if (db.isConnected()) {
        try {
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
        } catch (err) {
          console.error("Prisma products.findMany failed:", err.message);
          if (supabase) {
            const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
            if (!error && data) return data.map(withProductDefaults);
          }
          const localData = readLocalDb();
          return localData.products || [];
        }
      } else {
        if (supabase) {
          const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
          if (!error && data) return data.map(withProductDefaults);
        }
        const localData = readLocalDb();
        return localData.products || [];
      }
    },
    findUnique: async ({ where: { id } }) => {
      if (db.isConnected()) {
        try {
          return await runProductQuery(
            () => prisma.product.findUnique({ where: { id }, select: productSelect }),
            () => prisma.product.findUnique({ where: { id }, select: productSelectWithoutImages })
          );
        } catch (err) {
          console.error(`Prisma products.findUnique(${id}) failed:`, err.message);
          if (supabase) {
            const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
            if (!error && data) return withProductDefaults(data);
          }
          const localData = readLocalDb();
          return (localData.products || []).find(p => p.id === id) || null;
        }
      } else {
        if (supabase) {
          const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
          if (!error && data) return withProductDefaults(data);
        }
        const localData = readLocalDb();
        return (localData.products || []).find(p => p.id === id) || null;
      }
    },
    exists: async ({ where: { id } }) => {
      if (db.isConnected()) {
        try {
          return !!(await prisma.product.findUnique({ where: { id }, select: { id: true } }));
        } catch (err) {
          if (supabase) {
            const { data, error } = await supabase.from("products").select("id").eq("id", id).maybeSingle();
            if (!error && data) return true;
          }
          const localData = readLocalDb();
          return (localData.products || []).some(p => p.id === id);
        }
      } else {
        if (supabase) {
          const { data, error } = await supabase.from("products").select("id").eq("id", id).maybeSingle();
          if (!error && data) return true;
        }
        const localData = readLocalDb();
        return (localData.products || []).some(p => p.id === id);
      }
    },
    create: async ({ data }) => {
      if (db.isConnected()) {
        try {
          return await runProductQuery(
            () => prisma.product.create({ data, select: productSelect }),
            () => prisma.product.create({ data: stripProductImages(data), select: productSelectWithoutImages })
          );
        } catch (err) {
          console.error("Prisma products.create failed:", err.message);
          if (supabase) {
            const pgData = toPgProductData(data);
            const { data: created, error } = await supabase.from("products").insert(pgData).select("*").single();
            if (!error && created) return withProductDefaults(created);
          }
          const localData = readLocalDb();
          localData.products = localData.products || [];
          localData.products.push(data);
          writeLocalDb(localData);
          return data;
        }
      } else {
        if (supabase) {
          const pgData = toPgProductData(data);
          const { data: created, error } = await supabase.from("products").insert(pgData).select("*").single();
          if (!error && created) return withProductDefaults(created);
        }
        const localData = readLocalDb();
        localData.products = localData.products || [];
        localData.products.push(data);
        writeLocalDb(localData);
        return data;
      }
    },
    update: async ({ where: { id }, data }) => {
      if (db.isConnected()) {
        try {
          return await runProductQuery(
            () => prisma.product.update({ where: { id }, data, select: productSelect }),
            () => prisma.product.update({ where: { id }, data: stripProductImages(data), select: productSelectWithoutImages })
          );
        } catch (err) {
          console.error(`Prisma products.update(${id}) failed:`, err.message);
          if (supabase) {
            const pgData = toPgProductData(data);
            const { data: updated, error } = await supabase.from("products").update(pgData).eq("id", id).select("*").single();
            if (!error && updated) return withProductDefaults(updated);
          }
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
      } else {
        if (supabase) {
          const pgData = toPgProductData(data);
          const { data: updated, error } = await supabase.from("products").update(pgData).eq("id", id).select("*").single();
          if (!error && updated) return withProductDefaults(updated);
        }
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
        try {
          return await prisma.product.delete({ where: { id }, select: { id: true } });
        } catch (err) {
          console.error(`Prisma products.delete(${id}) failed:`, err.message);
          if (supabase) {
            const { error } = await supabase.from("products").delete().eq("id", id);
            if (!error) return { id };
          }
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
      } else {
        if (supabase) {
          const { error } = await supabase.from("products").delete().eq("id", id);
          if (!error) return { id };
        }
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
    },
  },

  // Journal
  journal: {
    findMany: async () => {
      if (db.isConnected()) {
        try {
          return await prisma.journal.findMany({
            orderBy: { createdAt: "desc" }
          });
        } catch (err) {
          console.error("Prisma journal.findMany failed:", err.message);
          const localData = readLocalDb();
          return localData.journal || [];
        }
      } else {
        const localData = readLocalDb();
        return localData.journal || [];
      }
    },
    create: async ({ data }) => {
      if (db.isConnected()) {
        try {
          return await prisma.journal.create({ data });
        } catch (err) {
          console.error("Prisma journal.create failed:", err.message);
          const localData = readLocalDb();
          localData.journal = localData.journal || [];
          localData.journal.unshift(data);
          writeLocalDb(localData);
          return data;
        }
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
        try {
          return await prisma.journal.update({ where: { id }, data });
        } catch (err) {
          console.error(`Prisma journal.update(${id}) failed:`, err.message);
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
        try {
          return await prisma.journal.delete({ where: { id } });
        } catch (err) {
          console.error(`Prisma journal.delete(${id}) failed:`, err.message);
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
        try {
          const logs = await prisma.securityLog.findMany({
            orderBy: { timestamp: "desc" }
          });
          return logs.map(l => ({
            timestamp: l.timestamp.toISOString().replace("T", " ").substring(0, 19) + " UTC",
            event: l.event,
            user: l.userEmail,
            status: l.status
          }));
        } catch (err) {
          console.error("Prisma securityLogs.findMany failed:", err.message);
          const localData = readLocalDb();
          return localData.securityLogs || [];
        }
      } else {
        const localData = readLocalDb();
        return localData.securityLogs || [];
      }
    },
    create: async ({ data }) => {
      if (db.isConnected()) {
        try {
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
        } catch (err) {
          console.error("Prisma securityLogs.create failed:", err.message);
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
        try {
          return await prisma.payment.findMany({
            orderBy: { createdAt: "desc" }
          });
        } catch (err) {
          console.error("Prisma payments.findMany failed:", err.message);
          const localData = readLocalDb();
          return localData.payments || [];
        }
      } else {
        const localData = readLocalDb();
        return localData.payments || [];
      }
    },
    create: async ({ data }) => {
      if (db.isConnected()) {
        try {
          return await prisma.payment.create({ data });
        } catch (err) {
          console.error("Prisma payments.create failed:", err.message);
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
        try {
          return await prisma.payment.update({ where: { orderId }, data });
        } catch (err) {
          console.error(`Prisma payments.update(${orderId}) failed:`, err.message);
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
    },
    findUnique: async ({ where: { orderId } }) => {
      if (db.isConnected()) {
        try {
          return await prisma.payment.findUnique({ where: { orderId } });
        } catch (err) {
          console.error(`Prisma payments.findUnique(${orderId}) failed:`, err.message);
          const localData = readLocalDb();
          return (localData.payments || []).find(p => p.orderId === orderId) || null;
        }
      } else {
        const localData = readLocalDb();
        return (localData.payments || []).find(p => p.orderId === orderId) || null;
      }
    }
  },

  // Users / Customers
  // Users / Customers
  users: {
    findMany: async () => {
      let result = [];
      if (db.isConnected()) {
        try {
          result = await prisma.user.findMany();
        } catch (err) {
          await ensureTablesExist();
          try { result = await prisma.user.findMany(); } catch (retryErr) {}
        }
      }
      if (result.length === 0 && supabase) {
        try {
          const { data, error } = await withTimeout(supabase.from("users").select("*"), 5000);
          if (!error && Array.isArray(data)) result = data;
        } catch (e) { console.warn("Supabase users findMany failed:", e.message); }
      }

      const localData = readLocalDb();
      const localUsers = localData.users || [];

      const map = new Map();
      for (const u of [...result, ...localUsers, ...Array.from(userMemoryMap.values())]) {
        if (u && u.email) {
          const key = String(u.email).toLowerCase().trim();
          const existing = map.get(key) || {};
          const merged = { ...existing, ...u, email: key };
          map.set(key, merged);
          syncUserToMemory(merged);
        }
      }
      return Array.from(map.values());
    },

    findUnique: async ({ where: { email } }) => {
      if (!email) return null;
      const targetEmail = String(email).toLowerCase().trim();

      // FAST PATH 1: Check In-Memory Map Cache (0ms)
      if (userMemoryMap.has(targetEmail)) {
        return userMemoryMap.get(targetEmail);
      }

      // FAST PATH 2: Check Prisma Postgres DB if connected
      if (db.isConnected()) {
        try {
          const user = await prisma.user.findUnique({ where: { email: targetEmail } });
          if (user) {
            syncUserToMemory(user);
            return user;
          }
        } catch (err) {}
      }

      // FAST PATH 3: Check Supabase (5000ms timeout for cold starts)
      if (supabase) {
        try {
          const { data, error } = await withTimeout(supabase.from("users").select("*").eq("email", targetEmail).maybeSingle(), 5000);
          if (!error && data) {
            syncUserToMemory(data);
            return data;
          }
        } catch (e) { console.warn("Supabase user lookup failed:", e.message); }
      }

      // FAST PATH 4: Check local db.json
      const localData = readLocalDb();
      const users = localData.users || [];
      const user = users.find(u => u.email && u.email.toLowerCase().trim() === targetEmail) || null;
      if (user) syncUserToMemory(user);
      return user;
    },

    create: async ({ data }) => {
      const emailLower = data.email ? String(data.email).toLowerCase().trim() : "";
      const recordData = { createdAt: new Date().toISOString(), ...data, email: emailLower };
      syncUserToMemory(recordData);

      // Async background persistence
      (async () => {
        if (db.isConnected()) {
          try { await prisma.user.create({ data: recordData }); } catch (err) {}
        }
        if (supabase) {
          try { await supabase.from("users").upsert([recordData]); } catch (e) {}
        }
        const localData = readLocalDb();
        localData.users = localData.users || [];
        const idx = localData.users.findIndex(u => u.email && u.email.toLowerCase().trim() === emailLower);
        if (idx !== -1) {
          localData.users[idx] = { ...localData.users[idx], ...recordData };
        } else {
          localData.users.push(recordData);
        }
        writeLocalDb(localData);
      })();

      return recordData;
    },

    update: async ({ where: { email }, data }) => {
      const targetEmail = email ? String(email).toLowerCase().trim() : "";
      const existing = userMemoryMap.get(targetEmail) || {};
      const updated = { ...existing, ...data, email: targetEmail };
      syncUserToMemory(updated);

      // Async background persistence
      (async () => {
        if (db.isConnected()) {
          try { await prisma.user.update({ where: { email: targetEmail }, data }); } catch (err) {}
        }
        if (supabase) {
          try { await supabase.from("users").update(data).eq("email", targetEmail); } catch (e) {}
        }
        const localData = readLocalDb();
        localData.users = localData.users || [];
        const idx = localData.users.findIndex(u => u.email && u.email.toLowerCase().trim() === targetEmail);
        if (idx !== -1) {
          localData.users[idx] = { ...localData.users[idx], ...data };
          writeLocalDb(localData);
        }
      })();

      return updated;
    },

    delete: async ({ where: { email } }) => {
      const targetEmail = email ? String(email).toLowerCase().trim() : "";
      userMemoryMap.delete(targetEmail);
      (async () => {
        if (db.isConnected()) {
          try { await prisma.user.delete({ where: { email: targetEmail } }); } catch (err) {}
        }
        if (supabase) {
          try { await supabase.from("users").delete().eq("email", targetEmail); } catch (e) {}
        }
        const localData = readLocalDb();
        localData.users = (localData.users || []).filter(u => String(u.email).toLowerCase().trim() !== targetEmail);
        writeLocalDb(localData);
      })();
      return { email: targetEmail };
    }
  },

  // Notifications
  notifications: {
    findMany: async (options = {}) => {
      const orderBy = options.orderBy || { createdAt: "desc" };
      const limit = options.take || 50;

      if (db.isConnected()) {
        try {
          return await prisma.notification.findMany({
            orderBy,
            take: limit
          });
        } catch (err) {
          console.error("Prisma notifications.findMany failed:", err.message);
        }
      }

      if (supabase) {
        try {
          const { data, error } = await supabase
            .from("notifications")
            .select("*")
            .order(orderBy.createdAt === "desc" ? "created_at" : "created_at", { ascending: orderBy.createdAt !== "desc" })
            .limit(limit);
          if (!error && data) return data.map(n => ({
            id: n.id,
            type: n.type,
            title: n.title,
            message: n.message,
            isRead: n.is_read,
            userEmail: n.user_email,
            createdAt: n.created_at
          }));
        } catch (e) {}
      }

      const localData = readLocalDb();
      let notifs = localData.notifications || [];
      notifs = [...notifs];
      if (orderBy.createdAt === "desc") {
        notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else {
        notifs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
      }
      return notifs.slice(0, limit);
    },

    create: async ({ data }) => {
      const record = {
        id: Math.random().toString(36).substring(2, 15),
        createdAt: new Date().toISOString(),
        isRead: false,
        userEmail: data.userEmail || null,
        ...data
      };

      if (db.isConnected()) {
        try {
          return await prisma.notification.create({ data: {
            type: record.type,
            title: record.title,
            message: record.message,
            isRead: record.isRead,
            userEmail: record.userEmail
          }});
        } catch (err) {
          console.error("Prisma notifications.create failed:", err.message);
        }
      }

      if (supabase) {
        try {
          await supabase.from("notifications").insert([{
            type: record.type,
            title: record.title,
            message: record.message,
            is_read: record.isRead,
            user_email: record.userEmail
          }]);
        } catch (e) {}
      }

      const localData = readLocalDb();
      localData.notifications = localData.notifications || [];
      localData.notifications.push(record);
      writeLocalDb(localData);
      return record;
    },

    update: async ({ where: { id }, data }) => {
      const mappedData = {};
      if (data.isRead !== undefined) mappedData.isRead = data.isRead;

      if (db.isConnected()) {
        try {
          return await prisma.notification.update({ where: { id }, data: mappedData });
        } catch (err) {
          console.error("Prisma notifications.update failed:", err.message);
        }
      }

      if (supabase) {
        try {
          const supData = {};
          if (data.isRead !== undefined) supData.is_read = data.isRead;
          await supabase.from("notifications").update(supData).eq("id", id);
        } catch (e) {}
      }

      const localData = readLocalDb();
      localData.notifications = localData.notifications || [];
      const idx = localData.notifications.findIndex(n => n.id === id);
      if (idx !== -1) {
        localData.notifications[idx] = { ...localData.notifications[idx], ...data };
        writeLocalDb(localData);
        return localData.notifications[idx];
      }
      return null;
    },

    updateMany: async ({ data }) => {
      const mappedData = {};
      if (data.isRead !== undefined) mappedData.isRead = data.isRead;

      if (db.isConnected()) {
        try {
          return await prisma.notification.updateMany({ data: mappedData });
        } catch (err) {
          console.error("Prisma notifications.updateMany failed:", err.message);
        }
      }

      if (supabase) {
        try {
          const supData = {};
          if (data.isRead !== undefined) supData.is_read = data.isRead;
          await supabase.from("notifications").update(supData);
        } catch (e) {}
      }

      const localData = readLocalDb();
      localData.notifications = (localData.notifications || []).map(n => ({ ...n, ...data }));
      writeLocalDb(localData);
      return { count: localData.notifications.length };
    },

    deleteMany: async () => {
      if (db.isConnected()) {
        try {
          return await prisma.notification.deleteMany();
        } catch (err) {
          console.error("Prisma notifications.deleteMany failed:", err.message);
        }
      }

      if (supabase) {
        try {
          await supabase.from("notifications").delete();
        } catch (e) {}
      }

      const localData = readLocalDb();
      localData.notifications = [];
      writeLocalDb(localData);
      return { count: 0 };
    }
  },

  // Verification OTPs

  verificationOtps: {
    create: async ({ data }) => {
      if (db.isConnected()) {
        try {
          return await prisma.verificationOtp.create({ data });
        } catch (err) {
          await ensureTablesExist();
          try {
            return await prisma.verificationOtp.create({ data });
          } catch (retryErr) {
            console.error("Prisma verificationOtps.create failed:", retryErr.message);
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
        }
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
        try {
          return await prisma.verificationOtp.findFirst({ where });
        } catch (err) {
          await ensureTablesExist();
          try {
            return await prisma.verificationOtp.findFirst({ where });
          } catch (retryErr) {
            console.error("Prisma verificationOtps.findFirst failed:", retryErr.message);
            const localData = readLocalDb();
            const otps = localData.otps || [];
            return otps.find(otp => {
              return Object.entries(where).every(([k, v]) => otp[k] === v);
            }) || null;
          }
        }
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
        try {
          return await prisma.verificationOtp.delete({ where: { id } });
        } catch (err) {
          await ensureTablesExist();
          try {
            return await prisma.verificationOtp.delete({ where: { id } });
          } catch (retryErr) {
            console.error(`Prisma verificationOtps.delete(${id}) failed:`, retryErr.message);
            const localData = readLocalDb();
            localData.otps = localData.otps || [];
            localData.otps = localData.otps.filter(otp => otp.id !== id);
            writeLocalDb(localData);
            return { id };
          }
        }
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
        try {
          return await prisma.verificationOtp.deleteMany({ where });
        } catch (err) {
          await ensureTablesExist();
          try {
            return await prisma.verificationOtp.deleteMany({ where });
          } catch (retryErr) {
            console.error("Prisma verificationOtps.deleteMany failed:", retryErr.message);
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
        try {
          return await prisma.redeemCode.findMany({
            orderBy: { createdAt: "desc" }
          });
        } catch (err) {
          console.error("Prisma redeemCodes.findMany failed:", err.message);
          const localData = readLocalDb();
          return localData.redeemCodes || [];
        }
      } else {
        const localData = readLocalDb();
        return localData.redeemCodes || [];
      }
    },
    count: async () => {
      if (db.isConnected()) {
        try {
          return await prisma.redeemCode.count();
        } catch (err) {
          console.error("Prisma redeemCodes.count failed:", err.message);
          const localData = readLocalDb();
          return (localData.redeemCodes || []).length;
        }
      } else {
        const localData = readLocalDb();
        return (localData.redeemCodes || []).length;
      }
    },
    findUnique: async ({ where: { code } }) => {
      if (db.isConnected()) {
        try {
          return await prisma.redeemCode.findUnique({ where: { code } });
        } catch (err) {
          console.error(`Prisma redeemCodes.findUnique(${code}) failed:`, err.message);
          const localData = readLocalDb();
          const codes = localData.redeemCodes || [];
          return codes.find(c => c.code.toUpperCase() === code.toUpperCase()) || null;
        }
      } else {
        const localData = readLocalDb();
        const codes = localData.redeemCodes || [];
        return codes.find(c => c.code.toUpperCase() === code.toUpperCase()) || null;
      }
    },
    create: async ({ data }) => {
      if (db.isConnected()) {
        try {
          return await prisma.redeemCode.create({ data });
        } catch (err) {
          console.error("Prisma redeemCodes.create failed:", err.message);
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
        try {
          return await prisma.redeemCode.update({ where: { code }, data });
        } catch (err) {
          console.error(`Prisma redeemCodes.update(${code}) failed:`, err.message);
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
        try {
          return await prisma.redeemCode.delete({ where: { code } });
        } catch (err) {
          console.error(`Prisma redeemCodes.delete(${code}) failed:`, err.message);
          const localData = readLocalDb();
          localData.redeemCodes = localData.redeemCodes || [];
          localData.redeemCodes = localData.redeemCodes.filter(c => c.code.toUpperCase() !== code.toUpperCase());
          writeLocalDb(localData);
          return { code };
        }
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
        try {
          return await prisma.deliveryStaff.findMany({
            orderBy: { createdAt: "desc" }
          });
        } catch (err) {
          console.error("Prisma deliveryStaff.findMany failed:", err.message);
          const localData = readLocalDb();
          return localData.deliveryStaff || [];
        }
      } else {
        const localData = readLocalDb();
        return localData.deliveryStaff || [];
      }
    },
    findUnique: async ({ where: { email } }) => {
      if (db.isConnected()) {
        try {
          return await prisma.deliveryStaff.findUnique({ where: { email } });
        } catch (err) {
          console.error(`Prisma deliveryStaff.findUnique(${email}) failed:`, err.message);
          const localData = readLocalDb();
          return (localData.deliveryStaff || []).find(s => s.email === email) || null;
        }
      } else {
        const localData = readLocalDb();
        return (localData.deliveryStaff || []).find(s => s.email === email) || null;
      }
    },
    create: async ({ data }) => {
      if (db.isConnected()) {
        try {
          return await prisma.deliveryStaff.create({ data });
        } catch (err) {
          console.error("Prisma deliveryStaff.create failed:", err.message);
          const localData = readLocalDb();
          localData.deliveryStaff = localData.deliveryStaff || [];
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
      } else {
        const localData = readLocalDb();
        localData.deliveryStaff = localData.deliveryStaff || [];
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
        try {
          return await prisma.deliveryStaff.delete({ where: { email } });
        } catch (err) {
          console.error(`Prisma deliveryStaff.delete(${email}) failed:`, err.message);
          const localData = readLocalDb();
          localData.deliveryStaff = localData.deliveryStaff || [];
          localData.deliveryStaff = localData.deliveryStaff.filter(s => s.email !== email);
          writeLocalDb(localData);
          return { email };
        }
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

let hasMigrated = false;
export async function migrateIfNeeded() {
  if (hasMigrated) return;
  hasMigrated = true;

  if (process.env.VERCEL) {
    console.log("Database Access Layer: Fast path for Vercel serverless.");
    return;
  }
  try {
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
  } catch (err) {
    console.error("Database Access Layer: Failed to seed local delivery staff:", err);
  }

  if (!db.isConnected()) return;

  try {
    // Structural migrations
    await prisma.$executeRawUnsafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "images" JSONB;').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_visible" BOOLEAN DEFAULT true;').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "is_vrix_plus_exclusive" BOOLEAN DEFAULT false;').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "vrix_plus_price" DOUBLE PRECISION;').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "original_price" DOUBLE PRECISION;').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "sku" TEXT;').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "layout_style" TEXT DEFAULT \'2x2\';').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "tags" JSONB;').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "is_vrix_plus_member" BOOLEAN DEFAULT false;').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "vrix_plus_joined_date" TEXT;').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "date_of_birth" TEXT;').catch(() => { });

    await prisma.$executeRawUnsafe('ALTER TABLE "redeem_codes" ADD COLUMN IF NOT EXISTS "description" TEXT;').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "redeem_codes" ADD COLUMN IF NOT EXISTS "min_subtotal" DOUBLE PRECISION;').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "redeem_codes" ADD COLUMN IF NOT EXISTS "usage_limit" INTEGER').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "redeem_codes" ADD COLUMN IF NOT EXISTS "used_count" INTEGER DEFAULT 0').catch(() => { });
    await prisma.$executeRawUnsafe('ALTER TABLE "redeem_codes" ADD COLUMN IF NOT EXISTS "expiry_date" TEXT').catch(() => { });

    // Automatic Row Level Security (RLS) enforcement for Supabase database security
    const tablesToSecure = ["cms_settings", "products", "journal", "security_logs", "payments", "delivery_staff", "verification_otps", "redeem_codes", "users"];
    for (const table of tablesToSecure) {
      await prisma.$executeRawUnsafe(`ALTER TABLE IF EXISTS "${table}" ENABLE ROW LEVEL SECURITY;`).catch(() => { });
    }

    const productCount = await prisma.product.count().catch(() => null);
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
          }).catch(() => { });
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
              originalPrice: p.originalPrice !== undefined ? Number(p.originalPrice) || null : null,
              image: p.image,
              images: Array.isArray(p.images) ? p.images : (p.image ? [p.image] : []),
              description: p.description || "",
              alt: p.alt || "",
              sku: p.sku || "",
              collection: p.collection || "",
              stock: p.stock !== undefined ? Number(p.stock) : 999,
              isVisible: p.isVisible !== false,
              isVrixPlusExclusive: !!p.isVrixPlusExclusive,
              vrixPlusPrice: p.vrixPlusPrice !== undefined ? Number(p.vrixPlusPrice) || null : null,
              layoutStyle: p.layoutStyle || "2x2",
              engravingOptions: p.engravingOptions || { enabled: false, limit: 25, price: 0 },
              giftNoteOptions: p.giftNoteOptions || { enabled: false, limit: 150, price: 0 },
              weight: p.weight || "",
              dimensions: p.dimensions || "",
              availableSizes: Array.isArray(p.availableSizes) ? p.availableSizes : [],
              tags: Array.isArray(p.tags) ? p.tags : [],
            }
          }).catch(() => { });
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
          }).catch(() => { });
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
          }).catch(() => { });
        }
      }

      // Seed Default Redeem Codes
      await prisma.redeemCode.create({
        data: {
          code: "VRIX20",
          discount: 20,
          type: "percentage"
        }
      }).catch(() => { });
      await prisma.redeemCode.create({
        data: {
          code: "WELCOME10",
          discount: 10,
          type: "fixed"
        }
      }).catch(() => { });

      console.log("Database Access Layer: Seeding completed successfully.");
    }

    // Seed delivery staff in Postgres if missing
    const staffCount = await prisma.deliveryStaff.count().catch(() => null);
    if (staffCount === 0) {
      console.log("Database Access Layer: Seeding default delivery staff in Postgres...");
      await prisma.deliveryStaff.create({ data: { email: "manager@vrix.com", name: "VRIX Manager", role: "manager" } }).catch(() => { });
      await prisma.deliveryStaff.create({ data: { email: "agent@vrix.com", name: "VRIX Agent", role: "agent" } }).catch(() => { });
      await prisma.deliveryStaff.create({ data: { email: "dhruv@vrix.com", name: "Dhruv Agent", role: "agent" } }).catch(() => { });
    }
  } catch (error) {
    console.error("Database Access Layer: Migration/seeding failed:", error);
  }
}
