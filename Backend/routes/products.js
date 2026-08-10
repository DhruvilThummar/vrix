import express from "express";
import { db } from "../database.js";
import { adminAuth } from "../middleware/auth.js";
import { getTransporter, sendEmailWithTimeout } from "../config/apiResolvers.js";

const router = express.Router();

const slugify = (value = "") =>
  String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const normalizeProductData = (body = {}) => {
  const images = Array.isArray(body.images)
    ? body.images.filter((url) => typeof url === "string" && url.trim()).map((url) => url.trim())
    : [];
  const image = typeof body.image === "string" && body.image.trim()
    ? body.image.trim()
    : images[0] || "";

  const data = {
    title: typeof body.title === "string" ? body.title.trim() : body.title || "",
    material: typeof body.material === "string" ? body.material.trim() : body.material || "",
    type: typeof body.type === "string" ? body.type.trim() : body.type || "Jewelry",
    price: Number(body.price) || 0,
    originalPrice: body.originalPrice !== undefined && body.originalPrice !== null ? Number(body.originalPrice) || null : null,
    image,
    images: images.length ? Array.from(new Set([image, ...images].filter(Boolean))) : image ? [image] : [],
    description: typeof body.description === "string" ? body.description.trim() : body.description || "",
    alt: typeof body.alt === "string" ? body.alt.trim() : body.alt || "",
    sku: typeof body.sku === "string" ? body.sku.trim() : body.sku || "",
    collection: typeof body.collection === "string" && body.collection.trim() ? body.collection.trim() : "uncategorized",
    stock: body.stock === undefined ? 999 : Number(body.stock),
    isVisible: body.isVisible !== false,
    isVrixPlusExclusive: body.isVrixPlusExclusive === true,
    vrixPlusPrice: body.vrixPlusPrice !== undefined && body.vrixPlusPrice !== null ? Number(body.vrixPlusPrice) || null : null,
    layoutStyle: body.layoutStyle === "asymmetric" ? "asymmetric" : "2x2",
    weight: typeof body.weight === "string" ? body.weight.trim() : "",
    dimensions: typeof body.dimensions === "string" ? body.dimensions.trim() : "",
    availableSizes: Array.isArray(body.availableSizes) ? body.availableSizes : [],
    engravingOptions: body.engravingOptions || { enabled: false, limit: 25, price: 0 },
    giftNoteOptions: body.giftNoteOptions || { enabled: false, limit: 150, price: 0 },
    comparisonOptions: body.comparisonOptions || { worthIndex: 5, hardness: 5, shine: 5, styleRating: 5 },
    giftOptions: body.giftOptions || { wrappingPrice: 0, showCustomBox: false, packagingNote: "" },
    tags: Array.isArray(body.tags) ? body.tags : [],
  };

  if (body.id) data.id = body.id;
  return data;
};

const createUniqueProductId = async (title) => {
  const base = slugify(title) || `product-${Date.now()}`;
  let candidate = base;
  let suffix = 2;

  while (await db.products.exists({ where: { id: candidate } })) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
};

const notifyWishlistedCustomers = async (product, alertType = "restocked") => {
  const watchers = await db.$queryRawUnsafe('SELECT user_email FROM "wishlist_stock_alerts" WHERE product_id = $1', product.id);
  if (!watchers.length) return;
  const transporter = await getTransporter();
  if (!transporter) return;
  const productUrl = `${process.env.FRONTEND_URL || "https://vrixjewels.com"}/product/${encodeURIComponent(product.id)}`;
  await Promise.allSettled(watchers.map(async ({ user_email }) => {
    await sendEmailWithTimeout(transporter, {
      from: `"VRIX" <${process.env.SMTP_USER || "info@vrixjewels.com"}>`,
      to: user_email,
      subject: alertType === "low" ? `${product.title} is almost sold out` : `${product.title} is back in stock`,
      html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#0f1728"><h2>${alertType === "low" ? "Your wishlist item is almost sold out" : "Your wishlist item is available"}</h2><img src="${product.image}" alt="${product.title}" style="width:100%;max-width:320px;max-height:360px;object-fit:cover"/><h3>${product.title}</h3><p>${product.material || "VRIX fine jewelry"}</p><p style="font-size:18px;font-weight:bold">₹${Number(product.price).toLocaleString("en-IN")}</p><p>${alertType === "low" ? `Only ${product.stock} left — secure your piece before it sells out.` : "Good news — this piece is back in stock. Availability is limited."}</p><a href="${productUrl}" style="display:inline-block;padding:12px 18px;background:#0f1728;color:#fff;text-decoration:none">Shop now</a></div>`,
    }, 15000);
  }));
  await db.$executeRawUnsafe('UPDATE "wishlist_stock_alerts" SET last_notified_at = CURRENT_TIMESTAMP WHERE product_id = $1', product.id);
};

