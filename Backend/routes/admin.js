import express from "express";
import { db } from "../database.js";

const router = express.Router();

const normalizeStatus = (status = "") => String(status).trim().toUpperCase();
const getAmount = (payment = {}) => Number(payment.amount || 0);

// GET /api/admin/users
router.get("/users", async (req, res) => {
  try {
    const [users, payments, carts, wishlists] = await Promise.all([
      db.users.findMany(),
      db.payments.findMany().catch(() => []),
      (db.carts?.findMany().catch(() => []) || Promise.resolve([])),
      (db.wishlists?.findMany().catch(() => []) || Promise.resolve([]))
    ]);

    const enriched = users.map((u) => {
      const cleanEmail = String(u.email || "").trim().toLowerCase();

      // Total lifetime spending from successful payments
      const userPayments = payments.filter(
        (p) =>
          String(p.userEmail || p.email || "").trim().toLowerCase() === cleanEmail &&
          ["SUCCESS", "DELIVERED", "PAID"].includes(normalizeStatus(p.status))
      );
      const totalBuying = userPayments.reduce((sum, p) => sum + getAmount(p), 0);

      // Active cart & wishlist counts
      const userCart = carts.find((c) => String(c.userEmail || c.email || "").trim().toLowerCase() === cleanEmail);
      const userWishlist = wishlists.find((w) => String(w.userEmail || w.email || "").trim().toLowerCase() === cleanEmail);

      const cartItemsCount = Array.isArray(userCart?.items) ? userCart.items.reduce((sum, i) => sum + (i.quantity || 1), 0) : 0;
      const wishlistItemsCount = Array.isArray(userWishlist?.items) ? userWishlist.items.length : 0;

      const { password: _, ...safeUser } = u;
      return {
        ...safeUser,
        totalBuying,
        totalOrdersCount: userPayments.length,
        cartItemsCount,
        wishlistItemsCount,
        cartItems: userCart?.items || [],
        wishlistItems: userWishlist?.items || [],
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/admin/users/:email/vrix-plus
router.patch("/users/:email/vrix-plus", async (req, res) => {
  const { email } = req.params;
  const { isVrixPlusMember } = req.body;
  try {
    const cleanEmail = String(email).trim().toLowerCase();
    const today = new Date().toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });
    const user = await db.users.update({
      where: { email: cleanEmail },
      data: { 
        isVrixPlusMember: !!isVrixPlusMember, 
        vrixPlusJoinedDate: isVrixPlusMember ? today : null 
      }
    });

    if (isVrixPlusMember) {
      db.notifications.create({
        data: {
          type: "VRIX_PLUS_JOINED",
          title: "🎉 VRIX+ Member Joined",
          message: `🎉 ${user.name || user.email} just became a VRIX+ Member (via Admin Panel)`,
          userEmail: user.email
        }
      }).catch(e => console.warn("Failed to create VRIX+ join notification:", e.message));
    }

    res.json({ success: true, user });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/stats
router.get("/stats", async (req, res) => {
  try {
    const [products, payments, promoCount] = await Promise.all([
      db.products.findMany(),
      db.payments.findMany(),
      db.redeemCodes.count()
    ]);

    const totalRevenue = payments
      .filter((p) => ["SUCCESS", "DELIVERED", "PAID"].includes(normalizeStatus(p.status)))
      .reduce((acc, p) => acc + getAmount(p), 0);

    const pending = payments.filter((p) => ["CREATED", "PENDING", "SUCCESS", "PAID"].includes(normalizeStatus(p.status))).length;
    const delivered = payments.filter((p) => normalizeStatus(p.status) === "DELIVERED").length;
    const outOfStock = products.filter((p) => (p.stock ?? 999) === 0).length;
    const hidden = products.filter((p) => p.isVisible === false).length;

    res.json({
      totalProducts: products.length,
      totalOrders: payments.length,
      totalRevenue,
      pendingOrders: pending,
      deliveredOrders: delivered,
      outOfStock,
      hiddenProducts: hidden,
      totalPromoCodes: promoCount,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/admin/update-credentials
import crypto from "crypto";
router.post("/update-credentials", async (req, res) => {
  const { oldEmail, newEmail, newPassword } = req.body;
  if (!oldEmail || !newEmail) {
    return res.status(400).json({ error: "Current email and new email are required." });
  }

  try {
    const cleanOld = String(oldEmail).trim().toLowerCase();
    const cleanNew = String(newEmail).trim().toLowerCase();

    const existing = await db.users.findUnique({ where: { email: cleanOld } });
    if (!existing) {
      return res.status(404).json({ error: "Admin user not found." });
    }

    const updateData = { email: cleanNew };
    if (newPassword && newPassword.trim()) {
      updateData.password = crypto.createHash("sha256").update(newPassword.trim()).digest("hex");
    }

    await db.users.update({
      where: { email: cleanOld },
      data: updateData,
    });

    await db.cmsSettings.upsert({
      where: { key: "admin_email" },
      update: { value: cleanNew },
      create: { key: "admin_email", value: cleanNew },
    });

    res.json({ success: true, message: "Credentials updated successfully.", newEmail: cleanNew });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
