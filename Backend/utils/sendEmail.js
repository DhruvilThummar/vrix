import nodemailer from "nodemailer";
import { getTransporter, sendEmailWithTimeout, getApiSettings } from "../config/apiResolvers.js";

/**
 * Resolves an active SMTP Transporter using process.env or CMS api_settings
 */
export async function createSmtpTransporter() {
  // 1. Check process.env SMTP configuration
  const envHost = process.env.SMTP_HOST;
  const envPort = Number(process.env.SMTP_PORT || 465);
  const envUser = process.env.SMTP_USER;
  const envPass = process.env.SMTP_PASS;

  if (envHost && envUser && envPass) {
    if (envHost === "smtp.gmail.com" || envUser.toLowerCase().endsWith("@gmail.com")) {
      return nodemailer.createTransport({
        service: "gmail",
        auth: { user: envUser, pass: envPass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 15000,
      });
    }

    return nodemailer.createTransport({
      host: envHost,
      port: envPort,
      secure: envPort === 465,
      auth: { user: envUser, pass: envPass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 15000,
    });
  }

  // 2. Fall back to CMS dynamic resolver
  return await getTransporter();
}

/**
 * Sends a luxury VRIX Order Confirmation Email for successful transactions
 * @param {string} userEmail - Recipient email
 * @param {object} orderDetails - Order information
 */
export async function sendOrderConfirmationEmail(userEmail, orderDetails = {}) {
  if (!userEmail) {
    console.warn("[sendOrderConfirmationEmail] No recipient email provided.");
    return false;
  }

  const {
    orderId = `vrix_${Date.now()}`,
    customerName = "Valued Client",
    amount = 0,
    currency = "USD",
    items = [],
    address = "",
    city = "",
    postalCode = "",
    isGiftWrapped = false,
    giftMessage = "",
    giftWrapPrice = 0,
    paymentId = "",
    paymentGateway = "PayPal",
  } = orderDetails;

  const normalizedCurrency = String(currency).toUpperCase();
  const formatCurrency = (val) => {
    const num = Number(val || 0);
    if (normalizedCurrency === "USD") return `$${num.toFixed(2)} USD`;
    if (normalizedCurrency === "EUR") return `€${num.toFixed(2)} EUR`;
    if (normalizedCurrency === "GBP") return `£${num.toFixed(2)} GBP`;
    return `₹${num.toLocaleString("en-IN")}`;
  };

  // Build items HTML list
  let itemsTableRows = "";
  if (Array.isArray(items) && items.length > 0) {
    items.forEach((item) => {
      const title = item.title || item.name || "VRIX Fine Jewelry Piece";
      const qty = item.quantity || item.qty || 1;
      const price = item.price || 0;
      const material = item.material || "Fine Gold & Lab Diamond";
      const size = item.size ? ` • Size: ${item.size}` : "";
      const engraving = item.engraving ? `<br/><span style="font-size:11px;color:#854d0e;font-style:italic;">Engraving: "${item.engraving}"</span>` : "";

      itemsTableRows += `
        <tr style="border-bottom: 1px solid #e5e3df;">
          <td style="padding: 16px 0; font-size: 13px; color: #0f1728; line-height: 1.5;">
            <strong style="text-transform: uppercase; letter-spacing: 0.5px; font-family: sans-serif;">${title}</strong><br/>
            <span style="font-size: 11px; color: #666; text-transform: uppercase;">${material}${size}</span>
            ${engraving}
          </td>
          <td style="padding: 16px 0; font-size: 13px; color: #0f1728; text-align: center;">${qty}</td>
          <td style="padding: 16px 0; font-size: 13px; font-weight: 600; color: #0f1728; text-align: right;">${formatCurrency(price * qty)}</td>
        </tr>
      `;
    });
  }

  if (isGiftWrapped) {
    itemsTableRows += `
      <tr style="border-bottom: 1px solid #e5e3df;">
        <td style="padding: 16px 0; font-size: 13px; color: #0f1728;">
          <strong style="text-transform: uppercase; letter-spacing: 0.5px;">Signature VRIX Gift Presentation Case</strong><br/>
          ${giftMessage ? `<span style="font-size: 11px; color: #666; font-style: italic;">Ribbon Note: "${giftMessage}"</span>` : ""}
        </td>
        <td style="padding: 16px 0; font-size: 13px; color: #0f1728; text-align: center;">1</td>
        <td style="padding: 16px 0; font-size: 13px; font-weight: 600; color: #0f1728; text-align: right;">${formatCurrency(giftWrapPrice || 250)}</td>
      </tr>
    `;
  }

  const deliveryEta = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });

  // VRIX Brand Typography & Minimalist Luxury HTML Email Template
  const htmlTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>VRIX Order Confirmation - ${orderId}</title>
    </head>
    <body style="margin: 0; padding: 0; background-color: #f4f3ef; font-family: 'Helvetica Neue', Arial, sans-serif;">
      <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f4f3ef; padding: 40px 10px;">
        <tr>
          <td align="center">
            <table width="600" border="0" cellspacing="0" cellpadding="0" style="background-color: #ffffff; border: 1px solid #e5e3df; max-width: 600px; padding: 40px;">
              <!-- Header -->
              <tr>
                <td align="center" style="border-bottom: 2px solid #0f1728; padding-bottom: 24px; margin-bottom: 30px;">
                  <h1 style="font-size: 28px; letter-spacing: 6px; color: #0f1728; text-transform: uppercase; margin: 0 0 6px 0; font-weight: 700;">VRIX</h1>
                  <p style="font-size: 10px; letter-spacing: 3px; color: #888888; text-transform: uppercase; margin: 0;">A luxury that feels like you.</p>
                </td>
              </tr>

              <!-- Greeting & Thank You -->
              <tr>
                <td style="padding-top: 30px; padding-bottom: 20px;">
                  <p style="font-size: 15px; color: #0f1728; margin: 0 0 12px 0;">Dear <strong>${customerName}</strong>,</p>
                  <p style="font-size: 13px; color: #555555; line-height: 1.6; margin: 0;">
                    Thank you for choosing VRIX. Your payment of <strong>${formatCurrency(amount)}</strong> has been successfully received and confirmed. Your fine jewelry piece has been entered into our Surat Atelier master ledger for hand-craftsmanship inspection.
                  </p>
                </td>
              </tr>

              <!-- Order Reference Box -->
              <tr>
                <td style="padding: 20px; background-color: #f9f8f6; border: 1px solid #e5e3df; margin-bottom: 30px;">
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 12px;">
                    <tr>
                      <td style="color: #888888; text-transform: uppercase; letter-spacing: 1px; font-size: 10px; padding-bottom: 8px;">Order Reference ID</td>
                      <td align="right" style="font-weight: bold; color: #0f1728; padding-bottom: 8px;">${orderId}</td>
                    </tr>
                    <tr>
                      <td style="color: #888888; text-transform: uppercase; letter-spacing: 1px; font-size: 10px; padding-bottom: 8px;">Payment Gateway</td>
                      <td align="right" style="font-weight: bold; color: #0f1728; padding-bottom: 8px;">${paymentGateway}</td>
                    </tr>
                    ${paymentId ? `
                    <tr>
                      <td style="color: #888888; text-transform: uppercase; letter-spacing: 1px; font-size: 10px; padding-bottom: 8px;">Transaction ID</td>
                      <td align="right" style="font-family: monospace; color: #0f1728; padding-bottom: 8px;">${paymentId}</td>
                    </tr>` : ""}
                    <tr>
                      <td style="color: #888888; text-transform: uppercase; letter-spacing: 1px; font-size: 10px;">Estimated Delivery Arrival</td>
                      <td align="right" style="font-weight: bold; color: #059669;">🚚 ${deliveryEta}</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Items Breakdown Table -->
              <tr>
                <td style="padding-top: 30px;">
                  <h3 style="font-size: 12px; letter-spacing: 2px; text-transform: uppercase; color: #888888; margin: 0 0 16px 0;">Purchased Fine Jewelry</h3>
                  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: collapse;">
                    <thead>
                      <tr style="border-bottom: 2px solid #e5e3df; font-size: 10px; text-transform: uppercase; color: #888888; letter-spacing: 1.5px;">
                        <th align="left" style="padding-bottom: 10px;">Item</th>
                        <th align="center" style="padding-bottom: 10px; width: 60px;">Qty</th>
                        <th align="right" style="padding-bottom: 10px; width: 120px;">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsTableRows}
                      <tr>
                        <td colspan="2" align="right" style="padding-top: 16px; font-size: 13px; font-weight: bold; color: #0f1728;">Grand Total:</td>
                        <td align="right" style="padding-top: 16px; font-size: 15px; font-weight: bold; color: #0f1728;">${formatCurrency(amount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </td>
              </tr>

              <!-- Shipping Address -->
              ${address ? `
              <tr>
                <td style="padding-top: 30px;">
                  <div style="padding: 20px; background-color: #f9f8f6; border: 1px solid #e5e3df;">
                    <p style="font-size: 10px; color: #888888; text-transform: uppercase; letter-spacing: 1px; margin: 0 0 8px 0;">Delivery Destination</p>
                    <p style="font-size: 13px; color: #0f1728; font-weight: bold; margin: 0;">${customerName}</p>
                    <p style="font-size: 12px; color: #555555; margin: 4px 0 0 0;">${address}, ${city} ${postalCode}</p>
                  </div>
                </td>
              </tr>` : ""}

              <!-- Footer -->
              <tr>
                <td align="center" style="padding-top: 40px; border-top: 1px solid #e5e3df; margin-top: 40px;">
                  <p style="font-size: 11px; color: #888888; line-height: 1.6; margin: 0 0 8px 0;">
                    Need assistance? Contact our Atelier Concierge team at <a href="mailto:info@vrixjewels.com" style="color: #0f1728; text-decoration: underline;">info@vrixjewels.com</a> or visit Flagship Atelier, Surat, Gujarat.
                  </p>
                  <p style="font-size: 10px; color: #aaaaaa; text-transform: uppercase; letter-spacing: 1px; margin: 0;">
                    © ${new Date().getFullYear()} VRIX Architectural Fine Jewelry. All rights reserved.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    const transporter = await createSmtpTransporter();
    if (!transporter) {
      console.warn("[sendOrderConfirmationEmail] Transporter not available.");
      return false;
    }

    const apiSettings = await getApiSettings();
    const senderEmail = apiSettings?.nodemailerUser || process.env.SMTP_USER || "info@vrixjewels.com";

    const mailOptions = {
      from: `"VRIX Atelier" <${senderEmail}>`,
      to: userEmail,
      subject: `✨ VRIX Order Confirmation #${orderId}`,
      html: htmlTemplate,
    };

    return await sendEmailWithTimeout(transporter, mailOptions);
  } catch (err) {
    console.error("[sendOrderConfirmationEmail Error]:", err.message);
    return false;
  }
}
