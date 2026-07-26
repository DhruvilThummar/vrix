import express from "express";
import { db } from "../database.js";

const router = express.Router();

const normalizeStatus = (status = "") => String(status).trim().toUpperCase();
const getAmount = (payment = {}) => Number(payment.amount || 0);

// GET /api/admin/users
router.get("/users", async (req, res) => {
  try {
    res.json(await db.users.findMany());
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
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/stats
router.get("/stats", async (req, res) => {
  try {
    const products = await db.products.findMany();
    const payments = await db.payments.findMany();
    const promoCount = await db.redeemCodes.count();

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

export default router;
