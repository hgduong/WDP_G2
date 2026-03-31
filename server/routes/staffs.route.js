const express = require("express");
const {
  registerStaff,
  getAllStaff,
  getStaffById,
  createStaff,
  updateStaff,
  deleteStaff,
  updateStaffStatus,
  changeStaffPassword,
  getStaffBookingShowtimes,
  getSeatMapForStaffBooking,
  createStaffBooking,
  getStaffDashboardStats,
  getStaffBookings,
  getAllBookings,
  verifyTicket,
  overrideSeatStatus,
  unlockInternalSeats,
  updateBookingPayment,
  getAuditLogs,
} = require("../controllers/staff.controller");
const {
  authenticateToken,
  authorizeRoles,
} = require("../config/auth.middleware");

const router = express.Router();
const adminStaffRouter = express.Router();
const staffWorkRouter = express.Router();

// Public staff registration
router.post("/register", registerStaff);

// ─── Staff dashboard (requires JWT) ────────────────────────────────────────
router.get("/dashboard/stats", authenticateToken, getStaffDashboardStats);

// ─── Staff work routes (requires JWT) ──────────────────────────────────────
staffWorkRouter.use(authenticateToken);

staffWorkRouter.get("/bookings", getStaffBookings);
staffWorkRouter.get("/bookings/all", getAllBookings);
staffWorkRouter.post("/tickets/verify", verifyTicket);
staffWorkRouter.post("/seats/override", overrideSeatStatus);
staffWorkRouter.post("/seats/unlock-internal", unlockInternalSeats);
staffWorkRouter.patch("/bookings/:id/payment", updateBookingPayment);
staffWorkRouter.get("/audit-logs", getAuditLogs);

router.use(staffWorkRouter);

// ─── Public staff-booking routes (no auth — internal counter tool) ─────────
// These endpoints are used by the Staff Booking page at /staff/bookings.
// They are intentionally public so staff can use the counter tool without
// going through a separate JWT check on each request.
router.get("/bookings/showtimes", getStaffBookingShowtimes);
router.get("/bookings/seatmap/:showtimeId", getSeatMapForStaffBooking);
router.post("/bookings", createStaffBooking);

// Public seatmap alias (legacy)
router.get("/public/seatmap/:showtimeId", getSeatMapForStaffBooking);

// ─── Admin-only staff management (requires Admin JWT) ─────────────────────
adminStaffRouter.use(authenticateToken);
adminStaffRouter.use(authorizeRoles(["Admin"]));

adminStaffRouter.get("/", getAllStaff);
adminStaffRouter.get("/:id", getStaffById);
adminStaffRouter.post("/", createStaff);
adminStaffRouter.put("/:id", updateStaff);
adminStaffRouter.delete("/:id", deleteStaff);
adminStaffRouter.patch("/:id/status", updateStaffStatus);
adminStaffRouter.post("/:id/change-password", changeStaffPassword);
adminStaffRouter.patch("/:id/password", changeStaffPassword);

router.use(adminStaffRouter);

module.exports = router;
