import express from "express";
import crypto from "crypto";
import { db } from "../database.js";
import { getRazorpay, getApiSettings, getTransporter } from "../config/apiResolvers.js";
import { createAdminNotification } from "../config/notificationHelper.js";


const router = express.Router();

const getRazorpayCredentials = async () => {
  const apiSettings = await getApiSettings();
  
  // If explicitly disabled in Admin panel, turn it OFF everywhere
  if (apiSettings && apiSettings.razorpayEnabled === false) {
    return null;
  }

  if (
    apiSettings?.razorpayEnabled &&
    apiSettings.razorpayKeyId &&
    apiSettings.razorpayKeyId !== "rzp_test_YourKeyIdHere" &&
    apiSettings.razorpayKeySecret &&
    apiSettings.razorpayKeySecret !== "YourKeySecretHere"
  ) {
    return {
      keyId: apiSettings.razorpayKeyId,
      keySecret: apiSettings.razorpayKeySecret,
      source: "cms",
      enabled: true,
    };
  }

  if (
    process.env.RAZORPAY_KEY_ID &&
    process.env.RAZORPAY_KEY_ID !== "rzp_test_YourKeyIdHere" &&
    process.env.RAZORPAY_KEY_SECRET &&
    process.env.RAZORPAY_KEY_SECRET !== "YourKeySecretHere"
  ) {
    return {
      keyId: process.env.RAZORPAY_KEY_ID,
      keySecret: process.env.RAZORPAY_KEY_SECRET,
      source: "env",
      enabled: true,
    };
  }

  return null;
};


const safeCompareHex = (actual, expected) => {
  const actualBuffer = Buffer.from(String(actual || ""), "hex");
  const expectedBuffer = Buffer.from(String(expected || ""), "hex");
  return actualBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
};

// ──────────────────────────────────────────────────────────────────────────────
// PayPal REST API credentials resolver
// Priority: CMS api_settings → process.env
// ──────────────────────────────────────────────────────────────────────────────
const getPayPalCredentials = async () => {
  const apiSettings = await getApiSettings();

  // If explicitly disabled in Admin panel, return null
  if (apiSettings && apiSettings.paypalEnabled === false) {
    return null;
  }

  // CMS-managed credentials take priority
  if (
    apiSettings?.paypalEnabled &&
    apiSettings.paypalClientId &&
    apiSettings.paypalClientId !== "YOUR_PAYPAL_CLIENT_ID" &&
    apiSettings.paypalClientSecret &&
    apiSettings.paypalClientSecret !== "YOUR_PAYPAL_CLIENT_SECRET"
  ) {
    return {
      clientId: apiSettings.paypalClientId,
      clientSecret: apiSettings.paypalClientSecret,
      mode: apiSettings.paypalMode || "sandbox", // "sandbox" | "live"
      source: "cms",
      enabled: true,
    };
  }

  // Fall back to environment variables
  if (
    process.env.PAYPAL_CLIENT_ID &&
    process.env.PAYPAL_CLIENT_ID !== "YOUR_PAYPAL_CLIENT_ID" &&
    process.env.PAYPAL_CLIENT_SECRET &&
    process.env.PAYPAL_CLIENT_SECRET !== "YOUR_PAYPAL_CLIENT_SECRET"
  ) {
    return {
      clientId: process.env.PAYPAL_CLIENT_ID,
      clientSecret: process.env.PAYPAL_CLIENT_SECRET,
      mode: process.env.PAYPAL_MODE || "sandbox",
      source: "env",
      enabled: true,
    };
  }

  return null;
};

// ──────────────────────────────────────────────────────────────────────────────
// PayPal REST API token exchange helper
// Uses OAuth2 client_credentials to get a short-lived bearer token
// ──────────────────────────────────────────────────────────────────────────────
const getPayPalAccessToken = async (credentials) => {
  const baseUrl = credentials.mode === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

  const auth = Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString("base64");
  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Authorization": `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(`PayPal OAuth failed: ${err.error_description || response.statusText}`);
  }

  const data = await response.json();
  return { token: data.access_token, baseUrl };
};

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/payment/config — Returns both Razorpay + PayPal availability
// ──────────────────────────────────────────────────────────────────────────────
router.get("/config", async (req, res) => {
  try {
    const apiSettings = await getApiSettings();

    // Razorpay status
    const razorpayDisabled = apiSettings && apiSettings.razorpayEnabled === false;
    const rzpCredentials = razorpayDisabled ? null : await getRazorpayCredentials();
    
    // PayPal status
    const paypalCredentials = await getPayPalCredentials();

    res.json({
      // Razorpay
      razorpay: {
        enabled: !razorpayDisabled && !!rzpCredentials?.keyId,
        keyId: rzpCredentials?.keyId || null,
        devMode: !razorpayDisabled && !rzpCredentials?.keyId,
        source: rzpCredentials?.source || (razorpayDisabled ? "disabled" : "dev"),
      },
      // PayPal
      paypal: {
        enabled: !!paypalCredentials,
        clientId: paypalCredentials?.clientId || null,
        mode: paypalCredentials?.mode || null,
        source: paypalCredentials?.source || "disabled",
      },
      currency: "INR",
      // Legacy compatibility — keep for old RazorpayPaymentSection
      keyId: rzpCredentials?.keyId || null,
      enabled: !razorpayDisabled && !!rzpCredentials?.keyId,
      devMode: !razorpayDisabled && !rzpCredentials?.keyId,
      source: rzpCredentials?.source || (razorpayDisabled ? "disabled" : "dev"),
    });
  } catch (err) {

    res.status(500).json({ error: err.message });
  }
});