// Add or remove a product from the server-side wishlist watchlist.
router.post("/wishlist-alerts", async (req, res) => {
  const email = String(req.body.email || "").trim().toLowerCase();
  const productId = String(req.body.productId || "").trim();
  const enabled = req.body.enabled !== false;
  if (!email || !productId) return res.status(400).json({ error: "Email and productId are required" });
  try {
    if (enabled) {
      await db.$executeRawUnsafe('INSERT INTO "wishlist_stock_alerts" (user_email, product_id) VALUES ($1, $2) ON CONFLICT (user_email, product_id) DO NOTHING', email, productId);
    } else {
      await db.$executeRawUnsafe('DELETE FROM "wishlist_stock_alerts" WHERE user_email = $1 AND product_id = $2', email, productId);
    }
    res.json({ success: true, enabled });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST /api/products/validate-stock — Validate cart items against active stock
router.post("/validate-stock", async (req, res) => {
  const { items } = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: "items array is required" });

  try {
    const allProducts = await db.products.findMany();
    const outOfStockItems = [];

    for (const item of items) {
      const product = allProducts.find((p) => p.id === item.id);
      if (!product) {
        outOfStockItems.push({ id: item.id, title: item.title, reason: "Product no longer available" });
        continue;
      }
      if (product.isVisible === false) {
        outOfStockItems.push({ id: item.id, title: item.title, reason: "Product is currently unavailable" });
        continue;
      }
      const availableStock = product.stock ?? 999;
      if (availableStock < item.quantity) {
        outOfStockItems.push({
          id: item.id,
          title: item.title,
          requested: item.quantity,
          available: availableStock,
          reason: availableStock === 0 ? "Out of stock" : `Only ${availableStock} left in stock`
        });
      }
    }

    if (outOfStockItems.length > 0) {
      return res.status(400).json({
        success: false,
        error: "Some items in your cart are no longer available in the requested quantity.",
        outOfStockItems
      });
    }

    res.json({ success: true, message: "All items in stock" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products
router.get("/", async (req, res) => {
  try {
    const products = await db.products.findMany();
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id
router.get("/:id", async (req, res) => {
  try {
    const product = await db.products.findUnique({ where: { id: req.params.id } });
    if (!product) return res.status(404).json({ error: "Product not found" });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products
router.post("/", adminAuth, async (req, res) => {
  try {
    const data = normalizeProductData(req.body);
    if (!data.title) return res.status(400).json({ error: "Product title is required" });
    if (!data.image) return res.status(400).json({ error: "At least one product image is required" });
    if (Number.isNaN(data.price) || data.price < 0) return res.status(400).json({ error: "Valid product price is required" });

    if (!data.id) {
      data.id = await createUniqueProductId(data.title);
    } else if (await db.products.exists({ where: { id: data.id } })) {
      data.id = await createUniqueProductId(data.id);
    }

    const product = await db.products.create({ data });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:id
router.put("/:id", adminAuth, async (req, res) => {
  try {
    const existing = await db.products.findUnique({ where: { id: req.params.id } });
    const data = normalizeProductData(req.body);
    if (!data.title) return res.status(400).json({ error: "Product title is required" });
    if (!data.image) return res.status(400).json({ error: "At least one product image is required" });
    if (Number.isNaN(data.price) || data.price < 0) return res.status(400).json({ error: "Valid product price is required" });

    delete data.id;
    const updated = await db.products.update({ where: { id: req.params.id }, data });
    if ((existing?.stock || 0) <= 0 && (updated.stock || 0) > 0) notifyWishlistedCustomers(updated).catch((err) => console.error("Restock notification failed:", err.message));
    if ((existing?.stock || 0) > 3 && (updated.stock || 0) > 0 && (updated.stock || 0) <= 3) notifyWishlistedCustomers(updated, "low").catch((err) => console.error("Low-stock notification failed:", err.message));
    res.json(updated);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// DELETE /api/products/:id
router.delete("/:id", adminAuth, async (req, res) => {
  try {
    await db.products.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: `Product ${req.params.id} deleted` });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// PATCH /api/products/:id/stock
router.patch("/:id/stock", adminAuth, async (req, res) => {
  const { stock } = req.body;
  if (stock === undefined || isNaN(Number(stock))) return res.status(400).json({ error: "stock (number) is required" });
  try {
    const existing = await db.products.findUnique({ where: { id: req.params.id } });
    const updated = await db.products.update({ where: { id: req.params.id }, data: { stock: Number(stock) } });
    if ((existing?.stock || 0) <= 0 && updated.stock > 0) notifyWishlistedCustomers(updated).catch((err) => console.error("Restock notification failed:", err.message));
    if ((existing?.stock || 0) > 3 && updated.stock > 0 && updated.stock <= 3) notifyWishlistedCustomers(updated, "low").catch((err) => console.error("Low-stock notification failed:", err.message));
    res.json(updated);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// PATCH /api/products/:id/visibility
router.patch("/:id/visibility", adminAuth, async (req, res) => {
  const { isVisible } = req.body;
  if (isVisible === undefined) return res.status(400).json({ error: "isVisible (boolean) is required" });
  try {
    const updated = await db.products.update({ where: { id: req.params.id }, data: { isVisible: Boolean(isVisible) } });
    res.json(updated);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

export default router;
