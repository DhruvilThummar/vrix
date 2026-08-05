import express from "express";
import { db } from "../database.js";
import { adminAuth } from "../middleware/auth.js";

const router = express.Router();

// GET /api/collections
router.get("/", async (req, res) => {
  try {
    const collectionsData = await db.cmsSettings.findUnique({ where: { key: "collections" } });
    const collections = Array.isArray(collectionsData) ? collectionsData : [];
    res.json(collections.filter((collection) => collection.isVisible !== false));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/collections/all — Full list from CMS setting
router.get("/all", async (req, res) => {
  try {
    const data = await db.cmsSettings.findUnique({ where: { key: "collections" } });
    res.json(Array.isArray(data) ? data : []);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/collections — Replace entire collections array
router.put("/", adminAuth, async (req, res) => {
  const { collections } = req.body;
  if (!Array.isArray(collections)) return res.status(400).json({ error: "collections array required" });
  try {
    await db.cmsSettings.upsert({
      where: { key: "collections" },
      update: { value: collections },
      create: { key: "collections", value: collections },
    });
    res.json({ success: true, collections });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
