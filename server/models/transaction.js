const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "ID người dùng là bắt buộc"],
    index: true,
  },
  walletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Wallet",
    required: [true, "ID ví là bắt buộc"],
    index: true,
  },
  type: {
    type: String,
    enum: ["deposit", "withdraw", "payment", "refund", "transfer"],
    required: [true, "Loại giao dịch là bắt buộc"],
    index: true,
  },
  amount: {
    type: Number,
    required: [true, "Số tiền giao dịch là bắt buộc"],
    min: [0, "Số tiền không được âm"],
  },
  balanceAfter: {
    type: Number,
    required: [true, "Số dư sau giao dịch là bắt buộc"],
    min: [0, "Số dư không được âm"],
  },
  description: {
    type: String,
    trim: true,
    default: "",
  },
  referenceId: {
    type: mongoose.Schema.Types.ObjectId,
    default: null,
    index: true,
  },
  referenceType: {
    type: String,
    enum: ["booking", "topup", "refund", "withdraw", "transfer", null],
    default: null,
  },
  status: {
    type: String,
    enum: ["pending", "completed", "failed", "cancelled"],
    default: "completed",
    index: true,
  },
  paymentMethod: {
    type: String,
    enum: ["wallet", "momo", "vnpay", "banking", "cash", "payos", "qr", null],
    default: "wallet",
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {},
  },
}, {
  timestamps: true,
});

// Index cho các truy vấn thường dùng
transactionSchema.index({ createdAt: -1 });
transactionSchema.index({ type: 1, createdAt: -1 });
transactionSchema.index({ status: 1, createdAt: -1 });
transactionSchema.index({ userId: 1, createdAt: -1 });

// Virtual để format số tiền với đơn vị VND
transactionSchema.virtual("formattedAmount").get(function () {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
  }).format(this.amount);
});

// Cho phép xuất virtual khi convert sang JSON/Object
transactionSchema.set("toJSON", { virtuals: true });
transactionSchema.set("toObject", { virtuals: true });

// Static method: lấy lịch sử giao dịch của user với phân trang
transactionSchema.statics.getUserTransactions = async function (userId, options = {}) {
  const {
    page = 1,
    limit = 20,
    type = null,
    status = null,
    startDate = null,
    endDate = null,
  } = options;

  const query = { userId };

  if (type) query.type = type;
  if (status) query.status = status;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }

  const skip = (page - 1) * limit;
  const [transactions, total] = await Promise.all([
    this.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean(),
    this.countDocuments(query),
  ]);

  return {
    transactions,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  };
};

// Static method: lấy thống kê giao dịch của user
transactionSchema.statics.getUserTransactionStats = async function (userId, startDate = null, endDate = null) {
  const match = { userId, status: "completed" };
  
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate) match.createdAt.$gte = new Date(startDate);
    if (endDate) match.createdAt.$lte = new Date(endDate);
  }

  const stats = await this.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$type",
        totalAmount: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  const result = {
    deposits: { totalAmount: 0, count: 0 },
    withdrawals: { totalAmount: 0, count: 0 },
    payments: { totalAmount: 0, count: 0 },
    refunds: { totalAmount: 0, count: 0 },
    transfers: { totalAmount: 0, count: 0 },
  };

  stats.forEach((stat) => {
    const typeMap = {
      deposit: "deposits",
      withdraw: "withdrawals",
      payment: "payments",
      refund: "refunds",
      transfer: "transfers",
    };
    const key = typeMap[stat._id];
    if (key) {
      result[key] = {
        totalAmount: stat.totalAmount,
        count: stat.count,
      };
    }
  });

  return result;
};

// Static method: tạo giao dịch với atomic operation
transactionSchema.statics.createTransaction = async function (data) {
  const Transaction = this;
  
  const transaction = new Transaction({
    userId: data.userId,
    walletId: data.walletId,
    type: data.type,
    amount: data.amount,
    balanceAfter: data.balanceAfter,
    description: data.description || "",
    referenceId: data.referenceId || null,
    referenceType: data.referenceType || null,
    status: data.status || "completed",
    paymentMethod: data.paymentMethod || "wallet",
    metadata: data.metadata || {},
  });

  return transaction.save();
};

module.exports = mongoose.model("Transaction", transactionSchema);
