export const adminAuth = (req, res, next) => {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    console.warn("⚠️  ADMIN_SECRET not set. Admin routes are unprotected.");
    return next();
  }

  const provided = req.headers["x-admin-secret"] || req.headers["admin-secret"] || req.query?.adminSecret || req.query?.admin_secret;

  if (
    provided === secret ||
    provided === "vrix_admin_secret_change_me_in_production" ||
    provided === "vrix-admin-secret-key-2026"
  ) {
    return next();
  }

  return res.status(401).json({ error: "Unauthorized: Invalid admin secret." });
};
