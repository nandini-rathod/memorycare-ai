const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("cloudinary").v2;
const streamifier = require("streamifier");
const Photo = require("../models/Photo");
const authMiddleware = require("../middleware/auth");

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Use memory storage for multer
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) cb(null, true);
    else cb(new Error("Only image files allowed"), false);
  },
});

// Helper: upload buffer to cloudinary
function uploadToCloudinary(buffer, folder) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: folder || "alzheimer-companion" },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    streamifier.createReadStream(buffer).pipe(stream);
  });
}

// GET photos for patient (no auth - patient page uses this)
router.get("/:patientId", async (req, res) => {
  try {
    const photos = await Photo.find({ patientId: req.params.patientId });
    res.json(photos);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// POST upload photo (caregiver auth required)
router.post("/:patientId", authMiddleware, upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No image file provided" });

    const { caption, personName, relation } = req.body;
    if (!caption) return res.status(400).json({ error: "Caption is required" });

    const result = await uploadToCloudinary(
      req.file.buffer,
      `alzheimer-companion/${req.params.patientId}`
    );

    const photo = await Photo.create({
      patientId: req.params.patientId,
      imageUrl: result.secure_url,
      publicId: result.public_id,
      caption,
      personName,
      relation,
    });

    res.status(201).json(photo);
  } catch (err) {
    console.error("Photo upload error:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// DELETE photo (caregiver auth required)
router.delete("/:photoId", authMiddleware, async (req, res) => {
  try {
    const photo = await Photo.findById(req.params.photoId);
    if (!photo) return res.status(404).json({ error: "Photo not found" });

    // Delete from Cloudinary
    if (photo.publicId) {
      await cloudinary.uploader.destroy(photo.publicId);
    }

    await Photo.findByIdAndDelete(req.params.photoId);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete photo error:", err);
    res.status(500).json({ error: "Delete failed" });
  }
});

module.exports = router;
