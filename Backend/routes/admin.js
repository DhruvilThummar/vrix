import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import { db } from "../database.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// GET /api/admin/users
router.get("/users", async (req, res) => {
  try {
    res.json(await db.users.findMany());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/stats
router.get("/stats", async (req, res) => {
  try {
    const products = await db.products.findMany();
    const payments = await db.payments.findMany();
    const promoData = await (async () => {
      if (db.isConnected()) {
        const { PrismaClient } = await import("@prisma/client");
        const p = new PrismaClient();
        return p.redeemCode.count();
      } else {
        const { readFileSync } = await import("fs");
        const raw = readFileSync(path.join(__dirname, "..", "data", "db.json"), "utf8");
        const local = JSON.parse(raw);
        return (local.redeemCodes || []).length;
      }
    })();

    const totalRevenue = payments
      .filter((p) => p.status === "SUCCESS" || p.status === "DELIVERED")
      .reduce((acc, p) => acc + (p.amount || 0), 0);

    const pending = payments.filter((p) => p.status === "CREATED" || p.status === "SUCCESS").length;
    const delivered = payments.filter((p) => p.status === "DELIVERED").length;
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
      totalPromoCodes: promoData,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
