import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:9999",
  withCredentials: true,
});

export const prepareQrBooking = async (bookingData) => {
  try {
    const response = await API.post("/api/bookings/prepare-qr", bookingData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const cancelBooking = async (bookingId) => {
  try {
    const response = await API.post(`/api/bookings/${bookingId}/cancel`);
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

export const getUserBookings = async () => {
  try {
    const response = await API.get("/api/bookings/user");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
