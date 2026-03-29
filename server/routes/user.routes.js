const express = require("express");
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  changePassword,
  deleteAccount,
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  getUserBookings,
} = require("../controllers/user.controller");
const {
  authenticateToken,
  authorizeRoles,
} = require("../config/auth.middleware");

// ═══════════════════════════════════════════════════════════════════════════════
// USER PROFILE ROUTES (Authenticated users)
// ═══════════════════════════════════════════════════════════════════════════════

router.get(
  "/profile",
  authenticateToken,
  authorizeRoles(["Admin", "Customer", "Staff", "Manager"]),
  getUserProfile,
);
router.put(
  "/profile",
  authenticateToken,
  authorizeRoles(["Admin", "Customer", "Staff", "Manager"]),
  updateUserProfile,
);
router.post(
  "/change-password",
  authenticateToken,
  authorizeRoles(["Admin", "Customer", "Staff", "Manager"]),
  changePassword,
);
router.put(
  "/account",
  authenticateToken,
  authorizeRoles(["Admin", "Customer", "Staff", "Manager"]),
  deleteAccount,
);

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN USER MANAGEMENT ROUTES (Admin only)
// ═══════════════════════════════════════════════════════════════════════════════

// Lấy danh sách tất cả người dùng (Admin)
router.get(
  "/",
  authenticateToken,
  authorizeRoles(["Admin"]),
  getAllUsers,
);

// Cập nhật trạng thái người dùng (Admin)
router.patch(
  "/:id/status",
  authenticateToken,
  authorizeRoles(["Admin"]),
  updateUserStatus,
);

// Cập nhật vai trò người dùng (Admin)
router.patch(
  "/:id/role",
  authenticateToken,
  authorizeRoles(["Admin"]),
  updateUserRole,
);

// Lấy lịch sử đặt vé của người dùng (Admin)
router.get(
  "/:id/bookings",
  authenticateToken,
  authorizeRoles(["Admin"]),
  getUserBookings,
);

module.exports = router;
