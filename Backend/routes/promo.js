import express from "express";
import { db } from "../database.js";

const router = express.Router();

// POST /api/promo/verify — Validate a promo code at checkout
router.post("/verify", async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ error: "Code is required" });

  try {
    const promo = await db.redeemCodes.findUnique({ where: { code: code.toUpperCase() } });
    if (!promo) return res.status(404).json({ error: "Invalid promo code" });
    if (!promo.isActive) return res.status(400).json({ error: "Promo code is no longer active" });

    res.json({ success: true, code: promo.code, discount: promo.discount, type: promo.type });
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
    const { code, discount, type } = req.body;
    if (!code || !discount || !type) return res.status(400).json({ error: "code, discount, and type are required" });
    const created = await db.redeemCodes.create({
      data: { code: code.toUpperCase(), discount: Number(discount), type, isActive: true },
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
