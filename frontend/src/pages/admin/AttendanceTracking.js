import React, { useState, useEffect } from "react";
import { getAllSchedules, getStaffList } from "../../services/schedulesApi";
import "./AdminManagement.css";

const SHIFTS = [
  { id: "Sáng", label: "Sáng (6h30-12h)" },
  { id: "Chiều", label: "Chiều (12h30-17h)" },
  { id: "Tối", label: "Tối (17h30-22h)" },
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
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStaffName, setFilterStaffName] = useState("");

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [selectedDate]);

  const fetchStaff = async () => {
    try {
      const data = await getStaffList();
      setStaffList(data);
    } catch (err) {
      console.error("Failed to fetch staff:", err);
    }
  };

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

    // Filter by staff name if provided
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
                    const daySchedules = getSchedulesForDateAndShift(
                      date,
                      shift.id
                    );
                    return (
                      <td
                        key={`${date.toISOString()}-${shift.id}`}
                        className="attendance-cell"
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
    </div>
  );
};

export default AttendanceTracking;
