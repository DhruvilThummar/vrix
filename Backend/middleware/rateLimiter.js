import rateLimit from "express-rate-limit";

// ══════════════════════════════════════════════════════════════════════════════
//  VRIX Rate Limiting Architecture (express-rate-limit)
// ══════════════════════════════════════════════════════════════════════════════

/**
 * 1. Global Rate Limiter: Applied to all /api/ routes
 * Limits each IP to 100 requests per 15 minutes
 */
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
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
 * 2. Strict Rate Limiter: Applied to sensitive payment & auth endpoints
 * Limits each IP to 5 requests per 1 minute to prevent automated abuse & carding attacks
 */
export const strictPaymentLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Too many payment attempts detected. Please wait 60 seconds before retrying.",
    code: "STRICT_PAYMENT_RATE_LIMIT_EXCEEDED",
    retryAfterSeconds: 60,
  },
  handler: (req, res, next, options) => {
    res.status(429).json(options.message);
  },
});
