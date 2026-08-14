import express from "express";
import { db } from "../database.js";

const router = express.Router();

// GET /api/tags — Public: returns distinct tag slugs from real DB query
router.get("/", async (req, res) => {
  try {
    const products = await db.products.findMany();
    const tagSet = new Set();

    if (Array.isArray(products)) {
      products.forEach((p) => {
        if (p.isVisible !== false && Array.isArray(p.tags)) {
          p.tags.forEach((t) => {
            if (t && typeof t === "string") {
              const slug = t.trim().toLowerCase();
              if (slug) tagSet.add(slug);
            }
          });
        }
      });
    }

    const tags = Array.from(tagSet).sort();
    res.json(tags);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
