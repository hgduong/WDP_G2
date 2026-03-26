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

module.exports = {
  createSchedule,
  getAllSchedules,
  getScheduleById,
  updateSchedule,
  getStaffList,
  getShiftDetails
};