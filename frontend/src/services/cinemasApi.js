import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:9999",
  withCredentials: true,
});

// ═══════════════════════════════════════════════════════════════════════════════
// CINEMAS API (Prefix: /api/cinemas)
// ═══════════════════════════════════════════════════════════════════════════════

// Cinemas
export const getAllCinemas = async () => {
  try {
    const response = await API.get("/api/cinemas");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getCinemaById = async (id) => {
  try {
    const response = await API.get(`/api/cinemas/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createCinema = async (cinemaData) => {
  try {
    const response = await API.post("/api/cinemas", cinemaData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateCinema = async (id, cinemaData) => {
  try {
    const response = await API.put(`/api/cinemas/${id}`, cinemaData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteCinema = async (id) => {
  try {
    const response = await API.delete(`/api/cinemas/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Rooms
export const getRoomsByCinema = async (cinemaId) => {
  try {
    const response = await API.get(`/api/cinemas/${cinemaId}/rooms`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getRoomById = async (id) => {
  try {
    const response = await API.get(`/api/cinemas/rooms/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createRoom = async (roomData) => {
  try {
    const response = await API.post("/api/cinemas/rooms", roomData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateRoom = async (id, roomData) => {
  try {
    const response = await API.put(`/api/cinemas/rooms/${id}`, roomData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteRoom = async (id) => {
  try {
    const response = await API.delete(`/api/cinemas/rooms/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
