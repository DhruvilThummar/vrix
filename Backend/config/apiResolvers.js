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
        return nodemailer.default.createTransport({
          host: apiSettings.nodemailerHost || "smtp.gmail.com",
          port: parseInt(apiSettings.nodemailerPort || "587"),
          secure: false,
          auth: { user: apiSettings.nodemailerUser, pass: apiSettings.nodemailerPass },
        });
      } catch (err) {
        console.warn("Nodemailer: Dynamic configuration failed, using fallback.", err.message);
      }
    }
  }

  // Fallback to process.env
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const nodemailer = await import("nodemailer");
      return nodemailer.default.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
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
