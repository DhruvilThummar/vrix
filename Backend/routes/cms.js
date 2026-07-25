import express from "express";
import { db } from "../database.js";

const router = express.Router();

// GET /api/db — Full DB snapshot (for admin CMS editor — includes api_settings)
router.get("/db", async (req, res) => {
  try {
    const cms = await db.cmsSettings.findMany();
    const products = await db.products.findMany();
    const journal = await db.journal.findMany();
    res.json({ ...cms, products, journal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/db/public — Public DB snapshot (strips sensitive api_settings)
router.get("/db/public", async (req, res) => {
  try {
    const cms = await db.cmsSettings.findMany();
    const products = await db.products.findMany();
    const journal = await db.journal.findMany();
    // Strip api_settings to prevent secret key exposure to public shop pages
    const { api_settings, ...publicCms } = cms;
    res.json({ ...publicCms, products, journal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cms — Upsert any CMS section
router.post("/cms", async (req, res) => {
  try {
    const sections = [
      "homepage", "story", "legal", "navigation", "brand", "features",
      "collections", "api_settings", "vrix_plus", "announcement_bar",
      "currency_settings", "shipping_settings", "gift_wrapping", "metal_types",
      "custom_pages"
    ];
    for (const section of sections) {
      if (req.body[section] !== undefined) {
        await db.cmsSettings.upsert({
          where: { key: section },
          update: { value: req.body[section] },
          create: { key: section, value: req.body[section] },
        });
      }
    }
    const updated = await db.cmsSettings.findMany();
    res.json({ success: true, db: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/config — Fetch all CMS settings
router.get("/config", async (req, res) => {
  try {
    const all = await db.cmsSettings.findMany();
    res.json(all);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/config/:key — Upsert a specific CMS key
router.post("/config/:key", async (req, res) => {
  const { key } = req.params;
  const { value } = req.body;
  if (value === undefined) return res.status(400).json({ error: "value is required" });
  try {
    await db.cmsSettings.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    });
    res.json({ success: true, key, value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
