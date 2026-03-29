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
