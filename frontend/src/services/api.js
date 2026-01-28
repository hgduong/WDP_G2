import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:9999",
});

// Hàm gọi API đăng ký
export const registerUser = async (userData) => {
  try {
    const res = await API.post("/register", userData);
    return res;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Hàm gọi API đăng nhập
export const loginUser = async (credentials) => {
  try {
    const res = await API.post("/login", credentials);
    return res;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const sendOtp = async (email) => {
  try {
    const res = await API.post("/send-otp", { email });
    return res;
  } catch (error) {
    throw error;
  }
};

export const verifyOtp = async (email, otp) => {
  try {
    const res = await API.post("/verify-otp", { email, otp });
    return res;
  } catch (error) {
    throw error;
  }
};
