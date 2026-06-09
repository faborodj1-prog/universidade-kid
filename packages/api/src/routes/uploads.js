const express = require("express");
const { authenticate } = require("../middlewares/auth");
const { upload } = require("../middlewares/upload");

const router = express.Router();

// POST /api/uploads/photo
router.post("/photo", authenticate, upload.single("photo"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "Nenhuma imagem enviada" });
  res.json({
    url: req.file.path,        // URL Cloudinary
    publicId: req.file.filename,
  });
});

module.exports = router;
