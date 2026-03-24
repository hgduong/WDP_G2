const express = require("express");
const router = express.Router();
const voucherController = require("../controllers/voucher.controller");
const { authenticateToken } = require("../config/auth.middleware");

// Áp dụng voucher (công khai) - phải đặt trước /:id
router.post("/apply", voucherController.applyVoucher);

// Lấy danh sách voucher (công khai)
router.get("/", voucherController.getAllVouchers);

// Lấy chi tiết voucher (công khai) - phải đặt sau các route cụ thể
router.get("/:id", voucherController.getVoucherById);

// Tạo voucher mới (Admin only)
router.post("/", authenticateToken, voucherController.createVoucher);

// Cập nhật voucher (Admin only)
router.put("/:id", authenticateToken, voucherController.updateVoucher);

// Xóa voucher (Admin only)
router.delete("/:id", authenticateToken, voucherController.deleteVoucher);

module.exports = router;
