
const express = require('express')
const router = express.Router()
const {register,login,sendOtp, verifyOtp, checkEmailExists, resetPassword} = require('../controllers/users.controller')
const { loginWithGoogle, googleCallback } = require('../controllers/login_methods/google.controller')
const passport = require('passport');

router.post('/register',register)
router.post('/login',login)
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/check-email-exists', checkEmailExists);
router.post('/reset-password', resetPassword);

router.get("/login-google", loginWithGoogle); 
router.get("/auth/google/callback", googleCallback);


router.get('/login/federated/facebook', passport.authenticate('facebook'));
module.exports =router;