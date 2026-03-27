const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/booking.controller");
const { authenticateToken } = require("../config/auth.middleware");

// Optional auth middleware - continues even without token
const optionalAuth = (req, res, next) => {
  const token = req.cookies.jwt;
  
  if (!token) {
    req.user = null;
    return next();
  }

  const jwt = require("jsonwebtoken");
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      req.user = null;
    } else {
      req.user = user;
    }
    next();
  });
};

// Create new booking (optional auth - guests can book too)
router.post("/bookings", optionalAuth, (req, res, next) => {
  console.log("=== BOOKING ROUTE HIT ===");
  console.log("Headers:", req.headers);
  console.log("Body:", req.body);
  console.log("User:", req.user);
  next();
}, bookingController.createBooking);

// Get booking by ID
router.get("/bookings/:bookingId", authenticateToken, bookingController.getBooking);

// Get booking by code
router.get("/bookings/code/:bookingCode", bookingController.getBookingByCode);

// Update payment status (optional auth)
router.patch("/bookings/:bookingId/payment", optionalAuth, bookingController.updatePaymentStatus);

// Get user bookings
router.get("/user/bookings", authenticateToken, bookingController.getUserBookings);

module.exports = router;