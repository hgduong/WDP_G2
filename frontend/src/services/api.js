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

export const staffLogin = async (credentials) => {
  try {
    const res = await API.post("/staff/login", credentials);
    return res;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const requestStaffLoginOtp = async (payload) => {
  try {
    const res = await API.post("/staff/login/request-otp", payload);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const verifyStaffLoginOtp = async (payload) => {
  try {
    const res = await API.post("/staff/login/verify-otp", payload);
    return res;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const registerStaffAccount = async (staffData) => {
  try {
    const res = await API.post("/staff/register", staffData);
    return res.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const logoutUser = async () => {
  try {
    const res = await API.post("/logout");
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

export const changePassword = async (
  currentPassword,
  newPassword,
  confirmPassword,
) => {
  try {
    const res = await API.post("/user/change-password", {
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

export const deleteUserAccount = async (password) => {
  try {
    const response = await API.put(`/user/account`, { password });
    return response.data;
  } catch (error) {
    console.error("Lỗi khi xóa tài khoản:", error);
    throw error;
  }
};

// ==================== ADMIN API ====================

// Movies
export const getAllMovies = async () => {
  try {
    const response = await API.get("/movies/all");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getMovieById = async (id) => {
  try {
    const response = await API.get(`/movies/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createMovie = async (movieData) => {
  try {
    const response = await API.post("/movies", movieData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateMovie = async (id, movieData) => {
  try {
    const response = await API.put(`/movies/${id}`, movieData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteMovie = async (id) => {
  try {
    const response = await API.delete(`/movies/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Cinemas
export const getAllCinemas = async () => {
  try {
    const response = await API.get("/cinemas");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getCinemaById = async (id) => {
  try {
    const response = await API.get(`/cinemas/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createCinema = async (cinemaData) => {
  try {
    const response = await API.post("/cinemas", cinemaData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateCinema = async (id, cinemaData) => {
  try {
    const response = await API.put(`/cinemas/${id}`, cinemaData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteCinema = async (id) => {
  try {
    const response = await API.delete(`/cinemas/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Rooms
export const getRoomsByCinema = async (cinemaId) => {
  try {
    const response = await API.get(`/cinemas/${cinemaId}/rooms`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getRoomById = async (id) => {
  try {
    const response = await API.get(`/rooms/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createRoom = async (roomData) => {
  try {
    const response = await API.post("/rooms", roomData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateRoom = async (id, roomData) => {
  try {
    const response = await API.put(`/rooms/${id}`, roomData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteRoom = async (id) => {
  try {
    const response = await API.delete(`/rooms/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Showtimes
export const getAllShowtimes = async () => {
  try {
    const response = await API.get("/showtimes");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getShowtimeById = async (id) => {
  try {
    const response = await API.get(`/showtimes/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getShowtimesByMovie = async (movieId) => {
  try {
    const response = await API.get(`/showtimes/movie/${movieId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getShowtimesByCinema = async (cinemaId) => {
  try {
    const response = await API.get(`/showtimes/cinema/${cinemaId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createShowtime = async (showtimeData) => {
  try {
    const response = await API.post("/showtimes", showtimeData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateShowtime = async (id, showtimeData) => {
  try {
    const response = await API.put(`/showtimes/${id}`, showtimeData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteShowtime = async (id) => {
  try {
    const response = await API.delete(`/showtimes/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

//Staff
export const getAllStaff = async () => {
  try {
    const response = await API.get("/staffs");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
export const getStaffById = async (id) => {
  try {
    const response = await API.get(`/staffs/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
export const createStaff = async (staffData) => {
  try {
    const response = await API.post("/staffs", staffData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
export const updateStaff = async (id, staffData) => {
  try {
    const response = await API.put(`/staffs/${id}`, staffData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
export const deleteStaff = async (id) => {
  try {
    const response = await API.delete(`/staffs/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
export const updateStaffStatus = async (id, status) => {
  try {
    const response = await API.patch(`/staffs/${id}/status`, { status });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
export const changeStaffPassword = async (id, passwordData) => {
  try {
    const response = await API.post(
      `/staffs/${id}/change-password`,
      passwordData,
    );
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
