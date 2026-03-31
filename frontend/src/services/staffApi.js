import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:9999",
  withCredentials: true,
});

// ═══════════════════════════════════════════════════════════════════════════════
// STAFF API (Prefix: /api/staff)
// ═══════════════════════════════════════════════════════════════════════════════

export const getStaffBookingShowtimes = async (params = {}) => {
  try {
    const response = await API.get("/api/staff/bookings/showtimes", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getStaffBookingSeatMap = async (showtimeId) => {
  try {
    // Use public staff-booking seatmap route (no auth required)
    const response = await API.get(`/api/staff/bookings/seatmap/${showtimeId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createStaffBookingOrder = async (payload) => {
  try {
    const response = await API.post("/api/staff/bookings", payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getStaffDashboardStats = async () => {
  try {
    const response = await API.get("/api/staff/dashboard/stats");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getStaffBookings = async (params = {}) => {
  try {
    const response = await API.get("/api/staff/bookings", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getAllBookings = async (params = {}) => {
  try {
    const response = await API.get("/api/staff/bookings/all", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const verifyTicket = async (payload) => {
  try {
    const response = await API.post("/api/staff/tickets/verify", payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const overrideSeatStatus = async (payload) => {
  try {
    const response = await API.post("/api/staff/seats/override", payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const unlockInternalSeats = async (showtimeId) => {
  try {
    const response = await API.post("/api/staff/seats/unlock-internal", { showtimeId });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateBookingPayment = async (bookingId, payload) => {
  try {
    const response = await API.patch(`/api/staff/bookings/${bookingId}/payment`, payload);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getAuditLogs = async (params = {}) => {
  try {
    const response = await API.get("/api/staff/audit-logs", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN STAFF MANAGEMENT API (Prefix: /api/staff)
// ═══════════════════════════════════════════════════════════════════════════════

export const getAllStaff = async (params = {}) => {
  try {
    const response = await API.get("/api/staff", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getStaffById = async (id) => {
  try {
    const response = await API.get(`/api/staff/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createStaff = async (staffData) => {
  try {
    const response = await API.post("/api/staff", staffData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateStaff = async (id, staffData) => {
  try {
    const response = await API.put(`/api/staff/${id}`, staffData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteStaff = async (id) => {
  try {
    const response = await API.delete(`/api/staff/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateStaffStatus = async (id, statusData) => {
  try {
    const response = await API.patch(`/api/staff/${id}/status`, statusData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const changeStaffPassword = async (id, passwordData) => {
  try {
    const response = await API.post(`/api/staff/${id}/change-password`, passwordData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// STAFF SCHEDULE & ATTENDANCE API (Prefix: /api/staff)
// ═══════════════════════════════════════════════════════════════════════════════

// Lấy lịch làm việc của nhân viên hiện tại
export const getMySchedule = async (params = {}) => {
  try {
    const response = await API.get("/api/staff/schedule/my", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Check-in cho ca làm việc
export const staffCheckIn = async (scheduleId) => {
  try {
    const response = await API.post(`/api/staff/schedule/${scheduleId}/check-in`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Check-out cho ca làm việc
export const staffCheckOut = async (scheduleId) => {
  try {
    const response = await API.post(`/api/staff/schedule/${scheduleId}/check-out`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
