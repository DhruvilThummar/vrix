import { db } from "../database.js";

const defaultCallback = process.env.GOOGLE_CALLBACK_URL || "https://snvifoikeixkgrdkgyme.supabase.co/auth/v1/callback";

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
  const apiSettings = await getApiSettings();
  
  let user = "";
  let pass = "";
  let host = "";
  let port = 465;

  if (apiSettings && apiSettings.nodemailerEnabled && apiSettings.nodemailerUser && apiSettings.nodemailerPass) {
    user = String(apiSettings.nodemailerUser).trim();
    pass = String(apiSettings.nodemailerPass).trim();
    host = String(apiSettings.nodemailerHost).trim();
    port = parseInt(apiSettings.nodemailerPort);
  } else {
    user = String(process.env.SMTP_USER).trim();
    pass = String(process.env.SMTP_PASS).trim();
    host = String(process.env.SMTP_HOST).trim();
    port = parseInt(process.env.SMTP_PORT);
  }

  if (!user || !pass || pass === "YourAppPasswordHere") {
    return null;
  }

  const passClean = pass.replace(/\s+/g, "").replace(/-/g, "");
  const isGoogleAppPass = passClean.length === 16;
  const isGmailUser = user.toLowerCase().endsWith("@gmail.com");

  try {
    const nodemailer = await import("nodemailer");

    if (host === "smtp.gmail.com" || isGmailUser) {
      console.log(`[SMTP CONFIG] Transport: Gmail Service for ${user}`);
      return nodemailer.default.createTransport({
        service: "gmail",
        auth: { user, pass },
        tls: { rejectUnauthorized: false },
        connectionTimeout: 15000,
      });
    }

    console.log(`[SMTP CONFIG] Transport: ${host}:${port} for ${user}`);
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

export async function sendEmailWithTimeout(activeTransporter, mailOptions, timeoutMs = 10000) {
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

export async function getTruecallerConfig() {
  const apiSettings = await getApiSettings();
  if (apiSettings) {
    return {
      enabled: !!apiSettings.truecallerEnabled,
      sandbox: !!apiSettings.truecallerSandboxMode,
      partnerKey: apiSettings.truecallerPartnerKey || process.env.TRUECALLER_PARTNER_KEY || "",
      appId: apiSettings.truecallerAppId || process.env.TRUECALLER_APP_ID || "",
    };
  }

  // Fallback to process.env
  const partnerKey = process.env.TRUECALLER_PARTNER_KEY || "";
  const appId = process.env.TRUECALLER_APP_ID || "";
  const enabled = !!(partnerKey && appId);
  const sandbox = process.env.TRUECALLER_SANDBOX_MODE === "true" || !enabled;
  return {
    enabled: enabled || sandbox, // Allow sandbox even if real keys are empty
    sandbox,
    partnerKey,
    appId,
  };
}

