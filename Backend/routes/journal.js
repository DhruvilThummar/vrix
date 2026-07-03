import express from "express";
import { db } from "../database.js";

const router = express.Router();

// GET /api/journal
router.get("/", async (req, res) => {
  try {
    res.json(await db.journal.findMany());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/journal
router.post("/", async (req, res) => {
  try {
    const data = req.body;
    if (!data.id) data.id = data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    if (!data.date) data.date = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
    const post = await db.journal.create({ data });
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/journal/:id
router.put("/:id", async (req, res) => {
  try {
    const updated = await db.journal.update({ where: { id: req.params.id }, data: req.body });
    res.json(updated);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

// DELETE /api/journal/:id
router.delete("/:id", async (req, res) => {
  try {
    await db.journal.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: `Article ${req.params.id} deleted` });
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
});

export default router;
