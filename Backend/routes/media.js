import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { getCloudinary } from "../config/apiResolvers.js";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const upload = multer({ storage: multer.memoryStorage() });

const PORT = process.env.PORT || 5000;

// POST /api/media/upload
router.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file provided" });

  const cClient = await getCloudinary();
  // If Cloudinary is configured, upload there
  if (cClient) {
    try {
      const result = await new Promise((resolve, reject) => {
        const stream = cClient.uploader.upload_stream(
          { folder: "vrix", resource_type: "auto" },
          (error, result) => (error ? reject(error) : resolve(result))
        );
        stream.end(req.file.buffer);
      });
      return res.json({ url: result.secure_url, public_id: result.public_id });
    } catch (err) {
      return res.status(500).json({ error: "Cloudinary upload failed: " + err.message });
    }
  }

  // Fallback: save file locally in /data/uploads/
  const uploadsDir = path.join(__dirname, "..", "data", "uploads");
  try {
    const { mkdirSync, writeFileSync } = await import("fs");
    mkdirSync(uploadsDir, { recursive: true });
    const safeName = Date.now() + "_" + req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
    writeFileSync(path.join(uploadsDir, safeName), req.file.buffer);
    const url = `http://localhost:${PORT}/uploads/${safeName}`;
    return res.json({ url, public_id: safeName });
  } catch (err) {
    return res.status(500).json({ error: "Local upload failed: " + err.message });
  }
});

export default router;
