import { db } from "../database.js";

// ─── Dynamic API Configuration Resolvers ──────────────────────────────────────

export async function getApiSettings() {
  try {
    const settings = await db.cmsSettings.findUnique({ where: { key: "api_settings" } });
    return settings || null;
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
  if (apiSettings && apiSettings.nodemailerEnabled) {
    if (apiSettings.nodemailerUser && apiSettings.nodemailerPass) {
      try {
        const nodemailer = await import("nodemailer");
        const port = parseInt(apiSettings.nodemailerPort || "465");
        const defaultHost = apiSettings.nodemailerUser.toLowerCase().includes("gmail.com") ? "smtp.gmail.com" : "smtp.hostinger.com";
        const host = apiSettings.nodemailerHost || defaultHost;
        return nodemailer.default.createTransport({
          host: host,
          port: port,
          secure: port === 465,
          auth: { user: apiSettings.nodemailerUser, pass: apiSettings.nodemailerPass },
          connectionTimeout: 8000,
          greetingTimeout: 8000,
          socketTimeout: 8000,
        });
      } catch (err) {
        console.warn("Nodemailer: Dynamic configuration failed, using fallback.", err.message);
      }
    }
  }

  // Fallback to process.env
  const user = process.env.SMTP_USER || "info@vrixjewels.com";
  const pass = process.env.SMTP_PASS || "wy0l-usan-vdb8-jruv";
  if (user && pass && pass !== "YourAppPasswordHere") {
    try {
      const nodemailer = await import("nodemailer");
      const port = parseInt(process.env.SMTP_PORT || "465");
      const defaultHost = user.toLowerCase().includes("gmail.com") ? "smtp.gmail.com" : "smtp.hostinger.com";
      const host = process.env.SMTP_HOST || defaultHost;
      return nodemailer.default.createTransport({
        host: host,
        port: port,
        secure: port === 465,
        auth: { user, pass },
        connectionTimeout: 8000,
        greetingTimeout: 8000,
        socketTimeout: 8000,
      });
    } catch (err) {
      console.warn("Nodemailer: fallback env config failed.", err.message);
    }
  }
  return null;
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

export async function getGoogleConfig() {
  const apiSettings = await getApiSettings();
  if (apiSettings) {
    return {
      enabled: apiSettings.googleEnabled !== false,
      clientId: apiSettings.googleClientId || process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: apiSettings.googleClientSecret || process.env.GOOGLE_CLIENT_SECRET || "",
      callbackUrl: apiSettings.googleCallbackUrl || process.env.GOOGLE_CALLBACK_URL || defaultCallback,
    };
  }

  return {
    enabled: true,
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    callbackUrl: process.env.GOOGLE_CALLBACK_URL || defaultCallback,
  };
}

