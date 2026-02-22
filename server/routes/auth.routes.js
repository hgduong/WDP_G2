require("../config/passport");
const express = require("express");
const router = express.Router();
const {
  register,
  login,
  sendOtp,
  verifyOtp,
  checkEmailExists,
  resetPassword,
  loginWithFacebook,
  facebookCallback,
  loginWithGoogle,
  googleCallback,
  logout,
} = require("../controllers/auth.controller");
const {authenticateToken, authorizeRoles} = require("../config/auth.middleware");

const jwt = require("jsonwebtoken");
router.post("/send-otp", sendOtp);
router.post("/verify-otp", verifyOtp);
router.post("/check-email-exists", checkEmailExists);
router.post("/reset-password", resetPassword);

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);

router.get("/login-google", loginWithGoogle);
router.get("/auth/google/callback", googleCallback);

router.get("/login/federated/facebook", loginWithFacebook);
router.get("/auth/facebook/callback", facebookCallback);

router.get("/user-info", authenticateToken, (req, res) => {
  res.json({
    message: "Thông tin người dùng",
    user: {
      id: req.user.id,
      fullName: req.user.fullName,
      email: req.user.email,
      role: req.user.role,
      avatarUrl: req.user.avatarUrl || null,
    },
  });
});

module.exports = router;
