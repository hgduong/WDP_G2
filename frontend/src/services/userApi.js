import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:9999",
  withCredentials: true,
});

// ═══════════════════════════════════════════════════════════════════════════════
// USER API (Prefix: /api/users)
// ═══════════════════════════════════════════════════════════════════════════════

export const changePassword = async (
  currentPassword,
  newPassword,
  confirmPassword,
) => {
  try {
    const res = await API.post("/api/users/change-password", {
      currentPassword,
      newPassword,
      confirmPassword,
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
    const response = await API.get(`/api/users/profile`);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy thông tin user profile:", error);
    throw error;
  }
};

// Cập nhật thông tin user
export const updateUserProfile = async (credentials) => {
  try {
    const response = await API.put(`/api/users/profile`, credentials);
    return response.data;
  } catch (error) {
    console.error("Lỗi khi cập nhật user profile:", error);
    throw error;
  }
};

export const deleteUserAccount = async (password) => {
  try {
    const response = await API.put(`/api/users/account`, { password });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi xóa tài khoản:", error);
    throw error;
  }
};

// ═══════════════════════════════════════════════════════════════════════════════
// ADMIN USER MANAGEMENT API (Prefix: /api/users)
// ═══════════════════════════════════════════════════════════════════════════════

// Lấy danh sách tất cả người dùng (Admin)
export const getAllUsers = async (params = {}) => {
  try {
    const response = await API.get("/api/users", { params });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi lấy danh sách người dùng:", error);
    throw error.response?.data || error;
  }
};

// Cập nhật trạng thái người dùng (Admin)
export const updateUserStatus = async (userId, status) => {
  try {
    const response = await API.patch(`/api/users/${userId}/status`, { status });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái người dùng:", error);
    throw error.response?.data || error;
  }
};

// Cập nhật vai trò người dùng (Admin)
export const updateUserRole = async (userId, role) => {
  try {
    const response = await API.patch(`/api/users/${userId}/role`, { role });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi cập nhật vai trò người dùng:", error);
    throw error.response?.data || error;
  }
};

// Get booking history by userId (Admin)
export const getUserBookingsByUserId = async (userId) => {
  try {
    const response = await API.get(`/api/users/${userId}/bookings`);
    return response.data;
  } catch (error) {
    console.error("Failed to load user bookings:", error);
    throw error.response?.data || error;
  }
};
