const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/booking.controller");
const { authenticateToken, authorizeRoles } = require("../config/auth.middleware");

router.post(
  "/prepare-qr",
  authenticateToken,
  authorizeRoles(["Customer", "Admin"]),
  bookingController.prepareQrBooking,
);

router.post(
  "/:bookingId/cancel",
  authenticateToken,
  authorizeRoles(["Customer", "Staff", "Admin"]),
  bookingController.cancelPendingBooking,
);

router.get(
  "/code/:bookingCode",
  authenticateToken,
  authorizeRoles(["Admin", "Customer", "Staff"]),
  bookingController.getBookingByCode,
);

router.get(
  "/user",
  authenticateToken,
  authorizeRoles(["Admin", "Customer", "Staff"]),
  bookingController.getUserBookings,
);

router.get(
  "/:bookingId",
  authenticateToken,
  authorizeRoles(["Admin", "Customer", "Staff"]),
  bookingController.getBooking,
);

module.exports = router;
