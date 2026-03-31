import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:9999",
  withCredentials: true,
});

export const getAllDirectors = async () => {
  try {
    const response = await API.get("/api/directors");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createDirector = async (directorData) => {
  try {
    const response = await API.post("/api/directors", directorData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateDirector = async (id, directorData) => {
  try {
    const response = await API.put(`/api/directors/${id}`, directorData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteDirector = async (id) => {
  try {
    const response = await API.delete(`/api/directors/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
