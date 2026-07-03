import express from "express";
import crypto from "crypto";
import { db } from "../database.js";
import { getRazorpay, getApiSettings, getTransporter } from "../config/apiResolvers.js";

const router = express.Router();

// POST /api/payment/order — Create a Razorpay order
router.post("/order", async (req, res) => {
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
        amount: Math.round(Number(amount) * 100),
        currency,
        receipt: receipt || `receipt_${Date.now()}`,
        notes,
      });

      await db.payments.create({
        data: { orderId: order.id, amount: Number(amount), currency, status: "CREATED", customerName, customerPhone, address, city, postalCode, userEmail },
      });

      res.json({ success: true, order });
    } else {
      const mockOrderId = "order_dev_" + Date.now();
      await db.payments.create({
        data: { orderId: mockOrderId, amount: Number(amount), currency, status: "CREATED", customerName, customerPhone, address, city, postalCode, userEmail },
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

// POST /api/payment/verify — Verify Razorpay payment signature
router.post("/verify", async (req, res) => {
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
      const expectedSig = crypto.createHmac("sha256", keySecret).update(body).digest("hex");
      isValid = expectedSig === razorpay_signature;
    } else {
      isValid = true; // Dev mode: always pass
    }

    if (!isValid) {
      await db.payments.update({ where: { orderId: razorpay_order_id }, data: { status: "FAILED" } });
      return res.status(400).json({ error: "Payment signature verification failed" });
    }

    const paymentRecord = await db.payments.update({
      where: { orderId: razorpay_order_id },
      data: { status: "SUCCESS", paymentId: razorpay_payment_id },
    });

    await db.securityLogs.create({
      data: { event: "PAYMENT_SUCCESS", user: razorpay_payment_id, status: "SUCCESS" },
    });

    // Send order confirmation emails
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
              <tbody>${itemsHtml || `<tr><td colspan="3" style="padding: 12px 0; text-align: center; color: #666;">No items registered</td></tr>`}</tbody>
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

        if (paymentRecord.userEmail) {
          await activeTransporter.sendMail({
            from: `"VRIX" <${senderEmail}>`,
            to: paymentRecord.userEmail,
            subject: `Your VRIX Order Confirmation - ${paymentRecord.orderId}`,
            html: orderSummaryHtml,
          });
        }

        await activeTransporter.sendMail({
          from: `"VRIX Order System" <${senderEmail}>`,
          to: adminEmail,
          subject: `New VRIX Order Received - ${paymentRecord.orderId}`,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e3df;"><h2 style="color: #0f1728; border-bottom: 2px solid #e5e3df; padding-bottom: 10px;">New Order Paid</h2><p>A new order has been paid and verified. Details are listed below:</p>${orderSummaryHtml}</div>`,
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

// GET /api/payment/logs — Get payment logs (admin)
router.get("/logs", async (req, res) => {
  try {
    res.json(await db.payments.findMany());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
