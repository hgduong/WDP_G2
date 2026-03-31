import React, { useEffect, useState, useContext } from "react";
import {
  getAllSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  getStaffList,
  getShiftDetails,
} from "../../services/schedulesApi";
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

const getNext7Days = () => {
  const dates = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
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
  const [selectedDates, setSelectedDates] = useState([]);
  const [selectedShift, setSelectedShift] = useState("");
  const [shiftDetails, setShiftDetails] = useState({ Sáng: [], Chiều: [], Tối: [] });
  const [showModal, setShowModal] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailSchedule, setDetailSchedule] = useState(null);
  const [next7Days, setNext7Days] = useState(getNext7Days());
  const [activeTab, setActiveTab] = useState("schedule");

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

  const handleMondayChange = (e) => {
    const date = new Date(e.target.value);
    setSelectedMonday(date);
    setWeekDates(getWeekDates(date));
  };

  const handleStaffChange = (e) => {
    setSelectedStaff(e.target.value);
    setSelectedShift("");
  };

  const handleDateToggle = (dateStr) => {
    setSelectedDates((prev) => {
      if (prev.includes(dateStr)) {
        return prev.filter((d) => d !== dateStr);
      }
      return [...prev, dateStr];
    });
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

    if (!selectedStaff || selectedDates.length === 0 || !selectedShift) {
      setError("Vui lòng chọn đầy đủ thông tin");
      return;
    }

    const staff = staffList.find((s) => s._id === selectedStaff);
    
    try {
      // Create schedules for all selected dates
      const promises = selectedDates.map((date) =>
        createSchedule({
          staffId: selectedStaff,
          fullName: staff.fullName,
          date: date,
          shift: selectedShift,
          createBy: user?.fullName || "Admin",
          role: "Staff",
        })
      );
      
      await Promise.all(promises);
      setSuccess(`Tạo lịch làm việc thành công cho ${selectedDates.length} ngày!`);
      setShowModal(false);
      resetForm();
      fetchSchedules();
    } catch (err) {
      // Handle error from backend - extract message from error object
      const errorMessage = err?.response?.data?.message || err?.message || err?.error || (typeof err === 'string' ? err : null) || "Failed to create schedule";
      setError(errorMessage);
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
    } catch (err) {
      // Handle error from backend - extract message from error object
      const errorMessage = err?.response?.data?.message || err?.message || err?.error || (typeof err === 'string' ? err : null) || "Failed to update schedule";
      setError(errorMessage);
    }
  };

  const handleDeleteSchedule = async (scheduleId) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa lịch làm việc này?")) {
      return;
    }

    setError("");
    setSuccess("");

    try {
      await deleteSchedule(scheduleId);
      setSuccess("Xóa lịch làm việc thành công!");
      setShowDetailModal(false);
      setDetailSchedule(null);
      fetchSchedules();
    } catch (err) {
      // Handle error from backend - extract message from error object
      const errorMessage = err?.response?.data?.message || err?.message || err?.error || (typeof err === 'string' ? err : null) || "Failed to delete schedule";
      setError(errorMessage);
    }
  };

  const openEditModal = (schedule) => {
    if (!canEditSchedule(schedule)) {
      setError("Chỉ được chỉnh sửa trong vòng 5 giờ từ khi tạo");
      return;
    }
    setEditingSchedule(schedule);
    setSelectedStaff(schedule.staffId);
    setSelectedDates([formatDate(new Date(schedule.date))]);
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
    setSelectedDates([]);
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

  // Check if staff has 2 or more shifts on a specific date
  const hasMaxShiftsOnDate = (staffId, dateStr) => {
    const shiftsOnDate = schedules.filter(
      (s) => s.staffId === staffId && formatDate(new Date(s.date)) === dateStr
    );
    return shiftsOnDate.length >= 2;
  };

  // Check if staff already has the same shift on a specific date
  const hasSameShiftOnDate = (staffId, dateStr, shift) => {
    return schedules.some(
      (s) => s.staffId === staffId && formatDate(new Date(s.date)) === dateStr && s.shift === shift
    );
  };

  // Check if a shift on a specific date already has 5 staff
  const isShiftFull = (dateStr, shift) => {
    const staffOnShift = schedules.filter(
      (s) => formatDate(new Date(s.date)) === dateStr && s.shift === shift
    );
    return staffOnShift.length >= 5;
  };

  // Check if staff is already assigned to any shift on a specific date
  const isStaffAssignedOnDate = (staffId, dateStr) => {
    return schedules.some(
      (s) => s.staffId === staffId && formatDate(new Date(s.date)) === dateStr
    );
  };

  // Get available staff for selected dates (not already assigned)
  const getAvailableStaff = () => {
    if (selectedDates.length === 0) return staffList;
    
    return staffList.filter((staff) => {
      // Check if staff is available for ALL selected dates
      return selectedDates.every((dateStr) => {
        // Staff already has 2 shifts on this date (any shift)
        if (hasMaxShiftsOnDate(staff._id, dateStr)) return false;
        // Staff already has the same shift on this date (if shift is selected)
        if (selectedShift && hasSameShiftOnDate(staff._id, dateStr, selectedShift)) return false;
        // Shift is already full (5 staff) on this date (if shift is selected)
        if (selectedShift && isShiftFull(dateStr, selectedShift)) return false;
        return true;
      });
    });
  };

  // Get reason why staff is not available
  const getStaffUnavailableReason = (staffId, dateStr) => {
    if (hasMaxShiftsOnDate(staffId, dateStr)) {
      return "Đã có 2 ca trong ngày";
    }
    if (selectedShift && hasSameShiftOnDate(staffId, dateStr, selectedShift)) {
      // Get the shift name that staff is already assigned to
      const assignedShifts = schedules.filter(
        (s) => s.staffId === staffId && formatDate(new Date(s.date)) === dateStr
      ).map(s => s.shift);
      return `Đã được phân công ca ${assignedShifts.join(', ')}`;
    }
    if (selectedShift && isShiftFull(dateStr, selectedShift)) {
      return "Ca đã đủ 5 staff";
    }
    return null;
  };

  // Get all unavailable staff with reasons
  const getUnavailableStaffWithReasons = () => {
    if (selectedDates.length === 0) return [];
    
    return staffList.filter((staff) => {
      return selectedDates.some((dateStr) => {
        return getStaffUnavailableReason(staff._id, dateStr) !== null;
      });
    }).map((staff) => {
      const reasons = selectedDates
        .map((dateStr) => {
          const reason = getStaffUnavailableReason(staff._id, dateStr);
          return reason ? `${dateStr}: ${reason}` : null;
        })
        .filter(Boolean);
      return { ...staff, reasons };
    });
  };

  return (
    <div className="admin-management">
      <div className="management-header">
        <h2>Quản lý lịch làm việc</h2>
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
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
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
                      {getAvailableStaff().map((staff) => (
                        <option key={staff._id} value={staff._id}>
                          {staff.fullName}
                        </option>
                      ))}
                    </select>
                    {selectedDates.length > 0 && getAvailableStaff().length === 0 && (
                      <p className="warning-text">Tất cả staff đã được phân công vào ngày đã chọn</p>
                    )}
                    {selectedDates.length > 0 && getUnavailableStaffWithReasons().length > 0 && (
                      <div className="unavailable-staff-info">
                        <p className="info-text">Staff không khả dụng:</p>
                        <ul className="unavailable-staff-list">
                          {getUnavailableStaffWithReasons().map((staff) => (
                            <li key={staff._id}>
                              <strong>{staff.fullName}:</strong>
                              <ul>
                                {staff.reasons.map((reason, idx) => (
                                  <li key={idx}>{reason}</li>
                                ))}
                              </ul>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="form-group">
                    <label>Chọn ca làm việc:</label>
                    <select
                      value={selectedShift}
                      onChange={handleShiftChange}
                      required
                    >
                      <option value="">-- Chọn ca --</option>
                      {SHIFTS.map((shift) => (
                        <option key={shift.id} value={shift.id}>
                          {shift.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Chọn ngày (7 ngày tiếp theo):</label>
                    <div className="date-checkboxes">
                      {next7Days.map((date) => {
                        const dateStr = formatDate(date);
                        const isSelected = selectedDates.includes(dateStr);
                        return (
                          <label key={dateStr} className="date-checkbox">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleDateToggle(dateStr)}
                            />
                            <span className="date-label">
                              {getDayName(date)} - {dateStr}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              {editingSchedule && (
                <div className="form-group">
                  <label>Chọn ca làm việc:</label>
                  <select
                    value={selectedShift}
                    onChange={handleShiftChange}
                    required
                  >
                    <option value="">-- Chọn ca --</option>
                    {SHIFTS.map((shift) => (
                      <option key={shift.id} value={shift.id}>
                        {shift.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {error && <p className="error-text">{error}</p>}
              {success && <p className="success-text">{success}</p>}
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
            {error && <div className="alert alert-error">{error}</div>}
            {success && <div className="alert alert-success">{success}</div>}
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
                <>
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
                  <button
                    type="button"
                    className="btn btn-delete"
                    onClick={() => handleDeleteSchedule(detailSchedule._id)}
                  >
                    Xóa
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduleManagement;