import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";
import multer from "multer";
import { db, migrateIfNeeded } from "./database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// Multer — in-memory for Cloudinary uploads
const upload = multer({ storage: multer.memoryStorage() });

// ─── Dynamic API Configuration Resolvers ────────────────────────────────────────
async function getApiSettings() {
  try {
    const settings = await db.cmsSettings.findUnique({ where: { key: "api_settings" } });
    return settings || null;
  } catch (err) {
    return null;
  }
}

async function getCloudinary() {
  const apiSettings = await getApiSettings();
  if (apiSettings && apiSettings.cloudinaryEnabled) {
    if (apiSettings.cloudinaryCloudName && apiSettings.cloudinaryApiKey && apiSettings.cloudinaryApiSecret) {
      try {
        const { v2 } = await import("cloudinary");
        v2.config({
          cloud_name: apiSettings.cloudinaryCloudName,
          api_key: apiSettings.cloudinaryApiKey,
          api_secret: apiSettings.cloudinaryApiSecret,
        });
        return v2;
      } catch (err) {
        console.warn("Cloudinary: Dynamic configuration failed, using fallback.", err.message);
      }
    }
  }

  // Fallback to process.env
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    try {
      const { v2 } = await import("cloudinary");
      v2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      return v2;
    } catch (err) {
      console.warn("Cloudinary: fallback env config failed.", err.message);
    }
  }
  return null;
}

async function getRazorpay() {
  const apiSettings = await getApiSettings();
  if (apiSettings && apiSettings.razorpayEnabled) {
    if (apiSettings.razorpayKeyId && apiSettings.razorpayKeySecret) {
      try {
        const { default: Razorpay } = await import("razorpay");
        return new Razorpay({
          key_id: apiSettings.razorpayKeyId,
          key_secret: apiSettings.razorpayKeySecret,
        });
      } catch (err) {
        console.warn("Razorpay: Dynamic configuration failed, using fallback.", err.message);
      }
    }
  }

  // Fallback to process.env
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    try {
      const { default: Razorpay } = await import("razorpay");
      return new Razorpay({
        key_id: process.env.RAZORPAY_KEY_ID,
        key_secret: process.env.RAZORPAY_KEY_SECRET,
      });
    } catch (err) {
      console.warn("Razorpay: fallback env config failed.", err.message);
    }
  }
  return null;
}

async function getTransporter() {
  const apiSettings = await getApiSettings();
  if (apiSettings && apiSettings.nodemailerEnabled) {
    if (apiSettings.nodemailerUser && apiSettings.nodemailerPass) {
      try {
        const nodemailer = await import("nodemailer");
        return nodemailer.default.createTransport({
          host: apiSettings.nodemailerHost || "smtp.gmail.com",
          port: parseInt(apiSettings.nodemailerPort || "587"),
          secure: false,
          auth: {
            user: apiSettings.nodemailerUser,
            pass: apiSettings.nodemailerPass,
          },
        });
      } catch (err) {
        console.warn("Nodemailer: Dynamic configuration failed, using fallback.", err.message);
      }
    }
  }

  // Fallback to process.env
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const nodemailer = await import("nodemailer");
      return nodemailer.default.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: false,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } catch (err) {
      console.warn("Nodemailer: fallback env config failed.", err.message);
    }
  }
  return null;
}

async function getTruecallerConfig() {
  const apiSettings = await getApiSettings();
  if (apiSettings) {
    return {
      enabled: !!apiSettings.truecallerEnabled,
      sandbox: !!apiSettings.truecallerSandboxMode,
      partnerKey: apiSettings.truecallerPartnerKey || process.env.TRUECALLER_PARTNER_KEY || "",
      appId: apiSettings.truecallerAppId || process.env.TRUECALLER_APP_ID || "",
    };
  }

  // Fallback to process.env
  const partnerKey = process.env.TRUECALLER_PARTNER_KEY || "";
  const appId = process.env.TRUECALLER_APP_ID || "";
  const enabled = !!(partnerKey && appId);
  const sandbox = process.env.TRUECALLER_SANDBOX_MODE === "true" || !enabled;
  return {
    enabled: enabled || sandbox, // Allow sandbox even if real keys are empty
    sandbox,
    partnerKey,
    appId,
  };
}

// ─── Startup Migration ─────────────────────────────────────────────────────────
await migrateIfNeeded();

// ══════════════════════════════════════════════════════════════════════════════
//  HEALTH
// ══════════════════════════════════════════════════════════════════════════════

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

