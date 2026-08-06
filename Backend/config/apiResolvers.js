import { db } from "../database.js";

// ─── Dynamic API Configuration Resolvers ──────────────────────────────────────

export async function getApiSettings() {
  try {
    const settings = await db.cmsSettings.findUnique({ where: { key: "api_settings" } });
    if (!settings) return null;
    return settings.value && typeof settings.value === "object" ? settings.value : settings;
  } catch (err) {
    return null;
  }
}

export async function getCloudinary() {
  const apiSettings = await getApiSettings();
  if (apiSettings && apiSettings.cloudinaryEnabled) {
    if (apiSettings.cloudinaryCloudName && apiSettings.cloudinaryApiKey && apiSettings.cloudinaryApiSecret) {
      try {
        const { v2 } = await import("cloudinary");
        v2.config({
          cloud_name: apiSettings.cloudinaryCloudName,
          api_key: apiSettings.cloudinaryApiKey,
          api_secret: apiSettings.cloudinaryApiSecret,
        });
        return v2;
      } catch (err) {
        console.warn("Cloudinary: Dynamic configuration failed, using fallback.", err.message);
      }
    }
  }

  // Fallback to process.env
  if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    try {
      const { v2 } = await import("cloudinary");
      v2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
      });
      return v2;
    } catch (err) {
      console.warn("Cloudinary: fallback env config failed.", err.message);
    }
  }
  return null;
}

export async function getRazorpay() {
  const apiSettings = await getApiSettings();
  if (apiSettings && apiSettings.razorpayEnabled) {
    if (apiSettings.razorpayKeyId && apiSettings.razorpayKeySecret) {
      try {
        const { default: Razorpay } = await import("razorpay");
        return new Razorpay({ key_id: apiSettings.razorpayKeyId, key_secret: apiSettings.razorpayKeySecret });
      } catch (err) {
        console.warn("Razorpay: Dynamic configuration failed, using fallback.", err.message);
      }
    }
  }

  // Fallback to process.env
  if (process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    try {
      const { default: Razorpay } = await import("razorpay");
      return new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
    } catch (err) {
      console.warn("Razorpay: fallback env config failed.", err.message);
    }
  }
  return null;
}

export async function getTransporter() {
  const user = String(process.env.SMTP_USER || "info@vrixjewels.com").trim();
  const pass = String(process.env.SMTP_PASS || "").trim();
  const host = String(process.env.SMTP_HOST || "smtp.hostinger.com").trim();
  const port = parseInt(process.env.SMTP_PORT || "465");

  if (!user || !pass || pass === "YourAppPasswordHere") {
    return null;
  }

  try {
    const nodemailer = await import("nodemailer");

    if (host === "smtp.gmail.com" || user.toLowerCase().endsWith("@gmail.com")) {
      return nodemailer.default.createTransport({
        service: "gmail",
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 15000,
      });
    }

    return nodemailer.default.createTransport({
      host: host,
      port: port,
      secure: port === 465,
      auth: { user, pass },
      tls: { rejectUnauthorized: false },
      connectionTimeout: 15000,
      greetingTimeout: 15000,
      socketTimeout: 15000,
    });
  } catch (err) {
    console.warn("Nodemailer: Transporter creation failed.", err.message);
    return null;
  }
}

export async function sendEmailWithTimeout(activeTransporter, mailOptions, timeoutMs = 100000) {
  if (!activeTransporter) return false;
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      console.warn(`[SMTP] Email sending timed out after ${timeoutMs}ms. Falling back.`);
      resolve(false);
    }, timeoutMs);

    activeTransporter.sendMail(mailOptions)
      .then((info) => {
        clearTimeout(timer);
        console.log(`[SMTP SUCCESS] Email sent to ${mailOptions.to}`);
        resolve(info || true);
      })
      .catch(async (err) => {
        clearTimeout(timer);
        console.warn("[SMTP Primary Warning]:", err.message);

        // Auto-fallback: If primary authentication failed and password is a 16-char Google App Pass, retry via Gmail Service
        if (err.message.includes("535") || err.message.includes("authentication failed")) {
          try {
            const apiSettings = await getApiSettings();
            const pass = apiSettings?.nodemailerPass || process.env.SMTP_PASS || "";
            const passClean = pass.replace(/\s+/g, "").replace(/-/g, "");
            
            if (passClean.length === 16) {
              console.log("[SMTP FALLBACK] Retrying email via Gmail Service (App Password detected)...");
              const nodemailer = await import("nodemailer");
              const fallbackUser = process.env.ADMIN_EMAIL || "";
              const fallbackTransporter = nodemailer.default.createTransport({
                service: "gmail",
                auth: { user: fallbackUser, pass },
                tls: { rejectUnauthorized: false },
                connectionTimeout: 100000,
              });

              const fallbackOptions = { ...mailOptions, from: `"VRIX" <${fallbackUser}>` };
              const fallbackInfo = await fallbackTransporter.sendMail(fallbackOptions);
              console.log(`[SMTP FALLBACK SUCCESS] Email sent via Gmail fallback to ${mailOptions.to}`);
              return resolve(fallbackInfo || true);
            }
          } catch (fallbackErr) {
            console.warn("[SMTP FALLBACK ERROR]:", fallbackErr.message);
          }
        }

        resolve(false);
      });
  });
}


export async function getGoogleConfig() {
  const apiSettings = await getApiSettings();
  const defaultClientId = process.env.GOOGLE_CLIENT_ID;
  const defaultSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (apiSettings) {
    return {
      enabled: apiSettings.googleEnabled !== false,
      clientId: apiSettings.googleClientId || defaultClientId,
      clientSecret: apiSettings.googleClientSecret || defaultSecret,
    };
  }

  return {
    enabled: true,
    clientId: defaultClientId,
    clientSecret: defaultSecret,
  };
}


