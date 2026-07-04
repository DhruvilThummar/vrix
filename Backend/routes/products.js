import express from "express";
import { db } from "../database.js";

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

  return {
    ...body,
    title: typeof body.title === "string" ? body.title.trim() : body.title,
    image,
    images: images.length ? Array.from(new Set([image, ...images].filter(Boolean))) : image ? [image] : [],
    price: Number(body.price),
    stock: body.stock === undefined ? 999 : Number(body.stock),
    isVisible: body.isVisible !== false,
  };
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
router.post("/", async (req, res) => {
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
router.put("/:id", async (req, res) => {
  try {
    const data = normalizeProductData(req.body);
    if (!data.title) return res.status(400).json({ error: "Product title is required" });
    if (!data.image) return res.status(400).json({ error: "At least one product image is required" });
    if (Number.isNaN(data.price) || data.price < 0) return res.status(400).json({ error: "Valid product price is required" });

    delete data.id;
    const updated = await db.products.update({ where: { id: req.params.id }, data });
    res.json(updated);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// DELETE /api/products/:id
router.delete("/:id", async (req, res) => {
  try {
    await db.products.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: `Product ${req.params.id} deleted` });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// PATCH /api/products/:id/stock
router.patch("/:id/stock", async (req, res) => {
  const { stock } = req.body;
  if (stock === undefined || isNaN(Number(stock))) return res.status(400).json({ error: "stock (number) is required" });
  try {
    const updated = await db.products.update({ where: { id: req.params.id }, data: { stock: Number(stock) } });
    res.json(updated);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// PATCH /api/products/:id/visibility
router.patch("/:id/visibility", async (req, res) => {
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
