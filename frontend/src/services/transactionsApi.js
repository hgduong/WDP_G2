import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:9999",
  withCredentials: true,
});

// ═══════════════════════════════════════════════════════════════════════════════
// TRANSACTIONS API (Prefix: /api/transactions)
// ═══════════════════════════════════════════════════════════════════════════════

export const getUserTransactions = async (params = {}) => {
  try {
    const response = await API.get("/api/transactions", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getTransactionById = async (id) => {
  try {
    const response = await API.get(`/api/transactions/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getUserTransactionStats = async () => {
  try {
    const response = await API.get("/api/transactions/stats");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createPendingDeposit = async (depositData) => {
  try {
    const response = await API.post("/api/transactions/create-pending-deposit", depositData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deposit = async (depositData) => {
  try {
    const response = await API.post("/api/transactions/deposit", depositData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createPaymentLink = async (paymentData) => {
  try {
    const response = await API.post("/api/transactions/create-payment-link", paymentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const checkPayOSPaymentStatus = async (paymentData) => {
  try {
    const response = await API.post("/api/transactions/check-payos-status", paymentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const withdraw = async (withdrawData) => {
  try {
    const response = await API.post("/api/transactions/withdraw", withdrawData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const pay = async (paymentData) => {
  try {
    const response = await API.post("/api/transactions/pay", paymentData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const refund = async (refundData) => {
  try {
    const response = await API.post("/api/transactions/refund", refundData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const cancelTransaction = async (id) => {
  try {
    const response = await API.put(`/api/transactions/${id}/cancel`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const cancelUserTransaction = async (id) => {
  try {
    const response = await API.put(`/api/transactions/${id}/cancel-user`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const confirmPayment = async (id) => {
  try {
    const response = await API.put(`/api/transactions/${id}/confirm`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getAllTransactions = async (params = {}) => {
  try {
    const response = await API.get("/api/transactions/admin/all", { params });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getAllTransactionStats = async () => {
  try {
    const response = await API.get("/api/transactions/admin/stats");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
