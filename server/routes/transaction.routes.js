const express = require("express");
const router = express.Router();
const {
  authenticateToken,
  authorizeRoles,
} = require("../config/auth.middleware");
const {
  getUserTransactions,
  getTransactionById,
  getUserTransactionStats,
  deposit,
  withdraw,
  pay,
  refund,
  cancelTransaction,
  getAllTransactions,
  getAllTransactionStats,
} = require("../controllers/transaction.controller");

/**
 * @route   GET /api/transactions
 * @desc    Lấy lịch sử giao dịch của user hiện tại
 * @access  Private (User)
 */
router.get(
  "/",
  authenticateToken,
  authorizeRoles(["Admin", "Customer", "Staff"]),
  getUserTransactions,
);

/**
 * @route   GET /api/transactions/stats
 * @desc    Lấy thống kê giao dịch của user
 * @access  Private (User)
 */
router.get(
  "/stats",
  authenticateToken,
  authorizeRoles(["Admin", "Customer", "Staff"]),
  getUserTransactionStats,
);

/**
 * @route   GET /api/transactions/:id
 * @desc    Lấy chi tiết một giao dịch
 * @access  Private (User)
 */
router.get(
  "/:id",
  authenticateToken,
  authorizeRoles(["Admin", "Customer", "Staff"]),
  getTransactionById,
);

/**
 * @route   POST /api/transactions/deposit
 * @desc    Nạp tiền vào ví
 * @access  Private (User)
 */
router.post(
  "/deposit",
  authenticateToken,
  authorizeRoles(["Admin", "Customer", "Staff"]),
  deposit,
);

/**
 * @route   POST /api/transactions/withdraw
 * @desc    Rút tiền từ ví
 * @access  Private (User)
 */
router.post(
  "/withdraw",
  authenticateToken,
  authorizeRoles(["Admin", "Customer", "Staff"]),
  withdraw,
);

/**
 * @route   POST /api/transactions/pay
 * @desc    Thanh toán từ ví (cho booking)
 * @access  Private (User)
 */
router.post(
  "/pay",
  authenticateToken,
  authorizeRoles(["Admin", "Customer", "Staff"]),
  pay,
);

/**
 * @route   POST /api/transactions/refund
 * @desc    Hoàn tiền (Admin/Staff)
 * @access  Private (Admin, Staff)
 */
router.post(
  "/refund",
  authenticateToken,
  authorizeRoles(["Admin", "Customer"]),
  refund,
);

/**
 * @route   PUT /api/transactions/:id/cancel
 * @desc    Hủy giao dịch đang chờ (Admin)
 * @access  Private (Admin)
 */
router.put(
  "/:id/cancel",
  authenticateToken,
  authorizeRoles(["Admin"]),
  cancelTransaction,
);

/**
 * ===============================
 * ADMIN ROUTES
 * ===============================
 */

/**
 * @route   GET /api/admin/transactions
 * @desc    Lấy tất cả giao dịch (Admin)
 * @access  Private (Admin)
 */
router.get(
  "/admin/all",
  authenticateToken,
  authorizeRoles(["Admin"]),
  getAllTransactions,
);

/**
 * @route   GET /api/admin/transactions/stats
 * @desc    Lấy thống kê giao dịch (Admin)
 * @access  Private (Admin)
 */
router.get(
  "/admin/stats",
  authenticateToken,
  authorizeRoles(["Admin"]),
  getAllTransactionStats,
);

module.exports = router;
