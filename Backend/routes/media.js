import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import multer from "multer";
import { getCloudinary } from "../config/apiResolvers.js";
import fs from "fs";

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const upload = multer({ storage: multer.memoryStorage() });

const PORT = process.env.PORT || 5000;

// POST /api/media/upload
router.post("/upload", upload.single("file"), async (req, res, next) => {
  try {
    console.log("📂 [Media Upload] Request received");

    if (!req.file) {
      console.warn("⚠️ [Media Upload] No file provided in request");
      return res.status(400).json({ error: "No file provided" });
    }

    console.log(`ℹ️ [Media Upload] File: ${req.file.originalname}, Size: ${req.file.size} bytes, Mimetype: ${req.file.mimetype}`);

    const cClient = await getCloudinary();
    // If Cloudinary is configured, upload there
    if (cClient) {
      console.log("☁️ [Media Upload] Cloudinary client resolved, uploading to Cloudinary...");
      try {
        const result = await new Promise((resolve, reject) => {
          const stream = cClient.uploader.upload_stream(
            { folder: "vrix", resource_type: "auto" },
            (error, result) => (error ? reject(error) : resolve(result))
          );
          stream.end(req.file.buffer);
        });
        console.log("✅ [Media Upload] Cloudinary upload successful:", result.secure_url);
        return res.json({ url: result.secure_url, public_id: result.public_id });
      } catch (err) {
        console.error("❌ [Media Upload] Cloudinary upload failed:", err);
        return res.status(500).json({ error: "Cloudinary upload failed: " + err.message });
      }
    }

    // Fallback: save file locally in /data/uploads/
    console.log("💾 [Media Upload] Cloudinary not configured. Storing file locally...");
    const uploadsDir = path.join(__dirname, "..", "data", "uploads");
    
    try {
      fs.mkdirSync(uploadsDir, { recursive: true });
      const safeName = Date.now() + "_" + req.file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = path.join(uploadsDir, safeName);
      fs.writeFileSync(filePath, req.file.buffer);
      
      const url = `http://localhost:${PORT}/uploads/${safeName}`;
      console.log(`✅ [Media Upload] Local upload successful. Path: ${filePath}, URL: ${url}`);
      return res.json({ url, public_id: safeName });
    } catch (err) {
      console.error("❌ [Media Upload] Local upload failed:", err);
      return res.status(500).json({ error: "Local upload failed: " + err.message });
    }
  } catch (err) {
    console.error("💥 [Media Upload] Unhandled route error:", err);
    next(err);
  }
});

// POST /api/media/upload-multiple
router.post("/upload-multiple", upload.array("files", 10), async (req, res, next) => {
  try {
    console.log("📂 [Media Upload Multiple] Request received");

    if (!req.files || req.files.length === 0) {
      console.warn("⚠️ [Media Upload Multiple] No files provided in request");
      return res.status(400).json({ error: "No files provided" });
    }

    console.log(`ℹ️ [Media Upload Multiple] Received ${req.files.length} files`);
    const uploadResults = [];

    const cClient = await getCloudinary();

    for (const file of req.files) {
      console.log(`Processing file: ${file.originalname} (${file.size} bytes)`);
      
      if (cClient) {
        // Upload to Cloudinary
        try {
          const result = await new Promise((resolve, reject) => {
            const stream = cClient.uploader.upload_stream(
              { folder: "vrix", resource_type: "auto" },
              (error, result) => (error ? reject(error) : resolve(result))
            );
            stream.end(file.buffer);
          });
          uploadResults.push({
            originalname: file.originalname,
            url: result.secure_url,
            public_id: result.public_id,
            success: true
          });
        } catch (err) {
          console.error(`Cloudinary upload failed for ${file.originalname}:`, err);
          uploadResults.push({
            originalname: file.originalname,
            error: err.message,
            success: false
          });
        }
      } else {
        // Fallback to local storage
        const uploadsDir = path.join(__dirname, "..", "data", "uploads");
        try {
          fs.mkdirSync(uploadsDir, { recursive: true });
          const safeName = Date.now() + "_" + file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_");
          const filePath = path.join(uploadsDir, safeName);
          fs.writeFileSync(filePath, file.buffer);
          const url = `http://localhost:${PORT}/uploads/${safeName}`;
          uploadResults.push({
            originalname: file.originalname,
            url,
            public_id: safeName,
            success: true
          });
        } catch (err) {
          console.error(`Local upload failed for ${file.originalname}:`, err);
          uploadResults.push({
            originalname: file.originalname,
            error: err.message,
            success: false
          });
        }
      }
    }

    console.log("✅ [Media Upload Multiple] All files processed");
    return res.json({ results: uploadResults });
  } catch (err) {
    console.error("💥 [Media Upload Multiple] Unhandled route error:", err);
    next(err);
  }
});

// GET /api/media
router.get("/", async (req, res, next) => {
  try {
    console.log("📂 [Media List] Request received");
    const uploadsDir = path.join(__dirname, "..", "data", "uploads");
    
    if (!fs.existsSync(uploadsDir)) {
      return res.json({ files: [] });
    }
    
    const fileNames = fs.readdirSync(uploadsDir);
    const files = [];
    
    for (const name of fileNames) {
      // Skip hidden files
      if (name.startsWith(".")) continue;
      
      try {
        const filePath = path.join(uploadsDir, name);
        const stats = fs.statSync(filePath);
        if (stats.isFile()) {
          files.push({
            name,
            url: `http://localhost:${PORT}/uploads/${name}`,
            createdAt: stats.birthtime,
            size: stats.size
          });
        }
      } catch (err) {
        console.error(`Error reading stat for file ${name}:`, err);
      }
    }
    
    // Sort by newest first
    files.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    console.log(`✅ [Media List] Found ${files.length} files`);
    return res.json({ files });
  } catch (err) {
    console.error("💥 [Media List] Unhandled route error:", err);
    next(err);
  }
});

export default router;
