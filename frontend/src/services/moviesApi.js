import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:9999",
  withCredentials: true,
});

// ═══════════════════════════════════════════════════════════════════════════════
// MOVIES API (Prefix: /api/movies)
// ═══════════════════════════════════════════════════════════════════════════════

// Movies
export const getAllMovies = async () => {
  try {
    const response = await API.get("/api/movies/all");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getMovieById = async (id) => {
  try {
    const response = await API.get(`/api/movies/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createMovie = async (movieData) => {
  try {
    const response = await API.post("/api/movies", movieData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateMovie = async (id, movieData) => {
  try {
    const response = await API.put(`/api/movies/${id}`, movieData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteMovie = async (id) => {
  try {
    const response = await API.delete(`/api/movies/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getNowShowingMovies = async () => {
  try {
    const response = await API.get("/api/movies/now-showing");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getComingSoonMovies = async () => {
  try {
    const response = await API.get("/api/movies/coming-soon");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getSpecialMovies = async () => {
  try {
    const response = await API.get("/api/movies/special");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
