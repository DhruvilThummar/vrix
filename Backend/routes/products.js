import express from "express";
import { db } from "../database.js";

const router = express.Router();

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
    const data = req.body;
    if (!data.id) {
      data.id = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
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
    const updated = await db.products.update({ where: { id: req.params.id }, data: req.body });
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
