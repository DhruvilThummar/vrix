import express from "express";
import { db } from "../database.js";

const router = express.Router();

// GET /api/security/logs
router.get("/logs", async (req, res) => {
  try {
    res.json(await db.securityLogs.findMany());
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/security/logs
router.post("/logs", async (req, res) => {
  try {
    const log = await db.securityLogs.create({ data: req.body });
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
