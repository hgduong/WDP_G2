const express = require("express");
const router = express.Router();
const scheduleController = require("../controllers/schedule.controller");
const { authenticateToken, authorizeRoles } = require("../config/auth.middleware");

// All routes require authentication and admin role
router.use(authenticateToken);
router.use(authorizeRoles(["Admin"]));

// Create schedule
router.post("/", scheduleController.createSchedule);

// Get all schedules
router.get("/", scheduleController.getAllSchedules);

// Get staff list
router.get("/staffs", scheduleController.getStaffList);

// Get shift details for a specific date
router.get("/shifts/:date", scheduleController.getShiftDetails);

// Get schedules by date (for attendance popup)
router.get("/date", scheduleController.getSchedulesByDate);

// Get schedule by ID
router.get("/:id", scheduleController.getScheduleById);

// Admin check-in
router.post("/:scheduleId/checkin", scheduleController.adminCheckIn);

// Admin check-out
router.post("/:scheduleId/checkout", scheduleController.adminCheckOut);

// Admin update attendance (edit)
router.patch("/:scheduleId/attendance", scheduleController.adminUpdateAttendance);

// Update schedule
router.put("/:id", scheduleController.updateSchedule);

// Delete schedule
router.delete("/:id", scheduleController.deleteSchedule);

module.exports = router;