// ══════════════════════════════════════════════════════════════════════════════
//  CMS
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/db — Full DB snapshot (for client-side hydration)
app.get("/api/db", async (req, res) => {
  try {
    const cms = await db.cmsSettings.findMany();
    const products = await db.products.findMany();
    const journal = await db.journal.findMany();
    res.json({ ...cms, products, journal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cms — Upsert any CMS section
app.post("/api/cms", async (req, res) => {
  try {
    const sections = ["homepage", "story", "legal", "navigation", "brand", "features", "collections", "api_settings"];
    for (const section of sections) {
      if (req.body[section] !== undefined) {
        await db.cmsSettings.upsert({
          where: { key: section },
          update: { value: req.body[section] },
          create: { key: section, value: req.body[section] },
        });
      }
    }
    const updated = await db.cmsSettings.findMany();
    res.json({ success: true, db: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
//  PRODUCTS
// ══════════════════════════════════════════════════════════════════════════════

app.get("/api/products", async (req, res) => {
  try {
    const products = await db.products.findMany();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/products/:id", async (req, res) => {
  try {
    const product = await db.products.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    const data = req.body;
    if (!data.id) {
      data.id = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    }
    const product = await db.products.create({ data });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/products/:id", async (req, res) => {
  try {
    const updated = await db.products.update({ where: { id: req.params.id }, data: req.body });
    res.json(updated);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    await db.products.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: `Product ${req.params.id} deleted` });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
//  COLLECTIONS
// ══════════════════════════════════════════════════════════════════════════════

app.get("/api/collections", async (req, res) => {
  try {
    const collectionsData = await db.cmsSettings.findUnique({ where: { key: "collections" } });
    res.json(collectionsData || []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
//  JOURNAL
// ══════════════════════════════════════════════════════════════════════════════

app.get("/api/journal", async (req, res) => {
  try {
    res.json(await db.journal.findMany());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/journal", async (req, res) => {
  try {
    const data = req.body;
    if (!data.id) data.id = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (!data.date) data.date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const post = await db.journal.create({ data });
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/journal/:id", async (req, res) => {
  try {
    const updated = await db.journal.update({ where: { id: req.params.id }, data: req.body });
    res.json(updated);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

app.delete("/api/journal/:id", async (req, res) => {
  try {
    await db.journal.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: `Article ${req.params.id} deleted` });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
//  SECURITY LOGS
// ══════════════════════════════════════════════════════════════════════════════

app.get("/api/security/logs", async (req, res) => {
  try {
    res.json(await db.securityLogs.findMany());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/security/logs", async (req, res) => {
  try {
    const log = await db.securityLogs.create({ data: req.body });
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
//  MEDIA UPLOAD (Cloudinary)
// ══════════════════════════════════════════════════════════════════════════════

app.post("/api/media/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file provided" });

  const cClient = await getCloudinary();
  // If Cloudinary is configured, upload there
  if (cClient) {
    try {
      const result = await new Promise((resolve, reject) => {
        const stream = cClient.uploader.upload_stream(
          { folder: "vrix", resource_type: "auto" },
          (error, result) => (error ? reject(error) : resolve(result))
        );
        stream.end(req.file.buffer);
      });
      return res.json({ url: result.secure_url, public_id: result.public_id });
    } catch (err) {
      return res.status(500).json({ error: "Cloudinary upload failed: " + err.message });
    }
  }

  // Fallback: save file locally in /data/uploads/
  const uploadsDir = path.join(__dirname, "data", "uploads");
  try {
    const { mkdirSync, writeFileSync } = await import("fs");
    mkdirSync(uploadsDir, { recursive: true });
    const safeName = Date.now() + "_" + req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    writeFileSync(path.join(uploadsDir, safeName), req.file.buffer);
    const url = `http://localhost:${PORT}/uploads/${safeName}`;
    return res.json({ url, public_id: safeName });
  } catch (err) {
    return res.status(500).json({ error: "Local upload failed: " + err.message });
  }
});

// Serve local uploads if Cloudinary is not configured
app.use("/uploads", express.static(path.join(__dirname, "data", "uploads")));

// ══════════════════════════════════════════════════════════════════════════════
//  OTP — Nodemailer
// ══════════════════════════════════════════════════════════════════════════════

app.post("/api/otp/send", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  try {
    // Remove existing OTPs for this email
    await db.verificationOtps.deleteMany({ where: { email } });

    // Store new OTP
    await db.verificationOtps.create({
      data: { email, otp, expiresAt: expiresAt.toISOString() },
    });

    const activeTransporter = await getTransporter();
    // Send email if Nodemailer is configured
    if (activeTransporter) {
      const apiSettings = await getApiSettings();
      const senderEmail = apiSettings && apiSettings.nodemailerUser ? apiSettings.nodemailerUser : (process.env.SMTP_USER || "info@vrixjewels.com");
      await activeTransporter.sendMail({
        from: `"VRIX" <${senderEmail}>`,
        to: email,
        subject: "Your VRIX Verification Code",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9f8f6;border:1px solid #e5e3df;">
            <h2 style="font-size:20px;letter-spacing:4px;color:#0f1728;text-transform:uppercase;margin-bottom:24px;">VRIX Verification</h2>
            <p style="color:#666;font-size:14px;margin-bottom:16px;">Your one-time verification code is:</p>
            <div style="font-size:36px;font-weight:700;letter-spacing:12px;color:#0f1728;text-align:center;padding:24px;background:#fff;border:1px solid #e5e3df;margin-bottom:24px;">${otp}</div>
            <p style="color:#999;font-size:12px;">This code expires in 10 minutes. Do not share it with anyone.</p>
          </div>
        `,
      });
      res.json({ success: true, message: "OTP sent to " + email });
    } else {
      // Dev mode: return OTP in response
      console.log(`[DEV] OTP for ${email}: ${otp}`);
      res.json({ success: true, message: "OTP generated (dev mode)", otp });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/otp/verify", async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: "Email and OTP required" });

  try {
    const record = await db.verificationOtps.findFirst({ where: { email, otp } });

    if (!record) return res.status(401).json({ error: "Invalid OTP" });

    const expiry = new Date(record.expiresAt);
    if (expiry < new Date()) {
      await db.verificationOtps.delete({ where: { id: record.id } });
      return res.status(401).json({ error: "OTP has expired" });
    }

    // Consume OTP
    await db.verificationOtps.delete({ where: { id: record.id } });

    // Log authentication
    await db.securityLogs.create({
      data: { event: "OTP_VERIFICATION", user: email, status: "SUCCESS" },
    });

    res.json({ success: true, email, message: "Email verified successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register Route: Checks if user exists, sends OTP to register
app.post("/api/auth/register", async (req, res) => {
  const { email, password, name, phone } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Email, password, and name are required." });
  }

  try {
    const existing = await db.users.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "User already exists with this email address." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    const targetKey = `register:${email.toLowerCase()}`;
    await db.verificationOtps.deleteMany({ where: { email: targetKey } });
    await db.verificationOtps.create({
      data: { email: targetKey, otp, expiresAt: expiresAt.toISOString() },
    });

    const activeTransporter = await getTransporter();
    if (activeTransporter) {
      const apiSettings = await getApiSettings();
      const senderEmail = apiSettings && apiSettings.nodemailerUser ? apiSettings.nodemailerUser : (process.env.SMTP_USER || "info@vrixjewels.com");
      await activeTransporter.sendMail({
        from: `"VRIX" <${senderEmail}>`,
        to: email,
        subject: "Verify Your VRIX Account Registration",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9f8f6;border:1px solid #e5e3df;">
            <h2 style="font-size:20px;letter-spacing:4px;color:#0f1728;text-transform:uppercase;margin-bottom:24px;">Verify Your Email</h2>
            <p style="color:#666;font-size:14px;margin-bottom:16px;">Hello ${name}, thank you for registering with VRIX. Please verify your email address using this verification code:</p>
            <div style="font-size:36px;font-weight:700;letter-spacing:12px;color:#0f1728;text-align:center;padding:24px;background:#fff;border:1px solid #e5e3df;margin-bottom:24px;">${otp}</div>
            <p style="color:#999;font-size:12px;">This code expires in 10 minutes. Do not share it with anyone.</p>
          </div>
        `,
      });
      res.json({ success: true, message: "OTP code sent to your email." });
    } else {
      console.log(`[DEV] Register OTP for ${email}: ${otp}`);
      res.json({ success: true, message: "OTP code generated (dev mode)", otp });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Confirm Registration: Verifies OTP, saves user in DB
app.post("/api/auth/register/confirm", async (req, res) => {
  const { email, otp, password, name, phone } = req.body;
  if (!email || !otp || !password || !name) {
    return res.status(400).json({ error: "Missing required verification fields." });
  }

  try {
    const targetKey = `register:${email.toLowerCase()}`;
    const record = await db.verificationOtps.findFirst({ where: { email: targetKey, otp } });

    if (!record) return res.status(401).json({ error: "Invalid verification code." });

    const expiry = new Date(record.expiresAt);
    if (expiry < new Date()) {
      await db.verificationOtps.delete({ where: { id: record.id } });
      return res.status(401).json({ error: "Verification code has expired." });
    }

    // Consume OTP
    await db.verificationOtps.delete({ where: { id: record.id } });

    // Hashing password
    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");

    // Save user record
    const newUser = await db.users.create({
      data: {
        email: email.toLowerCase(),
        password: hashedPassword,
        name,
        phone: phone || ""
      }
    });

    await db.securityLogs.create({
      data: { event: "ACCOUNT_REGISTER", user: email, status: "SUCCESS" },
    });

    res.json({ success: true, user: { email: newUser.email, name: newUser.name, phone: newUser.phone } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login Route: Verifies password, sends OTP to log in
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const user = await db.users.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    // Verify Password
    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");
    if (user.password !== hashedPassword && user.password !== "truecaller_oauth_account") {
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    const targetKey = `login:${email.toLowerCase()}`;
    await db.verificationOtps.deleteMany({ where: { email: targetKey } });
    await db.verificationOtps.create({
      data: { email: targetKey, otp, expiresAt: expiresAt.toISOString() },
    });

    const activeTransporter = await getTransporter();
    if (activeTransporter) {
      const apiSettings = await getApiSettings();
      const senderEmail = apiSettings && apiSettings.nodemailerUser ? apiSettings.nodemailerUser : (process.env.SMTP_USER || "info@vrixjewels.com");
      await activeTransporter.sendMail({
        from: `"VRIX" <${senderEmail}>`,
        to: email,
        subject: "VRIX Login Verification Code",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9f8f6;border:1px solid #e5e3df;">
            <h2 style="font-size:20px;letter-spacing:4px;color:#0f1728;text-transform:uppercase;margin-bottom:24px;">Verify Your Login</h2>
            <p style="color:#666;font-size:14px;margin-bottom:16px;">Hello ${user.name || 'member'}, please verify your VRIX sign-in request using this code:</p>
            <div style="font-size:36px;font-weight:700;letter-spacing:12px;color:#0f1728;text-align:center;padding:24px;background:#fff;border:1px solid #e5e3df;margin-bottom:24px;">${otp}</div>
            <p style="color:#999;font-size:12px;">This code expires in 10 minutes. Do not share it with anyone.</p>
          </div>
        `,
      });
      res.json({ success: true, message: "OTP sent to your email." });
    } else {
      console.log(`[DEV] Login OTP for ${email}: ${otp}`);
      res.json({ success: true, message: "OTP generated (dev mode)", otp });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Direct Login Route: Verifies password and logs in immediately without OTP
app.post("/api/auth/login/direct", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const user = await db.users.findUnique({ where: { email } });
    if (!user) {
      await db.securityLogs.create({
        data: { event: "ACCOUNT_LOGIN", user: email, status: "FAILED" },
      });
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    // Verify Password
    const hashedPassword = crypto.createHash("sha256").update(password).digest("hex");
    if (user.password !== hashedPassword && user.password !== "truecaller_oauth_account") {
      await db.securityLogs.create({
        data: { event: "ACCOUNT_LOGIN", user: email, status: "FAILED" },
      });
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    await db.securityLogs.create({
      data: { event: "ACCOUNT_LOGIN", user: email, status: "SUCCESS" },
    });

    res.json({ success: true, user: { email: user.email, name: user.name, phone: user.phone } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Confirm Login: Verifies OTP and completes log in session
app.post("/api/auth/login/confirm", async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required." });
  }

  try {
    const targetKey = `login:${email.toLowerCase()}`;
    const record = await db.verificationOtps.findFirst({ where: { email: targetKey, otp } });

    if (!record) return res.status(401).json({ error: "Invalid verification code." });

    const expiry = new Date(record.expiresAt);
    if (expiry < new Date()) {
      await db.verificationOtps.delete({ where: { id: record.id } });
      return res.status(401).json({ error: "Verification code has expired." });
    }

    // Consume OTP
    await db.verificationOtps.delete({ where: { id: record.id } });

    // Fetch user details
    const user = await db.users.findUnique({ where: { email } });

    await db.securityLogs.create({
      data: { event: "ACCOUNT_LOGIN", user: email, status: "SUCCESS" },
    });

    res.json({ success: true, user: { email: user.email, name: user.name, phone: user.phone } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
//  TRUECALLER API
// ══════════════════════════════════════════════════════════════════════════════

app.post("/api/truecaller/verify", async (req, res) => {
  const { payload, signature, signatureAlgorithm } = req.body;
  
  try {
    const config = await getTruecallerConfig();
    if (!config.enabled) {
      return res.status(400).json({ error: "Truecaller verification is not enabled in settings." });
    }

    if (config.sandbox || signature === "mock-signature" || !signature) {
      // Sandbox / Mock Mode: Simulate Truecaller Verification
      console.log("[TRUECALLER] Sandbox mode verification requested.");
      
      let profile = {
        name: "Dhruv Agent",
        email: "dhruv@vrix.com",
        phone: "+919876543210"
      };

      if (payload) {
        try {
          const decoded = JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));
          profile.name = (decoded.firstName + " " + (decoded.lastName || "")).trim() || profile.name;
          profile.email = decoded.email || profile.email;
          profile.phone = decoded.phoneNumber || profile.phone;
        } catch (e) {
          // ignore parsing error
        }
      }
      
      // Auto-register user in DB when verified via Truecaller
      try {
        let existingUser = await db.users.findUnique({ where: { email: profile.email } });
        if (!existingUser) {
          await db.users.create({
            data: {
              email: profile.email,
              name: profile.name,
              phone: profile.phone,
              password: "truecaller_oauth_account"
            }
          });
        }
      } catch (dbErr) {
        console.error("Failed to auto-register Truecaller user:", dbErr.message);
      }

      return res.json({
        success: true,
        verified: true,
        profile,
        mode: "sandbox"
      });
    }

    // Live Signature Verification
    if (!payload || !signature || !signatureAlgorithm) {
      return res.status(400).json({ error: "payload, signature, and signatureAlgorithm are required for live verification." });
    }

    // Fetch public keys from Truecaller
    const keyRes = await fetch("https://api4.truecaller.com/v1/key");
    if (!keyRes.ok) {
      throw new Error("Failed to retrieve public keys from Truecaller API.");
    }
    const { keys } = await keyRes.json();
    
    let isSignatureValid = false;
    for (const keyObj of keys) {
      const pemKey = `-----BEGIN PUBLIC KEY-----\n${keyObj.key}\n-----END PUBLIC KEY-----`;
      const verify = crypto.createVerify("RSA-SHA512");
      verify.update(payload);
      if (verify.verify(pemKey, signature, "base64")) {
        isSignatureValid = true;
        break;
      }
    }

    if (!isSignatureValid) {
      return res.status(401).json({ error: "Truecaller signature verification failed." });
    }

    // Decode Payload
    const decodedProfile = JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));

    // Validate Verifier
    if (config.partnerKey && config.appId) {
      const expectedVerifier = crypto
        .createHmac("sha256", config.partnerKey)
        .update(config.appId)
        .digest("base64");
      
      if (decodedProfile.verifier !== expectedVerifier) {
        return res.status(401).json({ error: "Truecaller payload verification mismatch (possible replay attack)." });
      }
    }

    const profileObj = {
      name: (decodedProfile.firstName + " " + (decodedProfile.lastName || "")).trim(),
      email: decodedProfile.email,
      phone: decodedProfile.phoneNumber
    };

    // Auto-register user in DB when verified via Truecaller
    try {
      let existingUser = await db.users.findUnique({ where: { email: profileObj.email } });
      if (!existingUser) {
        await db.users.create({
          data: {
            email: profileObj.email,
            name: profileObj.name,
            phone: profileObj.phone,
            password: "truecaller_oauth_account"
          }
        });
      }
    } catch (dbErr) {
      console.error("Failed to auto-register Truecaller user:", dbErr.message);
    }

    return res.json({
      success: true,
      verified: true,
      profile: profileObj,
      mode: "live"
    });

  } catch (err) {
    console.error("Truecaller verification error:", err.message);
    res.status(500).json({ error: "Truecaller verification failed: " + err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
//  PROMO / REDEEM CODES
// ══════════════════════════════════════════════════════════════════════════════

// Verify a promo code at checkout
app.post("/api/promo/verify", async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "Code is required" });

  try {
    const promo = await db.redeemCodes.findUnique({ where: { code: code.toUpperCase() } });

    if (!promo) return res.status(404).json({ error: "Invalid promo code" });
    if (!promo.isActive) return res.status(400).json({ error: "Promo code is no longer active" });

    res.json({
      success: true,
      code: promo.code,
      discount: promo.discount,
      type: promo.type, // "percentage" | "fixed"
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// List all promo codes (admin)
app.get("/api/promo/codes", async (req, res) => {
  try {
    // Access local db to get all codes (not exposed via db abstraction's findMany)
    if (db.isConnected()) {
      const { PrismaClient } = await import("@prisma/client");
      const p = new PrismaClient();
      const codes = await p.redeemCode.findMany({ orderBy: { createdAt: "desc" } });
      res.json(codes);
    } else {
      const { readFileSync } = await import("fs");
      const raw = readFileSync(path.join(__dirname, "data", "db.json"), "utf8");
      const local = JSON.parse(raw);
      res.json(local.redeemCodes || []);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create a promo code (admin)
app.post("/api/promo/codes", async (req, res) => {
  try {
    const { code, discount, type } = req.body;
    if (!code || !discount || !type) return res.status(400).json({ error: "code, discount, and type are required" });

    const created = await db.redeemCodes.create({
      data: { code: code.toUpperCase(), discount: Number(discount), type, isActive: true },
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Toggle active/inactive promo code (admin)
app.put("/api/promo/codes/:code", async (req, res) => {
  try {
    const updated = await db.redeemCodes.update({
      where: { code: req.params.code.toUpperCase() },
      data: req.body,
    });
    res.json(updated);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// Delete promo code (admin)
app.delete("/api/promo/codes/:code", async (req, res) => {
  try {
    await db.redeemCodes.delete({ where: { code: req.params.code.toUpperCase() } });
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
//  PAYMENTS — Razorpay
// ══════════════════════════════════════════════════════════════════════════════

// Create a Razorpay order
app.post("/api/payment/order", async (req, res) => {
  const { amount, currency = "INR", receipt, notes = {} } = req.body;
  if (!amount) return res.status(400).json({ error: "Amount is required (in paise)" });

  const customerName = req.body.customerName || notes.customerName || null;
  const customerPhone = req.body.customerPhone || notes.customerPhone || null;
  const address = req.body.address || notes.address || null;
  const city = req.body.city || notes.city || null;
  const postalCode = req.body.postalCode || notes.postalCode || null;
  const userEmail = req.body.email || notes.customerEmail || null;

  try {
    const activeRazorpay = await getRazorpay();
    if (activeRazorpay) {
      const order = await activeRazorpay.orders.create({
        amount: Math.round(Number(amount) * 100), // convert to paise
        currency,
        receipt: receipt || `receipt_${Date.now()}`,
        notes,
      });

      // Record in DB
      await db.payments.create({
        data: {
          orderId: order.id,
          amount: Number(amount),
          currency,
          status: "CREATED",
          customerName,
          customerPhone,
          address,
          city,
          postalCode,
          userEmail,
        },
      });

      res.json({ success: true, order });
    } else {
      // Dev fallback: mock Razorpay order
      const mockOrderId = "order_dev_" + Date.now();
      await db.payments.create({
        data: {
          orderId: mockOrderId,
          amount: Number(amount),
          currency,
          status: "CREATED",
          customerName,
          customerPhone,
          address,
          city,
          postalCode,
          userEmail,
        },
      });
      res.json({
        success: true,
        order: { id: mockOrderId, amount: Number(amount) * 100, currency, status: "created" },
        devMode: true,
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Verify Razorpay payment signature
app.post("/api/payment/verify", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, items } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "Missing payment verification fields" });
  }

  try {
    let isValid = false;
    const apiSettings = await getApiSettings();
    const keySecret = apiSettings && apiSettings.razorpayEnabled && apiSettings.razorpayKeySecret
      ? apiSettings.razorpayKeySecret
      : process.env.RAZORPAY_KEY_SECRET;

    if (keySecret) {
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSig = crypto
        .createHmac("sha256", keySecret)
        .update(body)
        .digest("hex");
      isValid = expectedSig === razorpay_signature;
    } else {
      // Dev mode: always pass
      isValid = true;
    }

    if (!isValid) {
      await db.payments.update({
        where: { orderId: razorpay_order_id },
        data: { status: "FAILED" },
      });
      return res.status(400).json({ error: "Payment signature verification failed" });
    }

    // Update payment record
    const paymentRecord = await db.payments.update({
      where: { orderId: razorpay_order_id },
      data: { status: "SUCCESS", paymentId: razorpay_payment_id },
    });

    await db.securityLogs.create({
      data: { event: "PAYMENT_SUCCESS", user: razorpay_payment_id, status: "SUCCESS" },
    });

    // Send email with order details to both customer and admin
    try {
      const activeTransporter = await getTransporter();
      if (activeTransporter) {
        const cmsBrand = await db.cmsSettings.findUnique({ where: { key: "brand" } }) || {};
        const adminEmail = cmsBrand.email || process.env.ADMIN_EMAIL || "contact@vrix.com";
        const senderEmail = apiSettings && apiSettings.nodemailerUser ? apiSettings.nodemailerUser : (process.env.SMTP_USER || "info@vrixjewels.com");
        
        const itemsList = items || [];
        let itemsHtml = "";
        itemsList.forEach((item) => {
          itemsHtml += `
            <tr style="border-bottom: 1px solid #e5e3df;">
              <td style="padding: 12px 0; font-size: 14px; color: #0f1728;">
                <strong>${item.title}</strong><br/>
                <span style="font-size: 12px; color: #666;">${item.material || ""} ${item.size ? `(Size: ${item.size})` : ""}</span>
                ${item.engraving ? `<br/><span style="font-size: 12px; color: #666; font-style: italic;">"${item.engraving}"</span>` : ""}
              </td>
              <td style="padding: 12px 0; font-size: 14px; color: #0f1728; text-align: center;">${item.quantity}</td>
              <td style="padding: 12px 0; font-size: 14px; color: #0f1728; text-align: right;">₹${(item.price * item.quantity).toLocaleString()}</td>
            </tr>
          `;
        });

        const orderSummaryHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 32px; background: #f9f8f6; border: 1px solid #e5e3df;">
            <h2 style="font-size: 20px; letter-spacing: 4px; color: #0f1728; text-transform: uppercase; margin-bottom: 24px; text-align: center; border-bottom: 1px solid #e5e3df; padding-bottom: 16px;">VRIX ORDER CONFIRMATION</h2>
            <p style="color: #666; font-size: 14px; margin-bottom: 16px;">Hello ${paymentRecord.customerName || 'Valued Customer'},</p>
            <p style="color: #666; font-size: 14px; margin-bottom: 24px;">Thank you for your purchase. We are preparing your architectural jewelry pieces with meticulous care. Below are your order details:</p>
            
            <div style="margin-bottom: 24px; background: #fff; padding: 20px; border: 1px solid #e5e3df;">
              <p style="font-size: 12px; color: #999; margin: 0 0 4px 0;">ORDER ID</p>
              <p style="font-size: 16px; color: #0f1728; font-weight: bold; margin: 0 0 16px 0;">${paymentRecord.orderId}</p>
              <p style="font-size: 12px; color: #999; margin: 0 0 4px 0;">SHIPPING ADDRESS</p>
              <p style="font-size: 14px; color: #0f1728; margin: 0;">${paymentRecord.customerName || ""}</p>
              <p style="font-size: 14px; color: #0f1728; margin: 0;">${paymentRecord.address || ""}</p>
              <p style="font-size: 14px; color: #0f1728; margin: 0;">${paymentRecord.city || ""}, ${paymentRecord.postalCode || ""}</p>
              <p style="font-size: 14px; color: #0f1728; margin: 4px 0 0 0;">Phone: ${paymentRecord.customerPhone || ""}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <thead>
                <tr style="border-bottom: 2px solid #e5e3df; font-size: 11px; text-transform: uppercase; color: #999; letter-spacing: 1px;">
                  <th style="text-align: left; padding-bottom: 8px;">Item</th>
                  <th style="text-align: center; padding-bottom: 8px; width: 60px;">Qty</th>
                  <th style="text-align: right; padding-bottom: 8px; width: 100px;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml || `<tr><td colspan="3" style="padding: 12px 0; text-align: center; color: #666;">No items registered</td></tr>`}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding: 16px 0 0 0; font-size: 14px; color: #666; text-align: right;">Total Paid</td>
                  <td style="padding: 16px 0 0 0; font-size: 18px; font-weight: bold; color: #0f1728; text-align: right;">₹${paymentRecord.amount.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
            
            <div style="border-top: 1px solid #e5e3df; padding-top: 24px; text-align: center;">
              <p style="color: #999; font-size: 12px; margin: 0 0 8px 0;">If you have any questions, please contact us at ${adminEmail}</p>
              <p style="color: #0f1728; font-size: 12px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; margin: 0;">VRIX LUXURY JEWELRY</p>
            </div>
          </div>
        `;

        // Send to customer
        if (paymentRecord.userEmail) {
          await activeTransporter.sendMail({
            from: `"VRIX" <${senderEmail}>`,
            to: paymentRecord.userEmail,
            subject: `Your VRIX Order Confirmation - ${paymentRecord.orderId}`,
            html: orderSummaryHtml,
          });
        }

        // Send to admin
        await activeTransporter.sendMail({
          from: `"VRIX Order System" <${senderEmail}>`,
          to: adminEmail,
          subject: `New VRIX Order Received - ${paymentRecord.orderId}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e3df;">
              <h2 style="color: #0f1728; border-bottom: 2px solid #e5e3df; padding-bottom: 10px;">New Order Paid</h2>
              <p>A new order has been paid and verified. Details are listed below:</p>
              ${orderSummaryHtml}
            </div>
          `,
        });
      }
    } catch (mailErr) {
      console.error("Failed to send order verification email:", mailErr.message);
    }

    res.json({ success: true, paymentId: razorpay_payment_id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get payment logs (admin)
app.get("/api/payment/logs", async (req, res) => {
  try {
    res.json(await db.payments.findMany());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
//  DELIVERY PANEL
// ══════════════════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════════════════
//  DELIVERY PORTAL & ROLE-BASED AUTH
// ══════════════════════════════════════════════════════════════════════════════

// Delivery Staff login (OTP generation)
app.post("/api/delivery/auth/login", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    // Check if user is registered delivery staff
    const staff = await db.deliveryStaff.findUnique({ where: { email } });
    if (!staff) {
      return res.status(403).json({ error: "Access denied. Not registered as delivery staff." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    // Store OTP tagged as delivery login auth
    const authKey = `delivery_auth:${email}`;
    await db.verificationOtps.deleteMany({ where: { email: authKey } });
    await db.verificationOtps.create({
      data: { email: authKey, otp, expiresAt: expiresAt.toISOString() },
    });

    const activeTransporter = await getTransporter();
    if (activeTransporter) {
      const apiSettings = await getApiSettings();
      const senderEmail = apiSettings && apiSettings.nodemailerUser ? apiSettings.nodemailerUser : (process.env.SMTP_USER || "info@vrixjewels.com");
      await activeTransporter.sendMail({
        from: `"VRIX Delivery System" <${senderEmail}>`,
        to: email,
        subject: "Your VRIX Delivery Portal Login Code",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#f0f4f8;border:1px solid #d0e0f0;">
            <h2 style="font-size:20px;letter-spacing:4px;color:#1a365d;text-transform:uppercase;margin-bottom:24px;">VRIX Delivery Staff Portal</h2>
            <p style="color:#4a5568;font-size:14px;margin-bottom:16px;">Hello ${staff.name}, your login verification code is:</p>
            <div style="font-size:36px;font-weight:700;letter-spacing:12px;color:#1a365d;text-align:center;padding:24px;background:#fff;border:1px solid #d0e0f0;margin-bottom:24px;">${otp}</div>
            <p style="color:#718096;font-size:12px;">This code is valid for 10 minutes. Please keep it secure.</p>
          </div>
        `,
      });
      res.json({ success: true, message: "Login OTP sent to " + email });
    } else {
      console.log(`[DEV] Delivery Auth OTP for ${email}: ${otp}`);
      res.json({ success: true, message: "Login OTP generated (dev mode)", otp });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delivery Staff verify login
app.post("/api/delivery/auth/verify", async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: "Email and OTP required" });

  try {
    const staff = await db.deliveryStaff.findUnique({ where: { email } });
    if (!staff) {
      return res.status(403).json({ error: "Access denied." });
    }

    const authKey = `delivery_auth:${email}`;
    const record = await db.verificationOtps.findFirst({
      where: { email: authKey, otp }
    });

    if (!record) return res.status(401).json({ error: "Invalid login OTP" });

    const expiry = new Date(record.expiresAt);
    if (expiry < new Date()) {
      await db.verificationOtps.delete({ where: { id: record.id } });
      return res.status(401).json({ error: "Login OTP has expired" });
    }

    // Consume OTP
    await db.verificationOtps.delete({ where: { id: record.id } });

    await db.securityLogs.create({
      data: { event: "DELIVERY_STAFF_LOGIN", user: email, status: "SUCCESS" },
    });

    res.json({
      success: true,
      user: {
        email: staff.email,
        name: staff.name,
        role: staff.role
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get delivery orders with role & email filters
app.get("/api/delivery/orders", async (req, res) => {
  const { role, email } = req.query;

  try {
    const payments = await db.payments.findMany();
    // Successful or delivered or created orders
    let orders = payments.filter((p) => p.status === "SUCCESS" || p.status === "DELIVERED" || p.status === "CREATED");

    if (role === "agent" && email) {
      // Agents see orders assigned to them, OR unassigned orders (null / undefined)
      orders = orders.filter(
        (o) => o.assignedAgent === email || !o.assignedAgent
      );
    }
    // Managers see all orders

    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Manager: Assign order to delivery agent
app.patch("/api/delivery/orders/:orderId/assign", async (req, res) => {
  const { orderId } = req.params;
  const { agentEmail } = req.body; // Can be email string, or null to unassign

  try {
    // If agentEmail is provided, check if it's a valid agent
    if (agentEmail) {
      const agent = await db.deliveryStaff.findUnique({ where: { email: agentEmail } });
      if (!agent) {
        return res.status(400).json({ error: "Invalid delivery staff member email" });
      }
    }

    const updated = await db.payments.update({
      where: { orderId },
      data: { assignedAgent: agentEmail || null },
    });

    await db.securityLogs.create({
      data: { event: "DELIVERY_ASSIGNED", user: `${orderId} to ${agentEmail || "unassigned"}`, status: "SUCCESS" },
    });

    res.json({ success: true, order: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Manager: List all delivery staff
app.get("/api/delivery/staff", async (req, res) => {
  try {
    const staff = await db.deliveryStaff.findMany();
    res.json(staff);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Manager: Create new delivery staff member
app.post("/api/delivery/staff", async (req, res) => {
  const { email, name, role } = req.body;
  if (!email || !name || !role) {
    return res.status(400).json({ error: "email, name, and role ('agent' | 'manager') are required" });
  }

  try {
    const created = await db.deliveryStaff.create({
      data: { email, name, role }
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Manager: Delete a delivery staff member
app.delete("/api/delivery/staff/:email", async (req, res) => {
  const { email } = req.params;
  try {
    await db.deliveryStaff.delete({ where: { email } });
    res.json({ success: true, email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delivery agent sends OTP to customer
app.post("/api/delivery/send-otp", async (req, res) => {
  const { orderId, customerEmail } = req.body;
  if (!orderId || !customerEmail) {
    return res.status(400).json({ error: "orderId and customerEmail are required" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min for delivery

  try {
    // Store delivery OTP tagged with orderId
    await db.verificationOtps.deleteMany({ where: { email: `delivery:${orderId}` } });
    await db.verificationOtps.create({
      data: {
        email: `delivery:${orderId}`,
        otp,
        expiresAt: expiresAt.toISOString(),
      },
    });

    const activeTransporter = await getTransporter();
    if (activeTransporter) {
      const apiSettings = await getApiSettings();
      const senderEmail = apiSettings && apiSettings.nodemailerUser ? apiSettings.nodemailerUser : (process.env.SMTP_USER || "info@vrixjewels.com");
      await activeTransporter.sendMail({
        from: `"VRIX Delivery" <${senderEmail}>`,
        to: customerEmail,
        subject: "Your VRIX Delivery Verification Code",
        html: `
          <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9f8f6;border:1px solid #e5e3df;">
            <h2 style="font-size:20px;letter-spacing:4px;color:#0f1728;text-transform:uppercase;margin-bottom:24px;">VRIX Delivery</h2>
            <p style="color:#666;font-size:14px;">Your delivery verification code for Order <strong>${orderId}</strong>:</p>
            <div style="font-size:36px;font-weight:700;letter-spacing:12px;color:#0f1728;text-align:center;padding:24px;background:#fff;border:1px solid #e5e3df;margin:24px 0;">${otp}</div>
            <p style="color:#999;font-size:12px;">Share this code with the delivery agent at the time of delivery. Valid for 15 minutes.</p>
          </div>
        `,
      });
      res.json({ success: true, message: `Delivery OTP sent to ${customerEmail}` });
    } else {
      console.log(`[DEV] Delivery OTP for order ${orderId}: ${otp}`);
      res.json({ success: true, message: "Delivery OTP generated (dev mode)", otp });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delivery agent verifies OTP from customer
app.post("/api/delivery/verify-otp", async (req, res) => {
  const { orderId, otp } = req.body;
  if (!orderId || !otp) return res.status(400).json({ error: "orderId and otp are required" });

  try {
    const record = await db.verificationOtps.findFirst({
      where: { email: `delivery:${orderId}`, otp },
    });

    if (!record) return res.status(401).json({ error: "Invalid delivery OTP" });

    const expiry = new Date(record.expiresAt);
    if (expiry < new Date()) {
      await db.verificationOtps.delete({ where: { id: record.id } });
      return res.status(401).json({ error: "Delivery OTP has expired" });
    }

    // Consume OTP & mark order as DELIVERED
    await db.verificationOtps.delete({ where: { id: record.id } });
    const order = await db.payments.update({ where: { orderId }, data: { status: "DELIVERED" } });

    await db.securityLogs.create({
      data: { event: "DELIVERY_CONFIRMED", user: orderId, status: "SUCCESS" },
    });

    // Send delivery details email to customer
    if (order.userEmail) {
      try {
        const activeTransporter = await getTransporter();
        if (activeTransporter) {
          const apiSettings = await getApiSettings();
          const senderEmail = apiSettings && apiSettings.nodemailerUser ? apiSettings.nodemailerUser : (process.env.SMTP_USER || "info@vrixjewels.com");
          
          const amountStr = order.currency + " " + (order.amount / 100).toLocaleString();
          
          await activeTransporter.sendMail({
            from: `"VRIX Order System" <${senderEmail}>`,
            to: order.userEmail,
            subject: `Your VRIX Order ${order.orderId} Has Been Delivered!`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 32px; background: #f9f8f6; border: 1px solid #e5e3df; color: #0f1728;">
                <h2 style="font-size: 20px; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 24px; border-bottom: 1px solid #e5e3df; padding-bottom: 12px; color: #0f1728;">Order Delivered Successfully</h2>
                <p style="font-size: 14px; line-height: 1.6; color: #4a5568;">Dear ${order.customerName || 'Customer'},</p>
                <p style="font-size: 14px; line-height: 1.6; color: #4a5568;">We are pleased to inform you that your order <strong>#${order.orderId}</strong> has been successfully delivered by our delivery agent.</p>
                
                <div style="background: #ffffff; border: 1px solid #e5e3df; padding: 20px; margin: 24px 0; border-radius: 4px;">
                  <h3 style="font-size: 14px; text-transform: uppercase; margin-top: 0; margin-bottom: 16px; border-bottom: 1px solid #f0edf8; padding-bottom: 8px; color: #0f1728;">Delivery Details</h3>
                  <table style="width: 100%; font-size: 13px; color: #4a5568; border-collapse: collapse;">
                    <tr>
                      <td style="padding: 6px 0; font-weight: bold; width: 120px;">Recipient Name:</td>
                      <td style="padding: 6px 0;">${order.customerName || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-weight: bold;">Phone Number:</td>
                      <td style="padding: 6px 0;">${order.customerPhone || 'N/A'}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-weight: bold; vertical-align: top;">Delivery Address:</td>
                      <td style="padding: 6px 0;">${order.address || 'N/A'}, ${order.city || ''} - ${order.postalCode || ''}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-weight: bold;">Amount Paid:</td>
                      <td style="padding: 6px 0; font-weight: bold; color: #16a34a;">${amountStr}</td>
                    </tr>
                    <tr>
                      <td style="padding: 6px 0; font-weight: bold;">Delivered At:</td>
                      <td style="padding: 6px 0;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)</td>
                    </tr>
                  </table>
                </div>

                <p style="font-size: 14px; line-height: 1.6; color: #4a5568;">If you did not receive this package or have any questions, please contact our support team immediately at <a href="mailto:support@vrixjewels.com" style="color: #0f1728; font-weight: bold; text-decoration: underline;">support@vrixjewels.com</a>.</p>
                
                <p style="font-size: 14px; line-height: 1.6; color: #4a5568; margin-top: 32px; border-top: 1px solid #e5e3df; padding-top: 16px;">Thank you for shopping with VRIX.</p>
                <p style="font-size: 12px; color: #999; margin-top: 8px;">This is an automated notification. Please do not reply directly to this email.</p>
              </div>
            `
          });
          console.log(`Delivery confirmation email sent to ${order.userEmail} for order ${order.orderId}`);
        } else {
          console.log(`[DEV MODE] SMTP not configured. Mocking delivery details email to ${order.userEmail} for order ${order.orderId}`);
        }
      } catch (emailErr) {
        console.error("Failed to send delivery details email:", emailErr.message);
      }
    }

    res.json({ success: true, orderId, message: "Delivery confirmed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
//  ADMIN — PRODUCT STOCK & VISIBILITY
// ══════════════════════════════════════════════════════════════════════════════

// PATCH /api/products/:id/stock — update stock level
app.patch("/api/products/:id/stock", async (req, res) => {
  const { stock } = req.body;
  if (stock === undefined || isNaN(Number(stock))) return res.status(400).json({ error: "stock (number) is required" });
  try {
    const updated = await db.products.update({ where: { id: req.params.id }, data: { stock: Number(stock) } });
    res.json(updated);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// PATCH /api/products/:id/visibility — toggle show/hide on storefront
app.patch("/api/products/:id/visibility", async (req, res) => {
  const { isVisible } = req.body;
  if (isVisible === undefined) return res.status(400).json({ error: "isVisible (boolean) is required" });
  try {
    const updated = await db.products.update({ where: { id: req.params.id }, data: { isVisible: Boolean(isVisible) } });
    res.json(updated);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
//  ADMIN — COLLECTIONS CRUD
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/collections/all — full list from CMS setting
app.get("/api/collections/all", async (req, res) => {
  try {
    const data = await db.cmsSettings.findUnique({ where: { key: "collections" } });
    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/collections — replace entire collections array
app.put("/api/collections", async (req, res) => {
  const { collections } = req.body;
  if (!Array.isArray(collections)) return res.status(400).json({ error: "collections array required" });
  try {
    await db.cmsSettings.upsert({
      where: { key: "collections" },
      update: { value: collections },
      create: { key: "collections", value: collections },
    });
    res.json({ success: true, collections });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
//  ADMIN — SITE CONFIG (features, brand, navigation)
// ══════════════════════════════════════════════════════════════════════════════

// GET /api/config — fetch all CMS settings (brand, features, navigation, homepage)
app.get("/api/config", async (req, res) => {
  try {
    const all = await db.cmsSettings.findMany();
    res.json(all);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/config/:key — upsert a specific CMS key (features, brand, navigation, homepage, etc.)
app.post("/api/config/:key", async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  if (value === undefined) return res.status(400).json({ error: "value is required" });
  try {
    await db.cmsSettings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    res.json({ success: true, key, value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
//  ADMIN — STATS OVERVIEW (live from DB)
// ══════════════════════════════════════════════════════════════════════════════

app.get("/api/admin/stats", async (req, res) => {
  try {
    const products = await db.products.findMany();
    const payments = await db.payments.findMany();
    const promoData = await (async () => {
      if (db.isConnected()) {
        const { PrismaClient } = await import("@prisma/client");
        const p = new PrismaClient();
        return p.redeemCode.count();
      } else {
        const { readFileSync } = await import("fs");
        const raw = readFileSync(path.join(__dirname, "data", "db.json"), "utf8");
        const local = JSON.parse(raw);
        return (local.redeemCodes || []).length;
      }
    })();

    const totalRevenue = payments
      .filter((p) => p.status === "SUCCESS" || p.status === "DELIVERED")
      .reduce((acc, p) => acc + (p.amount || 0), 0);

    const pending = payments.filter((p) => p.status === "CREATED" || p.status === "SUCCESS").length;
    const delivered = payments.filter((p) => p.status === "DELIVERED").length;
    const outOfStock = products.filter((p) => (p.stock ?? 999) === 0).length;
    const hidden = products.filter((p) => p.isVisible === false).length;

    res.json({
      totalProducts: products.length,
      totalOrders: payments.length,
      totalRevenue,
      pendingOrders: pending,
      deliveredOrders: delivered,
      outOfStock,
      hiddenProducts: hidden,
      totalPromoCodes: promoData,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
//  START SERVER
// ══════════════════════════════════════════════════════════════════════════════

app.listen(PORT, () => {
  console.log(`\n🚀 VRIX Backend API running → http://localhost:${PORT}`);
  console.log(`   DB Mode      : ${db.isConnected() ? "Prisma (PostgreSQL)" : "Local db.json"}`);
  console.log(`   Integrations : Dynamically managed (Cloudinary, Razorpay, SMTP, Truecaller)\n`);
});

export default app;

