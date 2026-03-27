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
                          <div className="schedule-actions">
                            {isTodayDay && schedule.attendanceStatus === "not-yet" && (
                              <>
                                <button
                                  className="action-btn check-in-btn"
                                  onClick={() => handleCheckIn(schedule._id)}
                                >
                                  Check-in
                                </button>
                              </>
                            )}
                            {isTodayDay &&
                              schedule.attendanceStatus === "attended" &&
                              !schedule.checkOutTime && (
                                <button
                                  className="action-btn check-out-btn"
                                  onClick={() => handleCheckOut(schedule._id)}
                                >
                                  Check-out
                                </button>
                              )}
                          </div>
                          {schedule.checkInTime && (
                            <div className="time-info">
                              <span className="time-label">Vào:</span>
                              <span className="time-value">
                                {new Date(schedule.checkInTime).toLocaleTimeString(
                                  "vi-VN",
                                  { hour: "2-digit", minute: "2-digit" }
                                )}
                              </span>
                            </div>
                          )}
                          {schedule.checkOutTime && (
                            <div className="time-info">
                              <span className="time-label">Ra:</span>
                              <span className="time-value">
                                {new Date(schedule.checkOutTime).toLocaleTimeString(
                                  "vi-VN",
                                  { hour: "2-digit", minute: "2-digit" }
                                )}
                              </span>
                            </div>
                          )}
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
