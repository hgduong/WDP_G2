
const express = require('express')
const router = express.Router()
const {register,login,sendOtp, verifyOtp, checkEmailExists, resetPassword, loginWithGoogle, googleCallback} = require('../controllers/users.controller')

router.post('/register',register)
router.post('/login',login)
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/check-email-exists', checkEmailExists);
router.post('/reset-password', resetPassword);

router.get("/login-google", loginWithGoogle); 
router.get("/auth/google/callback", googleCallback);
module.exports =router;