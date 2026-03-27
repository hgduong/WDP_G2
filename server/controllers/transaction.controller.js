const Transaction = require("../models/transaction");
const Wallet = require("../models/wallet");
const payos = require("../config/payos");

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
 * Tạo giao dịch nạp tiền pending (chưa xử lý)
 * POST /api/transactions/create-pending-deposit
 */
const createPendingDeposit = async (req, res) => {
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

    // Tạo pending transaction
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

    // Nếu user chọn phương thức thanh toán qua PayOS (QR), tạo payment request và trả về dữ liệu QR
    if (paymentMethod === "payos" || paymentMethod === "qr" || paymentMethod === "banking") {
      try {
        const YOUR_DOMAIN = process.env.CLIENT_URL || "http://localhost:3000";
        const orderCode = Number(String(Date.now()).slice(-6));

        const payload = {
          orderCode: orderCode,
          amount: amount,
          description: description || "Nạp tiền vào ví",
          cancelUrl: `${YOUR_DOMAIN}/topup-failure?reason=cancelled`,
          returnUrl: `${YOUR_DOMAIN}/topup-payment?status=success&transactionId=${transaction._id}`,
          signature: "",
        };

        const payosResponse = await payos.paymentRequests.create(payload);

        // Lưu orderCode vào metadata để có thể tìm thấy
        transaction.metadata = {
          ...transaction.metadata,
          payosOrderCode: orderCode,
          payosPaymentLinkId: payosResponse?.paymentLinkId || null,
        };
        await transaction.save();

        // Extract payment URL and QR data
        const paymentUrl = payosResponse?.checkoutUrl || payosResponse?.paymentUrl || payosResponse?.url || null;
        const qrData = payosResponse?.qrCode || payosResponse?.qr || null;

        return res.status(200).json({
          success: true,
          message: "Yêu cầu nạp tiền đã được tạo. Hoàn thành thanh toán qua QR.",
          data: {
            transaction: transaction,
            payment: {
              raw: payosResponse,
              paymentUrl,
              qrData,
            },
          },
        });
      } catch (err) {
        // Nếu gọi PayOS fail, huỷ pending transaction và báo lỗi
        transaction.status = "cancelled";
        await transaction.save();

        return res.status(502).json({
          success: false,
          message: "Không thể tạo yêu cầu thanh toán PayOS: " + err.message,
        });
      }
    }

    // Trường hợp offline / instant: trả về transaction pending
    return res.status(200).json({
      success: true,
      message: "Yêu cầu nạp tiền đã được tạo",
      data: {
        transaction: transaction,
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

    // Nếu user chọn phương thức thanh toán qua PayOS (QR), tạo payment request và trả về dữ liệu QR
    if (paymentMethod === "payos" || paymentMethod === "qr" || paymentMethod === "banking") {
      try {
        const YOUR_DOMAIN = process.env.CLIENT_URL || "http://localhost:3000";
        const orderCode = Number(String(Date.now()).slice(-6));

        const payload = {
          orderCode: orderCode,
          amount: amount,
          description: description || "Nạp tiền vào ví",
          cancelUrl: `${YOUR_DOMAIN}/topup-failure?reason=cancelled`,
          returnUrl: `${YOUR_DOMAIN}/topup-payment?status=success&transactionId=${transaction._id}`,
          signature: "",
        };

        const payosResponse = await payos.paymentRequests.create(payload);

        // Lưu orderCode vào metadata để có thể tìm thấy
        transaction.metadata = {
          ...transaction.metadata,
          payosOrderCode: orderCode,
          payosPaymentLinkId: payosResponse?.paymentLinkId || null,
        };
        await transaction.save();

        // Extract payment URL and QR data
        const paymentUrl = payosResponse?.checkoutUrl || payosResponse?.paymentUrl || payosResponse?.url || null;
        const qrData = payosResponse?.qrCode || payosResponse?.qr || null;

        return res.status(200).json({
          success: true,
          message: "Yêu cầu nạp tiền đã được tạo. Hoàn thành thanh toán qua QR.",
          data: {
            transaction: transaction,
            payment: {
              raw: payosResponse,
              paymentUrl,
              qrData,
            },
          },
        });
      } catch (err) {
        // Nếu gọi PayOS fail, huỷ pending transaction và báo lỗi
        transaction.status = "cancelled";
        await transaction.save();

        return res.status(502).json({
          success: false,
          message: "Không thể tạo yêu cầu thanh toán PayOS: " + err.message,
        });
      }
    }

    // Trường hợp offline / instant (giữ luồng cũ): thực hiện nạp tiền ngay lập tức
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

/**
 * Tạo payment link qua PayOS
 * POST /api/transactions/create-payment-link
 */
const createPaymentLink = async (req, res) => {
  try {
    const { amount, description, orderCode } = req.body;

    // Validate input
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Số tiền phải lớn hơn 0",
      });
    }

    const YOUR_DOMAIN = process.env.CLIENT_URL || "http://localhost:3000";
    const body = {
      orderCode: orderCode || Number(String(Date.now()).slice(-6)),
      amount: amount,
      description: description || "Thanh toan don hang",
      cancelUrl: `${YOUR_DOMAIN}`,
      returnUrl: `${YOUR_DOMAIN}`,
      signature: "",
    };

    const paymentLinkResponse = await payOS.paymentRequests.create(body);

    res.status(200).json({
      success: true,
      data: paymentLinkResponse,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Không thể tạo payment link: " + error.message,
    });
  }
};

/**
 * Xác nhận đã thanh toán (Customer)
 * PUT /api/transactions/:id/confirm
 */
const confirmPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const transaction = await Transaction.findOne({
      _id: id,
      userId: userId,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giao dịch",
      });
    }

    // Chỉ có thể xác nhận giao dịch đang chờ
    if (transaction.status !== "pending") {
      return res.status(400).json({
        success: false,
        message: "Chỉ có thể xác nhận giao dịch đang chờ xử lý",
      });
    }

    // Cập nhật trạng thái
    transaction.status = "completed";
    await transaction.save();

    // Cập nhật ví nếu là giao dịch nạp tiền
    if (transaction.type === "deposit") {
      const wallet = await Wallet.findById(transaction.walletId);
      if (wallet) {
        await wallet.deposit(
          transaction.amount,
          transaction.description || "Nạp tiền",
          transaction._id,
          "topup",
          transaction.paymentMethod
        );
        transaction.balanceAfter = wallet.balance;
        await transaction.save();
      }
    }

    res.status(200).json({
      success: true,
      message: "Xác nhận thanh toán thành công",
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
 * Hủy giao dịch đang chờ (Customer)
 * PUT /api/transactions/:id/cancel-user
 */
const cancelUserTransaction = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const transaction = await Transaction.findOne({
      _id: id,
      userId: userId,
    });

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
 * Kiểm tra trạng thái thanh toán từ PayOS API
 * POST /api/transactions/check-payos-status
 */
const checkPayOSPaymentStatus = async (req, res) => {
  try {
    const { transactionId } = req.body;
    const userId = req.user.id;

    if (!transactionId) {
      return res.status(400).json({
        success: false,
        message: "Transaction ID là bắt buộc",
      });
    }

    // Tìm transaction
    const transaction = await Transaction.findOne({
      _id: transactionId,
      userId: userId,
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: "Không tìm thấy giao dịch",
      });
    }

    // Kiểm tra transaction có phải là deposit không
    if (transaction.type !== "deposit") {
      return res.status(400).json({
        success: false,
        message: "Giao dịch không phải là nạp tiền",
      });
    }

    // Kiểm tra transaction đã được xử lý chưa
    if (transaction.status === "completed") {
      return res.status(200).json({
        success: true,
        message: "Giao dịch đã được xử lý trước đó",
        data: transaction,
      });
    }

    // Lấy orderCode từ metadata
    const orderCode = transaction.metadata?.payosOrderCode;
    if (!orderCode) {
      return res.status(400).json({
        success: false,
        message: "Không tìm thấy thông tin thanh toán PayOS",
      });
    }

    // Gọi PayOS API để kiểm tra trạng thái thanh toán
    try {
      const paymentInfo = await payos.paymentRequests.get(orderCode);

      if (!paymentInfo) {
        return res.status(404).json({
          success: false,
          message: "Không tìm thấy thông tin thanh toán từ PayOS",
        });
      }

      // Kiểm tra trạng thái thanh toán
      // PayOS trả về status: PAID, PENDING, CANCELLED, EXPIRED
      if (paymentInfo.status === "PAID") {
        // Thanh toán thành công
        // Kiểm tra số tiền có khớp không
        if (transaction.amount !== paymentInfo.amount) {
          console.error("Số tiền không khớp", {
            expected: transaction.amount,
            received: paymentInfo.amount,
          });
          return res.status(400).json({
            success: false,
            message: "Số tiền không khớp",
          });
        }

        // Cập nhật transaction
        transaction.status = "completed";
        transaction.metadata = {
          ...transaction.metadata,
          payosTransactionId: paymentInfo.reference || null,
          payosTransactionDateTime: paymentInfo.transactionDateTime || null,
          payosAccountNumber: paymentInfo.accountNumber || null,
          payosCounterAccountBankId: paymentInfo.counterAccountBankId || null,
          payosCounterAccountBankName: paymentInfo.counterAccountBankName || null,
          payosCounterAccountName: paymentInfo.counterAccountName || null,
          payosCounterAccountNumber: paymentInfo.counterAccountNumber || null,
          payosVirtualAccountName: paymentInfo.virtualAccountName || null,
          payosVirtualAccountNumber: paymentInfo.virtualAccountNumber || null,
        };
        await transaction.save();

        // Cập nhật ví
        const wallet = await Wallet.findById(transaction.walletId);
        if (wallet) {
          await wallet.deposit(
            transaction.amount,
            transaction.description || "Nạp tiền qua PayOS",
            transaction._id,
            "topup",
            transaction.paymentMethod
          );
          transaction.balanceAfter = wallet.balance;
          await transaction.save();
        }

        return res.status(200).json({
          success: true,
          message: "Thanh toán thành công",
          data: transaction,
        });
      } else if (paymentInfo.status === "PENDING") {
        return res.status(200).json({
          success: true,
          message: "Giao dịch đang chờ xử lý",
          data: {
            ...transaction.toObject(),
            payosStatus: paymentInfo.status,
          },
        });
      } else if (paymentInfo.status === "CANCELLED" || paymentInfo.status === "EXPIRED") {
        // Hủy transaction
        transaction.status = "cancelled";
        await transaction.save();

        return res.status(200).json({
          success: true,
          message: "Giao dịch đã bị hủy hoặc hết hạn",
          data: transaction,
        });
      } else {
        return res.status(200).json({
          success: true,
          message: "Trạng thái thanh toán không xác định",
          data: {
            ...transaction.toObject(),
            payosStatus: paymentInfo.status,
          },
        });
      }
    } catch (err) {
      console.error("Lỗi khi gọi PayOS API:", err);
      return res.status(502).json({
        success: false,
        message: "Không thể kiểm tra trạng thái thanh toán từ PayOS: " + err.message,
      });
    }
  } catch (error) {
    console.error("Lỗi checkPayOSPaymentStatus:", error);
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
  createPendingDeposit,
  deposit,
  withdraw,
  pay,
  refund,
  cancelTransaction,
  cancelUserTransaction,
  confirmPayment,
  getAllTransactions,
  getAllTransactionStats,
  createPaymentLink,
  checkPayOSPaymentStatus,
};
