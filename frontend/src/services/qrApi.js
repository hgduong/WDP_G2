import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:9999",
  withCredentials: true,
});

// ═══════════════════════════════════════════════════════════════════════════════
// QR CODE API (Prefix: /qrcode)
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generate QR code as base64 data URL
 * @param {string} data - The data to encode in the QR code
 * @returns {Promise<Object>} - Response containing success status and QR code data URL
 */
export const generateQRCode = async (data) => {
  try {
    const res = await API.post("/qrcode/generate", { data });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

/**
 * Generate QR code as PNG buffer
 * @param {string} data - The data to encode in the QR code
 * @returns {Promise<Blob>} - PNG image blob
 */
export const generateQRCodePNG = async (data) => {
  try {
    const res = await API.post("/qrcode/generate-png", { data }, {
      responseType: "blob",
    });
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
