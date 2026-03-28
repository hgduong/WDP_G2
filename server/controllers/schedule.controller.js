const Schedule = require("../models/schedule");
const User = require("../models/user");

// Create new schedule
const createSchedule = async (req, res) => {
  try {
    const { staffId, date, shift, createBy, fullName, role } = req.body;

    // Validate date is not in the past
    const scheduleDate = new Date(date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (scheduleDate < today) {
      return res.status(400).json({ message: "Không thể tạo lịch làm việc cho ngày trong quá khứ" });
    }

    // Validate staff exists
    const staff = await User.findById(staffId);
    if (!staff) {
      return res.status(404).json({ message: "Staff not found" });
    }

    // Check if staff already has 2 shifts on this day
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const existingShifts = await Schedule.find({
      staffId,
      date: {
        $gte: dayStart,
        $lte: dayEnd
      },
      isDeleted: false
    });

    if (existingShifts.length >= 2) {
      return res.status(400).json({
        message: "Staff không được làm việc quá 2 ca liên tiếp/ngày"
      });
    }

    // Check if staff already has this shift on this day
    const existingShift = await Schedule.findOne({
      staffId,
      date: {
        $gte: dayStart,
        $lte: dayEnd
      },
      shift,
      isDeleted: false
    });

    if (existingShift) {
      return res.status(400).json({
        message: "Staff đã được assigned ca này trong ngày"
      });
    }

    // Check max 5 staff per shift
    const shiftCount = await Schedule.countDocuments({
      date: {
        $gte: dayStart,
        $lte: dayEnd
      },
      shift,
      isDeleted: false
    });

    if (shiftCount >= 5) {
      return res.status(400).json({
        message: "Ca làm việc đã đủ 5 staff"
      });
    }

    // Check if shift is within 5 hours from now for edit (but for create it's always allowed)
    // For create, we just proceed

    const schedule = new Schedule({
      staffId,
      fullName: fullName || staff.fullName,
      role: role || "Staff",
      date,
      shift,
      createBy
    });

    await schedule.save();

    res.status(201).json(schedule);
  } catch (error) {
    console.error("Create schedule error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get all schedules
const getAllSchedules = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    let query = { isDeleted: false };

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const schedules = await Schedule.find(query).sort({ date: -1 });
    res.json(schedules);
  } catch (error) {
    console.error("Get schedules error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get schedule by ID
const getScheduleById = async (req, res) => {
  try {
    const schedule = await Schedule.findOne({
      _id: req.params.id,
      isDeleted: false
    });

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    res.json(schedule);
  } catch (error) {
    console.error("Get schedule error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update schedule (only within 5 hours from creation)
const updateSchedule = async (req, res) => {
  try {
    const { staffId, date, shift, fullName, role } = req.body;

    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Check if schedule is within 5 hours from creation
    const hoursSinceCreation = (Date.now() - schedule.createAt.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceCreation > 5) {
      return res.status(400).json({
        message: "Chỉ được chỉnh sửa trong vòng 5 giờ từ khi tạo"
      });
    }

    // If changing staff, validate new staff
    if (staffId && staffId !== schedule.staffId.toString()) {
      const staff = await User.findById(staffId);
      if (!staff) {
        return res.status(404).json({ message: "Staff not found" });
      }

      // Check if new staff already has 2 shifts on this day
      const dayStart = new Date(date || schedule.date);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(date || schedule.date);
      dayEnd.setHours(23, 59, 59, 999);

      const existingShifts = await Schedule.find({
        staffId,
        date: {
          $gte: dayStart,
          $lte: dayEnd
        },
        isDeleted: false,
        _id: { $ne: schedule._id }
      });

      if (existingShifts.length >= 2) {
        return res.status(400).json({
          message: "Staff không được làm việc quá 2 ca liên tiếp/ngày"
        });
      }

      // Check if new staff already has this shift on this day
      const existingShift = await Schedule.findOne({
        staffId,
        date: {
          $gte: dayStart,
          $lte: dayEnd
        },
        shift: shift || schedule.shift,
        isDeleted: false,
        _id: { $ne: schedule._id }
      });

      if (existingShift) {
        return res.status(400).json({
          message: "Staff đã được assigned ca này trong ngày"
        });
      }

      schedule.staffId = staffId;
      schedule.fullName = fullName || staff.fullName;
    }

    // If changing date or shift, validate
    if (date || shift) {
      const newDate = new Date(date || schedule.date);
      const newShift = shift || schedule.shift;

      // Check max 5 staff per shift
      const shiftCount = await Schedule.countDocuments({
        date: {
          $gte: new Date(newDate).setHours(0, 0, 0, 0),
          $lte: new Date(newDate).setHours(23, 59, 59, 999)
        },
        shift: newShift,
        isDeleted: false,
        _id: { $ne: schedule._id }
      });

      if (shiftCount >= 5) {
        return res.status(400).json({
          message: "Ca làm việc đã đủ 5 staff"
        });
      }

      if (date) schedule.date = date;
      if (shift) schedule.shift = shift;
    }

    if (role) schedule.role = role;

    await schedule.save();

    res.json(schedule);
  } catch (error) {
    console.error("Update schedule error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get staff list for dropdown
const getStaffList = async (req, res) => {
  try {
    const staff = await User.find({ 
      role: "Staff", 
      $or: [
        { isDeleted: false },
        { isDeleted: { $exists: false } }
      ]
    })
      .select("fullName email");
    res.json(staff);
  } catch (error) {
    console.error("Get staff error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get shift details for a specific date
const getShiftDetails = async (req, res) => {
  try {
    const { date } = req.params;
    
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const schedules = await Schedule.find({
      date: {
        $gte: dayStart,
        $lte: dayEnd
      },
      isDeleted: false
    }).populate("staffId", "fullName email");

    const shifts = {
      Sáng: [],
      Chiều: [],
      Tối: []
    };

    schedules.forEach(schedule => {
      shifts[schedule.shift].push({
        _id: schedule._id,
        fullName: schedule.fullName,
        staffId: schedule.staffId._id
      });
    });

    res.json(shifts);
  } catch (error) {
    console.error("Get shift details error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Delete schedule (soft delete, only within 5 hours from creation)
const deleteSchedule = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Check if schedule is within 5 hours from creation
    const hoursSinceCreation = (Date.now() - schedule.createAt.getTime()) / (1000 * 60 * 60);
    
    if (hoursSinceCreation > 5) {
      return res.status(400).json({
        message: "Chỉ được xóa trong vòng 5 giờ từ khi tạo"
      });
    }

    // Soft delete
    schedule.isDeleted = true;
    await schedule.save();

    res.json({ message: "Xóa lịch làm việc thành công" });
  } catch (error) {
    console.error("Delete schedule error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Helper function to get shift start/end times
const getShiftTimes = (date, shift) => {
  const shiftDate = new Date(date);
  let startTime, endTime;
  
  switch (shift) {
    case "Sáng":
      startTime = new Date(shiftDate);
      startTime.setHours(6, 30, 0, 0);
      endTime = new Date(shiftDate);
      endTime.setHours(12, 0, 0, 0);
      break;
    case "Chiều":
      startTime = new Date(shiftDate);
      startTime.setHours(12, 30, 0, 0);
      endTime = new Date(shiftDate);
      endTime.setHours(17, 0, 0, 0);
      break;
    case "Tối":
      startTime = new Date(shiftDate);
      startTime.setHours(17, 30, 0, 0);
      endTime = new Date(shiftDate);
      endTime.setHours(22, 0, 0, 0);
      break;
    default:
      startTime = new Date(shiftDate);
      endTime = new Date(shiftDate);
  }
  
  return { startTime, endTime };
};

// Check-in for a schedule
const checkIn = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const staffId = req.user.id;

    const schedule = await Schedule.findById(scheduleId);

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Check if staff is assigned to this schedule
    if (schedule.staffId.toString() !== staffId.toString()) {
      return res.status(403).json({ message: "Bạn không được phân công ca này" });
    }

    // Check if already checked in
    if (schedule.checkInTime) {
      return res.status(400).json({ message: "Bạn đã check-in ca này rồi" });
    }

    // Get shift times
    const { startTime, endTime } = getShiftTimes(schedule.date, schedule.shift);
    const now = new Date();

    // Check-in window: 10 minutes before shift start to 10 minutes after shift start
    const checkInStart = new Date(startTime);
    checkInStart.setMinutes(checkInStart.getMinutes() - 10);
    const checkInEnd = new Date(startTime);
    checkInEnd.setMinutes(checkInEnd.getMinutes() + 10);

    if (now < checkInStart) {
      return res.status(400).json({ message: "Chưa đến thời gian check-in (10p trước ca làm)" });
    }

    if (now > checkInEnd) {
      // Auto mark as absent
      schedule.attendanceStatus = "absent";
      await schedule.save();
      return res.status(400).json({ message: "Đã quá thời gian check-in, bạn bị đánh dấu vắng mặt" });
    }

    // Check-in successful
    schedule.checkInTime = now;
    schedule.attendanceStatus = "attended";
    await schedule.save();

    res.json({ message: "Check-in thành công", schedule });
  } catch (error) {
    console.error("Check-in error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Check-out for a schedule
const checkOut = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const staffId = req.user.id;

    const schedule = await Schedule.findById(scheduleId);

    if (!schedule) {
      return res.status(404).json({ message: "Schedule not found" });
    }

    // Check if staff is assigned to this schedule
    if (schedule.staffId.toString() !== staffId.toString()) {
      return res.status(403).json({ message: "Bạn không được phân công ca này" });
    }

    // Check if already checked out
    if (schedule.checkOutTime) {
      return res.status(400).json({ message: "Bạn đã check-out ca này rồi" });
    }

    // Check if checked in first
    if (!schedule.checkInTime) {
      return res.status(400).json({ message: "Bạn cần check-in trước khi check-out" });
    }

    // Get shift times
    const { startTime, endTime } = getShiftTimes(schedule.date, schedule.shift);
    const now = new Date();

    // Check-out window: from shift end to 10 minutes after shift end
    const checkOutStart = new Date(endTime);
    const checkOutEnd = new Date(endTime);
    checkOutEnd.setMinutes(checkOutEnd.getMinutes() + 10);

    if (now < checkOutStart) {
      return res.status(400).json({ message: "Chưa đến thời gian check-out" });
    }

    if (now > checkOutEnd) {
      return res.status(400).json({ message: "Đã quá thời gian check-out" });
    }

    // Check-out successful
    schedule.checkOutTime = now;
    await schedule.save();

    res.json({ message: "Check-out thành công", schedule });
  } catch (error) {
    console.error("Check-out error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get attendance data for a specific week
const getAttendanceByWeek = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate and endDate are required" });
    }

    const schedules = await Schedule.find({
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      isDeleted: false
    }).sort({ date: 1, shift: 1 });

    // Auto-mark absent for past schedules that weren't checked in
    const now = new Date();
    for (const schedule of schedules) {
      if (schedule.attendanceStatus === "not-yet") {
        const { startTime } = getShiftTimes(schedule.date, schedule.shift);
        const checkInEnd = new Date(startTime);
        checkInEnd.setMinutes(checkInEnd.getMinutes() + 10);
        
        if (now > checkInEnd) {
          schedule.attendanceStatus = "absent";
          await schedule.save();
        }
      }
    }

    res.json(schedules);
  } catch (error) {
    console.error("Get attendance error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Get staff's own schedule for a specific week
const getMySchedule = async (req, res) => {
  try {
    console.log("[DEBUG] getMySchedule called");
    console.log("[DEBUG] req.query:", req.query);
    console.log("[DEBUG] req.user:", req.user);
    
    const { startDate, endDate } = req.query;
    const staffId = req.user.id;

    console.log("[DEBUG] staffId:", staffId);
    console.log("[DEBUG] startDate:", startDate);
    console.log("[DEBUG] endDate:", endDate);

    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate and endDate are required" });
    }

    const schedules = await Schedule.find({
      staffId,
      date: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      },
      isDeleted: false
    }).sort({ date: 1, shift: 1 });

    console.log("[DEBUG] Found schedules:", schedules.length);

    // Auto-mark absent for past schedules that weren't checked in
    const now = new Date();
    for (const schedule of schedules) {
      if (schedule.attendanceStatus === "not-yet") {
        const { startTime } = getShiftTimes(schedule.date, schedule.shift);
        const checkInEnd = new Date(startTime);
        checkInEnd.setMinutes(checkInEnd.getMinutes() + 10);
        
        if (now > checkInEnd) {
          schedule.attendanceStatus = "absent";
          await schedule.save();
        }
      }
    }

    res.json(schedules);
  } catch (error) {
    console.error("Get my schedule error:", error);
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createSchedule,
  getAllSchedules,
  getScheduleById,
  updateSchedule,
  deleteSchedule,
  getStaffList,
  getShiftDetails,
  checkIn,
  checkOut,
  getAttendanceByWeek,
  getMySchedule
};