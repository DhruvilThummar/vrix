import crypto from "crypto";

/**
 * Utility function to verify standard HS256 JWT tokens using Node.js crypto
 * @param {string} token - JWT token string
 * @param {string} secret - JWT secret key
 */
export function verifyJwtToken(token, secret) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const [headerB64, payloadB64, signatureB64] = parts;
    const checkSig = crypto
      .createHmac("sha256", secret)
      .update(`${headerB64}.${payloadB64}`)
      .digest("base64url");

    if (signatureB64.length === checkSig.length && crypto.timingSafeEqual(Buffer.from(signatureB64), Buffer.from(checkSig))) {
      const payloadJson = Buffer.from(payloadB64, "base64url").toString("utf-8");
      return JSON.parse(payloadJson);
    }
    return null;
  } catch (err) {
    return null;
  }
}

/**
 * Production RBAC Admin Authentication Middleware (adminAuth)
 * 1. Verifies Bearer JWT Token or X-Admin-Secret
 * 2. Enforces req.user.role === 'ADMIN'
 * 3. Returns HTTP 403 Forbidden for non-admin users
 */
export const adminAuth = async (req, res, next) => {
  const jwtSecret = process.env.JWT_SECRET || process.env.ADMIN_SECRET || "vrix_jwt_secret_key";
  const authHeader = req.headers["authorization"] || req.headers["Authorization"];
  const adminSecretHeader = req.headers["x-admin-secret"] || req.headers["admin-secret"];

  // 1. Direct Admin Secret verification (for Admin CMS API access)
  const envAdminSecret = process.env.ADMIN_SECRET;
  if (envAdminSecret && adminSecretHeader === envAdminSecret) {
    req.user = { role: "ADMIN", email: "admin@vrix.com" };
    return next();
  }

  // 2. Extract Bearer JWT Token
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Access Denied: Missing or invalid Authorization header.",
      code: "UNAUTHORIZED",
    });
  }

  const token = authHeader.split(" ")[1];
  const decoded = verifyJwtToken(token, jwtSecret);

  if (!decoded) {
    return res.status(401).json({
      error: "Access Denied: Invalid or expired JWT token signature.",
      code: "INVALID_TOKEN",
    });
  }

  // Check token expiration
  if (decoded.exp && Date.now() >= decoded.exp * 1000) {
    return res.status(401).json({
      error: "Access Denied: Token has expired. Please log in again.",
      code: "TOKEN_EXPIRED",
    });
  }

  // 3. Strict RBAC Enforcement: Ensure req.user.role === 'ADMIN'
  const userRole = String(decoded.role || "").toUpperCase();
  if (userRole !== "ADMIN") {
    return res.status(403).json({
      error: "Access Forbidden: Administrator privileges (ADMIN role) are required to perform this action.",
      code: "FORBIDDEN",
      requiredRole: "ADMIN",
      userRole: userRole || "USER",
    });
  }

  // Attach verified user payload to request
  req.user = {
    id: decoded.id || decoded.sub,
    email: decoded.email,
    role: "ADMIN",
  };

  next();
};

export default adminAuth;
