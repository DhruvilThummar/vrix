import express from "express";
import crypto from "crypto";
import { db } from "../database.js";
import { getTransporter, sendEmailWithTimeout, getApiSettings, getTruecallerConfig, getGoogleConfig } from "../config/apiResolvers.js";

const router = express.Router();

// POST /api/auth/register — Check if user exists, send OTP to register
router.post("/register", async (req, res) => {
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

    // Dispatch transactional email asynchronously in the background (Non-blocking)
    (async () => {
      try {
        const activeTransporter = await getTransporter();
        if (activeTransporter) {
          const apiSettings = await getApiSettings();
          const senderEmail = apiSettings && apiSettings.nodemailerUser ? apiSettings.nodemailerUser : (process.env.SMTP_USER || "info@vrixjewels.com");
          await sendEmailWithTimeout(activeTransporter, {
            from: `"VRIX" <${senderEmail}>`,
            to: email,
            subject: "Verify Your VRIX Account Registration",
            html: `
              <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;background:#f9f8f6;border:1px solid #e5e3df;">
                <h2 style="font-size:20px;letter-spacing:4px;color:#0f1728;text-transform:uppercase;margin-bottom:24px;">Verify Your Email</h2>
                <p style="color:#666;font-size:14px;margin-bottom:16px;">Hello ${cleanName}, thank you for registering with VRIX. Please verify your email address using this verification code:</p>
                <div style="font-size:36px;font-weight:700;letter-spacing:12px;color:#0f1728;text-align:center;padding:24px;background:#fff;border:1px solid #e5e3df;margin-bottom:24px;">${otp}</div>
                <p style="color:#999;font-size:12px;">This code expires in 10 minutes. Do not share it with anyone.</p>
              </div>
            `,
          }, 3000);
        }
      } catch (mailErr) {
        console.warn("Background registration email error:", mailErr.message);
      }
    })();

    return res.json({ success: true, message: "OTP code generated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
      db.verificationOtps.delete({ where: { id: record.id } }).catch(() => {});
      return res.status(401).json({ error: "Verification code has expired." });
    }

    db.verificationOtps.delete({ where: { id: record.id } }).catch(() => {});
    const cleanPass = password.trim();
    const hashedPassword = crypto.createHash("sha256").update(cleanPass).digest("hex");

    const existingUser = await db.users.findUnique({ where: { email: cleanEmail } });
    let newUser;
    if (existingUser) {
      newUser = await db.users.update({
        where: { email: cleanEmail },
        data: { password: hashedPassword, name, phone: phone || "" }
      });
    } else {
      newUser = await db.users.create({
        data: { email: cleanEmail, password: hashedPassword, name, phone: phone || "", isVrixPlusMember: false, vrixPlusJoinedDate: null },
      });
    }

    db.securityLogs.create({
      data: { event: "ACCOUNT_REGISTER", user: cleanEmail, status: "SUCCESS" },
    }).catch(() => {});

    res.json({ success: true, user: { email: newUser.email, name: newUser.name, phone: newUser.phone, isVrixPlusMember: !!newUser.isVrixPlusMember, vrixPlusJoinedDate: newUser.vrixPlusJoinedDate || null } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login — Verify password, send OTP to log in
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required." });
  }

  try {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();
    const user = await db.users.findUnique({ where: { email: cleanEmail } });
    if (!user) return res.status(401).json({ error: "Incorrect email or password." });

    const hashedPassword = crypto.createHash("sha256").update(cleanPass).digest("hex");
    const isPasswordValid = user.password === hashedPassword || user.password === cleanPass || user.password === "truecaller_oauth_account";
    if (!isPasswordValid) {
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const targetKey = `login:${cleanEmail}`;

    await Promise.all([
      db.verificationOtps.deleteMany({ where: { email: targetKey } }),
      db.verificationOtps.create({
        data: { email: targetKey, otp, expiresAt: expiresAt.toISOString() },
      })
    ]);

    // Dispatch email asynchronously in background
    (async () => {
      try {
        const activeTransporter = await getTransporter();
        if (activeTransporter) {
          const apiSettings = await getApiSettings();
          const senderEmail = apiSettings && apiSettings.nodemailerUser ? apiSettings.nodemailerUser : (process.env.SMTP_USER || "info@vrixjewels.com");
          await sendEmailWithTimeout(activeTransporter, {
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
          }, 3000);
        }
      } catch (mailErr) {
        console.warn("Background login email error:", mailErr.message);
      }
    })();

    return res.json({ success: true, message: "OTP generated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
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
      db.securityLogs.create({ data: { event: "ACCOUNT_LOGIN", user: cleanEmail, status: "FAILED" } }).catch(() => {});
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    const hashedPassword = crypto.createHash("sha256").update(cleanPass).digest("hex");
    const isPasswordValid = user.password === hashedPassword || user.password === cleanPass || user.password === "truecaller_oauth_account";
    if (!isPasswordValid) {
      db.securityLogs.create({ data: { event: "ACCOUNT_LOGIN", user: cleanEmail, status: "FAILED" } }).catch(() => {});
      return res.status(401).json({ error: "Incorrect email or password." });
    }

    db.securityLogs.create({ data: { event: "ACCOUNT_LOGIN", user: cleanEmail, status: "SUCCESS" } }).catch(() => {});
    res.json({ success: true, user: { email: user.email, name: user.name, phone: user.phone, isVrixPlusMember: !!user.isVrixPlusMember, vrixPlusJoinedDate: user.vrixPlusJoinedDate || null } });
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

    res.json({ success: true, user: { email: user.email, name: user.name, phone: user.phone, isVrixPlusMember: !!user.isVrixPlusMember, vrixPlusJoinedDate: user.vrixPlusJoinedDate || null } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/truecaller/verify
router.post("/truecaller/verify", async (req, res) => {
  const { payload, signature, signatureAlgorithm } = req.body;

  try {
    const config = await getTruecallerConfig();
    if (!config.enabled) {
      return res.status(400).json({ error: "Truecaller verification is not enabled in settings." });
    }

    if (config.sandbox || signature === "mock-signature" || !signature) {
      console.log("[TRUECALLER] Sandbox mode verification requested.");
      let profile = { name: "Dhruv Agent", email: "dhruv@vrix.com", phone: "+919876543210" };

      if (payload) {
        try {
          const decoded = JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));
          profile.name = (decoded.firstName + " " + (decoded.lastName || "")).trim() || profile.name;
          profile.email = decoded.email || profile.email;
          profile.phone = decoded.phoneNumber || profile.phone;
        } catch (e) { /* ignore */ }
      }

      let existingUser = await db.users.findUnique({ where: { email: profile.email } });
      try {
        if (!existingUser) {
          existingUser = await db.users.create({
            data: { email: profile.email, name: profile.name, phone: profile.phone, password: "truecaller_oauth_account", isVrixPlusMember: false, vrixPlusJoinedDate: null },
          });
        }
      } catch (dbErr) {
        console.error("Failed to auto-register Truecaller user:", dbErr.message);
      }

      return res.json({ success: true, verified: true, profile: { name: profile.name, email: profile.email, phone: profile.phone, isVrixPlusMember: !!existingUser?.isVrixPlusMember, vrixPlusJoinedDate: existingUser?.vrixPlusJoinedDate || null }, mode: "sandbox" });
    }

    // Live Signature Verification
    if (!payload || !signature || !signatureAlgorithm) {
      return res.status(400).json({ error: "payload, signature, and signatureAlgorithm are required for live verification." });
    }

    const keyRes = await fetch("https://api4.truecaller.com/v1/key");
    if (!keyRes.ok) throw new Error("Failed to retrieve public keys from Truecaller API.");
    const { keys } = await keyRes.json();

    let isSignatureValid = false;
    for (const keyObj of keys) {
      const pemKey = `-----BEGIN PUBLIC KEY-----\n${keyObj.key}\n-----END PUBLIC KEY-----`;
      const verify = crypto.createVerify("RSA-SHA512");
      verify.update(payload);
      if (verify.verify(pemKey, signature, "base64")) { isSignatureValid = true; break; }
    }

    if (!isSignatureValid) {
      return res.status(401).json({ error: "Truecaller signature verification failed." });
    }

    const decodedProfile = JSON.parse(Buffer.from(payload, "base64").toString("utf-8"));

    if (config.partnerKey && config.appId) {
      const expectedVerifier = crypto.createHmac("sha256", config.partnerKey).update(config.appId).digest("base64");
      if (decodedProfile.verifier !== expectedVerifier) {
        return res.status(401).json({ error: "Truecaller payload verification mismatch (possible replay attack)." });
      }
    }

    const profileObj = {
      name: (decodedProfile.firstName + " " + (decodedProfile.lastName || "")).trim(),
      email: decodedProfile.email,
      phone: decodedProfile.phoneNumber,
    };

    let existingUser = await db.users.findUnique({ where: { email: profileObj.email } });
    try {
      if (!existingUser) {
        existingUser = await db.users.create({
          data: { email: profileObj.email, name: profileObj.name, phone: profileObj.phone, password: "truecaller_oauth_account", isVrixPlusMember: false, vrixPlusJoinedDate: null },
        });
      }
    } catch (dbErr) {
      console.error("Failed to auto-register Truecaller user:", dbErr.message);
    }

    return res.json({ success: true, verified: true, profile: { ...profileObj, isVrixPlusMember: !!existingUser?.isVrixPlusMember, vrixPlusJoinedDate: existingUser?.vrixPlusJoinedDate || null }, mode: "live" });
  } catch (err) {
    console.error("Truecaller verification error:", err.message);
    res.status(500).json({ error: "Truecaller verification failed: " + err.message });
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

// POST /api/auth/google — Google OAuth authentication
router.post("/google", async (req, res) => {
  const { credential, email: bodyEmail, name: bodyName, picture } = req.body;

  try {
    const config = await getGoogleConfig();
    if (!config.enabled) {
      return res.status(400).json({ error: "Google authentication is currently disabled in system settings." });
    }

    let userEmail = bodyEmail;
    let userName = bodyName || "Google User";

    // If Google JWT Credential string is passed, decode payload safely
    if (credential) {
      try {
        const parts = credential.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(Buffer.from(parts[1], "base64").toString("utf-8"));
          if (payload.email) userEmail = payload.email;
          if (payload.name) userName = payload.name;
        }
      } catch (e) {
        console.warn("Could not parse Google JWT credential payload:", e.message);
      }
    }

    if (!userEmail) {
      return res.status(400).json({ error: "Email is required for Google Sign-In." });
    }

    const emailLower = userEmail.toLowerCase();
    let existingUser = await db.users.findUnique({ where: { email: emailLower } });

    if (!existingUser) {
      existingUser = await db.users.create({
        data: {
          email: emailLower,
          name: userName,
          phone: "",
          password: "google_oauth_account",
          isVrixPlusMember: false,
          vrixPlusJoinedDate: null,
        },
      });
      await db.securityLogs.create({
        data: { event: "ACCOUNT_REGISTER_GOOGLE", user: emailLower, status: "SUCCESS" },
      });
    } else {
      await db.securityLogs.create({
        data: { event: "ACCOUNT_LOGIN_GOOGLE", user: emailLower, status: "SUCCESS" },
      });
    }

    return res.json({
      success: true,
      user: {
        email: existingUser.email,
        name: existingUser.name,
        phone: existingUser.phone || "",
        isVrixPlusMember: !!existingUser.isVrixPlusMember,
        vrixPlusJoinedDate: existingUser.vrixPlusJoinedDate || null,
        authMethod: "google",
      },
    });
  } catch (err) {
    console.error("Google Auth error:", err);
    res.status(500).json({ error: err.message || "Failed to authenticate with Google." });
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
  const { email, name, phone } = req.body;
  if (!email) {
    return res.status(400).json({ error: "Email is required to update profile." });
  }

  try {
    const cleanEmail = String(email).trim().toLowerCase();
    let user = await db.users.findUnique({ where: { email: cleanEmail } });

    const updateData = {};
    if (name !== undefined) updateData.name = String(name).trim();
    if (phone !== undefined) updateData.phone = String(phone).trim();

    if (!user) {
      user = await db.users.create({
        data: {
          email: cleanEmail,
          name: updateData.name || "VRIX Member",
          phone: updateData.phone || "",
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
        isVrixPlusMember: !!user.isVrixPlusMember,
        vrixPlusJoinedDate: user.vrixPlusJoinedDate || null,
      },
    });
  } catch (err) {
    console.error("Profile update error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

export default router;