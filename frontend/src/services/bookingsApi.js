import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:9999",
  withCredentials: true,
});

// ═══════════════════════════════════════════════════════════════════════════════
// BOOKINGS API (Prefix: /api/bookings)
// ═══════════════════════════════════════════════════════════════════════════════

export const createBooking = async (bookingData) => {
  try {
    const response = await API.post("/api/bookings", bookingData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getBookingById = async (bookingId) => {
  try {
    const response = await API.get(`/api/bookings/${bookingId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getBookingByCode = async (bookingCode) => {
  try {
    const response = await API.get(`/api/bookings/code/${bookingCode}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateBookingPaymentStatus = async (bookingId, paymentData) => {
  try {
    const response = await API.patch(`/api/bookings/${bookingId}/payment`, paymentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getUserBookings = async (userId) => {
  try {
    const url = userId ? `/api/bookings/user/${userId}` : "/api/bookings/user";
    const response = await API.get(url);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
