import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:9999",
  withCredentials: true,
});

// ═══════════════════════════════════════════════════════════════════════════════
// AUTH API (Prefix: /api/auth)
// ═══════════════════════════════════════════════════════════════════════════════

// Hàm gọi API đăng ký
export const registerUser = async (userData) => {
  try {
    const res = await API.post("/api/auth/register", userData);
    return res;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Hàm gọi API đăng nhập
export const loginUser = async (credentials) => {
  try {
    const res = await API.post("/api/auth/login", credentials);
    return res;
  } catch (error) {
    throw error; // Throw full error để Access all properties
  }
};

export const staffLogin = async (credentials) => {
  try {
    const res = await API.post("/api/auth/staff/login", credentials);
    return res;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const requestStaffLoginOtp = async (payload) => {
  try {
    const res = await API.post("/api/auth/staff/login/request-otp", payload);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const verifyStaffLoginOtp = async (payload) => {
  try {
    const res = await API.post("/api/auth/staff/login/verify-otp", payload);
    return res;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const registerStaffAccount = async (staffData) => {
  try {
    const res = await API.post("/api/staff/register", staffData);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const logoutUser = async () => {
  try {
    const res = await API.post("/api/auth/logout");
    return res;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const sendOtp = async (email) => {
  try {
    const res = await API.post("/api/auth/send-otp", { email });
    return res;
  } catch (error) {
    throw error;
  }
};

export const verifyOtp = async (email, otp, purpose) => {
  try {
    const res = await API.post("/api/auth/verify-otp", { email, otp, purpose });
    return res;
  } catch (error) {
    throw error;
  }
};

export const checkEmailExists = async (email) => {
  try {
    const res = await API.post("/api/auth/check-email-exists", { email });
    return res;
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (token, newPassword) => {
  try {
    const res = await API.post("/api/auth/reset-password", { token, newPassword });
    return res;
  } catch (error) {
    throw error;
  }
};

export const getUserInfo = async () => {
  try {
    const res = await API.get("/api/auth/user-info");
    return res;
  } catch (error) {
    throw error;
  }
};
