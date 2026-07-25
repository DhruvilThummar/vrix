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
// Dynamically mirror the request's origin (supports localhost:3000, vercel, etc.) and allow credentials
app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    callback(null, true);
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.options("*", cors());
app.use(express.json());

// Serve local uploads if Cloudinary is not configured
app.use("/uploads", express.static(path.join(__dirname, "data", "uploads")));

// ─── Startup Migration ─────────────────────────────────────────────────────────
await migrateIfNeeded();

// ─── Health Check ──────────────────────────────────────────────────────────────
app.get("/api/health", async (req, res) => {
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
});

// ─── API Routers ───────────────────────────────────────────────────────────────
app.use("/api", cmsRouter);
app.use("/api/products", productsRouter);
app.use("/api/collections", collectionsRouter);
app.use("/api/journal", journalRouter);
app.use("/api/security", securityRouter);
app.use("/api/media", mediaRouter);
app.use("/api/otp", otpRouter);
app.use("/api/auth", authRouter);
app.use("/api/promo", promoRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/delivery", deliveryRouter);
app.use("/api/newsletter", newsletterRouter);
// ─── Admin Auth Middleware ─────────────────────────────────────────────────────
// Protects all /api/admin/* routes with a secret header
const adminAuth = (req, res, next) => {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    // No secret configured — allow access in dev mode (warn only)
    console.warn("⚠️  ADMIN_SECRET not set. Admin routes are unprotected.");
    return next();
  }
  const provided = req.headers["x-admin-secret"] || req.query.adminSecret;
  if (provided === secret) return next();
  return res.status(401).json({ error: "Unauthorized: Invalid admin secret." });
};

app.use("/api/admin", adminAuth, adminRouter);
app.use("/api/geo", geoRouter);

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
