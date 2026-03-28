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
module.exports = router;
