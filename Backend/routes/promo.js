import express from "express";
import { db } from "../database.js";

const router = express.Router();

// POST /api/promo/verify — Validate a promo code at checkout
router.post("/verify", async (req, res) => {
  const { code, subtotal } = req.body;
  if (!code) return res.status(400).json({ error: "Code is required" });

  try {
    const promo = await db.redeemCodes.findUnique({ where: { code: code.toUpperCase() } });
    if (!promo) return res.status(404).json({ error: "Invalid promo code" });
    if (!promo.isActive) return res.status(400).json({ error: "Promo code is no longer active" });

    // Expiry Check
    if (promo.expiryDate) {
      const expiry = new Date(promo.expiryDate);
      expiry.setHours(23, 59, 59, 999);
      if (new Date() > expiry) {
        return res.status(400).json({ error: "Promo code has expired" });
      }
    }

    // Usage Limit Check
    if (promo.usageLimit !== undefined && promo.usageLimit !== null && promo.usageLimit > 0) {
      const used = promo.usedCount || 0;
      if (used >= promo.usageLimit) {
        return res.status(400).json({ error: "Promo code usage limit has been reached" });
      }
    }

    // Min Order Subtotal Check
    if (promo.minSubtotal !== undefined && promo.minSubtotal !== null && promo.minSubtotal > 0) {
      if (subtotal !== undefined && Number(subtotal) < Number(promo.minSubtotal)) {
        return res.status(400).json({ error: `Minimum order subtotal of ₹${promo.minSubtotal} required` });
      }
    }

    res.json({ 
      success: true, 
      code: promo.code, 
      discount: promo.discount, 
      type: promo.type,
      description: promo.description,
      minSubtotal: promo.minSubtotal,
      usageLimit: promo.usageLimit,
      expiryDate: promo.expiryDate
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/promo/codes — List all promo codes (admin)
router.get("/codes", async (req, res) => {
  try {
    res.json(await db.redeemCodes.findMany());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/promo/codes — Create a promo code (admin)
router.post("/codes", async (req, res) => {
  try {
    const { code, discount, type, description, minSubtotal, usageLimit, expiryDate } = req.body;
    if (!code || !discount || !type) return res.status(400).json({ error: "code, discount, and type are required" });
    const created = await db.redeemCodes.create({
      data: { 
        code: code.toUpperCase(), 
        discount: Number(discount), 
        type, 
        isActive: true,
        description: description || null,
        minSubtotal: minSubtotal ? Number(minSubtotal) : null,
        usageLimit: usageLimit ? Number(usageLimit) : null,
        usedCount: 0,
        expiryDate: expiryDate || null
      },
    });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/promo/codes/:code — Toggle active/inactive promo code (admin)
router.put("/codes/:code", async (req, res) => {
  try {
    const updated = await db.redeemCodes.update({
      where: { code: req.params.code.toUpperCase() },
      data: req.body,
    });
    res.json(updated);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// DELETE /api/promo/codes/:code — Delete promo code (admin)
router.delete("/codes/:code", async (req, res) => {
  try {
    await db.redeemCodes.delete({ where: { code: req.params.code.toUpperCase() } });
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

export default router;
