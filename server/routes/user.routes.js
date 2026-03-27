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

router.get(
  "/user/profile",
  authenticateToken,
  authorizeRoles(["Admin", "Customer", "Staff", "Manager"]),
  getUserProfile,
);
router.put(
  "/user/profile",
  authenticateToken,
  authorizeRoles(["Admin", "Customer", "Staff", "Manager"]),
  updateUserProfile,
);
router.post(
  "/user/change-password",
  authenticateToken,
  authorizeRoles(["Admin", "Customer", "Staff", "Manager"]),
  changePassword,
);
router.put(
  "/user/account",
  authenticateToken,
  authorizeRoles(["Admin", "Customer", "Staff", "Manager"]),
  deleteAccount,
);

// ==================== ADMIN USER MANAGEMENT ROUTES ====================
router.get(
  "/admin/users",
  authenticateToken,
  authorizeRoles(["Admin"]),
  getAllUsers,
);

router.patch(
  "/admin/users/:id/status",
  authenticateToken,
  authorizeRoles(["Admin"]),
  updateUserStatus,
);

router.patch(
  "/admin/users/:id/role",
  authenticateToken,
  authorizeRoles(["Admin"]),
  updateUserRole,
);

router.get(
  "/admin/users/:id/bookings",
  authenticateToken,
  authorizeRoles(["Admin"]),
  getUserBookings,
);

module.exports = router;
