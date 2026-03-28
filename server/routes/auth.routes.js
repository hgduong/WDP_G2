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
  loginWithFacebook,
  facebookCallback,
  loginWithGoogle,
  googleCallback,
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

// Social login routes
router.get("/login-google", loginWithGoogle);
router.get("/auth/google/callback", googleCallback);
router.get("/login/federated/facebook", loginWithFacebook);
router.get("/auth/facebook/callback", facebookCallback);

// User info route (authenticated)
router.get(
  "/user-info",
  authenticateToken,
  authorizeRoles(["Admin", "Customer", "Staff"]),
  getUserIdentity,
);

module.exports = router;
