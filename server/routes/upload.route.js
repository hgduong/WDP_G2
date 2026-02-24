const express = require("express");
const multer = require("multer");
const path = require("path");

const router = express.Router();

// Cấu hình nơi lưu file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, "../public/upload"));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// API upload ảnh
router.post("/upload", upload.single("image"), (req, res) => {
  const fileUrl = `/upload/${req.file.filename}`;
  res.json({ url: fileUrl });
});

module.exports = router;
