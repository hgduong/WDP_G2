// routes/staffs.route.js
const express = require("express");
const router = express.Router();
const {
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  updateStaffStatus,
  changeStaffPassword,
} = require("../controllers/staff.controller");
const {
  authenticateToken,
  authorizeRoles,
} = require("../config/auth.middleware");

// Tất cả các routes nhân viên đều cần đăng nhập và có quyền Admin
router.use(authenticateToken);
router.use(authorizeRoles(["Admin"]));

// Lấy danh sách tất cả nhân viên
router.get("/staffs", getAllStaff);

// Lấy thông tin nhân viên theo ID
router.get("/staffs/:id", getStaffById);

// Tạo nhân viên mới
router.post("/staffs", createStaff);

// Cập nhật thông tin nhân viên
router.put("/staffs/:id", updateStaff);

// Xóa nhân viên (vô hiệu hóa)
router.delete("/staffs/:id", deleteStaff);

// Cập nhật trạng thái nhân viên
router.patch("/staffs/:id/status", updateStaffStatus);

// Đổi mật khẩu nhân viên
router.post("/staffs/:id/change-password", changeStaffPassword);

module.exports = router;
