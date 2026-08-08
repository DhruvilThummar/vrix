import express from "express";
import { db } from "../database.js";
import { adminAuth } from "../middleware/auth.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// Fallback / Initial Seed Data if DB is clean
const DEFAULT_BESPOKE_SETTINGS = {
  id: "default",
  headline: "Bespoke Atelier Estimate",
  slogan: "THE SIGNATURE COLLECTION",
  subtitle: "Crafted to your exact specifications. Begin building your legacy piece.",
  introParagraph: "Our master goldsmiths work directly with you in our atelier to craft bespoke, made-to-order creations.",
  disclaimerText: "Final quote verified during 1-on-1 consultation with our lead master craftsman.",
  consultationCtaText: "Book Atelier Consultation",
  craftingTimeline: "3 – 4 Weeks",
  baseMinPrice: 65000,
  baseMaxPrice: 180000,
  isEnabled: true,
};

const DEFAULT_METALS = [
  {
    id: "metal-1",
    category: "metal",
    name: "18K Yellow Gold",
    code: "18K_YELLOW_GOLD",
    colorHex: "#E6C762",
    imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=800&auto=format&fit=crop",
    priceMultiplier: 1.0,
    sortOrder: 1,
    isEnabled: true
  },
  {
    id: "metal-2",
    category: "metal",
    name: "18K White Gold",
    code: "18K_WHITE_GOLD",
    colorHex: "#E1E1E1",
    imageUrl: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?q=80&w=800&auto=format&fit=crop",
    priceMultiplier: 1.05,
    sortOrder: 2,
    isEnabled: true
  },
  {
    id: "metal-3",
    category: "metal",
    name: "18K Rose Gold",
    code: "18K_ROSE_GOLD",
    colorHex: "#E8B2A1",
    imageUrl: "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?q=80&w=800&auto=format&fit=crop",
    priceMultiplier: 1.02,
    sortOrder: 3,
    isEnabled: true
  },
  {
    id: "metal-4",
    category: "metal",
    name: "950 Platinum",
    code: "950_PLATINUM",
    colorHex: "#D1D3D4",
    imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=800&auto=format&fit=crop",
    priceMultiplier: 1.25,
    sortOrder: 4,
    isEnabled: true
  }
];

const DEFAULT_SILHOUETTES = [
  {
    id: "sil-1",
    category: "silhouette",
    name: "Solitaire Ring",
    code: "SOLITAIRE_RING",
    imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=800&auto=format&fit=crop",
    priceMultiplier: 1.0,
    sortOrder: 1,
    isEnabled: true
  },
  {
    id: "sil-2",
    category: "silhouette",
    name: "Pendant Necklace",
    code: "PENDANT_NECKLACE",
    imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?q=80&w=800&auto=format&fit=crop",
    priceMultiplier: 1.35,
    sortOrder: 2,
    isEnabled: true
  },
  {
    id: "sil-3",
    category: "silhouette",
    name: "Drop Earrings",
    code: "DROP_EARRINGS",
    imageUrl: "https://images.unsplash.com/photo-1635767798638-3e25273a8236?q=80&w=800&auto=format&fit=crop",
    priceMultiplier: 1.2,
    sortOrder: 3,
    isEnabled: true
  },
  {
    id: "sil-4",
    category: "silhouette",
    name: "Tennis Bracelet",
    code: "TENNIS_BRACELET",
    imageUrl: "https://images.unsplash.com/photo-1611591475281-8d2813298ca8?q=80&w=800&auto=format&fit=crop",
    priceMultiplier: 1.6,
    sortOrder: 4,
    isEnabled: true
  }
];

const DEFAULT_SHAPES = [
  { id: "shp-1", category: "stone_shape", name: "ROUND", code: "ROUND", imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=800&auto=format&fit=crop", priceMultiplier: 1.0, sortOrder: 1, isEnabled: true },
  { id: "shp-2", category: "stone_shape", name: "OVAL", code: "OVAL", imageUrl: "https://images.unsplash.com/photo-1603561591411-07134e71a2a9?q=80&w=800&auto=format&fit=crop", priceMultiplier: 1.1, sortOrder: 2, isEnabled: true },
  { id: "shp-3", category: "stone_shape", name: "EMERALD", code: "EMERALD", imageUrl: "https://images.unsplash.com/photo-1602751584552-8ba73aad10e1?q=80&w=800&auto=format&fit=crop", priceMultiplier: 1.15, sortOrder: 3, isEnabled: true },
  { id: "shp-4", category: "stone_shape", name: "PEAR", code: "PEAR", imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?q=80&w=800&auto=format&fit=crop", priceMultiplier: 1.12, sortOrder: 4, isEnabled: true }
];

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

    // Also check cmsSettings for legacy compatibility
    const cmsBespoke = await db.cmsSettings.findUnique({ where: { key: "bespoke_config" } }).catch(() => null);
    const legacyConfig = cmsBespoke?.value || {};

    if (!settings) {
      settings = {
        ...DEFAULT_BESPOKE_SETTINGS,
        headline: legacyConfig.title || DEFAULT_BESPOKE_SETTINGS.headline,
        slogan: legacyConfig.slogan || DEFAULT_BESPOKE_SETTINGS.slogan,
        subtitle: legacyConfig.subtitle || DEFAULT_BESPOKE_SETTINGS.subtitle,
        baseMinPrice: Number(legacyConfig.baseMinPrice || legacyConfig.basePrice || 65000),
        baseMaxPrice: Number(legacyConfig.baseMaxPrice || 180000),
      };
    }

    if (!options || options.length === 0) {
      options = [...DEFAULT_METALS, ...DEFAULT_SILHOUETTES, ...DEFAULT_SHAPES];
    }

    res.json({
      settings,
      options,
      variants,
      metals: options.filter(o => o.category === "metal"),
      silhouettes: options.filter(o => o.category === "silhouette"),
      shapes: options.filter(o => o.category === "stone_shape"),
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
