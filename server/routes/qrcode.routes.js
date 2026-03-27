const express = require("express");
const router = express.Router();
const QRCode = require("qrcode");

/**
 * @route   POST /api/qrcode/generate
 * @desc    Generate QR code image from data string
 * @access  Public
 */
router.post("/generate", async (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data) {
      return res.status(400).json({
        success: false,
        message: "Data is required",
      });
    }

    // Generate QR code as data URL (base64)
    const qrImage = await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });

    res.json({
      success: true,
      data: qrImage,
    });
  } catch (err) {
    console.error("Error generating QR code:", err);
    res.status(500).json({
      success: false,
      message: "Error generating QR code",
    });
  }
});

/**
 * @route   POST /api/qrcode/generate-png
 * @desc    Generate QR code as PNG buffer
 * @access  Public
 */
router.post("/generate-png", async (req, res) => {
  try {
    const { data } = req.body;

    if (!data) {
      return res.status(400).json({
        success: false,
        message: "Data is required",
      });
    }

    // Set response headers for PNG image
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=31536000");

    // Generate QR code as PNG buffer and pipe to response
    await QRCode.toFileStream(res, data, {
      width: 300,
      margin: 2,
      color: {
        dark: "#000000",
        light: "#ffffff",
      },
    });
  } catch (err) {
    console.error("Error generating QR code:", err);
    res.status(500).json({
      success: false,
      message: "Error generating QR code",
    });
  }
});

module.exports = router;
