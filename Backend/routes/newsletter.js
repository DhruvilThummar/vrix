import express from "express";
import { db } from "../database.js";
import { getTransporter, getApiSettings } from "../config/apiResolvers.js";
import { contactLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// POST /api/newsletter/subscribe — Subscribe email to newsletter
router.post("/subscribe", contactLimiter, async (req, res) => {
  const { email } = req.body;
  if (!email || !String(email).includes("@")) {
    return res.status(400).json({ error: "A valid email address is required." });
  }

  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Persist to CMS newsletter_subscribers list
    const existing = await db.cmsSettings.findUnique({ where: { key: "newsletter_subscribers" } });
    const subscribers = Array.isArray(existing) ? existing : [];

    if (subscribers.includes(normalizedEmail)) {
      return res.json({ success: true, message: "You are already subscribed. Thank you!" });
    }

    subscribers.push(normalizedEmail);
    await db.cmsSettings.upsert({
      where: { key: "newsletter_subscribers" },
      update: { value: subscribers },
      create: { key: "newsletter_subscribers", value: subscribers },
    });

    // Send welcome email if mailer is configured
    try {
      const activeTransporter = await getTransporter();
      if (activeTransporter) {
        const apiSettings = await getApiSettings();
        const senderEmail = apiSettings?.nodemailerUser || process.env.SMTP_USER || "info@vrixjewels.com";
        const brandData = await db.cmsSettings.findUnique({ where: { key: "brand" } });
        const brandName = brandData?.name || "VRIX";

        await activeTransporter.sendMail({
          from: `"${brandName}" <${senderEmail}>`,
          to: normalizedEmail,
          subject: `Welcome to the ${brandName} Circle`,
          html: `
            <div style="font-family:Arial,sans-serif;max-width:520px;margin:auto;padding:40px;background:#f9f8f6;border:1px solid #e5e3df;">
              <h2 style="font-size:18px;letter-spacing:4px;color:#0f1728;text-transform:uppercase;margin-bottom:24px;text-align:center;">${brandName} Circle</h2>
              <p style="color:#666;font-size:14px;line-height:1.8;margin-bottom:20px;">
                Thank you for joining our circle. You will receive early access to new collections, exclusive offers, and curated moments from the world of ${brandName}.
              </p>
              <div style="border-top:1px solid #e5e3df;padding-top:20px;margin-top:20px;">
                <p style="color:#999;font-size:11px;text-align:center;letter-spacing:2px;text-transform:uppercase;">${brandName} Luxury Jewelry</p>
              </div>
            </div>
          `,
        });
      }
    } catch (mailErr) {
      // Non-fatal: subscription is saved even if email fails
      console.error("Newsletter welcome email failed:", mailErr.message);
    }

    res.json({ success: true, message: "You have been successfully subscribed!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/newsletter/subscribers — Admin: list all subscribers
router.get("/subscribers", async (req, res) => {
  try {
    const data = await db.cmsSettings.findUnique({ where: { key: "newsletter_subscribers" } });
    res.json({ subscribers: Array.isArray(data) ? data : [], count: Array.isArray(data) ? data.length : 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
