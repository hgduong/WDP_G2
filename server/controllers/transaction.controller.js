const Transaction = require("../models/transaction");
const Wallet = require("../models/wallet");

/**
 * Lấy lịch sử giao dịch của user hiện tại
 * GET /api/transactions
 */
const getUserTransactions = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      page = 1,
      limit = 20,
      type,
      status,
      startDate,
      endDate,
    } = req.query;

    const result = await Transaction.getUserTransactions(userId, {
      page: parseInt(page),
      limit: parseInt(limit),
      type,
      status,
      startDate,
      endDate,
    });

    res.status(200).json({
      success: true,
      data: result.transactions,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Lấy chi tiết một giao dịch
 * GET /api/transactions/:id
 */
const getTransactionById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const transaction = await Transaction.findOne({
      _id: id,
      userId: userId,
    }).populate("walletId", "balance currency");

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giao dịch",
      });
    }

    res.status(200).json({
      success: true,
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Lấy thống kê giao dịch của user
 * GET /api/transactions/stats
 */
const getUserTransactionStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    const stats = await Transaction.getUserTransactionStats(
      userId,
      startDate,
      endDate
    );

    // Lấy thông tin ví
    const wallet = await Wallet.findOne({ userId });

    res.status(200).json({
      success: true,
      data: {
        wallet: wallet
          ? {
              balance: wallet.balance,
              totalDeposited: wallet.totalDeposited,
              totalSpent: wallet.totalSpent,
              currency: wallet.currency,
            }
          : null,
        transactions: stats,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Nạp tiền vào ví
 * POST /api/transactions/deposit
 */
const deposit = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, description, paymentMethod = "banking" } = req.body;

    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Số tiền nạp phải lớn hơn 0",
      });
    }

    // Tìm hoặc tạo ví
    let wallet = await Wallet.findOrCreateByUserId(userId);

    // Kiểm tra ví có đang hoạt động không
    if (wallet.status !== "Active") {
      return res.status(400).json({
        success: false,
        message: "Ví không hoạt động, không thể nạp tiền",
      });
    }

    // Tạo pending transaction trước
    const transaction = await Transaction.createTransaction({
      userId: wallet.userId,
      walletId: wallet._id,
      type: "deposit",
      amount: amount,
      balanceAfter: wallet.balance,
      description: description || "Nạp tiền",
      referenceType: "topup",
      status: "pending",
      paymentMethod: paymentMethod,
    });

    // Thực hiện nạp tiền (trong thực tế sẽ gọi payment gateway ở đây)
    // Giả lập thành công ngay lập tức
    await wallet.deposit(
      amount,
      description || "Nạp tiền",
      transaction._id,
      "topup",
      paymentMethod
    );

    // Cập nhật transaction thành completed
    transaction.status = "completed";
    transaction.balanceAfter = wallet.balance;
    await transaction.save();

    res.status(200).json({
      success: true,
      message: "Nạp tiền thành công",
      data: {
        transaction: transaction,
        wallet: {
          balance: wallet.balance,
          totalDeposited: wallet.totalDeposited,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Rút tiền từ ví
 * POST /api/transactions/withdraw
 */
const withdraw = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, description, bankAccount } = req.body;

    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Số tiền rút phải lớn hơn 0",
      });
    }

    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy ví",
      });
    }

    // Kiểm tra số dư
    if (!wallet.hasEnoughBalance(amount)) {
      return res.status(400).json({
        success: false,
        message: "Số dư không đủ để thực hiện giao dịch",
      });
    }

    // Kiểm tra ví có đang hoạt động không
    if (wallet.status !== "Active") {
      return res.status(400).json({
        success: false,
        message: "Ví không hoạt động, không thể rút tiền",
      });
    }

    // Tạo pending transaction
    const transaction = await Transaction.createTransaction({
      userId: wallet.userId,
      walletId: wallet._id,
      type: "withdraw",
      amount: amount,
      balanceAfter: wallet.balance,
      description: description || "Rút tiền",
      referenceType: "withdraw",
      status: "pending",
      paymentMethod: "banking",
      metadata: { bankAccount },
    });

    // Thực hiện rút tiền
    await wallet.withdraw(
      amount,
      description || "Rút tiền về tài khoản ngân hàng",
      transaction._id,
      "withdraw"
    );

    // Cập nhật transaction thành completed
    transaction.status = "completed";
    transaction.balanceAfter = wallet.balance;
    await transaction.save();

    res.status(200).json({
      success: true,
      message: "Yêu cầu rút tiền đã được xử lý",
      data: {
        transaction: transaction,
        wallet: {
          balance: wallet.balance,
          totalSpent: wallet.totalSpent,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Thanh toán từ ví (cho booking)
 * POST /api/transactions/pay
 */
const pay = async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount, description, bookingId } = req.body;

    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Số tiền thanh toán phải lớn hơn 0",
      });
    }

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: "Booking ID là bắt buộc",
      });
    }

    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy ví",
      });
    }

    // Kiểm tra số dư
    if (!wallet.hasEnoughBalance(amount)) {
      return res.status(400).json({
        success: false,
        message: "Số dư không đủ để thanh toán",
      });
    }

    // Kiểm tra ví có đang hoạt động không
    if (wallet.status !== "Active") {
      return res.status(400).json({
        success: false,
        message: "Ví không hoạt động, không thể thanh toán",
      });
    }

    // Thực hiện thanh toán
    await wallet.pay(
      amount,
      description || "Thanh toán đơn hàng",
      bookingId,
      "booking"
    );

    // Lấy transaction vừa tạo
    const transaction = await Transaction.findOne({
      userId: wallet.userId,
      walletId: wallet._id,
      type: "withdraw",
      referenceId: bookingId,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      message: "Thanh toán thành công",
      data: {
        transaction: transaction,
        wallet: {
          balance: wallet.balance,
          totalSpent: wallet.totalSpent,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Hoàn tiền (Admin/Staff)
 * POST /api/transactions/refund
 */
const refund = async (req, res) => {
  try {
    const { userId, amount, description, bookingId } = req.body;

    // Validate input
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID là bắt buộc",
      });
    }

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Số tiền hoàn phải lớn hơn 0",
      });
    }

    const wallet = await Wallet.findOne({ userId });

    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy ví của người dùng",
      });
    }

    // Kiểm tra ví có đang hoạt động không
    if (wallet.status !== "Active") {
      return res.status(400).json({
        success: false,
        message: "Ví không hoạt động, không thể hoàn tiền",
      });
    }

    // Thực hiện hoàn tiền
    await wallet.refund(
      amount,
      description || "Hoàn tiền",
      bookingId || null,
      "refund"
    );

    // Lấy transaction vừa tạo
    const transaction = await Transaction.findOne({
      userId: wallet.userId,
      walletId: wallet._id,
      type: "refund",
      referenceId: bookingId,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      message: "Hoàn tiền thành công",
      data: {
        transaction: transaction,
        wallet: {
          balance: wallet.balance,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Hủy giao dịch đang chờ (Admin)
 * PUT /api/transactions/:id/cancel
 */
const cancelTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const transaction = await Transaction.findById(id);

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giao dịch",
      });
    }

    // Chỉ có thể hủy giao dịch đang chờ
    if (transaction.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể hủy giao dịch đang chờ xử lý",
      });
    }

    // Cập nhật trạng thái
    transaction.status = "cancelled";
    await transaction.save();

    res.status(200).json({
      success: true,
      message: "Hủy giao dịch thành công",
      data: transaction,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Lấy tất cả giao dịch (Admin)
 * GET /api/admin/transactions
 */
const getAllTransactions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      userId,
      type,
      status,
      startDate,
      endDate,
    } = req.query;

    const query = {};

    if (userId) query.userId = userId;
    if (type) query.type = type;
    if (status) query.status = status;
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }

    const skip = (page - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find(query)
        .populate("userId", "name email phone")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Transaction.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      data: transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

/**
 * Lấy thống kê giao dịch (Admin)
 * GET /api/admin/transactions/stats
 */
const getAllTransactionStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const match = { status: "completed" };
    if (startDate || endDate) {
      match.createdAt = {};
      if (startDate) match.createdAt.$gte = new Date(startDate);
      if (endDate) match.createdAt.$lte = new Date(endDate);
    }

    const stats = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$type",
          totalAmount: { $sum: "$amount" },
          count: { $sum: 1 },
          avgAmount: { $avg: "$amount" },
          maxAmount: { $max: "$amount" },
          minAmount: { $min: "$amount" },
        },
      },
      {
        $sort: { totalAmount: -1 },
      },
    ]);

    // Thống kê tổng quan
    const overview = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          avgTransactionAmount: { $avg: "$amount" },
        },
      },
    ]);

    // Thống kê theo payment method
    const byPaymentMethod = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        byType: stats,
        overview: overview[0] || {
          totalTransactions: 0,
          totalAmount: 0,
          avgTransactionAmount: 0,
        },
        byPaymentMethod: byPaymentMethod,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
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
};
