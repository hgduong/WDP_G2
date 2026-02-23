const express = require("express");
const router = express.Router();
const {
  getUserProfile,
  updateUserProfile,
  changePassword,
} = require("../controllers/user.controller");
const {
  authenticateToken,
  authorizeRoles,
} = require("../config/auth.middleware");

router.get("/user/profile", authenticateToken, getUserProfile);
router.put("/user/profile", authenticateToken, updateUserProfile);
router.post("/user/change-password", authenticateToken, changePassword);
module.exports = router;
