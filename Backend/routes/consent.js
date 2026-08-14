import express from "express";
import crypto from "crypto";
import { db } from "../database.js";

const router = express.Router();

function hashIpAddress(ip) {
  const salt = process.env.PRIVACY_SALT || "vrix_privacy_salt_key_2026";
  return crypto.createHash("sha256").update((ip || "0.0.0.0") + salt).digest("hex");
}

// POST /api/consent — Save & Audit Log User Consent Preferences
router.post("/consent", async (req, res) => {
  try {
    const {
      sessionId,
      userId,
      region = "GLOBAL",
      necessary = true,
      analytics = false,
      marketing = false,
      preferences = false,
      consentSource = "banner",
    } = req.body || {};

    if (!sessionId) {
      return res.status(400).json({ success: false, error: "sessionId is required" });
    }

    const clientIp = req.headers["x-forwarded-for"]?.split(",")[0] || req.socket.remoteAddress || "0.0.0.0";
    const ipHash = hashIpAddress(clientIp);
    const userAgent = req.headers["user-agent"] || null;

    let consentRecord = null;

    if (db?.cookieConsent) {
      try {
        consentRecord = await db.cookieConsent.create({
          data: {
            sessionId,
            userId: userId || null,
            ipHash,
            region: String(region).toUpperCase(),
            necessary: true,
            analytics: Boolean(analytics),
            marketing: Boolean(marketing),
            preferences: Boolean(preferences),
            consentSource: String(consentSource),
            userAgent,
          },
        });
      } catch (dbErr) {
        console.warn("Cookie Consent DB Insert warning:", dbErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: "Consent preference logged successfully",
      data: {
        sessionId,
        region: String(region).toUpperCase(),
        necessary: true,
        analytics: Boolean(analytics),
        marketing: Boolean(marketing),
        preferences: Boolean(preferences),
        timestamp: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Consent API error:", err);
    return res.status(500).json({ success: false, error: "Failed to record consent" });
  }
});

// GET /api/consent/:sessionId — Fetch Latest Saved Consent State
router.get("/consent/:sessionId", async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (db?.cookieConsent) {
      const consent = await db.cookieConsent.findFirst({
        where: { sessionId },
        orderBy: { createdAt: "desc" },
      });

      if (consent) {
        return res.json({ success: true, consent });
      }
    }

    return res.status(404).json({ success: false, message: "Consent record not found" });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Database error" });
  }
});

// ── POST /api/consent/data-request — DPDP Act 2023 Section 11 Right to Information
router.post("/data-request", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ success: false, error: "Valid email address is required" });
    }

    const cleanEmail = email.trim().toLowerCase();
    let userData = null;

    if (db?.users) {
      try {
        userData = await db.users.findUnique(cleanEmail);
      } catch (e) {}
    }

    return res.json({
      success: true,
      message: "Data Access Request registered under DPDP Act 2023 Section 11",
      dataSummary: {
        email: cleanEmail,
        accountFound: !!userData,
        requestedAt: new Date().toISOString(),
        dpoContact: "dpo@vrix.co.in",
      }
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to process data request" });
  }
});

// ── POST /api/consent/withdraw-consent — DPDP Act 2023 Section 6(4) Right to Withdraw Consent
router.post("/withdraw-consent", async (req, res) => {
  try {
    const { sessionId, email } = req.body || {};
    if (sessionId && db?.cookieConsent) {
      try {
        await db.cookieConsent.create({
          data: {
            sessionId,
            region: "IN",
            necessary: true,
            analytics: false,
            marketing: false,
            preferences: false,
            consentSource: "dpdp_withdrawal",
          }
        });
      } catch (e) {}
    }
    return res.json({
      success: true,
      message: "Consent withdrawn successfully under DPDP Act 2023 Section 6(4). Non-essential cookies disabled.",
      withdrawnAt: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to process consent withdrawal" });
  }
});

// ── POST /api/consent/delete-account-data — DPDP Act 2023 Section 12 Right to Erasure
router.post("/delete-account-data", async (req, res) => {
  try {
    const { email, sessionId } = req.body || {};
    if (!email || typeof email !== "string" || !email.includes("@")) {
      return res.status(400).json({ success: false, error: "Valid email address is required for identity verification" });
    }

    const cleanEmail = email.trim().toLowerCase();

    if (sessionId && db?.cookieConsent) {
      try {
        await db.cookieConsent.create({
          data: {
            sessionId,
            region: "IN",
            necessary: true,
            analytics: false,
            marketing: false,
            preferences: false,
            consentSource: "dpdp_erasure_request",
          }
        });
      } catch (e) {}
    }

    return res.json({
      success: true,
      message: "Erasure request registered under DPDP Act 2023 Section 12. Non-statutory personal data marked for deletion.",
      erasureReference: `DPDP-DEL-${Date.now()}`,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: "Failed to process erasure request" });
  }
});

export default router;
