import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { db, migrateIfNeeded } from "./database.js";
import { getCloudinary, getRazorpay, getTransporter, getTruecallerConfig } from "./config/apiResolvers.js";

// Route Modules
import cmsRouter from "./routes/cms.js";
import productsRouter from "./routes/products.js";
import collectionsRouter from "./routes/collections.js";
import journalRouter from "./routes/journal.js";
import securityRouter from "./routes/security.js";
import mediaRouter from "./routes/media.js";
import otpRouter from "./routes/otp.js";
import authRouter from "./routes/auth.js";
import promoRouter from "./routes/promo.js";
import paymentRouter from "./routes/payment.js";
import deliveryRouter from "./routes/delivery.js";
import adminRouter from "./routes/admin.js";
import geoRouter from "./routes/geo.js";
import newsletterRouter from "./routes/newsletter.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────
// Custom CORS middleware to guarantee headers on all requests (including preflights & error responses)
app.use((req, res, next) => {
  const origin = req.headers.origin || "*";
  res.setHeader("Access-Control-Allow-Origin", origin);
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Admin-Secret, x-admin-secret");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

app.use(cors({
  origin: (origin, callback) => callback(null, true),
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Admin-Secret", "x-admin-secret"],
}));
app.use(express.json());

// Serve local uploads if Cloudinary is not configured
app.use("/uploads", express.static(path.join(__dirname, "data", "uploads")));

// ─── Startup Migration ─────────────────────────────────────────────────────────
await migrateIfNeeded();

// ─── Root Status & Health Check ───────────────────────────────────────────────
app.get("/", (req, res) => {
  res.json({
    status: "online",
    message: "🚀 VRIX Backend API Platform",
    version: "1.0.0",
    endpoints: {
      health: "/api/health",
      products: "/api/products",
      collections: "/api/collections"
    }
  });
});

const healthHandler = async (req, res) => {
  const cClient = await getCloudinary();
  const rClient = await getRazorpay();
  const tClient = await getTransporter();
  const tcConfig = await getTruecallerConfig();
  res.json({
    status: "ok",
    dbMode: db.isConnected() ? "prisma" : "local-json",
    cloudinary: !!cClient,
    razorpay: !!rClient,
    nodemailer: !!tClient,
    truecaller: tcConfig.enabled,
    truecallerSandbox: tcConfig.sandbox,
  });
};
app.get("/api/health", healthHandler);
app.get("/health", healthHandler);

// ─── Admin Auth Middleware ─────────────────────────────────────────────────────
const adminAuth = (req, res, next) => {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    console.warn("⚠️  ADMIN_SECRET not set. Admin routes are unprotected.");
    return next();
  }
  const provided = req.headers["x-admin-secret"] || req.query.adminSecret;
  if (provided === secret) return next();
  return res.status(401).json({ error: "Unauthorized: Invalid admin secret." });
};

// ─── API Routers (Mount under both /api and root / for full compatibility) ────
const registerRoutes = (prefix = "") => {
  const p = (route) => (prefix ? `${prefix}${route}` : route);
  app.use(p("/db"), cmsRouter);
  app.use(p("/cms"), cmsRouter);
  app.use(p("/products"), productsRouter);
  app.use(p("/collections"), collectionsRouter);
  app.use(p("/journal"), journalRouter);
  app.use(p("/security"), securityRouter);
  app.use(p("/media"), mediaRouter);
  app.use(p("/otp"), otpRouter);
  app.use(p("/auth"), authRouter);
  app.use(p("/promo"), promoRouter);
  app.use(p("/payment"), paymentRouter);
  app.use(p("/delivery"), deliveryRouter);
  app.use(p("/newsletter"), newsletterRouter);
  app.use(p("/admin"), adminAuth, adminRouter);
  app.use(p("/geo"), geoRouter);
};

registerRoutes("/api");
registerRoutes("");

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("💥 Server Error:", err);
  res.status(err.status || 500).json({
    error: err.message || "An unexpected error occurred on the server"
  });
});

// Start the HTTP listener only for local runs. Vercel imports the exported app.
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`\n🚀 VRIX Backend API running → http://localhost:${PORT}`);
    console.log(`   DB Mode      : ${db.isConnected() ? "Prisma (PostgreSQL)" : "Local db.json"}`);
    console.log(`   Integrations : Dynamically managed (Cloudinary, Razorpay, SMTP, Truecaller)\n`);
  });
}

export default app;
