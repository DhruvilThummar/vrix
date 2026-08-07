import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { db, migrateIfNeeded } from "./database.js";
import { getCloudinary, getRazorpay, getTransporter } from "./config/apiResolvers.js";


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
import notificationsRouter from "./routes/notifications.js";
import chatRouter from "./routes/chat.js";
import consentRouter from "./routes/consent.js";



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
  // If a browser visits root with an OAuth hash callback (e.g. from Supabase Google Login redirect)
  if (req.headers.accept && req.headers.accept.includes("text/html")) {
    const frontendBase = process.env.FRONTEND_URL || "http://localhost:3000";
    return res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>VRIX Authentication</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #FAF8F5; color: #0F1728; }
          .card { background: #fff; padding: 40px; border: 1px solid #e5e3df; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.05); }
          .spinner { border: 3px solid #f3f3f3; border-top: 3px solid #0F1728; border-radius: 50%; width: 28px; height: 28px; animation: spin 1s linear infinite; margin: 0 auto 16px; }
          @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="spinner"></div>
          <h2 style="font-size:16px;letter-spacing:2px;text-transform:uppercase;margin:0 0 8px;">Completing Sign In</h2>
          <p style="font-size:13px;color:#666;margin:0;">Redirecting back to VRIX store...</p>
        </div>
        <script>
          (function() {
            const hash = window.location.hash || '';
            const search = window.location.search || '';
            const defaultFrontend = '${frontendBase}';
            let targetOrigin = defaultFrontend;
            try {
              if (window.opener || document.referrer) {
                const ref = new URL(document.referrer || window.location.href);
                if (ref.hostname === 'localhost' || ref.hostname === '127.0.0.1') {
                  targetOrigin = 'http://localhost:3000';
                }
              }
            } catch(e) {}
            const redirectUrl = targetOrigin.replace(/\\/$/, '') + '/auth/callback' + hash + (hash ? '' : search);
            window.location.href = redirectUrl;
          })();
        </script>
      </body>
      </html>
    `);
  }

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
  res.json({
    status: "ok",
    dbMode: db.isConnected() ? "prisma" : "local-json",
    cloudinary: !!cClient,
    razorpay: !!rClient,
    nodemailer: !!tClient,
  });
};

app.get("/api/health", healthHandler);
app.get("/health", healthHandler);

import { adminAuth } from "./middleware/auth.js";

// ─── API Routers (Mount under both /api and root / for full compatibility) ────
const registerRoutes = (prefix = "") => {
  const p = (route) => (prefix ? `${prefix}${route}` : route);
  app.use(prefix || "/", cmsRouter);
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
  app.use(p("/notifications"), notificationsRouter);
  app.use(p("/geo"), geoRouter);
  app.use(p("/chat"), chatRouter);
  app.use(p("/consent"), consentRouter);

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
    console.log(`   DB Status    : Connected to PostgreSQL (Supabase) via Prisma`);
    console.log(`   Integrations : Dynamically managed (Cloudinary, Razorpay, SMTP, Truecaller)\n`);
  });
}

export default app;
