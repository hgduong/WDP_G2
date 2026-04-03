import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:9999",
  withCredentials: true,
});

// ═══════════════════════════════════════════════════════════════════════════════
// SEATS API (Prefix: /api/seats)
// ═══════════════════════════════════════════════════════════════════════════════

export const generateSeatLayout = async (seatData) => {
  try {
    const response = await API.post("/api/seats/generate", seatData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getSeatmapByShowtime = async (showtimeId) => {
  try {
    const response = await API.get(`/api/seats/${showtimeId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getHeldSeats = async (showtimeId) => {
  try {
    const response = await API.get(`/api/seats/held/${showtimeId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const holdSeats = async (seatData) => {
  try {
    const response = await API.post("/api/seats/hold", seatData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const releaseSeats = async (seatData) => {
  try {
    const response = await API.post("/api/seats/release", seatData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const bookSeats = async (seatData) => {
  try {
    const response = await API.post("/api/seats/book", seatData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getSeatsByRoom = async (roomId) => {
  try {
    const response = await API.get(`/api/seats/room/${roomId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateSeat = async (seatId, seatData) => {
  try {
    const response = await API.put(`/api/seats/${seatId}`, seatData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteSeat = async (seatId) => {
  try {
    const response = await API.delete(`/api/seats/${seatId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const addSeat = async (roomId, seatData) => {
  try {
    const response = await API.post(`/api/seats/room/${roomId}`, seatData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
