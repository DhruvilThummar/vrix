import express from "express";
import crypto from "crypto";
import { db } from "../database.js";
import { getRazorpay, getApiSettings, getTransporter } from "../config/apiResolvers.js";

const router = express.Router();

const getRazorpayCredentials = async () => {
  const apiSettings = await getApiSettings();
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
    };
  }

  return null;
};

const safeCompareHex = (actual, expected) => {
  const actualBuffer = Buffer.from(String(actual || ""), "hex");
  const expectedBuffer = Buffer.from(String(expected || ""), "hex");
  return actualBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
};

router.get("/config", async (req, res) => {
  try {
    const credentials = await getRazorpayCredentials();
    res.json({
      keyId: credentials?.keyId || null,
      currency: "INR",
      enabled: !!credentials?.keyId,
      devMode: !credentials?.keyId,
      source: credentials?.source || "dev",
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

      res.json({ success: true, order });
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
          data: { status: "SUCCESS", paymentId: razorpay_payment_id },
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

        // 4. Deduct stock for purchased items
        if (Array.isArray(items)) {
          for (const item of items) {
            const product = await tx.products.findUnique({ where: { id: item.id } });
            if (product) {
              const currentStock = product.stock ?? 999;
              const newStock = Math.max(0, currentStock - (item.quantity || 1));
              await tx.products.update({ where: { id: item.id }, data: { stock: newStock } });
            }
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

        if (isGiftWrapped) {
          itemsHtml += `
            <tr style="border-bottom: 1px solid #e5e3df;">
              <td style="padding: 12px 0; font-size: 14px; color: #0f1728;">
                <strong>Signature Gift Packaging</strong><br/>
                ${giftMessage ? `<span style="font-size: 12px; color: #666; font-style: italic;">Note: "${giftMessage}"</span>` : ""}
              </td>
              <td style="padding: 12px 0; font-size: 14px; color: #0f1728; text-align: center;">1</td>
              <td style="padding: 12px 0; font-size: 14px; color: #0f1728; text-align: right;">₹${giftWrapPrice || 250}</td>
            </tr>
          `;
        }

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
      if (dbCms) {
        cfg = { ...cfg, ...dbCms };
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
            font-size: 28px; 
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
              <div class="brand" style="font-size: ${cfg.logoWidth}px">${cfg.companyName}</div>
              <div class="title">Official Tax Invoice</div>
              ${cfg.companyGst ? `<div style="font-size: 10px; color: #555; margin-top: 5px;">GSTIN: <strong>${cfg.companyGst}</strong></div>` : ""}
            </div>
            <div class="meta">
              <div>Invoice Date: ${dateStr}</div>
              <div>Order ID: <strong>${payment.orderId}</strong></div>
              <div>Payment ID: ${payment.paymentId || "N/A"}</div>
            </div>
          </div>

          <div class="grid">
            <div class="card">
              <h4>Billed & Shipped To</h4>
              <div><strong>${payment.customerName || payment.userEmail || "Customer"}</strong></div>
              <div>${payment.address || "Address Provided at Checkout"}</div>
              <div>${payment.city || ""}${payment.postalCode ? `, ${payment.postalCode}` : ""}</div>
              <div>Email: ${payment.userEmail || "N/A"}</div>
              <div>Phone: ${payment.customerPhone || "N/A"}</div>
            </div>
            <div class="card">
              <h4>Seller Details</h4>
              <div><strong>${cfg.companyName}</strong></div>
              <div>${cfg.addressLine1}</div>
              <div>${cfg.addressLine2}</div>
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
                      item.material ? `Material: ${item.material}` : "",
                      item.size ? `Size: ${item.size}` : "",
                      item.engraving ? `Engraving: "${item.engraving}"` : ""
                    ].filter(Boolean).join(" | ");

                    itemsHtml += `
                      <tr>
                        <td>
                          <div style="font-weight: bold;">${nameStr}</div>
                          ${options ? `<div style="font-size: 11px; color: #666; margin-top: 3px;">${options}</div>` : ""}
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

export default router;

