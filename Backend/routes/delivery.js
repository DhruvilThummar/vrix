import express from "express";
import { db } from "../database.js";
import { getTransporter, getApiSettings } from "../config/apiResolvers.js";

const router = express.Router();

// POST /api/delivery/auth/login — Delivery staff login (OTP generation)
router.post("/auth/login", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: "Email is required" });

  try {
    const staff = await db.deliveryStaff.findUnique({ where: { email } });
    if (!staff) {
      return res.status(403).json({ error: "Access denied. Not registered as delivery staff." });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const authKey = `delivery_auth:${email}`;
    await db.verificationOtps.deleteMany({ where: { email: authKey } });
    await db.verificationOtps.create({ data: { email: authKey, otp, expiresAt: expiresAt.toISOString() } });

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

// POST /api/delivery/auth/verify — Delivery staff verify login
router.post("/auth/verify", async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) return res.status(400).json({ error: "Email and OTP required" });

  try {
    const staff = await db.deliveryStaff.findUnique({ where: { email } });
    if (!staff) return res.status(403).json({ error: "Access denied." });

    const authKey = `delivery_auth:${email}`;
    const record = await db.verificationOtps.findFirst({ where: { email: authKey, otp } });
    if (!record) return res.status(401).json({ error: "Invalid login OTP" });

    const expiry = new Date(record.expiresAt);
    if (expiry < new Date()) {
      await db.verificationOtps.delete({ where: { id: record.id } });
      return res.status(401).json({ error: "Login OTP has expired" });
    }

    await db.verificationOtps.delete({ where: { id: record.id } });
    await db.securityLogs.create({ data: { event: "DELIVERY_STAFF_LOGIN", user: email, status: "SUCCESS" } });

    res.json({ success: true, user: { email: staff.email, name: staff.name, role: staff.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/delivery/orders — Get delivery orders with role & email filters
router.get("/orders", async (req, res) => {
  const { role, email } = req.query;
  try {
    const payments = await db.payments.findMany();
    let orders = payments.filter((p) => p.status === "SUCCESS" || p.status === "DELIVERED" || p.status === "CREATED");
    if (role === "agent" && email) {
      orders = orders.filter((o) => o.assignedAgent === email || !o.assignedAgent);
    }
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/delivery/orders/:orderId/assign — Manager: Assign order to delivery agent
router.patch("/orders/:orderId/assign", async (req, res) => {
  const { orderId } = req.params;
  const { agentEmail } = req.body;
  try {
    if (agentEmail) {
      const agent = await db.deliveryStaff.findUnique({ where: { email: agentEmail } });
      if (!agent) return res.status(400).json({ error: "Invalid delivery staff member email" });
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

// GET /api/delivery/staff — Manager: List all delivery staff
router.get("/staff", async (req, res) => {
  try {
    res.json(await db.deliveryStaff.findMany());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/delivery/staff — Manager: Create new delivery staff member
router.post("/staff", async (req, res) => {
  const { email, name, role } = req.body;
  if (!email || !name || !role) {
    return res.status(400).json({ error: "email, name, and role ('agent' | 'manager') are required" });
  }
  try {
    const created = await db.deliveryStaff.create({ data: { email, name, role } });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/delivery/staff/:email — Manager: Delete a delivery staff member
router.delete("/staff/:email", async (req, res) => {
  try {
    await db.deliveryStaff.delete({ where: { email: req.params.email } });
    res.json({ success: true, email: req.params.email });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/delivery/send-otp — Delivery agent sends OTP to customer
router.post("/send-otp", async (req, res) => {
  const { orderId, customerEmail } = req.body;
  if (!orderId || !customerEmail) {
    return res.status(400).json({ error: "orderId and customerEmail are required" });
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 min for delivery

  try {
    await db.verificationOtps.deleteMany({ where: { email: `delivery:${orderId}` } });
    await db.verificationOtps.create({
      data: { email: `delivery:${orderId}`, otp, expiresAt: expiresAt.toISOString() },
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

// POST /api/delivery/verify-otp — Delivery agent verifies OTP from customer
router.post("/verify-otp", async (req, res) => {
  const { orderId, otp } = req.body;
  if (!orderId || !otp) return res.status(400).json({ error: "orderId and otp are required" });

  try {
    const record = await db.verificationOtps.findFirst({ where: { email: `delivery:${orderId}`, otp } });
    if (!record) return res.status(401).json({ error: "Invalid delivery OTP" });

    const expiry = new Date(record.expiresAt);
    if (expiry < new Date()) {
      await db.verificationOtps.delete({ where: { id: record.id } });
      return res.status(401).json({ error: "Delivery OTP has expired" });
    }

    await db.verificationOtps.delete({ where: { id: record.id } });
    const order = await db.payments.update({ where: { orderId }, data: { status: "DELIVERED" } });
    await db.securityLogs.create({ data: { event: "DELIVERY_CONFIRMED", user: orderId, status: "SUCCESS" } });

    // Send delivery confirmation email to customer
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
                    <tr><td style="padding: 6px 0; font-weight: bold; width: 120px;">Recipient Name:</td><td style="padding: 6px 0;">${order.customerName || 'N/A'}</td></tr>
                    <tr><td style="padding: 6px 0; font-weight: bold;">Phone Number:</td><td style="padding: 6px 0;">${order.customerPhone || 'N/A'}</td></tr>
                    <tr><td style="padding: 6px 0; font-weight: bold; vertical-align: top;">Delivery Address:</td><td style="padding: 6px 0;">${order.address || 'N/A'}, ${order.city || ''} - ${order.postalCode || ''}</td></tr>
                    <tr><td style="padding: 6px 0; font-weight: bold;">Amount Paid:</td><td style="padding: 6px 0; font-weight: bold; color: #16a34a;">${amountStr}</td></tr>
                    <tr><td style="padding: 6px 0; font-weight: bold;">Delivered At:</td><td style="padding: 6px 0;">${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} (IST)</td></tr>
                  </table>
                </div>
                <p style="font-size: 14px; line-height: 1.6; color: #4a5568;">If you did not receive this package or have any questions, please contact our support team immediately at <a href="mailto:support@vrixjewels.com" style="color: #0f1728; font-weight: bold; text-decoration: underline;">support@vrixjewels.com</a>.</p>
                <p style="font-size: 14px; line-height: 1.6; color: #4a5568; margin-top: 32px; border-top: 1px solid #e5e3df; padding-top: 16px;">Thank you for shopping with VRIX.</p>
                <p style="font-size: 12px; color: #999; margin-top: 8px;">This is an automated notification. Please do not reply directly to this email.</p>
              </div>
            `,
          });
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

export default router;