// POST /api/payment/order — Create a Razorpay order
router.post("/order", async (req, res) => {
  const { amount, currency = "INR", receipt, notes = {} } = req.body;
  const amountRupees = Number(amount);
  if (!Number.isFinite(amountRupees) || amountRupees <= 0) {
    return res.status(400).json({ error: "Valid amount is required" });
  }

  const customerName = req.body.customerName || notes.customerName || null;
  const customerPhone = req.body.customerPhone || notes.customerPhone || null;
  const address = req.body.address || notes.address || null;
  const city = req.body.city || notes.city || null;
  const postalCode = req.body.postalCode || notes.postalCode || null;
  const userEmail = req.body.email || notes.customerEmail || null;
  const normalizedCurrency = String(currency || "INR").toUpperCase();
  const normalizedReceipt = String(receipt || `vrix_${Date.now()}`).slice(0, 40);

  try {
    const apiSettings = await getApiSettings();
    if (apiSettings && apiSettings.razorpayEnabled === false) {
      return res.status(400).json({ error: "Razorpay payments are currently disabled by administrator." });
    }

    const activeRazorpay = await getRazorpay();
    if (activeRazorpay) {
      const order = await activeRazorpay.orders.create({
        amount: Math.round(amountRupees * 100),
        currency: normalizedCurrency,
        receipt: normalizedReceipt,
        notes,
      });

      await db.payments.create({
        data: { orderId: order.id, amount: amountRupees, currency: normalizedCurrency, status: "CREATED", customerName, customerPhone, address, city, postalCode, userEmail },
      });

      const credentials = await getRazorpayCredentials();
      res.json({ success: true, order, keyId: credentials?.keyId, devMode: false });
    } else {
      const mockOrderId = "order_dev_" + Date.now();
      await db.payments.create({
        data: { orderId: mockOrderId, amount: amountRupees, currency: normalizedCurrency, status: "CREATED", customerName, customerPhone, address, city, postalCode, userEmail },
      });
      res.json({
        success: true,
        order: { id: mockOrderId, amount: Math.round(amountRupees * 100), currency: normalizedCurrency, status: "created" },
        devMode: true,
      });
    }
  } catch (err) {

    res.status(500).json({ error: err.message });
  }
});

