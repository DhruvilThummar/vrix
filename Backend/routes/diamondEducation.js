import express from "express";
import { db } from "../database.js";
import { adminAuth } from "../middleware/auth.js";

const router = express.Router();

// Helper to generate URL-safe slugs
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^\w\-]+/g, "")
    .replace(/\-\-+/g, "-");
}

// ── Public List Endpoint ───────────────────────────────────────────────────
// GET /api/diamond-education — Public published articles
router.get("/", async (req, res) => {
  try {
    const articles = await db.diamondEducation.findMany({
      where: { isPublished: true },
      orderBy: { createdAt: "desc" }
    });

    res.json({
      success: true,
      articles: articles || []
    });
  } catch (err) {
    console.error("Fetch diamond education error:", err);
    res.status(500).json({ error: "Failed to fetch diamond education articles." });
  }
});

// ── Admin Endpoints (Protected by adminAuth Middleware) ────────────────────
// GET /api/diamond-education/admin/list — Admin list all articles (published & drafts)
router.get("/admin/list", adminAuth, async (req, res) => {
  try {
    const articles = await db.diamondEducation.findMany({
      orderBy: { createdAt: "desc" }
    });

    res.json({
      success: true,
      articles: articles || []
    });
  } catch (err) {
    console.error("Admin fetch diamond education error:", err);
    res.status(500).json({ error: "Failed to load admin diamond education list." });
  }
});

// POST /api/diamond-education/admin/create — Create new article
router.post("/admin/create", adminAuth, async (req, res) => {
  const { title, category, content, summary, tags, isPublished, slug: customSlug } = req.body || {};

  if (!title || !content) {
    return res.status(400).json({ error: "Title and Content are required fields." });
  }

  const baseSlug = slugify(customSlug || title) || "diamond-guide";
  const slug = `${baseSlug}-${Date.now().toString(36)}`;

  try {
    const article = await db.diamondEducation.create({
      data: {
        title: title.trim(),
        slug,
        category: category || "4Cs",
        content: content.trim(),
        summary: summary ? summary.trim() : undefined,
        tags: Array.isArray(tags) ? tags : [],
        isPublished: isPublished !== false
      }
    });

    res.status(201).json({
      success: true,
      message: "Diamond Education article created successfully.",
      article
    });
  } catch (err) {
    console.error("Create diamond education article error:", err);
    res.status(500).json({ error: "Failed to create diamond education article." });
  }
});

// PUT /api/diamond-education/admin/update/:id — Update article
router.put("/admin/update/:id", adminAuth, async (req, res) => {
  const { title, category, content, summary, tags, isPublished } = req.body || {};
  const { id } = req.params;

  try {
    const updateData = {};
    if (title !== undefined) {
      updateData.title = title.trim();
      updateData.slug = slugify(title) + "-" + id.slice(-4);
    }
    if (category !== undefined) updateData.category = category;
    if (content !== undefined) updateData.content = content.trim();
    if (summary !== undefined) updateData.summary = summary ? summary.trim() : null;
    if (tags !== undefined) updateData.tags = tags;
    if (isPublished !== undefined) updateData.isPublished = Boolean(isPublished);

    const article = await db.diamondEducation.update({
      where: { id },
      data: updateData
    });

    res.json({
      success: true,
      message: "Diamond Education article updated successfully.",
      article
    });
  } catch (err) {
    console.error("Update diamond education article error:", err);
    res.status(500).json({ error: "Failed to update diamond education article." });
  }
});

// DELETE /api/diamond-education/admin/delete/:id — Delete article
router.delete("/admin/delete/:id", adminAuth, async (req, res) => {
  const { id } = req.params;

  try {
    await db.diamondEducation.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: "Diamond Education article deleted successfully."
    });
  } catch (err) {
    console.error("Delete diamond education article error:", err);
    res.status(500).json({ error: "Failed to delete diamond education article." });
  }
});

// ── Public Single Article Endpoint (Wildcard slug must come LAST) ───────────
// GET /api/diamond-education/:slug — Public single article by slug
router.get("/:slug", async (req, res) => {
  try {
    const article = await db.diamondEducation.findUnique({
      where: { slug: req.params.slug }
    });

    if (!article || !article.isPublished) {
      return res.status(404).json({ error: "Article not found." });
    }

    res.json({ success: true, article });
  } catch (err) {
    console.error("Fetch article by slug error:", err);
    res.status(500).json({ error: "Failed to fetch article." });
  }
});

export default router;

