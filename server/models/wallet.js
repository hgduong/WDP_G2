const mongoose = require("mongoose");
const Transaction = require("./transaction");

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "ID người dùng là bắt buộc"],
    unique: true,
  },
  balance: {
    type: Number,
    default: 0,
    min: [0, "Số dư không được âm"],
  },
  currency: {
    type: String,
    default: "VND",
    uppercase: true,
  },
  status: {
    type: String,
    enum: ["Active", "Frozen", "Closed"],
    default: "Active",
  },
  totalDeposited: {
    type: Number,
    default: 0,
    min: [0, "Tổng tiền nạp không được âm"],
  },
  totalSpent: {
    type: Number,
    default: 0,
    min: [0, "Tổng tiền tiêu không được âm"],
  },
  lastTransactionAt: {
    type: Date,
    default: null,
  },
  frozenAt: {
    type: Date,
    default: null,
  },
  frozenReason: {
    type: String,
    trim: true,
    default: null,
  },
}, {
  timestamps: true,
});

// Virtual field: kiểm tra ví có đủ số dư để thanh toán không
walletSchema.methods.hasEnoughBalance = function (amount) {
  return this.balance >= amount;
};

// Virtual field: tính tổng số dư khả dụng
walletSchema.virtual("availableBalance").get(function () {
  if (this.status !== "Active") return 0;
  return this.balance;
});

// Instance method: thêm tiền vào ví
walletSchema.methods.deposit = async function (amount, description = "Nạp tiền", referenceId = null, referenceType = "topup", paymentMethod = "wallet") {
  if (amount <= 0) {
    throw new Error("Số tiền nạp phải lớn hơn 0");
  }

  const previousBalance = this.balance;
  this.balance += amount;
  this.totalDeposited += amount;
  this.lastTransactionAt = new Date();
  await this.save();

  // Tạo transaction record riêng
  await Transaction.createTransaction({
    userId: this.userId,
    walletId: this._id,
    type: "deposit",
    amount: amount,
    balanceAfter: this.balance,
    description: description,
    referenceId: referenceId,
    referenceType: referenceType,
    status: "completed",
    paymentMethod: paymentMethod,
  });

  return this;
};

// Instance method: trừ tiền từ ví
walletSchema.methods.withdraw = async function (amount, description = "Rút tiền", referenceId = null, referenceType = null) {
  if (amount <= 0) {
    throw new Error("Số tiền rút phải lớn hơn 0");
  }

  if (!this.hasEnoughBalance(amount)) {
    throw new Error("Số dư không đủ để thực hiện giao dịch");
  }

  if (this.status !== "Active") {
    throw new Error("Ví không hoạt động, không thể thực hiện giao dịch");
  }

  const previousBalance = this.balance;
  this.balance -= amount;
  this.totalSpent += amount;
  this.lastTransactionAt = new Date();
  await this.save();

  // Tạo transaction record riêng
  await Transaction.createTransaction({
    userId: this.userId,
    walletId: this._id,
    type: "withdraw",
    amount: amount,
    balanceAfter: this.balance,
    description: description,
    referenceId: referenceId,
    referenceType: referenceType,
    status: "completed",
    paymentMethod: "wallet",
  });

  return this;
};

// Instance method: thanh toán từ ví
walletSchema.methods.pay = async function (amount, description, referenceId, referenceType = "booking") {
  return this.withdraw(amount, description, referenceId, referenceType);
};

// Instance method: hoàn tiền vào ví
walletSchema.methods.refund = async function (amount, description = "Hoàn tiền", referenceId = null, referenceType = "refund") {
  if (amount <= 0) {
    throw new Error("Số tiền hoàn phải lớn hơn 0");
  }

  const previousBalance = this.balance;
  this.balance += amount;
  this.lastTransactionAt = new Date();
  await this.save();

  // Tạo transaction record riêng
  await Transaction.createTransaction({
    userId: this.userId,
    walletId: this._id,
    type: "refund",
    amount: amount,
    balanceAfter: this.balance,
    description: description,
    referenceId: referenceId,
    referenceType: referenceType,
    status: "completed",
    paymentMethod: "wallet",
  });

  return this;
};

// Instance method: đóng băng ví
walletSchema.methods.freeze = async function (reason = "Tài khoản bị đóng băng") {
  if (this.status === "Frozen") {
    throw new Error("Ví đã bị đóng băng trước đó");
  }

  if (this.status === "Closed") {
    throw new Error("Ví đã bị đóng, không thể đóng băng");
  }

  this.status = "Frozen";
  this.frozenAt = new Date();
  this.frozenReason = reason;

  return this.save();
};

// Instance method: mở đóng băng ví
walletSchema.methods.unfreeze = async function () {
  if (this.status !== "Frozen") {
    throw new Error("Ví không bị đóng băng");
  }

  this.status = "Active";
  this.frozenAt = null;
  this.frozenReason = null;

  return this.save();
};

// Instance method: lấy lịch sử giao dịch của ví
walletSchema.methods.getTransactions = async function (options = {}) {
  return Transaction.getUserTransactions(this.userId, {
    ...options,
    walletId: this._id,
  });
};

// Static method: tìm hoặc tạo ví mới cho user
walletSchema.statics.findOrCreateByUserId = async function (userId) {
  let wallet = await this.findOne({ userId });

  if (!wallet) {
    wallet = await this.create({ userId });
  }

  return wallet;
};

// Static method: lấy thống kê ví của tất cả user
walletSchema.statics.getWalletStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: null,
        totalWallets: { $sum: 1 },
        activeWallets: {
          $sum: { $cond: [{ $eq: ["$status", "Active"] }, 1, 0] },
        },
        frozenWallets: {
          $sum: { $cond: [{ $eq: ["$status", "Frozen"] }, 1, 0] },
        },
        totalBalance: { $sum: "$balance" },
        totalDeposited: { $sum: "$totalDeposited" },
        totalSpent: { $sum: "$totalSpent" },
      },
    },
  ]);

  return stats[0] || {
    totalWallets: 0,
    activeWallets: 0,
    frozenWallets: 0,
    totalBalance: 0,
    totalDeposited: 0,
    totalSpent: 0,
  };
};

// Cho phép xuất virtual khi convert sang JSON/Object
walletSchema.set("toJSON", { virtuals: true });
walletSchema.set("toObject", { virtuals: true });

// Index cho các trường thường truy vấn
walletSchema.index({ userId: 1 });
walletSchema.index({ status: 1 });
walletSchema.index({ lastTransactionAt: -1 });

module.exports = mongoose.model("Wallet", walletSchema);
