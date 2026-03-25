const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/booking.controller");
const { authenticateToken } = require("../config/auth.middleware");

// Create new booking
router.post("/bookings", authenticateToken, bookingController.createBooking);

// Get booking by ID
router.get("/bookings/:bookingId", authenticateToken, bookingController.getBooking);

// Get booking by code
router.get("/bookings/code/:bookingCode", bookingController.getBookingByCode);

// Update payment status
router.patch("/bookings/:bookingId/payment", authenticateToken, bookingController.updatePaymentStatus);

// Get user bookings
router.get("/user/bookings", authenticateToken, bookingController.getUserBookings);

module.exports = router;