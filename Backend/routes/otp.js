import express from "express";
import { db } from "../database.js";
import { getTransporter, getApiSettings } from "../config/apiResolvers.js";

const router = express.Router();

// POST /api/otp/send
router.post("/send", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

  try {
    await db.verificationOtps.deleteMany({ where: { email } });
    await db.verificationOtps.create({
      data: { email, otp, expiresAt: expiresAt.toISOString() },
    });

    const activeTransporter = await getTransporter();
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
      console.log(`[DEV] OTP for ${email}: ${otp}`);
      res.json({ success: true, message: "OTP generated (dev mode)", otp });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/otp/verify
router.post("/verify", async (req, res) => {
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

    await db.verificationOtps.delete({ where: { id: record.id } });
    await db.securityLogs.create({
      data: { event: "OTP_VERIFICATION", user: email, status: "SUCCESS" },
    });

    res.json({ success: true, email, message: "Email verified successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/otp/test-email — Test SMTP email sending configuration
router.post("/test-email", async (req, res) => {
  const { recipientEmail } = req.body;
  const target = recipientEmail || "dhruvilthummar2007@gmail.com";

  try {
    const activeTransporter = await getTransporter();
    if (!activeTransporter) {
      return res.status(400).json({
        success: false,
        error: "SMTP Transporter is not configured. Please enable SMTP and enter host/user/pass in Admin Settings."
      });
    }

    const apiSettings = await getApiSettings();
    const senderEmail = apiSettings?.nodemailerUser || process.env.SMTP_USER || "info@vrixjewels.com";

    const info = await activeTransporter.sendMail({
      from: `"VRIX Test Mailer" <${senderEmail}>`,
      to: target,
      subject: "VRIX SMTP Configuration Test Success",
      html: `
        <div style="font-family:Arial,sans-serif;max-width:500px;margin:auto;padding:32px;background:#f9f8f6;border:1px solid #e5e3df;color:#0f1728;">
          <h2 style="font-size:18px;letter-spacing:3px;text-transform:uppercase;color:#0f1728;margin-bottom:16px;">VRIX Email Test Passed 🎉</h2>
          <p style="font-size:14px;color:#444;line-height:1.6;">Your SMTP email server configuration is working 100% perfectly!</p>
          <div style="background:#fff;padding:16px;border:1px solid #e5e3df;margin:20px 0;font-size:13px;color:#555;">
            <div><strong>Sender:</strong> ${senderEmail}</div>
            <div><strong>Recipient:</strong> ${target}</div>
            <div><strong>Timestamp:</strong> ${new Date().toISOString()}</div>
          </div>
          <p style="font-size:12px;color:#888;">If you received this message, transactional OTP emails & customer order confirmations will be delivered smoothly.</p>
        </div>
      `,
    });

    res.json({
      success: true,
      message: `Test email sent successfully to ${target}!`,
      messageId: info.messageId,
      response: info.response,
    });
  } catch (err) {
    console.error("Test email sending failed:", err);
    res.status(500).json({
      success: false,
      error: err.message || "Failed to send test email.",
    });
  }
});

export default router;
