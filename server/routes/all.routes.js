
const express = require('express')
const router = express.Router()
const {register,login,sendOtp, verifyOtp, checkEmailExists, resetPassword} = require('../controllers/users.controller')

router.post('/register',register)
router.post('/login',login)
router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/check-email-exists', checkEmailExists);
router.post('/reset-password', resetPassword);
module.exports =router;