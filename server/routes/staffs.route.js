const express = require("express");
const router = express.Router();
const {
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

router.use(authenticateToken);
router.use(authorizeRoles(["Admin"]));

router.get("/staffs", getAllStaff);
router.get("/staffs/:id", getStaffById);
router.post("/staffs", createStaff);
router.put("/staffs/:id", updateStaff);
router.delete("/staffs/:id", deleteStaff);
router.patch("/staffs/:id/status", updateStaffStatus);
router.post("/staffs/:id/change-password", changeStaffPassword);
router.patch("/staffs/:id/password", changeStaffPassword);

module.exports = router;
