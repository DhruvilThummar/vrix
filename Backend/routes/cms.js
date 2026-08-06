import express from "express";
import { db } from "../database.js";
import { adminAuth } from "../middleware/auth.js";

const router = express.Router();

// GET /api/db — DB snapshot (strips sensitive api_settings if not authenticated as admin)
router.get("/db", async (req, res) => {
  try {
    const [cms, products, journal] = await Promise.all([
      db.cmsSettings.findMany(),
      db.products.findMany(),
      db.journal.findMany()
    ]);

    const secret = process.env.ADMIN_SECRET;
    const provided = req.headers["x-admin-secret"] || req.headers["admin-secret"] || req.query.adminSecret || req.query.admin_secret;
    const isAdmin = !secret || provided === secret;

    if (isAdmin) {
      res.json({ ...cms, products, journal });
    } else {
      const { api_settings, ...publicCms } = cms;
      res.json({ ...publicCms, products, journal });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/db/public — Public DB snapshot (strips sensitive api_settings)
router.get("/db/public", async (req, res) => {
  try {
    const [cms, products, journal] = await Promise.all([
      db.cmsSettings.findMany(),
      db.products.findMany(),
      db.journal.findMany()
    ]);
    // Strip api_settings to prevent secret key exposure to public shop pages
    const { api_settings, ...publicCms } = cms;
    res.json({ ...publicCms, products, journal });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cms — Upsert any CMS section
router.post("/cms", adminAuth, async (req, res) => {
  try {
    const sections = [
      "homepage", "story", "legal", "navigation", "brand", "features",
      "collections", "api_settings", "vrix_plus", "announcement_bar",
      "currency_settings", "shipping_settings", "gift_wrapping", "metal_types",
      "custom_pages", "invoice_settings"
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
router.get("/config", adminAuth, async (req, res) => {
  try {
    const all = await db.cmsSettings.findMany();
    res.json(all);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/config/:key — Upsert a specific CMS key
router.post("/config/:key", adminAuth, async (req, res) => {
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

// GET /api/cms/gift-wrapping — Public endpoint for gift wrapping options
router.get("/cms/gift-wrapping", async (req, res) => {
  try {
    const setting = await db.cmsSettings.findUnique({ where: { key: "gift_wrapping" } });
    const defaultData = {
      isEnabled: true,
      title: "Signature Gift Packaging & Ribbon Card",
      price: 250,
      image: "https://images.unsplash.com/photo-1549465220-1a8b9238cd48?q=80&w=600&auto=format&fit=crop",
      description: "Delivered in signature luxury pouch, ribbon-wrapped box, and custom hand-written gift card.",
      giftOptions: []
    };
    res.json(setting?.value ? { ...defaultData, ...setting.value } : defaultData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cms/gift-wrapping — Admin endpoint to update gift wrapping configuration & gift options
router.post("/cms/gift-wrapping", adminAuth, async (req, res) => {
  try {
    const { isEnabled, title, price, image, description, giftOptions } = req.body;
    const value = {
      isEnabled: isEnabled !== false,
      title: title || "Signature Gift Packaging & Ribbon Card",
      price: Number(price || 250),
      image: image || "",
      description: description || "",
      giftOptions: Array.isArray(giftOptions) ? giftOptions : []
    };
    await db.cmsSettings.upsert({
      where: { key: "gift_wrapping" },
      update: { value },
      create: { key: "gift_wrapping", value }
    });
    res.json({ success: true, gift_wrapping: value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cms/announcement-bar — Public endpoint for announcement bar settings & links
router.get("/cms/announcement-bar", async (req, res) => {
  try {
    const setting = await db.cmsSettings.findUnique({ where: { key: "announcement_bar" } });
    const defaultData = {
      isEnabled: true,
      interval: 3000,
      backgroundColor: "#000000",
      textColor: "#ffffff",
      fontSize: "11px",
      lines: ["Complimentary Express Insured Shipping Worldwide", "Handcrafted Fine Jewelry & Bespoke Atelier"],
      actionText: "Shop Offers →",
      actionLink: "/offers"
    };
    res.json(setting?.value ? { ...defaultData, ...setting.value } : defaultData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/cms/announcement-bar — Admin endpoint to update announcement bar
router.post("/cms/announcement-bar", adminAuth, async (req, res) => {
  try {
    const { isEnabled, interval, backgroundColor, textColor, fontSize, lines, showLink, actionText, actionLink } = req.body;
    const value = {
      isEnabled: isEnabled !== false,
      interval: Number(interval || 3000),
      backgroundColor: backgroundColor || "#000000",
      textColor: textColor || "#ffffff",
      fontSize: fontSize || "11px",
      lines: Array.isArray(lines) ? lines : [],
      showLink: showLink !== false,
      actionText: actionText || "Shop Offers →",
      actionLink: actionLink || "/offers"
    };
    await db.cmsSettings.upsert({
      where: { key: "announcement_bar" },
      update: { value },
      create: { key: "announcement_bar", value }
    });
    res.json({ success: true, announcement_bar: value });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/cms/homepage — Public endpoint for homepage slides & layout configuration
router.get("/cms/homepage", async (req, res) => {
  try {
    const setting = await db.cmsSettings.findUnique({ where: { key: "homepage" } });
    res.json(setting?.value || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
