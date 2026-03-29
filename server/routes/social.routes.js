require("../config/passport");
const express = require("express");
const router = express.Router();
const {
  loginWithFacebook,
  facebookCallback,
  loginWithGoogle,
  googleCallback,
} = require("../controllers/auth.controller");

// Social login routes (mounted directly without /api/auth prefix)
router.get("/login-google", loginWithGoogle);
router.get("/auth/google/callback", googleCallback);
router.get("/login/federated/facebook", loginWithFacebook);
router.get("/auth/facebook/callback", facebookCallback);

module.exports = router;
