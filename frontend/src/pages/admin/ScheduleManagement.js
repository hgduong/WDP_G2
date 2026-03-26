import React, { useEffect, useState, useContext } from "react";
import {
  getAllSchedules,
  createSchedule,
  updateSchedule,
  getStaffList,
  getShiftDetails,
} from "../../services/api";
import { UserContext } from "../../context/UserContext";
import "./AdminManagement.css";

const SHIFTS = [
  { id: "Sáng", label: "Sáng (6h30-12h)" },
  { id: "Chiều", label: "Chiều (12h30-17h)" },
  { id: "Tối", label: "Tối (17h30-22h)" },
];

const getMonday = (date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
};

const formatDate = (date) => {
  return new Date(date).toISOString().split("T")[0];
};

const getWeekDates = (monday) => {
  const dates = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    dates.push(date);
  }
  return dates;
};

const getDayName = (date) => {
  const days = ["Chủ Nhật", "Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7"];
  return days[date.getDay()];
};

const ScheduleManagement = () => {
  const { user } = useContext(UserContext);
  const [schedules, setSchedules] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Date selection
  const [selectedMonday, setSelectedMonday] = useState(getMonday(new Date()));
  const [weekDates, setWeekDates] = useState(getWeekDates(getMonday(new Date())));
  
  // Form state
  const [selectedStaff, setSelectedStaff] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedShift, setSelectedShift] = useState("");
  const [shiftDetails, setShiftDetails] = useState({ Sáng: [], Chiều: [], Tối: [] });
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailSchedule, setDetailSchedule] = useState(null);

  const fetchStaff = async () => {
    try {
      const data = await getStaffList();
      setStaffList(data);
    } catch (err) {
      console.error("Failed to fetch staff:", err);
    }
  };

  const fetchShiftDetails = async (date) => {
    try {
      const data = await getShiftDetails(date);
      setShiftDetails(data);
    } catch (err) {
      console.error("Failed to fetch shift details:", err);
    }
  };

  const fetchSchedules = async () => {
    try {
      setLoading(true);
      const startDate = formatDate(selectedMonday);
      const endDate = new Date(selectedMonday);
      endDate.setDate(endDate.getDate() + 6);
      
      const data = await getAllSchedules({
        startDate,
        endDate: formatDate(endDate),
      });
      setSchedules(data);
    } catch (err) {
      console.error("Failed to fetch schedules:", err);
      setError("Failed to load schedules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    fetchSchedules();
  }, [selectedMonday]);

  useEffect(() => {
    if (selectedDate) {
      fetchShiftDetails(selectedDate);
    }
  }, [selectedDate]);

  const handleMondayChange = (e) => {
    const date = new Date(e.target.value);
    setSelectedMonday(date);
    setWeekDates(getWeekDates(date));
  };

  const handleStaffChange = (e) => {
    setSelectedStaff(e.target.value);
    setSelectedShift("");
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setSelectedShift("");
  };

  const handleShiftChange = (e) => {
    setSelectedShift(e.target.value);
  };

  const canEditSchedule = (schedule) => {
    const hoursSinceCreation = (Date.now() - new Date(schedule.createAt).getTime()) / (1000 * 60 * 60);
    return hoursSinceCreation <= 5;
  };

  const handleCreateSchedule = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedStaff || !selectedDate || !selectedShift) {
      setError("Vui lòng chọn đầy đủ thông tin");
      return;
    }

    const staff = staffList.find((s) => s._id === selectedStaff);
    
    try {
      await createSchedule({
        staffId: selectedStaff,
        fullName: staff.fullName,
        date: selectedDate,
        shift: selectedShift,
        createBy: user?.fullName || "Admin",
        role: "Staff",
      });
      setSuccess("Tạo lịch làm việc thành công!");
      setShowModal(false);
      resetForm();
      fetchSchedules();
      if (selectedDate) fetchShiftDetails(selectedDate);
    } catch (err) {
      setError(err.message || "Failed to create schedule");
    }
  };

  const handleUpdateSchedule = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedShift) {
      setError("Vui lòng chọn ca làm việc");
      return;
    }

    try {
      await updateSchedule(editingSchedule._id, {
        shift: selectedShift,
      });
      setSuccess("Cập nhật lịch làm việc thành công!");
      setShowModal(false);
      setEditingSchedule(null);
      resetForm();
      fetchSchedules();
      if (selectedDate) fetchShiftDetails(selectedDate);
    } catch (err) {
      setError(err.message || "Failed to update schedule");
    }
  };

  const openEditModal = (schedule) => {
    if (!canEditSchedule(schedule)) {
      setError("Chỉ được chỉnh sửa trong vòng 5 giờ từ khi tạo");
      return;
    }
    setEditingSchedule(schedule);
    setSelectedStaff(schedule.staffId);
    setSelectedDate(formatDate(new Date(schedule.date)));
    setSelectedShift(schedule.shift);
    setShowModal(true);
    setError("");
    setSuccess("");
  };

  const openDetailModal = (schedule) => {
    setDetailSchedule(schedule);
    setShowDetailModal(true);
  };

  const resetForm = () => {
    setSelectedStaff("");
    setSelectedDate("");
    setSelectedShift("");
    setEditingSchedule(null);
  };

  const getSchedulesForDateAndShift = (date, shift) => {
    if (!date) return [];
    const dateStr = formatDate(date);
    return schedules.filter(
      (s) => {
        if (!s.date) return false;
        return formatDate(new Date(s.date)) === dateStr && s.shift === shift;
      }
    );
  };

  const getStaffShiftCount = (staffId, date) => {
    if (!date) return 0;
    const dateStr = formatDate(new Date(date));
    return schedules.filter(
      (s) => {
        if (!s.date) return false;
        return formatDate(new Date(s.date)) === dateStr && s.staffId === staffId;
      }
    ).length;
  };

  return (
    <div className="admin-management">
      <div className="management-header">
        <h2>Tạo lịch làm việc</h2>
        <div>
          <input
            type="date"
            value={formatDate(selectedMonday)}
            onChange={handleMondayChange}
            className="monday-picker"
          />
          <button
            className="btn btn-primary"
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
          >
            + Thêm lịch
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {/* Week View Table */}
      <div className="schedule-table-container">
        {loading ? (
          <p>Loading...</p>
        ) : (
          <table className="schedule-table">
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
                      <td key={`${date.toISOString()}-${shift.id}`} className="schedule-cell">
                        {daySchedules.map((s) => (
                          <div
                            key={s._id}
                            className="schedule-item"
                            onClick={() => openDetailModal(s)}
                          >
                            {s.fullName}
                          </div>
                        ))}
                        <span className="staff-count">
                          {daySchedules.length}/5 staff
                        </span>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editingSchedule ? "Chỉnh sửa lịch" : "Tạo lịch làm việc"}</h3>
            <form onSubmit={editingSchedule ? handleUpdateSchedule : handleCreateSchedule}>
              {!editingSchedule && (
                <>
                  <div className="form-group">
                    <label>Chọn Staff:</label>
                    <select
                      value={selectedStaff}
                      onChange={handleStaffChange}
                      required
                    >
                      <option value="">-- Chọn Staff --</option>
                      {staffList.map((staff) => {
                        const shiftCount = getStaffShiftCount(staff._id, selectedDate);
                        return (
                          <option
                            key={staff._id}
                            value={staff._id}
                            disabled={shiftCount >= 2}
                          >
                            {staff.fullName} {shiftCount >= 2 ? "(Đủ 2 ca)" : ""}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Chọn ngày:</label>
                    <input
                      type="date"
                      value={selectedDate}
                      onChange={handleDateChange}
                      min={formatDate(new Date())}
                      required
                    />
                  </div>
                </>
              )}
              
              <div className="form-group">
                <label>Chọn ca làm việc:</label>
                <select
                  value={selectedShift}
                  onChange={handleShiftChange}
                  required
                >
                  <option value="">-- Chọn ca --</option>
                  {SHIFTS.map((shift) => {
                    const shiftCount = shiftDetails[shift.id]?.length || 0;
                    return (
                      <option
                        key={shift.id}
                        value={shift.id}
                        disabled={shiftCount >= 5}
                      >
                        {shift.label} {shiftCount >= 5 ? "(Đã đủ)" : `(${shiftCount}/5 staff)`}
                      </option>
                    );
                  })}
                </select>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSchedule ? "Cập nhật" : "Tạo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && detailSchedule && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Chi tiết lịch làm việc</h3>
            <div className="detail-content">
              <p><strong>Nhân viên:</strong> {detailSchedule.fullName}</p>
              <p><strong>Ngày:</strong> {formatDate(new Date(detailSchedule.date))}</p>
              <p><strong>Ca làm:</strong> {detailSchedule.shift}</p>
              <p><strong>Người tạo:</strong> {detailSchedule.createBy}</p>
              <p><strong>Ngày tạo:</strong> {new Date(detailSchedule.createAt).toLocaleString()}</p>
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowDetailModal(false)}
              >
                Đóng
              </button>
              {canEditSchedule(detailSchedule) && (
                <button
                  type="button"
                  className="btn btn-edit"
                  onClick={() => {
                    setShowDetailModal(false);
                    openEditModal(detailSchedule);
                  }}
                >
                  Chỉnh sửa
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleManagement;