const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/booking.controller");
const { authenticateToken, authorizeRoles } = require("../config/auth.middleware"); 

// Create new booking (chỉ user đã đăng nhập mới tạo được)
router.post(
  "/",
  authenticateToken, // cho phép cả user và admin
  (req, res, next) => {
    console.log("=== BOOKING ROUTE HIT ===");
    console.log("Headers:", req.headers);
    console.log("Body:", req.body);
    console.log("User:", req.user);
    next();
  },
  bookingController.createBooking
);

// Get booking by ID (chỉ admin mới xem được)
router.get(
  "/:bookingId",
  authenticateToken,
  authorizeRoles(["Admin"]),
  bookingController.getBooking
);

// Get booking by code (cho phép user và admin)
router.get(
  "/code/:bookingCode",
  authenticateToken,
  authorizeRoles(["Admin", "Customer", "Staff", "Manager"]),
  bookingController.getBookingByCode
);

// Update payment status (chỉ admin mới được cập nhật)
router.patch(
  "/:bookingId/payment",
  authenticateToken,
  authorizeRoles(["Admin", "Customer", "Staff", "Manager"]),
  bookingController.updatePaymentStatus
);

// Get user bookings (chỉ user đã đăng nhập mới xem được)
router.get(
  "/user",
  authenticateToken,
  authorizeRoles(["Admin", "Customer", "Staff", "Manager"]),
  bookingController.getUserBookings
);

module.exports = router;
