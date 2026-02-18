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

export const verifyOtp = async (email, otp, purpose) => {
  try {
    const res = await API.post("/verify-otp", { email, otp, purpose });
    return res;
  } catch (error) {
    throw error;
  }
};

export const checkEmailExists = async (email) => {
  try {
    const res = await API.post("/check-email-exists", { email});
    return res;
  } catch (error) {
    throw error;
  }
};

export const resetPassword = async (token, newPassword) => {
  try {
    const res = await API.post("/reset-password", { token, newPassword });
    return res;
  } catch (error) {
    throw error;
  }
};


export const getUserInfo = async (token) => {
  try {
    const res = await API.get("/profile", {
      headers: { Authorization: `Bearer ${token}` },
    });
    return res;
  } catch (error) {
    throw error;
  }
};



export const updateUserInfo = async (userData) => {
  try {
    const res = await API.put("/profile", userData);
    return res;
  } catch (error) {
    throw error;
  }
};

export const changePassword = async (currentPassword, newPassword) => {
  try {
    const res = await API.post("/change-password", { currentPassword, newPassword });
    return res;
  } catch (error) {
    throw error;
  }
};