import React, { useState, useEffect } from "react";
import { getMySchedule, staffCheckIn, staffCheckOut } from "../../services/api";
import "../../assets/styles/StaffSchedule.css";

const StaffSchedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentWeekStart, setCurrentWeekStart] = useState(getMonday(new Date()));

  // Get Monday of the week
  function getMonday(date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  // Format date to YYYY-MM-DD
  function formatDate(date) {
    return date.toISOString().split("T")[0];
  }

  // Get array of 7 days starting from Monday
  function getWeekDays(startDate) {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  }

  // Fetch schedules for the current week
  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const weekEnd = new Date(currentWeekStart);
      weekEnd.setDate(currentWeekStart.getDate() + 6);

      const data = await getMySchedule({
        startDate: formatDate(currentWeekStart),
        endDate: formatDate(weekEnd),
      });

      setSchedules(Array.isArray(data) ? data : []);
      setError("");
    } catch (err) {
      setError(err?.message || "Không thể tải lịch làm việc");
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [currentWeekStart]);

  // Navigate to previous week
  const goToPreviousWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() - 7);
    setCurrentWeekStart(newStart);
  };

  // Navigate to next week
  const goToNextWeek = () => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() + 7);
    setCurrentWeekStart(newStart);
  };

  // Go to current week
  const goToCurrentWeek = () => {
    setCurrentWeekStart(getMonday(new Date()));
  };

  // Get schedule for a specific day and shift
  const getScheduleForSlot = (date, shift) => {
    const dateStr = formatDate(date);
    return schedules.find(
      (s) =>
        formatDate(new Date(s.date)) === dateStr && s.shift === shift
    );
  };

  // Get shift start time
  const getShiftStartTime = (date, shift) => {
    const shiftDate = new Date(date);
    let hours, minutes;
    
    switch (shift) {
      case "Sáng":
        hours = 6;
        minutes = 30;
        break;
      case "Chiều":
        hours = 12;
        minutes = 30;
        break;
      case "Tối":
        hours = 17;
        minutes = 30;
        break;
      default:
        hours = 0;
        minutes = 0;
    }
    
    shiftDate.setHours(hours, minutes, 0, 0);
    return shiftDate;
  };

  // Get shift end time
  const getShiftEndTime = (date, shift) => {
    const shiftDate = new Date(date);
    let hours, minutes;
    
    switch (shift) {
      case "Sáng":
        hours = 12;
        minutes = 0;
        break;
      case "Chiều":
        hours = 17;
        minutes = 0;
        break;
      case "Tối":
        hours = 22;
        minutes = 0;
        break;
      default:
        hours = 0;
        minutes = 0;
    }
    
    shiftDate.setHours(hours, minutes, 0, 0);
    return shiftDate;
  };

  // Check if check-in is available
  const isCheckInAvailable = (schedule) => {
    if (!schedule || schedule.attendanceStatus !== "not-yet") {
      return false;
    }
    
    const now = new Date();
    const shiftStart = getShiftStartTime(schedule.date, schedule.shift);
    const checkInStart = new Date(shiftStart);
    checkInStart.setMinutes(checkInStart.getMinutes() - 10);
    const checkInEnd = new Date(shiftStart);
    checkInEnd.setMinutes(checkInEnd.getMinutes() + 10);
    
    return now >= checkInStart && now <= checkInEnd;
  };

  // Check if check-out is available
  const isCheckOutAvailable = (schedule) => {
    if (!schedule || schedule.attendanceStatus !== "attended" || schedule.checkOutTime) {
      return false;
    }
    
    const now = new Date();
    const shiftEnd = getShiftEndTime(schedule.date, schedule.shift);
    const checkOutStart = new Date(shiftEnd);
    const checkOutEnd = new Date(shiftEnd);
    checkOutEnd.setMinutes(checkOutEnd.getMinutes() + 10);
    
    return now >= checkOutStart && now <= checkOutEnd;
  };

  // Get check-in window text
  const getCheckInWindow = (schedule) => {
    const shiftStart = getShiftStartTime(schedule.date, schedule.shift);
    const checkInStart = new Date(shiftStart);
    checkInStart.setMinutes(checkInStart.getMinutes() - 10);
    const checkInEnd = new Date(shiftStart);
    checkInEnd.setMinutes(checkInEnd.getMinutes() + 10);
    
    return `${checkInStart.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} - ${checkInEnd.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
  };

  // Get check-out window text
  const getCheckOutWindow = (schedule) => {
    const shiftEnd = getShiftEndTime(schedule.date, schedule.shift);
    const checkOutStart = new Date(shiftEnd);
    const checkOutEnd = new Date(shiftEnd);
    checkOutEnd.setMinutes(checkOutEnd.getMinutes() + 10);
    
    return `${checkOutStart.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })} - ${checkOutEnd.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}`;
  };

  // Handle check-in
  const handleCheckIn = async (scheduleId) => {
    try {
      await staffCheckIn(scheduleId);
      setSuccess("Check-in thành công!");
      fetchSchedules();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err?.message || "Check-in thất bại");
      setTimeout(() => setError(""), 3000);
    }
  };

  // Handle check-out
  const handleCheckOut = async (scheduleId) => {
    try {
      await staffCheckOut(scheduleId);
      setSuccess("Check-out thành công!");
      fetchSchedules();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err?.message || "Check-out thất bại");
      setTimeout(() => setError(""), 3000);
    }
  };

  // Get attendance status badge
  const getAttendanceBadge = (status) => {
    switch (status) {
      case "attended":
        return <span className="attendance-badge attended">Đã điểm danh</span>;
      case "absent":
        return <span className="attendance-badge absent">Vắng mặt</span>;
      case "not-yet":
        return <span className="attendance-badge not-yet">Chưa điểm danh</span>;
      default:
        return null;
    }
  };

  // Get shift time display
  const getShiftTime = (shift) => {
    switch (shift) {
      case "Sáng":
        return "06:30 - 12:00";
      case "Chiều":
        return "12:30 - 17:00";
      case "Tối":
        return "17:30 - 22:00";
      default:
        return "";
    }
  };

  // Check if date is today
  const isToday = (date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Check if date is in the past
  const isPast = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const weekDays = getWeekDays(currentWeekStart);
  const shifts = ["Sáng", "Chiều", "Tối"];

  // Format week range for display
  const weekRangeText = `${currentWeekStart.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  })} - ${weekDays[6].toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  })}`;

  if (loading) {
    return (
      <div className="staff-schedule">
        <div className="loading">Đang tải lịch làm việc...</div>
      </div>
    );
  }

  return (
    <div className="staff-schedule">
      <div className="schedule-header">
        <div className="header-content">
          <h1>📅 Lịch làm việc</h1>
          <p className="subtitle">Theo dõi lịch làm việc & Chấm công</p>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="week-navigation">
        <button className="nav-btn" onClick={goToPreviousWeek}>
          ← Tuần trước
        </button>
        <div className="week-info">
          <span className="week-range">{weekRangeText}</span>
          <button className="today-btn" onClick={goToCurrentWeek}>
            Hôm nay
          </button>
        </div>
        <button className="nav-btn" onClick={goToNextWeek}>
          Tuần sau →
        </button>
      </div>

      <div className="schedule-grid-container">
        <table className="schedule-grid">
          <thead>
            <tr>
              <th className="shift-header">Ca làm</th>
              {weekDays.map((day, index) => (
                <th
                  key={index}
                  className={`day-header ${isToday(day) ? "today" : ""} ${
                    isPast(day) ? "past" : ""
                  }`}
                >
                  <div className="day-name">
                    {day.toLocaleDateString("vi-VN", { weekday: "short" })}
                  </div>
                  <div className="day-date">
                    {day.toLocaleDateString("vi-VN", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {shifts.map((shift) => (
              <tr key={shift}>
                <td className="shift-cell">
                  <div className="shift-name">{shift}</div>
                  <div className="shift-time">{getShiftTime(shift)}</div>
                </td>
                {weekDays.map((day, dayIndex) => {
                  const schedule = getScheduleForSlot(day, shift);
                  const isPastDay = isPast(day);
                  const isTodayDay = isToday(day);
                  const canCheckIn = isCheckInAvailable(schedule);
                  const canCheckOut = isCheckOutAvailable(schedule);

                  return (
                    <td
                      key={dayIndex}
                      className={`schedule-cell ${isTodayDay ? "today" : ""} ${
                        isPastDay ? "past" : ""
                      } ${schedule ? "has-schedule" : ""}`}
                    >
                      {schedule ? (
                        <div className="schedule-card">
                          <div className="schedule-status">
                            {getAttendanceBadge(schedule.attendanceStatus)}
                          </div>
                          
                          {/* Check-in Section */}
                          <div className="check-section check-in-section">
                            <div className="check-header">
                              <span className="check-icon">🟢</span>
                              <span className="check-title">Check-in</span>
                            </div>
                            <div className="check-window">
                              {getCheckInWindow(schedule)}
                            </div>
                            {schedule.checkInTime ? (
                              <div className="check-time">
                                <span className="time-label">Đã check-in:</span>
                                <span className="time-value">
                                  {new Date(schedule.checkInTime).toLocaleTimeString(
                                    "vi-VN",
                                    { hour: "2-digit", minute: "2-digit" }
                                  )}
                                </span>
                              </div>
                            ) : (
                              <button
                                className={`action-btn check-in-btn ${!canCheckIn ? "disabled" : ""}`}
                                onClick={() => handleCheckIn(schedule._id)}
                                disabled={!canCheckIn}
                              >
                                {canCheckIn ? "Check-in" : "Chưa đến giờ"}
                              </button>
                            )}
                          </div>

                          {/* Check-out Section */}
                          <div className="check-section check-out-section">
                            <div className="check-header">
                              <span className="check-icon">🔴</span>
                              <span className="check-title">Check-out</span>
                            </div>
                            <div className="check-window">
                              {getCheckOutWindow(schedule)}
                            </div>
                            {schedule.checkOutTime ? (
                              <div className="check-time">
                                <span className="time-label">Đã check-out:</span>
                                <span className="time-value">
                                  {new Date(schedule.checkOutTime).toLocaleTimeString(
                                    "vi-VN",
                                    { hour: "2-digit", minute: "2-digit" }
                                  )}
                                </span>
                              </div>
                            ) : (
                              <button
                                className={`action-btn check-out-btn ${!canCheckOut ? "disabled" : ""}`}
                                onClick={() => handleCheckOut(schedule._id)}
                                disabled={!canCheckOut}
                              >
                                {canCheckOut ? "Check-out" : "Chưa đến giờ"}
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="empty-slot">
                          {isPastDay ? "—" : "Nghỉ"}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="schedule-legend">
        <h3>Chú thích</h3>
        <div className="legend-items">
          <div className="legend-item">
            <span className="attendance-badge attended">Đã điểm danh</span>
            <span>Đã check-in</span>
          </div>
          <div className="legend-item">
            <span className="attendance-badge absent">Vắng mặt</span>
            <span>Không check-in</span>
          </div>
          <div className="legend-item">
            <span className="attendance-badge not-yet">Chưa điểm danh</span>
            <span>Chưa đến giờ</span>
          </div>
        </div>
      </div>

      <div className="schedule-stats">
        <div className="stat-card">
          <div className="stat-icon">📊</div>
          <div className="stat-content">
            <div className="stat-value">
              {schedules.filter((s) => s.attendanceStatus === "attended").length}
            </div>
            <div className="stat-label">Đã điểm danh</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">❌</div>
          <div className="stat-content">
            <div className="stat-value">
              {schedules.filter((s) => s.attendanceStatus === "absent").length}
            </div>
            <div className="stat-label">Vắng mặt</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-value">
              {schedules.filter((s) => s.attendanceStatus === "not-yet").length}
            </div>
            <div className="stat-label">Chưa điểm danh</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📅</div>
          <div className="stat-content">
            <div className="stat-value">{schedules.length}</div>
            <div className="stat-label">Tổng ca làm</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffSchedule;
