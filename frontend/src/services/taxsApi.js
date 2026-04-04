import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:9999",
  withCredentials: true,
});

export const getAllTaxs = async () => {
  try {
    const response = await API.get("/api/taxs");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getTaxById = async (id) => {
  try {
    const response = await API.get(`/api/taxs/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createTax = async (taxData) => {
  try {
    const response = await API.post("/api/taxs", taxData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateTax = async (id, taxData) => {
  try {
    const response = await API.put(`/api/taxs/${id}`, taxData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteTax = async (id) => {
  try {
    const response = await API.delete(`/api/taxs/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const checkOverlap = async (data) => {
  try {
    const response = await API.post("/api/taxs/check-overlap", data);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getActiveFoodBeverageTax = async () => {
  try {
    const response = await API.get("/api/taxs/active/food-beverage", {
      params: { t: Date.now() },
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
    return response.data;
  } catch (error) {
    return null;
  }
};

export const getActiveMovieTicketTax = async () => {
  try {
    const response = await API.get("/api/taxs/active/movie-ticket", {
      params: { t: Date.now() },
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });
    return response.data;
  } catch (error) {
    return null;
  }
};