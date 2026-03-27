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
const voucherController = require("../controllers/voucher.controller");
const {
  authenticateToken,
  authorizeRoles,
} = require("../config/auth.middleware");

const router = express.Router();
const adminStaffRouter = express.Router();
const staffWorkRouter = express.Router();

// Public staff registration
router.post("/staff/register", registerStaff);

// ─── Staff dashboard (requires JWT) ────────────────────────────────────────
router.get("/staff/dashboard/stats", authenticateToken, getStaffDashboardStats);

// ─── Staff work routes (requires JWT) ──────────────────────────────────────
staffWorkRouter.use(authenticateToken);

staffWorkRouter.get("/staff/bookings", getStaffBookings);
staffWorkRouter.get("/staff/bookings/all", getAllBookings);
staffWorkRouter.post("/staff/tickets/verify", verifyTicket);
staffWorkRouter.post("/staff/seats/override", overrideSeatStatus);
staffWorkRouter.post("/staff/seats/unlock-internal", unlockInternalSeats);
staffWorkRouter.patch("/staff/bookings/:id/payment", updateBookingPayment);
staffWorkRouter.get("/staff/audit-logs", getAuditLogs);
staffWorkRouter.post("/staff/vouchers/apply", voucherController.applyVoucher);

// Staff schedule routes
const scheduleController = require("../controllers/schedule.controller");
console.log("[DEBUG] Registering staff schedule routes");
staffWorkRouter.get("/staff/schedule", (req, res, next) => {
  console.log("[DEBUG] /staff/schedule route hit");
  console.log("[DEBUG] req.user:", req.user);
  next();
}, scheduleController.getMySchedule);
staffWorkRouter.post("/staff/schedule/:scheduleId/check-in", scheduleController.checkIn);
staffWorkRouter.post("/staff/schedule/:scheduleId/check-out", scheduleController.checkOut);

router.use(staffWorkRouter);

// ─── Public staff-booking routes (no auth — internal counter tool) ─────────
// These endpoints are used by the Staff Booking page at /staff/bookings.
// They are intentionally public so staff can use the counter tool without
// going through a separate JWT check on each request.
router.get("/staff/bookings/showtimes", getStaffBookingShowtimes);
router.get("/staff/bookings/seatmap/:showtimeId", getSeatMapForStaffBooking);
router.post("/staff/bookings", createStaffBooking);

// Public seatmap alias (legacy)
router.get("/public/seatmap/:showtimeId", getSeatMapForStaffBooking);

// ─── Admin-only staff management (requires Admin JWT) ─────────────────────
adminStaffRouter.use(authenticateToken);
adminStaffRouter.use(authorizeRoles(["Admin"]));

adminStaffRouter.get("/staffs", getAllStaff);
adminStaffRouter.get("/staffs/:id", getStaffById);
adminStaffRouter.post("/staffs", createStaff);
adminStaffRouter.put("/staffs/:id", updateStaff);
adminStaffRouter.delete("/staffs/:id", deleteStaff);
adminStaffRouter.patch("/staffs/:id/status", updateStaffStatus);
adminStaffRouter.post("/staffs/:id/change-password", changeStaffPassword);
adminStaffRouter.patch("/staffs/:id/password", changeStaffPassword);

router.use(adminStaffRouter);

module.exports = router;
