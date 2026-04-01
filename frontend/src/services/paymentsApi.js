import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:9999",
  withCredentials: true,
});

export const getPaymentStatus = async (paymentId) => {
  try {
    const response = await API.get(`/api/payments/${paymentId}/status`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
