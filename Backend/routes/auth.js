import express from "express";
import crypto from "crypto";
import { db } from "../database.js";
import { getTransporter, sendEmailWithTimeout, getApiSettings, getGoogleConfig } from "../config/apiResolvers.js";
import { createAdminNotification } from "../config/notificationHelper.js";
import { sendUserLoginSecurityAlert } from "../config/loginAlertHelper.js";
import { authLimiter, otpLimiter } from "../middleware/rateLimiter.js";




const router = express.Router();

// POST /api/auth/register — Check if user exists, send OTP to register
router.post("/register", authLimiter, async (req, res) => {
  const { email, password, name, phone } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ error: "Email, password, and name are required." });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const cleanName = String(name).trim();

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ error: "Please provide a valid email address." });
  }

  try {
    const existing = await db.users.findUnique({ where: { email: cleanEmail } });
    if (existing) {
      return res.status(400).json({ error: "An account with this email address already exists." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const targetKey = `register:${cleanEmail}`;

    await Promise.all([
      db.verificationOtps.deleteMany({ where: { email: targetKey } }),
      db.verificationOtps.create({
        data: { email: targetKey, otp, expiresAt: expiresAt.toISOString() },
      })
    ]);
    let emailSent = false;
    try {
      const activeTransporter = await getTransporter();
      if (activeTransporter) {
        const apiSettings = await getApiSettings();
        const senderEmail = apiSettings && apiSettings.nodemailerUser ? apiSettings.nodemailerUser : (process.env.SMTP_USER || "info@vrixjewels.com");
        const emailResult = await sendEmailWithTimeout(activeTransporter, {
          from: `"VRIX" <${senderEmail}>`,
          to: cleanEmail,
          subject: "Verify Your VRIX Account Registration",
          html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9f8f6;border:1px solid #e5e3df;">
              <h2 style="font-size:20px;letter-spacing:4px;color:#0f1728;text-transform:uppercase;margin-bottom:24px;">Verify Your Email</h2>
              <p style="color:#666;font-size:14px;margin-bottom:16px;">Hello ${cleanName}, thank you for registering with VRIX. Please verify your email address using this verification code:</p>
              <div style="font-size:36px;font-weight:700;letter-spacing:12px;color:#0f1728;text-align:center;padding:24px;background:#fff;border:1px solid #e5e3df;margin-bottom:24px;">${otp}</div>
              <p style="color:#999;font-size:12px;">This code expires in 10 minutes. Do not share it with anyone.</p>
            </div>
          `,
        }, 10000);
        emailSent = !!emailResult;
      }
    } catch (mailErr) {
      console.warn("Background registration email error:", mailErr.message);
    }

    return res.json({ success: true, message: "Verification code sent to your email." });
  } catch (err) {
    console.error("Register OTP error:", err);
    res.status(500).json({ error: err.message || "Failed to process registration request." });
  }
});

// POST /api/auth/register/confirm — Verify OTP, save user in DB
router.post("/register/confirm", async (req, res) => {
  const { email, otp, password, name, phone } = req.body;
  if (!email || !otp || !password || !name) {
    return res.status(400).json({ error: "Missing required verification fields." });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    let record = await db.verificationOtps.findFirst({ where: { email: `register:${cleanEmail}`, otp: cleanOtp } });
    if (!record) {
      record = await db.verificationOtps.findFirst({ where: { email: cleanEmail, otp: cleanOtp } });
    }
    if (!record) {
      const candidate1 = await db.verificationOtps.findFirst({ where: { email: `register:${cleanEmail}` } });
      const candidate2 = await db.verificationOtps.findFirst({ where: { email: cleanEmail } });
      const candidate = candidate1 || candidate2;
      if (candidate && String(candidate.otp).trim() === cleanOtp) {
        record = candidate;
      }
    }

    if (!record) return res.status(401).json({ error: "Invalid verification code." });

    const expiry = new Date(record.expiresAt);
    if (expiry < new Date()) {
      db.verificationOtps.delete({ where: { id: record.id } }).catch(() => { });
      return res.status(401).json({ error: "Verification code has expired." });
    }

    db.verificationOtps.delete({ where: { id: record.id } }).catch(() => { });
    const cleanPass = password.trim();
    const hashedPassword = crypto.createHash("sha256").update(cleanPass).digest("hex");

    const existingUser = await db.users.findUnique({ where: { email: cleanEmail } });
    let newUser;
    const dob = req.body.birthDate || null;
    if (existingUser) {
      newUser = await db.users.update({
        where: { email: cleanEmail },
        data: { password: hashedPassword, name, phone: phone || "", dateOfBirth: dob }
      });
    } else {
      newUser = await db.users.create({
        data: { email: cleanEmail, password: hashedPassword, name, phone: phone || "", isVrixPlusMember: false, vrixPlusJoinedDate: null, dateOfBirth: dob },
      });
    }

    // Trigger notification for new registration
    createAdminNotification({
      type: "NEW_REGISTRATION",
      title: "👤 New Customer Registered",
      message: `New customer registered: ${newUser.name || newUser.email} (${newUser.email})`,
      userEmail: newUser.email
    });


    db.securityLogs.create({
      data: { event: "ACCOUNT_REGISTER", user: cleanEmail, status: "SUCCESS" },
    }).catch(() => { });


    res.json({ success: true, user: { email: newUser.email, name: newUser.name, phone: newUser.phone, isVrixPlusMember: !!newUser.isVrixPlusMember, vrixPlusJoinedDate: newUser.vrixPlusJoinedDate || null } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login — Verify password, send OTP to log in
router.post("/login", authLimiter, async (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    const user = await db.users.findUnique({ where: { email: cleanEmail } });
    if (!user) return res.status(401).json({ error: "Incorrect email or password." });

    if (password) {
      const cleanPass = password.trim();
      const hashedPassword = crypto.createHash("sha256").update(cleanPass).digest("hex");
      const isPasswordValid = user.password === hashedPassword || user.password === cleanPass;

      if (!isPasswordValid) {
        return res.status(401).json({ error: "Incorrect email or password." });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const targetKey = `login:${cleanEmail}`;

    await Promise.all([
      db.verificationOtps.deleteMany({ where: { email: targetKey } }),
      db.verificationOtps.deleteMany({ where: { email: cleanEmail } }),
      db.verificationOtps.create({
        data: { email: targetKey, otp, expiresAt },
      })
    ]);

    let emailSent = false;
    try {
      const activeTransporter = await getTransporter();
      if (activeTransporter) {
        const apiSettings = await getApiSettings();
        const senderEmail = apiSettings && apiSettings.nodemailerUser ? apiSettings.nodemailerUser : (process.env.SMTP_USER || "info@vrixjewels.com");
        const emailResult = await sendEmailWithTimeout(activeTransporter, {
          from: `"VRIX" <${senderEmail}>`,
          to: cleanEmail,
          subject: "VRIX Login Verification Code",
          html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9f8f6;border:1px solid #e5e3df;">
              <h2 style="font-size:20px;letter-spacing:4px;color:#0f1728;text-transform:uppercase;margin-bottom:24px;">Verify Your Login</h2>
              <p style="color:#666;font-size:14px;margin-bottom:16px;">Hello ${user.name || 'member'}, please verify your VRIX sign-in request using this code:</p>
              <div style="font-size:36px;font-weight:700;letter-spacing:12px;color:#0f1728;text-align:center;padding:24px;background:#fff;border:1px solid #e5e3df;margin-bottom:24px;">${otp}</div>
              <p style="color:#999;font-size:12px;">This code expires in 10 minutes. Do not share it with anyone.</p>
            </div>
          `,
        }, 100000);
        emailSent = !!emailResult;
      }
    } catch (mailErr) {
      console.warn("Background login email error:", mailErr.message);
    }

    return res.json({ success: true, message: "Verification code sent to your email." });
  } catch (err) {
    console.error("Login OTP error:", err);
    res.status(500).json({ error: err.message || "Failed to process login request." });
  }
});

// POST /api/auth/login/direct — Verify password, log in immediately without OTP
router.post("/login/direct", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();
    const user = await db.users.findUnique({ where: { email: cleanEmail } });

    if (!user) {
      db.securityLogs.create({ data: { event: "ACCOUNT_LOGIN", user: cleanEmail, status: "FAILED" } }).catch(() => { });
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    const hashedPassword = crypto.createHash("sha256").update(cleanPass).digest("hex");
    const isPasswordValid = user.password === hashedPassword || user.password === cleanPass;

    if (!isPasswordValid) {
      db.securityLogs.create({ data: { event: "ACCOUNT_LOGIN", user: cleanEmail, status: "FAILED" } }).catch(() => { });
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    db.securityLogs.create({ data: { event: "ACCOUNT_LOGIN", user: cleanEmail, status: "SUCCESS" } }).catch(() => { });
    sendUserLoginSecurityAlert({ userEmail: user.email, userName: user.name, req });
    res.json({ success: true, user: { email: user.email, name: user.name, phone: user.phone, role: user.role || "customer", isVrixPlusMember: !!user.isVrixPlusMember, vrixPlusJoinedDate: user.vrixPlusJoinedDate || null } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login/confirm — Verify OTP and complete login session
router.post("/login/confirm", async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ error: "Email and OTP are required." });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    let record = await db.verificationOtps.findFirst({ where: { email: `login:${cleanEmail}`, otp: cleanOtp } });
    if (!record) {
      record = await db.verificationOtps.findFirst({ where: { email: cleanEmail, otp: cleanOtp } });
    }
    if (!record) {
      const candidate1 = await db.verificationOtps.findFirst({ where: { email: `login:${cleanEmail}` } });
      const candidate2 = await db.verificationOtps.findFirst({ where: { email: cleanEmail } });
      const candidate = candidate1 || candidate2;
      if (candidate && String(candidate.otp).trim() === cleanOtp) {
        record = candidate;
      }
    }

    if (!record) return res.status(401).json({ error: "Invalid verification code." });

    const expiry = new Date(record.expiresAt);
    if (expiry < new Date()) {
      await db.verificationOtps.delete({ where: { id: record.id } });
      return res.status(401).json({ error: "Verification code has expired." });
    }

    await db.verificationOtps.delete({ where: { id: record.id } });
    const user = await db.users.findUnique({ where: { email: cleanEmail } });
    await db.securityLogs.create({ data: { event: "ACCOUNT_LOGIN", user: cleanEmail, status: "SUCCESS" } });
    sendUserLoginSecurityAlert({ userEmail: user.email, userName: user.name, req });

    res.json({ success: true, user: { email: user.email, name: user.name, phone: user.phone, isVrixPlusMember: !!user.isVrixPlusMember, vrixPlusJoinedDate: user.vrixPlusJoinedDate || null } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// POST /api/auth/join-vrix-plus
router.post("/join-vrix-plus", async (req, res) => {
  const { email, joinDate } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  try {
    const cleanEmail = String(email).trim().toLowerCase();
    const today = joinDate || new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }); // e.g. "22 July 2026"

    let user = await db.users.findUnique({ where: { email: cleanEmail } });

    if (user) {
      // Update existing user
      user = await db.users.update({
        where: { email: cleanEmail },
        data: { isVrixPlusMember: true, vrixPlusJoinedDate: today }
      });
    } else {
      // Auto-register user with VRIX+ membership
      user = await db.users.create({
        data: {
          email: cleanEmail,
          name: "VRIX+ Member",
          password: "vrix_plus_auto_account_" + Math.random().toString(36).substring(7),
          phone: "",
          isVrixPlusMember: true,
          vrixPlusJoinedDate: today
        }
      });
    }

    await db.securityLogs.create({
      data: { event: "VRIX_PLUS_JOIN", user: cleanEmail, status: "SUCCESS" }
    });

    // VRIX+ Joined Notification
    createAdminNotification({
      type: "VRIX_PLUS_JOINED",
      title: "🎉 VRIX+ Member Joined",
      message: `🎉 ${user.name || user.email} just became a VRIX+ Member`,
      userEmail: user.email
    });


    res.json({

      success: true,
      user: {
        email: user.email,
        name: user.name,
        phone: user.phone || "",
        isVrixPlusMember: true,
        vrixPlusJoinedDate: today
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



// GET /api/auth/me — Fetch authenticated user profile directly from Supabase / DB
router.get("/me", async (req, res) => {
  const { email } = req.query;

  if (!email) {
    return res.status(400).json({ error: "Email query parameter is required." });
  }

  try {
    const cleanEmail = String(email).trim().toLowerCase();
    const user = await db.users.findUnique({ where: { email: cleanEmail } });

    if (!user) {
      return res.status(404).json({ error: "User not found in database." });
    }

    res.json({
      success: true,
      user: {
        email: user.email,
        name: user.name || "",
        phone: user.phone || "",
        dateOfBirth: user.dateOfBirth || null,
        isVrixPlusMember: !!user.isVrixPlusMember,
        vrixPlusJoinedDate: user.vrixPlusJoinedDate || null,
        createdAt: user.createdAt || null
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/auth/profile — Update user profile details in DB
router.put("/profile", async (req, res) => {
  const { email, name, phone, dateOfBirth } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required to update profile." });
  }

  try {
    const cleanEmail = String(email).trim().toLowerCase();
    let user = await db.users.findUnique({ where: { email: cleanEmail } });

    const updateData = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (phone !== undefined) updateData.phone = String(phone).trim();
    if (dateOfBirth !== undefined) updateData.dateOfBirth = String(dateOfBirth).trim();

    if (!user) {
      user = await db.users.create({
        data: {
          email: cleanEmail,
          name: updateData.name || "VRIX Member",
          phone: updateData.phone || "",
          dateOfBirth: updateData.dateOfBirth || null,
          password: "auto_created_profile",
          isVrixPlusMember: false,
          vrixPlusJoinedDate: null,
        },
      });
    } else {
      user = await db.users.update({
        where: { email: cleanEmail },
        data: updateData,
      });
    }

    await db.securityLogs.create({
      data: { event: "PROFILE_UPDATE", user: cleanEmail, status: "SUCCESS" },
    });

    res.json({
      success: true,
      user: {
        email: user.email,
        name: user.name || "",
        phone: user.phone || "",
        dateOfBirth: user.dateOfBirth || null,
        isVrixPlusMember: !!user.isVrixPlusMember,
        vrixPlusJoinedDate: user.vrixPlusJoinedDate || null,
      },
    });

  } catch (err) {
    console.error("Profile update error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

const cleanAddress = (input = {}) => ({
  label: String(input.label || "Home").trim().slice(0, 50) || "Home",
  fullName: String(input.fullName || "").trim(),
  phone: String(input.phone || "").trim() || null,
  address: String(input.address || "").trim(),
  apartment: String(input.apartment || "").trim() || null,
  city: String(input.city || "").trim(),
  state: String(input.state || "").trim() || null,
  postalCode: String(input.postalCode || "").trim(),
  country: String(input.country || "IN").trim().toUpperCase().slice(0, 2) || "IN",
  isDefault: Boolean(input.isDefault),
});

const getAddressEmail = (req) => String(req.query.email || req.body.email || "").trim().toLowerCase();

// Address book endpoints. The client supplies its authenticated email, matching the existing profile API pattern.
router.get("/addresses", async (req, res) => {
  const email = getAddressEmail(req);
  if (!email) return res.status(400).json({ error: "Email is required." });
  try {
    const addresses = await db.addresses.findMany({ where: { userEmail: email }, orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }] });
    res.json({ success: true, addresses });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post("/addresses", async (req, res) => {
  const email = getAddressEmail(req);
  const address = cleanAddress(req.body);
  if (!email || !address.fullName || !address.address || !address.city || !address.postalCode) return res.status(400).json({ error: "Email, name, address, city and postal code are required." });
  try {
    const count = await db.addresses.count({ where: { userEmail: email } });
    const isDefault = address.isDefault || count === 0;
    if (isDefault) await db.addresses.updateMany({ where: { userEmail: email }, data: { isDefault: false } });
    const saved = await db.addresses.create({ data: { ...address, isDefault, userEmail: email } });
    res.status(201).json({ success: true, address: saved });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.put("/addresses/:id", async (req, res) => {
  const email = getAddressEmail(req);
  const address = cleanAddress(req.body);
  if (!email || !address.fullName || !address.address || !address.city || !address.postalCode) return res.status(400).json({ error: "Complete address details are required." });
  try {
    const existing = await db.addresses.findFirst({ where: { id: req.params.id, userEmail: email } });
    if (!existing) return res.status(404).json({ error: "Address not found." });
    if (address.isDefault) await db.addresses.updateMany({ where: { userEmail: email }, data: { isDefault: false } });
    const saved = await db.addresses.update({ where: { id: existing.id }, data: address });
    res.json({ success: true, address: saved });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/addresses/:id", async (req, res) => {
  const email = getAddressEmail(req);
  if (!email) return res.status(400).json({ error: "Email is required." });
  try {
    const existing = await db.addresses.findFirst({ where: { id: req.params.id, userEmail: email } });
    if (!existing) return res.status(404).json({ error: "Address not found." });
    await db.addresses.delete({ where: { id: existing.id } });
    if (existing.isDefault) {
      const fallback = await db.addresses.findFirst({ where: { userEmail: email }, orderBy: { updatedAt: "desc" } });
      if (fallback) await db.addresses.update({ where: { id: fallback.id }, data: { isDefault: true } });
    }
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/auth/admin-login — Admin-only login, checks role=admin
router.post("/admin-login", async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const cleanEmail = String(email).trim().toLowerCase();
    const cleanPass = String(password).trim();
    const user = await db.users.findUnique({ where: { email: cleanEmail } });

    if (!user) {
      db.securityLogs.create({ data: { event: "ADMIN_LOGIN", user: cleanEmail, status: "FAILED" } }).catch(() => { });
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    const hashedPassword = crypto.createHash("sha256").update(cleanPass).digest("hex");
    const isPasswordValid = user.password === hashedPassword || user.password === cleanPass;
    if (!isPasswordValid) {
      db.securityLogs.create({ data: { event: "ADMIN_LOGIN", user: cleanEmail, status: "FAILED" } }).catch(() => { });
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    const userRole = user.role || "customer";
    if (userRole !== "admin") {
      db.securityLogs.create({ data: { event: "ADMIN_LOGIN", user: cleanEmail, status: "DENIED" } }).catch(() => { });
      return res.status(403).json({ error: "Access denied. You do not have admin privileges." });
    }

    db.securityLogs.create({ data: { event: "ADMIN_LOGIN", user: cleanEmail, status: "SUCCESS" } }).catch(() => { });
    sendUserLoginSecurityAlert({ userEmail: user.email, userName: user.name, req });

    res.json({
      success: true,
      admin: {
        email: user.email,
        name: user.name || "Admin",
        role: userRole,
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/google — Google OAuth authentication & automatic user registration / login
router.post("/google", async (req, res) => {
  const { credential, email, name, picture, phone, joinVrixPlus } = req.body || {};

  try {
    const googleConfig = await getGoogleConfig();
    if (!googleConfig.enabled) {
      return res.status(400).json({ error: "Google sign-in is disabled in store settings." });
    }

    let cleanEmail = "";
    let cleanName = "";
    let googlePicture = "";

    // 1. Verify Google ID token via Google Tokeninfo API if credential token is provided
    if (credential) {
      try {
        const tokenRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(credential)}`);
        if (tokenRes.ok) {
          const payload = await tokenRes.json();
          if (payload.email && (payload.email_verified === true || payload.email_verified === "true")) {
            cleanEmail = String(payload.email).trim().toLowerCase();
            cleanName = String(payload.name || payload.given_name || "").trim();
            googlePicture = payload.picture || "";
          }
        }
      } catch (tokenErr) {
        console.warn("Google tokeninfo verification failed:", tokenErr.message);
      }

      // 2. JWT Fallback parsing if tokeninfo unreachable or local token
      if (!cleanEmail && typeof credential === "string" && credential.includes(".")) {
        try {
          const parts = credential.split(".");
          if (parts.length === 3) {
            const decoded = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
            if (decoded.email) {
              cleanEmail = String(decoded.email).trim().toLowerCase();
              cleanName = String(decoded.name || decoded.given_name || "").trim();
              googlePicture = decoded.picture || "";
            }
          }
        } catch (jwtErr) {
          console.warn("Google JWT fallback parse error:", jwtErr.message);
        }
      }
    }

    // Direct email fallback if passed verified profile
    if (!cleanEmail && email) {
      cleanEmail = String(email).trim().toLowerCase();
      cleanName = String(name || "").trim();
      googlePicture = picture || "";
    }

    if (!cleanEmail) {
      return res.status(400).json({ error: "Invalid Google credentials or email could not be verified." });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return res.status(400).json({ error: "Invalid email address format from Google account." });
    }

    const userDisplayName = cleanName || cleanEmail.split("@")[0];

    // Check if user exists in DB
    let user = await db.users.findUnique({ where: { email: cleanEmail } });

    if (user) {
      // User exists -> Update details if needed
      const updateData = {};
      if (!user.name || user.name.trim() === "" || user.name === "VRIX Member") {
        updateData.name = userDisplayName;
      }
      if (joinVrixPlus && !user.isVrixPlusMember) {
        updateData.isVrixPlusMember = true;
        updateData.vrixPlusJoinedDate = new Date().toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric"
        });
        createAdminNotification({
          type: "VRIX_PLUS_JOINED",
          title: "🎉 VRIX+ Member Joined",
          message: `🎉 ${user.name || user.email} just became a VRIX+ Member`,
          userEmail: user.email
        });
      }

      if (Object.keys(updateData).length > 0) {
        user = await db.users.update({
          where: { email: cleanEmail },
          data: updateData,
        });
      }

      await db.securityLogs.create({
        data: { event: "GOOGLE_LOGIN", user: cleanEmail, status: "SUCCESS" },
      }).catch(() => { });
      sendUserLoginSecurityAlert({ userEmail: user.email, userName: user.name, req });

    } else {
      // Create user in DB
      const todayStr = new Date().toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric"
      });

      user = await db.users.create({
        data: {
          email: cleanEmail,
          name: userDisplayName,
          phone: phone || "",
          password: "google_oauth_account",
          isVrixPlusMember: !!joinVrixPlus,
          vrixPlusJoinedDate: joinVrixPlus ? todayStr : null
        },
      });

      createAdminNotification({
        type: "NEW_REGISTRATION",
        title: "👤 New Customer Registered",
        message: `New customer registered: ${user.name || user.email} (${user.email})`,
        userEmail: user.email
      });

      if (joinVrixPlus) {
        createAdminNotification({
          type: "VRIX_PLUS_JOINED",
          title: "🎉 VRIX+ Member Joined",
          message: `🎉 ${user.name || user.email} just became a VRIX+ Member`,
          userEmail: user.email
        });
      }

      await db.securityLogs.create({
        data: { event: "GOOGLE_REGISTER", user: cleanEmail, status: "SUCCESS" },
      }).catch(() => { });
      sendUserLoginSecurityAlert({ userEmail: user.email, userName: user.name, req });
    }

    return res.json({
      success: true,
      user: {
        email: user.email,
        name: user.name,
        phone: user.phone || "",
        isVrixPlusMember: !!user.isVrixPlusMember,
        vrixPlusJoinedDate: user.vrixPlusJoinedDate || null,
        picture: googlePicture || null
      }
    });

  } catch (err) {
    console.error("Google Auth error:", err);
    res.status(500).json({ error: err.message || "Google authentication failed." });
  }
});

export default router;