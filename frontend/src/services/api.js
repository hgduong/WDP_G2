import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:9999", 
});

// Hàm gọi API đăng ký
export const registerUser = async (userData) => {
  try {
    const res = await API.post("/register", userData);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Hàm gọi API đăng nhập
export const loginUser = async (credentials) => {
  try {
    const res = await API.post("/login", credentials);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
