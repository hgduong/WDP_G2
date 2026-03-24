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

const jwt = require("jsonwebtoken");
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/check-email-exists", checkEmailExists);
router.post("/reset-password", resetPassword);

router.post("/register", register);
router.post("/login", login);
router.post("/staff/login", staffLogin);
router.post("/staff/login/request-otp", requestStaffLoginOtp);
router.post("/staff/login/verify-otp", verifyStaffLoginOtp);
router.post("/logout", logout);

router.get("/login-google", loginWithGoogle);
router.get("/auth/google/callback", googleCallback);

router.get("/login/federated/facebook", loginWithFacebook);
router.get("/auth/facebook/callback", facebookCallback);

router.get(
  "/user-info",
  authenticateToken,
  authorizeRoles(["Admin", "Customer", "Staff"]),
  getUserIdentity,
);

module.exports = router;
