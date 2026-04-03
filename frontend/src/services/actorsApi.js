import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:9999",
  withCredentials: true,
});

export const getAllActors = async () => {
  try {
    const response = await API.get("/api/actors");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createActor = async (actorData) => {
  try {
    const response = await API.post("/api/actors", actorData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateActor = async (id, actorData) => {
  try {
    const response = await API.put(`/api/actors/${id}`, actorData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteActor = async (id) => {
  try {
    const response = await API.delete(`/api/actors/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
