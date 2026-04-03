import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:9999",
  withCredentials: true,
});

// ═══════════════════════════════════════════════════════════════════════════════
// SCHEDULES API (Prefix: /api/schedules)
// ═══════════════════════════════════════════════════════════════════════════════

export const createSchedule = async (scheduleData) => {
  try {
    const response = await API.post("/api/schedules", scheduleData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getAllSchedules = async () => {
  try {
    const response = await API.get("/api/schedules");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getStaffList = async () => {
  try {
    const response = await API.get("/api/schedules/staffs");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getShiftDetails = async (date) => {
  try {
    const response = await API.get(`/api/schedules/shifts/${date}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getScheduleById = async (id) => {
  try {
    const response = await API.get(`/api/schedules/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateSchedule = async (id, scheduleData) => {
  try {
    const response = await API.put(`/api/schedules/${id}`, scheduleData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteSchedule = async (id) => {
  try {
    const response = await API.delete(`/api/schedules/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get schedules by date for attendance
export const getSchedulesByDate = async (date, shift) => {
  try {
    const params = new URLSearchParams({ date });
    if (shift) params.append("shift", shift);
    const response = await API.get(`/api/schedules/date?${params}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Admin check-in
export const adminCheckIn = async (scheduleId) => {
  try {
    const response = await API.post(`/api/schedules/${scheduleId}/checkin`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Admin check-out
export const adminCheckOut = async (scheduleId) => {
  try {
    const response = await API.post(`/api/schedules/${scheduleId}/checkout`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Admin update attendance
export const adminUpdateAttendance = async (scheduleId, data) => {
  try {
    const response = await API.patch(`/api/schedules/${scheduleId}/attendance`, data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
