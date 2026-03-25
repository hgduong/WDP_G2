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
const staffBookingRouter = express.Router();

// Public staff registration
router.post("/staff/register", registerStaff);

// Admin-only staff management
adminStaffRouter.use(authenticateToken);
adminStaffRouter.use(authorizeRoles(["Admin"]));

staffBookingRouter.use(authenticateToken);
staffBookingRouter.use(authorizeRoles(["Admin", "Staff"]));

adminStaffRouter.get("/staffs", getAllStaff);
adminStaffRouter.get("/staffs/:id", getStaffById);
adminStaffRouter.post("/staffs", createStaff);
adminStaffRouter.put("/staffs/:id", updateStaff);
adminStaffRouter.delete("/staffs/:id", deleteStaff);
adminStaffRouter.patch("/staffs/:id/status", updateStaffStatus);
adminStaffRouter.post("/staffs/:id/change-password", changeStaffPassword);

staffBookingRouter.get("/staff/bookings/showtimes", getStaffBookingShowtimes);
staffBookingRouter.get("/staff/bookings/showtimes/:showtimeId/seats", getSeatMapForStaffBooking);
staffBookingRouter.post("/staff/bookings", createStaffBooking);

// Public seatmap endpoint for customer booking (no auth required)
router.get("/public/seatmap/:showtimeId", getSeatMapForStaffBooking);

// Backward-compatible alias for older frontend calls
adminStaffRouter.patch("/staffs/:id/password", changeStaffPassword);

router.use(adminStaffRouter);
router.use(staffBookingRouter);

module.exports = router;
