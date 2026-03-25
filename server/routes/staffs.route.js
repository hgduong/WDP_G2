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
} = require("../controllers/staff.controller");
const {
  authenticateToken,
  authorizeRoles,
} = require("../config/auth.middleware");

const router = express.Router();
const adminStaffRouter = express.Router();

// Public staff registration
router.post("/staff/register", registerStaff);

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
