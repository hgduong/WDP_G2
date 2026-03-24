const mongoose = require("mongoose");

const voucherSchema = new mongoose.Schema(
  {
    discountPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    maxDiscount: {
      type: Number,
      required: true,
      min: 0,
    },
    maxUsage: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    maxUsagePerAccount: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    minOrderValue: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    note: {
      type: String,
      default: "",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    usedCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true, // Tự động thêm createdAt và updatedAt
  },
);

// Virtual để kiểm tra voucher có còn hiệu lực không
voucherSchema.virtual("isValid").get(function () {
  const now = new Date();
  // Voucher hợp lệ khi: đang active VÀ chưa hết hạn VÀ chưa hết lượt
  return this.isActive && now >= this.startDate && now <= this.endDate && this.usedCount < this.maxUsage;
});

// Virtual cho trạng thái hiển thị
voucherSchema.virtual("status").get(function () {
  if (!this.isActive) return "Đã vô hiệu hóa";
  const now = new Date();
  if (now < this.startDate) return "Chưa bắt đầu";
  if (now > this.endDate) return "Đã hết hạn";
  if (this.usedCount >= this.maxUsage) return "Đã hết lượt";
  return "Hoạt động";
});

// Đảm bảo virtuals được include khi convert to JSON
voucherSchema.set("toJSON", { virtuals: true });
voucherSchema.set("toObject", { virtuals: true });

// Index để tìm kiếm nhanh hơn
voucherSchema.index({ startDate: 1, endDate: 1 });
voucherSchema.index({ isActive: 1 });

const Voucher = mongoose.model("Voucher", voucherSchema);

module.exports = Voucher;
