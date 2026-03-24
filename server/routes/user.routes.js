const express = require("express");
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  changePassword,
  deleteAccount,
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
module.exports = router;
