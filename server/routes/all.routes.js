
const express = require('express')
const router = express.Router()
const {register,login,sendOtp, verifyOtp, checkEmailExists, resetPassword} = require('../controllers/users.controller')
const { loginWithGoogle, googleCallback } = require('../controllers/login_methods/google.controller')
const passport = require('passport');
const { ConfigPassport } = require("../controllers/passport.controller");
const jwt = require("jsonwebtoken");
ConfigPassport();


router.post('/register',register)
router.post('/login',login)
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/check-email-exists', checkEmailExists);
router.post('/reset-password', resetPassword);

router.get("/login-google", loginWithGoogle); 
router.get("/auth/google/callback", googleCallback);


router.get('/login/federated/facebook', passport.authenticate('facebook'));

router.get(
  "/auth/facebook/callback",
  passport.authenticate("facebook", {
    session: false,
    failureRedirect:
      "http://localhost:3000/login?error=Facebook%20login%20failed",
  }),
  (req, res) => {
    if (!req.user) {
      return res.redirect(
        "http://localhost:3000/login?error=Không%20thể%20lấy%20email%20từ%20facebook",
      );
    }

    const token = jwt.sign(
      {
        id: req.user._id,
        fullName: req.user.fullName,
        email: req.user.email,
        role: req.user.role,
        avatarUrl: req.user.avatarUrl || null,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.redirect(`http://localhost:3000/?token=${token}`);
  },
);

module.exports =router;