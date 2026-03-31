import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:9999",
  withCredentials: true,
});

// ═══════════════════════════════════════════════════════════════════════════════
// SHOWTIMES API (Prefix: /api/movies/showtimes)
// ═══════════════════════════════════════════════════════════════════════════════

// Showtimes
export const getAllShowtimes = async () => {
  try {
    const response = await API.get("/api/movies/showtimes");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getShowtimeById = async (id) => {
  try {
    const response = await API.get(`/api/movies/showtimes/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getShowtimesByMovie = async (movieId) => {
  try {
    const response = await API.get(`/api/movies/showtimes/movie/${movieId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getShowtimesByCinema = async (cinemaId) => {
  try {
    const response = await API.get(`/api/movies/showtimes/cinema/${cinemaId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getShowtimesByIds = async (ids) => {
  try {
    const response = await API.post("/api/movies/showtimes/ids", { ids });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createShowtime = async (showtimeData) => {
  try {
    const response = await API.post("/api/movies/showtimes", showtimeData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateShowtime = async (id, showtimeData) => {
  try {
    const response = await API.put(`/api/movies/showtimes/${id}`, showtimeData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteShowtime = async (id) => {
  try {
    const response = await API.delete(`/api/movies/showtimes/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
