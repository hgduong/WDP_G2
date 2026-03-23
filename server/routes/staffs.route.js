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
} = require("../controllers/staff.controller");
const {
  authenticateToken,
  authorizeRoles,
} = require("../config/auth.middleware");

const router = express.Router();
const adminStaffRouter = express.Router();

// Public staff registration
router.post("/staff/register", registerStaff);

// Admin-only staff management
adminStaffRouter.use(authenticateToken);
adminStaffRouter.use(authorizeRoles(["Admin"]));

adminStaffRouter.get("/staffs", getAllStaff);
adminStaffRouter.get("/staffs/:id", getStaffById);
adminStaffRouter.post("/staffs", createStaff);
adminStaffRouter.put("/staffs/:id", updateStaff);
adminStaffRouter.delete("/staffs/:id", deleteStaff);
adminStaffRouter.patch("/staffs/:id/status", updateStaffStatus);
adminStaffRouter.post("/staffs/:id/change-password", changeStaffPassword);

// Backward-compatible alias for older frontend calls
adminStaffRouter.patch("/staffs/:id/password", changeStaffPassword);

router.use(adminStaffRouter);

module.exports = router;
