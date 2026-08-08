import express from "express";
import { db } from "../database.js";
import { adminAuth } from "../middleware/auth.js";
import { randomUUID as uuidv4 } from "crypto";

const router = express.Router();

// GET /api/bespoke — Public endpoint to load complete Bespoke Atelier config
router.get("/", async (req, res) => {
  try {
    let settings = null;
    let options = [];
    let variants = [];

    if (db.bespokeSettings) {
      settings = await db.bespokeSettings.findUnique({ where: { id: "default" } }).catch(() => null);
    }
    if (db.bespokeOption) {
      options = await db.bespokeOption.findMany({ orderBy: { sortOrder: "asc" } }).catch(() => []);
    }
    if (db.bespokeVariant) {
      variants = await db.bespokeVariant.findMany({ where: { isAvailable: true } }).catch(() => []);
    }

    // Check cmsSettings for legacy compatibility if database table has not been configured
    const cmsBespoke = await db.cmsSettings.findUnique({ where: { key: "bespoke_config" } }).catch(() => null);
    const legacyConfig = cmsBespoke?.value || {};

    if (!settings) {
      settings = {
        id: "default",
        headline: legacyConfig.title || legacyConfig.headline || "Bespoke Atelier Estimate",
        slogan: legacyConfig.slogan || "THE SIGNATURE COLLECTION",
        subtitle: legacyConfig.subtitle || "Our Atelier custom commission service is currently busy.",
        introParagraph: legacyConfig.introParagraph || "Our master goldsmiths are currently busy crafting custom creations. Please check back later.",
        disclaimerText: legacyConfig.disclaimerText || "Final quote verified during 1-on-1 consultation.",
        consultationCtaText: legacyConfig.consultationCtaText || "Book Atelier Consultation",
        craftingTimeline: legacyConfig.craftingTimeline || "3 – 4 Weeks",
        baseMinPrice: Number(legacyConfig.baseMinPrice || legacyConfig.basePrice || 65000),
        baseMaxPrice: Number(legacyConfig.baseMaxPrice || 180000),
        isEnabled: legacyConfig.isEnabled !== undefined ? legacyConfig.isEnabled : true,
      };
    }

    const isBusy = options.length === 0;

    res.json({
      settings,
      options,
      variants,
      metals: options.filter(o => o.category === "metal"),
      silhouettes: options.filter(o => o.category === "silhouette"),
      shapes: options.filter(o => o.category === "stone_shape"),
      isBusy,
      busyMessage: isBusy ? "Our Bespoke Atelier is currently busy. Please check back later." : null,
    });
  } catch (err) {
    console.error("GET /api/bespoke error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bespoke/settings — Admin endpoint to update Bespoke Atelier copy, timeline & pricing
router.post("/settings", adminAuth, async (req, res) => {
  try {
    const {
      headline,
      slogan,
      subtitle,
      introParagraph,
      disclaimerText,
      consultationCtaText,
      craftingTimeline,
      baseMinPrice,
      baseMaxPrice,
      isEnabled,
    } = req.body;

    const data = {
      headline: headline || "Bespoke Atelier Estimate",
      slogan: slogan || "THE SIGNATURE COLLECTION",
      subtitle: subtitle || "",
      introParagraph: introParagraph || "Our master goldsmiths work directly with you in our atelier to craft bespoke, made-to-order creations.",
      disclaimerText: disclaimerText || "Final quote verified during 1-on-1 consultation with our lead master craftsman.",
      consultationCtaText: consultationCtaText || "Book Atelier Consultation",
      craftingTimeline: craftingTimeline || "3 – 4 Weeks",
      baseMinPrice: Number(baseMinPrice || 65000),
      baseMaxPrice: Number(baseMaxPrice || 180000),
      isEnabled: isEnabled !== false,
    };

    let updated;
    if (db.bespokeSettings) {
      updated = await db.bespokeSettings.upsert({
        where: { id: "default" },
        update: data,
        create: { id: "default", ...data },
      });
    }

    // Also update cms_settings table for global fallback sync
    await db.cmsSettings.upsert({
      where: { key: "bespoke_config" },
      update: { value: { ...data, basePrice: data.baseMinPrice } },
      create: { key: "bespoke_config", value: { ...data, basePrice: data.baseMinPrice } },
    }).catch(() => {});

    res.json({ success: true, settings: updated || data });
  } catch (err) {
    console.error("POST /api/bespoke/settings error:", err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bespoke/options — Admin endpoint to Add or Update option attribute
router.post("/options", adminAuth, async (req, res) => {
  try {
    const { id, category, name, code, colorHex, imageUrl, priceMultiplier, priceAddition, sortOrder, isEnabled } = req.body;

    if (!category || !name) {
      return res.status(400).json({ error: "Category and Name are required" });
    }

    // Enforce strict image validation rule
    if (!imageUrl || !imageUrl.trim()) {
      return res.status(400).json({ error: "Image URL is strictly required. Please upload or specify an image URL." });
    }

    const payload = {
      category,
      name,
      code: code || name.toUpperCase().replace(/\s+/g, "_"),
      colorHex: colorHex || null,
      imageUrl: imageUrl.trim(),
      priceMultiplier: Number(priceMultiplier || 1.0),
      priceAddition: Number(priceAddition || 0),
      sortOrder: Number(sortOrder || 0),
      isEnabled: isEnabled !== false,
    };

    let result;
    if (db.bespokeOption) {
      if (id) {
        result = await db.bespokeOption.update({
          where: { id },
          data: payload,
        });
      } else {
        result = await db.bespokeOption.create({
          data: { id: uuidv4(), ...payload },
        });
      }
    } else {
      result = { id: id || uuidv4(), ...payload };
    }

    res.json({ success: true, option: result });
  } catch (err) {
    console.error("POST /api/bespoke/options error:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/bespoke/options/:id — Admin endpoint to delete an option attribute
router.delete("/options/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (db.bespokeOption) {
      await db.bespokeOption.delete({ where: { id } }).catch(() => {});
    }
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bespoke/variants — Admin endpoint to map specific combination render image
router.post("/variants", adminAuth, async (req, res) => {
  try {
    const { id, silhouette, metal, stoneShape, imageUrl, priceModifier, isAvailable } = req.body;

    if (!silhouette || !metal) {
      return res.status(400).json({ error: "Silhouette and Metal are required to map a variant render." });
    }

    if (!imageUrl || !imageUrl.trim()) {
      return res.status(400).json({ error: "High-resolution Image URL is required for variant render mapping." });
    }

    const payload = {
      silhouette,
      metal,
      stoneShape: stoneShape || null,
      imageUrl: imageUrl.trim(),
      priceModifier: Number(priceModifier || 1.0),
      isAvailable: isAvailable !== false,
    };

    let result;
    if (db.bespokeVariant) {
      if (id) {
        result = await db.bespokeVariant.update({
          where: { id },
          data: payload,
        });
      } else {
        // Try finding existing mapping by unique composite or create new
        const existing = await db.bespokeVariant.findFirst({
          where: { silhouette, metal, stoneShape: stoneShape || null }
        }).catch(() => null);

        if (existing) {
          result = await db.bespokeVariant.update({
            where: { id: existing.id },
            data: payload,
          });
        } else {
          result = await db.bespokeVariant.create({
            data: { id: uuidv4(), ...payload },
          });
        }
      }
    } else {
      result = { id: id || uuidv4(), ...payload };
    }

    res.json({ success: true, variant: result });
  } catch (err) {
    console.error("POST /api/bespoke/variants error:", err);
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/bespoke/variants/:id — Admin endpoint to delete a variant mapping
router.delete("/variants/:id", adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    if (db.bespokeVariant) {
      await db.bespokeVariant.delete({ where: { id } }).catch(() => {});
    }
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
