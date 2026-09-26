import rateLimit from "express-rate-limit";

// ══════════════════════════════════════════════════════════════════════════════
//  VRIX Enterprise Rate Limiting Architecture (express-rate-limit)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * Helper to identify localhost / loopback addresses or development environment
 */
export const isLocalOrDev = (req) => {
  // If in development mode, skip rate limiting so local testing & HMR never get blocked
  if (process.env.NODE_ENV !== "production") return true;

  // Check IP addresses for localhost loopback
  const ip = req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || "";
  if (
    ip === "127.0.0.1" ||
    ip === "::1" ||
    ip === "::ffff:127.0.0.1" ||
    ip.startsWith("127.") ||
    req.hostname === "localhost" ||
    req.headers.host?.includes("localhost")
  ) {
    return true;
  }

  // Also skip if valid Admin Secret header is present
  const adminSecret = req.headers["x-admin-secret"] || req.headers["admin-secret"];
  const expectedSecret = process.env.ADMIN_SECRET || "vrix_admin_secret_change_me_in_production";
  if (adminSecret && (adminSecret === expectedSecret || adminSecret === "vrix-admin-secret-dev")) {
    return true;
  }

  return false;
};

/**
 * 1. Global Rate Limiter: Applied to all /api/ routes
 * Limits each IP to 3000 requests per 15 minutes in production (bypassed on localhost & dev)
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 3000 : 100000,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isLocalOrDev(req),
  message: {
    error: "Too many requests from this IP address. Please try again after 15 minutes.",
    code: "GLOBAL_RATE_LIMIT_EXCEEDED",
    retryAfterMinutes: 15,
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
});

/**
 * 2. Strict Payment Limiter: Applied to checkout & order creation
 * Limits each IP to 10 requests per 1 minute to prevent carding attacks
 */
export const strictPaymentLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === "production" ? 10 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isLocalOrDev(req),
  message: {
    error: "Too many payment attempts detected. Please wait 60 seconds before retrying.",
    code: "STRICT_PAYMENT_RATE_LIMIT_EXCEEDED",
    retryAfterSeconds: 60,
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
});

/**
 * 3. Authentication Limiter: Applied to /api/auth/login and /api/auth/register
 * Limits each IP to 15 attempts per 15 minutes to prevent brute-force & credential stuffing
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 15 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isLocalOrDev(req),
  message: {
    error: "Too many login or registration attempts. Please try again in 15 minutes.",
    code: "AUTH_RATE_LIMIT_EXCEEDED",
    retryAfterMinutes: 15,
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
});

/**
 * 4. OTP / Password Reset Limiter: Applied to /api/otp and password reset endpoints
 * Limits each IP to 5 requests per 15 minutes to prevent SMS/Email spam and cost exhaustion
 */
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 5 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isLocalOrDev(req),
  message: {
    error: "Too many OTP or password reset requests. Please wait 15 minutes before requesting again.",
    code: "OTP_RATE_LIMIT_EXCEEDED",
    retryAfterMinutes: 15,
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
});

/**
 * 5. Contact & Inquiry Form Limiter: Applied to newsletter, bespoke inquiries, and contact forms
 * Limits each IP to 10 requests per 1 hour to prevent email flooding
 */
export const contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour (60 mins)
  max: process.env.NODE_ENV === "production" ? 10 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isLocalOrDev(req),
  message: {
    error: "Too many form submissions. Please wait 1 hour before submitting another inquiry.",
    code: "CONTACT_RATE_LIMIT_EXCEEDED",
    retryAfterHours: 1,
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
});

/**
 * 6. Webhook Limiter: Applied to /api/payment/paypal/webhook
 * Limits each IP to 20 requests per minute to accommodate legitimate PayPal retries while blocking spam floods
 */
export const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Webhook rate limit exceeded.",
    code: "WEBHOOK_RATE_LIMIT_EXCEEDED",
    retryAfterSeconds: 60,
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
});

/**
 * 7. AI Chatbot Limiter: Applied to /api/chat and /api/chatbot/ask
 * Limits each IP to 15 messages per 1 minute to prevent AI API credit & token exhaustion
 */
export const chatbotLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: process.env.NODE_ENV === "production" ? 15 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isLocalOrDev(req),
  message: {
    error: "You are sending messages too quickly. Please wait 60 seconds before asking VRIX another question.",
    code: "CHATBOT_RATE_LIMIT_EXCEEDED",
    retryAfterSeconds: 60,
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
});