// POST /api/payment/verify — Verify Razorpay payment signature
router.post("/verify", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, items, promoCode, isGiftWrapped, giftMessage, giftWrapPrice } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: "Missing payment verification fields" });
  }

  try {
    const credentials = await getRazorpayCredentials();
    let isValid = razorpay_order_id.startsWith("order_dev_") && razorpay_signature === "dev_signature";

    if (credentials?.keySecret) {
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSig = crypto.createHmac("sha256", credentials.keySecret).update(body).digest("hex");
      isValid = safeCompareHex(razorpay_signature, expectedSig);
    } else if (!isValid) {
      return res.status(503).json({ error: "Razorpay is not configured" });
    }

    if (!isValid) {
      // Step 1a: Signature mismatch - mark payment as FAILED
      await db.payments.update({ where: { orderId: razorpay_order_id }, data: { status: "FAILED" } });
      return res.status(400).json({ error: "Payment signature verification failed" });
    }

    let paymentRecord;
    try {
      // Step 1b: Signature valid - Execute atomic transaction for payment fulfillment
      // If any of these operations fail, the entire block is rolled back.
      // NOTE: Because Razorpay has already deducted money, a failure here requires manual intervention.
      paymentRecord = await db.$transaction(async (tx) => {
        // 1. Update payment status to SUCCESS
        const updatedPayment = await tx.payments.update({
          where: { orderId: razorpay_order_id },
          data: { 
            status: "SUCCESS", 
            paymentId: razorpay_payment_id,
            cartItems: items ? (typeof items === "string" ? items : JSON.stringify(items)) : "[]",
            isGiftWrapped: !!isGiftWrapped,
            giftMessage: giftMessage || "",
            giftWrapPrice: giftWrapPrice ? Number(giftWrapPrice) : 0
          },
        });

        // 2. Create security log for audit trail
        await tx.securityLogs.create({
          data: { event: "PAYMENT_SUCCESS", user: razorpay_payment_id, status: "SUCCESS" },
        });

        // 3. Increment promo code usage
        if (promoCode) {
          const promo = await tx.redeemCodes.findUnique({ where: { code: promoCode.toUpperCase() } });
          if (promo) {
            await tx.redeemCodes.update({
              where: { code: promo.code },
              data: { usedCount: (promo.usedCount || 0) + 1 },
            });
          }
        }

        // 4. Reserve stock atomically. Never clamp stock: a failed conditional update
        // rolls the whole transaction back instead of allowing an oversell.
        if (Array.isArray(items)) {
          const requested = new Map();
          for (const item of items) {
            const quantity = Math.max(1, Number(item.quantity) || 1);
            requested.set(item.id, (requested.get(item.id) || 0) + quantity);
          }
          for (const [productId, quantity] of requested) {
            const result = await tx.products.updateMany({
              where: { id: productId, isVisible: true, stock: { gte: quantity } },
              data: { stock: { decrement: quantity } },
            });
            if (result.count !== 1) throw new Error(`Insufficient stock for product ${productId}`);
          }
        }

        return updatedPayment;
      });
    } catch (txError) {
      console.error("Critical Fulfillment Error (Transaction Rolled Back):", txError.message);
      // Since Razorpay collected the money but our fulfillment failed, we must alert the admin
      // and return a specific error so the frontend knows to instruct the user.
      return res.status(500).json({ 
        error: "Payment was successful but fulfillment failed. Please contact support with your Order ID.",
        orderId: razorpay_order_id
      });
    }

    // Trigger notification for new order placed
    createAdminNotification({
      type: "NEW_ORDER",
      title: "📦 New Order Placed",
      message: `📦 New order #${paymentRecord.orderId} of ₹${paymentRecord.amount.toLocaleString()} placed by ${paymentRecord.userEmail || "guest"}`,
      userEmail: paymentRecord.userEmail
    });



    // Send order confirmation emails
    try {
      const activeTransporter = await getTransporter();
      if (activeTransporter) {
        const apiSettings = await getApiSettings();
        const cmsBrand = await db.cmsSettings.findUnique({ where: { key: "brand" } }) || {};
        const adminEmail = cmsBrand.email || process.env.ADMIN_EMAIL || "contact@vrix.com";
        const senderEmail = apiSettings && apiSettings.nodemailerUser ? apiSettings.nodemailerUser : (process.env.SMTP_USER || "info@vrixjewels.com");

        const itemsList = items || [];
        let itemsHtml = "";
        itemsList.forEach((item) => {
          itemsHtml += `
            <tr style="border-bottom: 1px solid #e5e3df;">
              <td style="padding: 14px 0; font-size: 13px; color: #0f1728; line-height: 1.5;">
                <strong style="text-transform: uppercase; letter-spacing: 0.5px;">${item.title}</strong><br/>
                <span style="font-size: 11px; color: #666; text-transform: uppercase;">${item.material || "Fine Jewelry"} ${item.size ? `• Size: ${item.size}` : ""}</span>
                ${item.engraving ? `<br/><span style="font-size: 11px; color: #854d0e; font-style: italic;">Engraving: "${item.engraving}"</span>` : ""}
                ${item.giftNote ? `<br/><span style="font-size: 11px; color: #4338ca; font-style: italic;">Gift Message: "${item.giftNote}"</span>` : ""}
              </td>
              <td style="padding: 14px 0; font-size: 13px; color: #0f1728; text-align: center;">${item.quantity || 1}</td>
              <td style="padding: 14px 0; font-size: 13px; font-weight: bold; color: #0f1728; text-align: right;">₹${((item.price || 0) * (item.quantity || 1)).toLocaleString("en-IN")}</td>
            </tr>
          `;
        });

        if (isGiftWrapped) {
          itemsHtml += `
            <tr style="border-bottom: 1px solid #e5e3df;">
              <td style="padding: 14px 0; font-size: 13px; color: #0f1728;">
                <strong style="text-transform: uppercase; letter-spacing: 0.5px;">VRIX Signature Gift Presentation Case</strong><br/>
                ${giftMessage ? `<span style="font-size: 11px; color: #666; font-style: italic;">Ribbon Note: "${giftMessage}"</span>` : ""}
              </td>
              <td style="padding: 14px 0; font-size: 13px; color: #0f1728; text-align: center;">1</td>
              <td style="padding: 14px 0; font-size: 13px; font-weight: bold; color: #0f1728; text-align: right;">₹${(giftWrapPrice || 250).toLocaleString("en-IN")}</td>
            </tr>
          `;
        }

        const etaLabel = paymentRecord.estimatedDeliveryDate
          ? new Date(paymentRecord.estimatedDeliveryDate).toLocaleDateString("en-IN", { weekday: 'long', month: 'short', day: 'numeric' })
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", { weekday: 'long', month: 'short', day: 'numeric' });

        const orderSummaryHtml = `
          <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: auto; padding: 36px; background: #f8f6f0; border: 1px solid #e5e3df; color: #0f1728;">
            <div style="text-align: center; border-bottom: 2px solid #0f1728; padding-bottom: 20px; margin-bottom: 28px;">
              <h1 style="font-size: 24px; letter-spacing: 6px; color: #0f1728; text-transform: uppercase; margin: 0 0 6px 0; font-weight: 700;">VRIX</h1>
              <p style="font-size: 10px; letter-spacing: 3px; color: #666; text-transform: uppercase; margin: 0;">Architectural Fine Jewelry • Official Invoice</p>
            </div>

            <p style="color: #444; font-size: 14px; margin-bottom: 16px;">Dear <strong>${paymentRecord.customerName || 'Valued Client'}</strong>,</p>
            <p style="color: #666; font-size: 13px; line-height: 1.6; margin-bottom: 24px;">Thank you for selecting VRIX. Your piece has been recorded in our master ledger and is entering hand-craftsmanship inspection. Below is your official tax receipt and shipment schedule:</p>

            <div style="margin-bottom: 24px; background: #ffffff; padding: 20px; border: 1px solid #e5e3df;">
              <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                <tr>
                  <td style="padding-bottom: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px; font-size: 10px;">Order Reference</td>
                  <td style="padding-bottom: 10px; text-align: right; font-weight: bold; color: #0f1728;">${paymentRecord.orderId}</td>
                </tr>
                <tr>
                  <td style="padding-bottom: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px; font-size: 10px;">Payment Reference ID</td>
                  <td style="padding-bottom: 10px; text-align: right; font-mono: true; color: #0f1728;">${paymentRecord.paymentId || razorpay_payment_id}</td>
                </tr>
                <tr>
                  <td style="color: #888; text-transform: uppercase; letter-spacing: 1px; font-size: 10px;">Estimated Delivery Arrival</td>
                  <td style="text-align: right; font-weight: bold; color: #2563eb;">🚚 ${etaLabel}</td>
                </tr>
              </table>
            </div>

            <div style="margin-bottom: 24px; background: #ffffff; padding: 20px; border: 1px solid #e5e3df;">
              <p style="font-size: 10px; color: #888; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">Recipient &amp; Delivery Destination</p>
              <p style="font-size: 13px; color: #0f1728; font-weight: bold; margin: 0;">${paymentRecord.customerName || "VRIX Client"}</p>
              <p style="font-size: 12px; color: #444; margin: 4px 0 0 0;">${paymentRecord.address || ""}, ${paymentRecord.city || ""} ${paymentRecord.postalCode || ""}</p>
              <p style="font-size: 12px; color: #666; margin: 4px 0 0 0;">Contact Phone: ${paymentRecord.customerPhone || "N/A"}</p>
            </div>

            <table style="width: 100%; border-collapse: collapse; margin-bottom: 24px;">
              <thead>
                <tr style="border-bottom: 2px solid #e5e3df; font-size: 10px; text-transform: uppercase; color: #888; letter-spacing: 1.5px;">
                  <th style="text-align: left; padding-bottom: 8px;">Jewelry Item</th>
                  <th style="text-align: center; padding-bottom: 8px; width: 50px;">Qty</th>
                  <th style="text-align: right; padding-bottom: 8px; width: 100px;">Amount</th>
                </tr>
              </thead>
              <tbody>${itemsHtml || `<tr><td colspan="3" style="padding: 12px 0; text-align: center; color: #666;">Standard Jewelry Piece</td></tr>`}</tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding: 16px 0 0 0; font-size: 13px; color: #666; text-align: right;">Total Amount Paid (Inclusive of Taxes)</td>
                  <td style="padding: 16px 0 0 0; font-size: 18px; font-weight: bold; color: #0f1728; text-align: right;">₹${paymentRecord.amount.toLocaleString("en-IN")}</td>
                </tr>
              </tfoot>
            </table>

            <div style="border-top: 1px solid #e5e3df; padding-top: 20px; text-align: center;">
              <p style="color: #888; font-size: 11px; margin: 0 0 6px 0;">For inquiries or custom sizing support: <a href="mailto:${adminEmail}" style="color: #0f1728;">${adminEmail}</a></p>
              <p style="color: #0f1728; font-size: 11px; font-weight: bold; letter-spacing: 2px; text-transform: uppercase; margin: 0;">VRIX FINE JEWELRY • ALL RIGHTS RESERVED</p>
            </div>
          </div>
        `;

        if (paymentRecord.userEmail) {
          await activeTransporter.sendMail({
            from: `"VRIX Fine Jewelry" <${senderEmail}>`,
            to: paymentRecord.userEmail,
            subject: `Order Invoice & Receipt #${paymentRecord.orderId} - VRIX`,
            html: orderSummaryHtml,
          });
        }

        await activeTransporter.sendMail({
          from: `"VRIX System" <${senderEmail}>`,
          to: adminEmail,
          subject: `New Paid Order Verified - #${paymentRecord.orderId}`,
          html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e5e3df;"><h3 style="color: #0f1728; border-bottom: 2px solid #e5e3df; padding-bottom: 10px;">Payment Verified</h3>${orderSummaryHtml}</div>`,
        });
      }
    } catch (mailErr) {
      console.error("Failed to send order verification email:", mailErr.message);
    }

    res.json({ success: true, paymentId: razorpay_payment_id, order: paymentRecord });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payment/user-orders — Fetch all orders for a logged-in user
router.get("/user-orders", async (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ error: "Email query parameter is required" });

  try {
    const allPayments = await db.payments.findMany();
    const userPayments = allPayments.filter(
      p => p.userEmail && p.userEmail.toLowerCase() === String(email).toLowerCase()
    );
    res.json(userPayments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payment/track/:query — Track specific order by orderId or paymentId
router.get("/track/:query", async (req, res) => {
  const { query } = req.params;
  if (!query) return res.status(400).json({ error: "Order ID or Payment ID is required" });

  try {
    const qLower = String(query).trim().toLowerCase();
    const allPayments = await db.payments.findMany();
    const match = allPayments.find(
      (p) =>
        (p.orderId && p.orderId.toLowerCase() === qLower) ||
        (p.paymentId && p.paymentId.toLowerCase() === qLower)
    );

    if (!match) {
      return res.status(404).json({ error: `No order found matching "${query}". Please check your Order ID and try again.` });
    }

    res.json({ success: true, order: match });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/payment/invoice/:orderId — Generate Invoice View / Printable Document
router.get("/invoice/:orderId", async (req, res) => {
  const { orderId } = req.params;
  try {
    const payment = await db.payments.findUnique({ where: { orderId } });
    if (!payment) {
      return res.status(404).send("<h2 style='font-family:sans-serif;text-align:center;padding:50px;'>Invoice not found.</h2>");
    }

    // Load dynamic customizer settings from CMS
    let cfg = {
      themeColor: "#0f1728",
      fontFamily: "sans-serif",
      logoWidth: "120",
      companyName: "VRIX",
      companyGst: "",
      addressLine1: "VRIX Architectural Fine Jewelry",
      addressLine2: "Mumbai, India",
      footerNotes: "This is a computer generated document. Signed under official luxury brand licensing.",
      layoutMode: "modern"
    };

    try {
      const dbCms = await db.cmsSettings.findUnique({ where: { key: "invoice_settings" } });
      if (dbCms && dbCms.value) {
        let val = dbCms.value;
        if (typeof val === "string") {
          try {
            val = JSON.parse(val);
          } catch (e) {
            val = {};
          }
        }
        if (val && typeof val === "object") {
          cfg = { ...cfg, ...val };
        }
      }
    } catch (e) {
      console.warn("Failed to load invoice_settings CMS config, using defaults:", e.message);
    }

    const dateStr = new Date(payment.createdAt || Date.now()).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const isIndia = String(payment.city || "").toLowerCase().includes("india") || 
                    String(payment.address || "").toLowerCase().includes("india") ||
                    !payment.currency || payment.currency === "INR";

    const subtotal = Number(payment.amount || 0);
    const taxRate = isIndia ? 0.18 : 0.05; // 18% GST default for India
    const taxAmount = subtotal * (taxRate / (1 + taxRate)); // inclusive tax calculation
    const baseAmount = subtotal - taxAmount;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${cfg.companyName} Invoice - ${payment.orderId}</title>
        <style>
          body { 
            font-family: ${cfg.fontFamily === "serif" ? "'Times New Roman', Georgia, serif" : cfg.fontFamily === "monospace" ? "'Courier New', Courier, monospace" : "'Helvetica Neue', Arial, sans-serif"}; 
            background: #fff; 
            color: #0f1728; 
            margin: 0; 
            padding: 40px; 
          }
          .container { max-width: 750px; margin: auto; border: 1px solid #e5e3df; padding: 40px; }
          .header { 
            display: flex; 
            justify-content: space-between; 
            align-items: flex-start; 
            border-bottom: 2px solid ${cfg.themeColor}; 
            padding-bottom: 20px; 
            margin-bottom: 30px; 
          }
          .brand { 
            font-size: ${cfg.logoWidth || '28'}px; 
            font-weight: 700; 
            letter-spacing: 4px; 
            text-transform: uppercase; 
            color: ${cfg.themeColor};
          }
          .title { font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: #666; margin-top: 5px; }
          .meta { text-align: right; font-size: 12px; color: #555; }
          .meta strong { font-size: 16px; color: #0f1728; display: block; margin-top: 4px; }
          .grid { display: grid; grid-template-cols: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
          .card { background: #f9f8f6; padding: 20px; border: 1px solid #e5e3df; font-size: 13px; line-height: 1.6; }
          .card h4 { margin: 0 0 10px 0; text-transform: uppercase; font-size: 11px; letter-spacing: 1px; color: #888; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; }
          th { 
            text-align: left; 
            padding: 12px; 
            border-bottom: 2px solid ${cfg.themeColor}; 
            font-size: 11px; 
            text-transform: uppercase; 
            letter-spacing: 1px; 
            color: #666; 
          }
          td { padding: 14px 12px; border-bottom: 1px solid #e5e3df; font-size: 14px; }
          .total-row { font-size: 18px; font-weight: bold; background: #f9f8f6; }
          .print-btn { 
            display: block; 
            width: 180px; 
            margin: 30px auto 0; 
            text-align: center; 
            background: ${cfg.themeColor}; 
            color: #fff; 
            padding: 12px; 
            text-decoration: none; 
            font-size: 12px; 
            text-transform: uppercase; 
            letter-spacing: 2px; 
            border-radius: 4px;
          }
          @media print { .print-btn { display: none; } }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div>
              ${cfg.logoUrl ? `
                <div style="height: ${cfg.logoWidth || '32'}px; margin-bottom: 8px; display: flex; align-items: center;">
                  <img src="${cfg.logoUrl}" alt="${cfg.companyName || 'VRIX'}" style="height: 100%; max-height: 100%; object-fit: contain;" />
                </div>
              ` : `
                <div class="brand">${cfg.companyName || 'VRIX'}</div>
              `}
              <div class="title">Official Tax Invoice</div>
              ${cfg.companyGst ? `<div style="font-size: 10px; color: #555; margin-top: 5px;">GSTIN: <strong>${cfg.companyGst}</strong></div>` : ""}
            </div>
            <div class="meta">
              <div>Invoice Date: ${dateStr}</div>
              <div>Order ID: <strong>${payment.orderId}</strong></div>
              <div>Payment ID: ${payment.paymentId || "N/A"}</div>
            </div>
          </div>

          <div class="grid" style="display: flex; justify-content: space-between; gap: 20px; width: 100%;">
            <div class="card" style="flex: 1; min-width: 0; box-sizing: border-box;">
              <h4>Billed & Shipped To</h4>
              <div><strong>${payment.customerName || payment.userEmail || "Customer"}</strong></div>
              <div>${payment.address || "Address Provided at Checkout"}</div>
              <div>${payment.city || ""}${payment.postalCode ? `, ${payment.postalCode}` : ""}</div>
              <div>Email: ${payment.userEmail || "N/A"}</div>
              <div>Phone: ${payment.customerPhone || "N/A"}</div>
            </div>
            <div class="card" style="flex: 1; min-width: 0; box-sizing: border-box;">
              <h4>Seller Details</h4>
              <div><strong>${cfg.companyName || "VRIX Jewels"}</strong></div>
              <div>${cfg.addressLine1 || "VRIX Architectural Fine Jewelry"}</div>
              <div>${cfg.addressLine2 || "Mumbai, India"}</div>
              ${cfg.companyGst ? `<div>GSTIN: ${cfg.companyGst}</div>` : ""}
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>Description</th>
                <th style="text-align: center; width: 80px;">Qty</th>
                <th style="text-align: right; width: 120px;">Unit Price</th>
                <th style="text-align: right; width: 140px;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${(() => {
                let itemsHtml = "";
                let hasItems = false;
                
                // Read cart_items from payment table if stored as JSON/object
                let orderItems = [];
                if (payment.cartItems) {
                  try {
                    orderItems = typeof payment.cartItems === "string" ? JSON.parse(payment.cartItems) : payment.cartItems;
                  } catch (e) {
                    orderItems = [];
                  }
                }
                
                if (Array.isArray(orderItems) && orderItems.length > 0) {
                  hasItems = true;
                  orderItems.forEach(item => {
                    const priceVal = Number(item.price || 0);
                    const qtyVal = Number(item.quantity || 1);
                    const nameStr = item.title || item.name || "VRIX Jewelry Piece";
                    const options = [
                      item.type ? `Collection Category: ${item.type.toUpperCase()}` : "",
                      item.material ? `Material Swatch: ${item.material}` : "",
                      item.size ? `Size Option: ${item.size}` : "",
                      item.engraving ? `Engraving Signature: "${item.engraving}"` : ""
                    ].filter(Boolean).join(" | ");

                    itemsHtml += `
                      <tr>
                        <td>
                          <div style="font-weight: bold; color: ${cfg.themeColor};">${nameStr}</div>
                          ${options ? `<div style="font-size: 11px; color: #555; margin-top: 5px; font-family: sans-serif; line-height: 1.4;">${options}</div>` : ""}
                        </td>
                        <td style="text-align: center;">${qtyVal}</td>
                        <td style="text-align: right;">${payment.currency || "INR"} ${priceVal.toLocaleString()}</td>
                        <td style="text-align: right; font-weight: bold;">${payment.currency || "INR"} ${(priceVal * qtyVal).toLocaleString()}</td>
                      </tr>
                    `;
                  });
                }

                // Fallback row if order details not stored
                if (!hasItems) {
                  itemsHtml += `
                    <tr>
                      <td>
                        <strong>VRIX Fine Jewelry Purchase</strong>
                        <div style="font-size: 11px; color: #666; margin-top: 3px;">Order Receipt: ${payment.orderId}</div>
                      </td>
                      <td style="text-align: center;">1</td>
                      <td style="text-align: right;">${payment.currency || "INR"} ${baseAmount.toLocaleString()}</td>
                      <td style="text-align: right; font-weight: bold;">${payment.currency || "INR"} ${baseAmount.toLocaleString()}</td>
                    </tr>
                  `;
                }

                // Add gift wrap row if selected
                if (payment.isGiftWrapped || payment.giftWrapPrice) {
                  const wrapPrice = Number(payment.giftWrapPrice || 250);
                  itemsHtml += `
                    <tr>
                      <td>
                        <strong>Signature Gift Packaging</strong>
                        ${payment.giftMessage ? `<div style="font-size: 11px; color: #666; margin-top: 3px; font-style: italic;">Note: "${payment.giftMessage}"</div>` : ""}
                      </td>
                      <td style="text-align: center;">1</td>
                      <td style="text-align: right;">${payment.currency || "INR"} ${wrapPrice.toLocaleString()}</td>
                      <td style="text-align: right; font-weight: bold;">${payment.currency || "INR"} ${wrapPrice.toLocaleString()}</td>
                    </tr>
                  `;
                }

                return itemsHtml;
              })()}

              <tr style="border-top: 2px solid #e5e3df;">
                <td colspan="2" style="border: none;"></td>
                <td style="text-align: right; font-size: 12px; color: #666; padding: 8px 12px;">Subtotal (excl. tax)</td>
                <td style="text-align: right; font-size: 12px; color: #666; padding: 8px 12px;">${payment.currency || "INR"} ${baseAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
              </tr>
              
              ${isIndia ? `
                <tr>
                  <td colspan="2" style="border: none;"></td>
                  <td style="text-align: right; font-size: 12px; color: #666; padding: 8px 12px;">CGST (9%)</td>
                  <td style="text-align: right; font-size: 12px; color: #666; padding: 8px 12px;">${payment.currency || "INR"} ${(taxAmount / 2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
                <tr>
                  <td colspan="2" style="border: none;"></td>
                  <td style="text-align: right; font-size: 12px; color: #666; padding: 8px 12px;">SGST (9%)</td>
                  <td style="text-align: right; font-size: 12px; color: #666; padding: 8px 12px;">${payment.currency || "INR"} ${(taxAmount / 2).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              ` : `
                <tr>
                  <td colspan="2" style="border: none;"></td>
                  <td style="text-align: right; font-size: 12px; color: #666; padding: 8px 12px;">VAT / Tax (${Math.round(taxRate * 100)}%)</td>
                  <td style="text-align: right; font-size: 12px; color: #666; padding: 8px 12px;">${payment.currency || "INR"} ${taxAmount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                </tr>
              `}

              <tr class="total-row">
                <td colspan="2" style="border: none; background: transparent;"></td>
                <td style="text-align: right;">Grand Total</td>
                <td style="text-align: right; color: ${cfg.themeColor};">${payment.currency || "INR"} ${subtotal.toLocaleString()}</td>
              </tr>
            </tbody>
          </table>

          <div style="font-size: 11px; color: #888; text-align: center; margin-top: 40px; padding-top: 20px; border-t: 1px solid #e5e3df; line-height: 1.5;">
            ${cfg.footerNotes}
          </div>

          <a href="#" onclick="window.print(); return false;" class="print-btn">Print / Save Invoice</a>
        </div>
      </body>
      </html>
    `;
    res.send(html);
  } catch (err) {
    res.status(500).send("Error generating invoice: " + err.message);
  }
});

// GET /api/payment/logs — Get payment logs (admin)
router.get("/logs", async (req, res) => {
  try {
    const payments = await db.payments.findMany();
    res.json(payments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/payment/status/:orderId — Update order status (admin)
const ALLOWED_TRANSITIONS = {
  CREATED:   ["SUCCESS", "FAILED"],
  SUCCESS:   ["DELIVERED", "REFUNDED"],
  DELIVERED: ["REFUNDED"],
  FAILED:    [],
  REFUNDED:  [],
};

router.patch("/status/:orderId", async (req, res) => {
  const { orderId } = req.params;
  const { status: newStatus } = req.body;

  if (!newStatus) return res.status(400).json({ error: "status is required" });

  try {
    const payment = await db.payments.findUnique({ where: { orderId } });
    if (!payment) return res.status(404).json({ error: "Order not found" });

    const currentStatus = (payment.status || "CREATED").toUpperCase();
    const allowed = ALLOWED_TRANSITIONS[currentStatus] || [];

    if (!allowed.includes(newStatus.toUpperCase())) {
      return res.status(400).json({
        error: `Cannot transition from ${currentStatus} to ${newStatus}. Allowed: ${allowed.join(", ") || "none"}`
      });
    }

    const updated = await db.payments.update({
      where: { orderId },
      data: { status: newStatus.toUpperCase() },
    });

    db.securityLogs.create({
      data: { event: "ORDER_STATUS_UPDATE", user: orderId, status: newStatus.toUpperCase() }
    }).catch(() => {});

    res.json({ success: true, order: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ══════════════════════════════════════════════════════════════════════════════
//  PAYPAL — Create Order
//  POST /api/payment/paypal/create-order
// ══════════════════════════════════════════════════════════════════════════════
router.post("/paypal/create-order", async (req, res) => {
  const {
    amount,
    currency = "USD",
    customerName,
    customerPhone,
    email,
    address,
    city,
    postalCode,
    notes,
    isGiftWrapped,
    giftMessage,
    giftWrapPrice,
  } = req.body;

  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: "Invalid amount" });
  }

  try {
    const credentials = await getPayPalCredentials();

    if (!credentials) {
      return res.status(503).json({
        error: "PayPal is currently disabled or not configured",
        code: "PAYPAL_DISABLED",
      });
    }

    const { token, baseUrl } = await getPayPalAccessToken(credentials);

    // PayPal requires 2 decimal places and specific currency codes
    const normalizedCurrency = currency.toUpperCase();
    const formattedAmount = Number(amount).toFixed(2);

    // Create PayPal Order via REST v2
    const ppResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json",
        "PayPal-Request-Id": `vrix-${Date.now()}`, // idempotency key
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            reference_id: `vrix_${Date.now()}`,
            amount: {
              currency_code: normalizedCurrency,
              value: formattedAmount,
            },
            description: "VRIX Jewellery Order",
            soft_descriptor: "VRIX",
          },
        ],
        application_context: {
          brand_name: "VRIX",
          landing_page: "NO_PREFERENCE",
          user_action: "PAY_NOW",
          return_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/checkout/success`,
          cancel_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/checkout/payment`,
        },
      }),
    });

    if (!ppResponse.ok) {
      const ppError = await ppResponse.json().catch(() => ({}));
      throw new Error(ppError.message || `PayPal order creation failed (${ppResponse.status})`);
    }

    const ppOrder = await ppResponse.json();

    // Persist a PENDING payment record (same table as Razorpay)
    const internalOrderId = `pp_${ppOrder.id}`;
    await db.payments.create({
      data: {
        orderId: internalOrderId,
        amount: Number(amount),
        currency: normalizedCurrency,
        status: "CREATED",
        userEmail: email || null,
        customerName: customerName || null,
        customerPhone: customerPhone || null,
        address: address || null,
        city: city || null,
        postalCode: postalCode || null,
        isGiftWrapped: !!isGiftWrapped,
        giftMessage: giftMessage || "",
        giftWrapPrice: giftWrapPrice ? Number(giftWrapPrice) : 0,
        paymentGateway: "paypal",
        gatewayOrderId: ppOrder.id,
      },
    });

    // Audit log
    await db.securityLogs.create({
      data: {
        event: "PAYPAL_ORDER_CREATED",
        user: ppOrder.id,
        userEmail: email || null,
        status: "INFO",
      },
    });

    res.json({
      success: true,
      orderId: ppOrder.id,          // PayPal order ID — needed by frontend JS SDK
      internalOrderId,              // Our DB reference
      approvalUrl: ppOrder.links?.find((l) => l.rel === "approve")?.href || null,
    });
  } catch (err) {
    console.error("[PayPal Create Order]", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
//  PAYPAL — Capture Order (called after buyer approves in the popup)
//  POST /api/payment/paypal/capture-order
// ══════════════════════════════════════════════════════════════════════════════
router.post("/paypal/capture-order", async (req, res) => {
  const {
    paypalOrderId,
    items,
    promoCode,
    isGiftWrapped,
    giftMessage,
    giftWrapPrice,
    email,
  } = req.body;

  if (!paypalOrderId) {
    return res.status(400).json({ error: "Missing paypalOrderId" });
  }

  try {
    const credentials = await getPayPalCredentials();
    if (!credentials) {
      return res.status(503).json({ error: "PayPal is disabled", code: "PAYPAL_DISABLED" });
    }

    const { token, baseUrl } = await getPayPalAccessToken(credentials);

    // Capture the approved order
    const captureResponse = await fetch(
      `${baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const captureData = await captureResponse.json();

    if (!captureResponse.ok || captureData.status !== "COMPLETED") {
      // Mark payment as FAILED in DB
      const internalOrderId = `pp_${paypalOrderId}`;
      await db.payments.updateMany({
        where: { gatewayOrderId: paypalOrderId },
        data: { status: "FAILED" },
      });

      await db.securityLogs.create({
        data: {
          event: "PAYPAL_CAPTURE_FAILED",
          user: paypalOrderId,
          userEmail: email || null,
          status: "FAILED",
        },
      });

      const declineReason =
        captureData.details?.[0]?.description ||
        captureData.message ||
        "Payment was declined by PayPal";

      return res.status(402).json({
        error: declineReason,
        code: captureData.details?.[0]?.issue || "CAPTURE_FAILED",
      });
    }

    // Extract capture details
    const capture = captureData.purchase_units?.[0]?.payments?.captures?.[0];
    const captureId = capture?.id;

    // Atomic transaction: update payment + stock + promo + log
    const paymentRecord = await db.$transaction(async (tx) => {
      // 1. Update payment status to SUCCESS
      const updated = await tx.payments.updateMany({
        where: { gatewayOrderId: paypalOrderId },
        data: {
          status: "SUCCESS",
          paymentId: captureId,
          cartItems: items ? JSON.stringify(items) : "[]",
          isGiftWrapped: !!isGiftWrapped,
          giftMessage: giftMessage || "",
          giftWrapPrice: giftWrapPrice ? Number(giftWrapPrice) : 0,
        },
      });

      // 2. Security log
      await tx.securityLogs.create({
        data: {
          event: "PAYPAL_CAPTURE_SUCCESS",
          user: captureId,
          userEmail: email || null,
          status: "SUCCESS",
        },
      });

      // 3. Promo code usage increment
      if (promoCode) {
        const promo = await tx.redeemCodes.findUnique({
          where: { code: promoCode.toUpperCase() },
        });
        if (promo) {
          await tx.redeemCodes.update({
            where: { code: promo.code },
            data: { usedCount: (promo.usedCount || 0) + 1 },
          });
        }
      }

      // 4. Decrement stock
      if (items && Array.isArray(items)) {
        for (const item of items) {
          if (item.id && item.qty) {
            await tx.products.updateMany({
              where: { id: item.id },
              data: { stock: { decrement: item.qty } },
            });
          }
        }
      }

      return updated;
    });

    // Fetch the payment record for the response
    const savedPayment = await db.payments.findFirst({
      where: { gatewayOrderId: paypalOrderId },
    });

    // Admin notification (non-blocking)
    createAdminNotification({
      type: "payment",
      title: "New PayPal Payment",
      message: `PayPal payment captured: ${captureId} — ₹${savedPayment?.amount ?? ""}`,
      userEmail: email || null,
    }).catch(() => {});

    res.json({
      success: true,
      captureId,
      orderId: savedPayment?.orderId || `pp_${paypalOrderId}`,
      paymentId: captureId,
    });
  } catch (err) {
    console.error("[PayPal Capture Order]", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════════
//  PAYPAL — Webhook verification
//  POST /api/payment/paypal/webhook
//  Handles: PAYMENT.CAPTURE.COMPLETED, PAYMENT.CAPTURE.DENIED
// ══════════════════════════════════════════════════════════════════════════════
router.post("/paypal/webhook", async (req, res) => {
  // Acknowledge immediately to PayPal
  res.sendStatus(200);

  try {
    const event = req.body;
    const eventType = event?.event_type;
    const resource = event?.resource;

    if (!eventType || !resource) return;

    if (eventType === "PAYMENT.CAPTURE.COMPLETED") {
      const captureId = resource.id;
      const supplementalData = resource.supplementary_data?.related_ids;
      const ppOrderId = supplementalData?.order_id;

      if (ppOrderId) {
        await db.payments.updateMany({
          where: { gatewayOrderId: ppOrderId },
          data: { status: "SUCCESS", paymentId: captureId },
        });
        await db.securityLogs.create({
          data: { event: "PAYPAL_WEBHOOK_CAPTURE_COMPLETED", user: captureId, status: "SUCCESS" },
        });
      }
    } else if (
      eventType === "PAYMENT.CAPTURE.DENIED" ||
      eventType === "PAYMENT.CAPTURE.REFUNDED"
    ) {
      const supplementalData = resource.supplementary_data?.related_ids;
      const ppOrderId = supplementalData?.order_id;

      if (ppOrderId) {
        const newStatus = eventType === "PAYMENT.CAPTURE.REFUNDED" ? "REFUNDED" : "FAILED";
        await db.payments.updateMany({
          where: { gatewayOrderId: ppOrderId },
          data: { status: newStatus },
        });
        await db.securityLogs.create({
          data: { event: `PAYPAL_WEBHOOK_${eventType.replace(/\./g, "_")}`, user: ppOrderId, status: newStatus },
        });
      }
    }
  } catch (err) {
    console.error("[PayPal Webhook]", err.message);
  }
});

export default router;

