require("../config/passport");
const express = require("express");
const router = express.Router();
const {
  register,
  login,
  staffLogin,
  requestStaffLoginOtp,
  verifyStaffLoginOtp,
  sendOtp,
  verifyOtp,
  checkEmailExists,
  resetPassword,
  logout,
  getUserIdentity,
} = require("../controllers/auth.controller");
const {
  authenticateToken,
  authorizeRoles,
} = require("../config/auth.middleware");

// OTP routes
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/check-email-exists", checkEmailExists);
router.post("/reset-password", resetPassword);

// Auth routes
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

// Staff auth routes
router.post("/staff/login", staffLogin);
router.post("/staff/login/request-otp", requestStaffLoginOtp);
router.post("/staff/login/verify-otp", verifyStaffLoginOtp);

// User info route (authenticated)
router.get(
  "/user-info",
  authenticateToken,
  authorizeRoles(["Admin", "Customer", "Staff"]),
  getUserIdentity,
);

module.exports = router;
