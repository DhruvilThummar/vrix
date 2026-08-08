import express from "express";
import { db } from "../database.js";
import { adminAuth } from "../middleware/auth.js";

const router = express.Router();

// GET /api/categories — Public: returns only visible categories
router.get("/", async (req, res) => {
  try {
    const data = await db.cmsSettings.findUnique({ where: { key: "categories" } });
    const categories = Array.isArray(data?.value) ? data.value : [];
    res.json(categories.filter((cat) => cat.isVisible !== false));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/categories/all — Admin: returns all categories including hidden
router.get("/all", async (req, res) => {
  try {
    const data = await db.cmsSettings.findUnique({ where: { key: "categories" } });
    res.json(Array.isArray(data?.value) ? data.value : []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/categories — Admin: replace entire categories array
router.put("/", adminAuth, async (req, res) => {
  const { categories } = req.body;
  if (!Array.isArray(categories)) {
    return res.status(400).json({ error: "categories array required" });
  }
  try {
    await db.cmsSettings.upsert({
      where: { key: "categories" },
      update: { value: categories },
      create: { key: "categories", value: categories },
    });
    res.json({ success: true, categories });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
