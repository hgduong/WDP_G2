import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:9999",
  withCredentials: true,
});

// ═══════════════════════════════════════════════════════════════════════════════
// VOUCHERS API (Prefix: /api/vouchers)
// ═══════════════════════════════════════════════════════════════════════════════

export const applyVoucher = async (voucherData) => {
  try {
    const response = await API.post("/api/vouchers/apply", voucherData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getAllVouchers = async () => {
  try {
    const response = await API.get("/api/vouchers");
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const getVoucherById = async (id) => {
  try {
    const response = await API.get(`/api/vouchers/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const createVoucher = async (voucherData) => {
  try {
    const response = await API.post("/api/vouchers", voucherData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const updateVoucher = async (id, voucherData) => {
  try {
    const response = await API.put(`/api/vouchers/${id}`, voucherData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

export const deleteVoucher = async (id) => {
  try {
    const response = await API.delete(`/api/vouchers/${id}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Áp dụng voucher cho staff booking
export const staffApplyVoucher = async (voucherCode, totalPrice) => {
  try {
    const response = await API.post("/api/vouchers/staff-apply", {
      voucherCode,
      totalPrice,
    });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};
