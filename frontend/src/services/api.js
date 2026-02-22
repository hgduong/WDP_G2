import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:9999",
  withCredentials: true,
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
    const res = await API.post("/check-email-exists", { email });
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

export const getUserInfo = async () => {
  try {
    const res = await API.get("/user-info");
    return res;
  } catch (error) {
    throw error;
  }
};

export const changePassword = async (currentPassword, newPassword, confirmPassword) => {
  try {
    const res = await API.post("/user/change-password", {
      currentPassword,
      newPassword,
      confirmPassword
    });
    return res;
  } catch (error) {
    throw error;
  }
};

// Lấy danh sách tỉnh/thành phố
export const getProvinces = async () => {
  try {
    const res = await API.get("/api/provinces");
    return res.data; // dữ liệu JSON từ backend
  } catch (error) {
    throw error;
  }
};

// Lấy danh sách quận/huyện theo provinceId
export const getDistricts = async (provinceCode) => {
  try {
    const res = await API.get(`/api/districts/${provinceCode}`);
    return res.data;
  } catch (error) {
    throw error;
  }
};

// Lấy danh sách phường/xã theo districtId
export const getWards = async (districtCode) => {
  try {
    const res = await API.get(`/api/wards/${districtCode}`);
    return res.data;
  } catch (error) {
    throw error;
  }
};

// Lấy thông tin chi tiết user
export const getUserProfile = async () => {
  try {
    const response = await API.get(`/user/profile`);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin user profile:", error);
    throw error;
  }
};

// Cập nhật thông tin user
export const updateUserProfile = async (credentials) => {
  try {
    const response = await API.put(`/user/profile`, credentials);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi cập nhật user profile:", error);
    throw error;
  }
};


