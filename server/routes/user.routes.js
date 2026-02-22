// require("../config/passport");
const express = require("express");
const router = express.Router();
// const passport = require("passport");
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

module.exports = router;
