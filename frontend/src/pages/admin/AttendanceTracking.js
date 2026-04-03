import React, { useState, useEffect } from "react";
import { getAllSchedules, getSchedulesByDate, adminCheckIn, adminCheckOut } from "../../services/schedulesApi";
import "./AdminManagement.css";

const SHIFTS = [
  { id: "Sáng", label: "Sáng (6h30-12h)", start: "06:30", end: "12:00" },
  { id: "Chiều", label: "Chiều (12h30-17h)", start: "12:30", end: "17:00" },
  { id: "Tối", label: "Tối (17h30-22h)", start: "17:30", end: "22:00" },
];

const formatDate = (date) => {
  return new Date(date).toISOString().split("T")[0];
};

const getDayName = (date) => {
  const days = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
  return days[date.getDay()];
};

const getNext7Days = (startDate) => {
  const dates = [];
  const start = new Date(startDate);
  for (let i = 0; i < 7; i++) {
    const date = new Date(start);
    date.setDate(start.getDate() + i);
    dates.push(date);
  }
  return dates;
};

const AttendanceTracking = () => {
  const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
  const [weekDates, setWeekDates] = useState(getNext7Days(new Date()));
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStaffName, setFilterStaffName] = useState("");
  
  const [showPopup, setShowPopup] = useState(false);
  const [popupDate, setPopupDate] = useState(null);
  const [popupShift, setPopupShift] = useState(null);
  const [popupSchedules, setPopupSchedules] = useState([]);
  const [popupLoading, setPopupLoading] = useState(false);

  useEffect(() => {
    fetchSchedules();
  }, [selectedDate]);

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const startDate = selectedDate;
      const endDate = new Date(selectedDate);
      endDate.setDate(endDate.getDate() + 6);

      const data = await getAllSchedules({
        startDate,
        endDate: formatDate(endDate),
      });
      setSchedules(data);
    } catch (err) {
      console.error("Failed to fetch schedules:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    setWeekDates(getNext7Days(new Date(date)));
  };

  const getSchedulesForDateAndShift = (date, shift) => {
    if (!date) return [];
    const dateStr = formatDate(date);
    let filtered = schedules.filter((s) => {
      if (!s.date) return false;
      return formatDate(new Date(s.date)) === dateStr && s.shift === shift;
    });

    if (filterStaffName.trim()) {
      filtered = filtered.filter((s) =>
        s.fullName.toLowerCase().includes(filterStaffName.toLowerCase())
      );
    }

    return filtered;
  };

  const getAttendanceStatusClass = (status) => {
    switch (status) {
      case "attended":
        return "status-attended";
      case "absent":
        return "status-absent";
      case "not-yet":
      default:
        return "status-not-yet";
    }
  };

  const getAttendanceStatusText = (schedule) => {
    if (schedule.attendanceStatus === "attended") {
      if (schedule.checkInTime && schedule.checkOutTime) {
        return "Hoàn thành";
      } else if (schedule.checkInTime) {
        return "Đã check-in";
      }
    }
    if (schedule.attendanceStatus === "absent") {
      return "Vắng mặt";
    }
    return "Chưa điểm danh";
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "--:--";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const openPopup = async (date, shift) => {
    setPopupDate(date);
    setPopupShift(shift);
    setPopupLoading(true);
    setShowPopup(true);

    try {
      const data = await getSchedulesByDate(formatDate(date), shift);
      setPopupSchedules(data);
    } catch (err) {
      console.error("Failed to fetch schedules:", err);
      setPopupSchedules([]);
    } finally {
      setPopupLoading(false);
    }
  };

  const closePopup = () => {
    setShowPopup(false);
    setPopupDate(null);
    setPopupShift(null);
    setPopupSchedules([]);
  };

  const getShiftTimes = (shiftId) => {
    const shift = SHIFTS.find((s) => s.id === shiftId);
    return shift ? { start: shift.start, end: shift.end } : { start: "00:00", end: "00:00" };
  };

  const getShiftStartTime = (schedule) => {
    const { start } = getShiftTimes(schedule.shift);
    const [hours, minutes] = start.split(":").map(Number);
    const shiftStart = new Date(popupDate);
    shiftStart.setHours(hours, minutes, 0, 0);
    return shiftStart;
  };

  const getShiftEndTime = (schedule) => {
    const { end } = getShiftTimes(schedule.shift);
    const [hours, minutes] = end.split(":").map(Number);
    const shiftEnd = new Date(popupDate);
    shiftEnd.setHours(hours, minutes, 0, 0);
    return shiftEnd;
  };

  const canCheckIn = (schedule) => {
    if (!schedule || !popupDate) return false;
    const today = formatDate(new Date());
    if (formatDate(new Date(popupDate)) !== today) return false;
    if (schedule.checkInTime) return false;
    
    const shiftStart = getShiftStartTime(schedule);
    const now = new Date();
    const checkInStart = new Date(shiftStart);
    checkInStart.setMinutes(checkInStart.getMinutes() - 10);
    const checkInEnd = new Date(shiftStart);
    checkInEnd.setMinutes(checkInEnd.getMinutes() + 10);
    
    return now >= checkInStart && now <= checkInEnd;
  };

  const canCheckOut = (schedule) => {
    if (!schedule || !popupDate) return false;
    const today = formatDate(new Date());
    if (formatDate(new Date(popupDate)) !== today) return false;
    if (!schedule.checkInTime || schedule.checkOutTime) return false;
    
    const shiftEnd = getShiftEndTime(schedule);
    const now = new Date();
    const checkOutStart = new Date(shiftEnd);
    const checkOutEnd = new Date(shiftEnd);
    checkOutEnd.setMinutes(checkOutEnd.getMinutes() + 10);
    
    return now >= checkOutStart && now <= checkOutEnd;
  };

  const handleCheckIn = async (scheduleId) => {
    try {
      await adminCheckIn(scheduleId);
      const data = await getSchedulesByDate(formatDate(popupDate), popupShift);
      setPopupSchedules(data);
    } catch (err) {
      alert(err.message || "Check-in thất bại");
    }
  };

  const handleCheckOut = async (scheduleId) => {
    try {
      await adminCheckOut(scheduleId);
      const data = await getSchedulesByDate(formatDate(popupDate), popupShift);
      setPopupSchedules(data);
    } catch (err) {
      alert(err.message || "Check-out thất bại");
    }
  };

  return (
    <div className="admin-management">
      <div className="management-header">
        <h2>Theo dõi điểm danh</h2>
        <div className="header-controls">
          <div className="date-picker-group">
            <label>Chọn ngày bắt đầu:</label>
            <input
              type="date"
              value={selectedDate}
              onChange={handleDateChange}
              className="date-picker"
            />
          </div>
          <div className="filter-group">
            <label>Lọc theo tên nhân viên:</label>
            <input
              type="text"
              placeholder="Nhập tên nhân viên..."
              value={filterStaffName}
              onChange={(e) => setFilterStaffName(e.target.value)}
              className="filter-input"
            />
          </div>
        </div>
      </div>

      <div className="attendance-info">
        <p>
          Hiển thị lịch làm việc từ <strong>{selectedDate}</strong> đến{" "}
          <strong>{formatDate(weekDates[6])}</strong>
        </p>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="attendance-table-container">
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Ca làm</th>
                {weekDates.map((date) => (
                  <th key={date.toISOString()}>
                    {getDayName(date)}
                    <br />
                    {formatDate(date)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SHIFTS.map((shift) => (
                <tr key={shift.id}>
                  <td className="shift-cell">{shift.label}</td>
                  {weekDates.map((date) => {
                    const daySchedules = getSchedulesForDateAndShift(date, shift.id);
                    return (
                      <td
                        key={`${date.toISOString()}-${shift.id}`}
                        className="attendance-cell clickable"
                        onClick={() => openPopup(date, shift.id)}
                      >
                        {daySchedules.map((s) => (
                          <div
                            key={s._id}
                            className={`attendance-item ${getAttendanceStatusClass(
                              s.attendanceStatus
                            )}`}
                          >
                            <div className="staff-name">{s.fullName}</div>
                            <div className="attendance-status">
                              {getAttendanceStatusText(s)}
                            </div>
                            {s.checkInTime && (
                              <div className="time-info">
                                In: {formatTime(s.checkInTime)}
                              </div>
                            )}
                            {s.checkOutTime && (
                              <div className="time-info">
                                Out: {formatTime(s.checkOutTime)}
                              </div>
                            )}
                          </div>
                        ))}
                        {daySchedules.length === 0 && (
                          <span className="no-schedule">Không có lịch</span>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showPopup && (
        <div className="modal-overlay" onClick={closePopup}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                Điểm danh - {popupDate && formatDate(popupDate)} - {popupShift}
              </h3>
              <button className="close-btn" onClick={closePopup}>
                ×
              </button>
            </div>
            <div className="modal-body">
              {popupLoading ? (
                <p>Loading...</p>
              ) : popupSchedules.length === 0 ? (
                <p>Không có lịch làm việc</p>
              ) : (
                <table className="attendance-popup-table">
                  <thead>
                    <tr>
                      <th>Nhân viên</th>
                      <th>Trạng thái</th>
                      <th>Check-in</th>
                      <th>Check-out</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {popupSchedules.map((schedule) => (
                      <tr key={schedule._id}>
                        <td>{schedule.fullName}</td>
                        <td>
                          <span className={`status-badge ${getAttendanceStatusClass(schedule.attendanceStatus)}`}>
                            {schedule.attendanceStatus === "attended" ? "Có mặt" : 
                             schedule.attendanceStatus === "absent" ? "Vắng mặt" : "Chưa điểm danh"}
                          </span>
                        </td>
                        <td>
                          {schedule.checkInTime ? formatTime(schedule.checkInTime) : "--:--"}
                        </td>
                        <td>
                          {schedule.checkOutTime ? formatTime(schedule.checkOutTime) : "--:--"}
                        </td>
                        <td>
                          <div className="action-buttons">
                            {canCheckIn(schedule) && (
                              <button
                                className="btn-checkin"
                                onClick={() => handleCheckIn(schedule._id)}
                              >
                                Check-in
                              </button>
                            )}
                            {canCheckOut(schedule) && (
                              <button
                                className="btn-checkout"
                                onClick={() => handleCheckOut(schedule._id)}
                              >
                                Check-out
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AttendanceTracking;