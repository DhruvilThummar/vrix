import express from "express";
import { db } from "../database.js";
import { adminAuth } from "../middleware/auth.js";

const router = express.Router();

// GET /api/notifications — Fetch latest 50 notifications
router.get("/", adminAuth, async (req, res) => {
  try {
    const list = await db.notifications.findMany({
      orderBy: { createdAt: "desc" },
      take: 50
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notifications/:id/read — Mark one as read
router.patch("/:id/read", adminAuth, async (req, res) => {
  try {
    const updated = await db.notifications.update({
      where: { id: req.params.id },
      data: { isRead: true }
    });
    res.json({ success: true, notification: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/notifications/read-all — Mark all as read
router.patch("/read-all", adminAuth, async (req, res) => {
  try {
    await db.notifications.updateMany({
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/notifications/clear — Clear all notifications
router.delete("/clear", adminAuth, async (req, res) => {
  try {
    await db.notifications.deleteMany();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
