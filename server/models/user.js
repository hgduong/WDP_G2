const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email là bắt buộc"],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Email không hợp lệ"],
  },
  fullName: {
    type: String,
    required: [true, "Họ và tên là bắt buộc"],
    minlength: [2, "Tên phải có ít nhất 2 ký tự"],
    maxlength: [50, "Tên không được vượt quá 50 ký tự"],
    trim: true,
    match: [/^[\p{L}\s]+$/u, "Tên chỉ được chứa chữ cái và khoảng trắng"],
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
    required: [true, "Giới tính là bắt buộc"],
  },
  passwordHash: {
    type: String,
    required: [true, "Mật khẩu là bắt buộc"],
  },
  dob: {
    type: Date,
    validate: {
      validator: function (value) {
        if (!value) return true;
        const today = new Date();
        const age = today.getFullYear() - value.getFullYear();
        return age >= 13;
      },
      message: "Bạn phải ít nhất 13 tuổi để đăng ký",
    },
  },
  idCard: {
    type: String,
    match: [/^\d{9,12}$/, "Số CMND/CCCD phải từ 9-12 chữ số"],
  },
  phone: {
    type: String,
    required: [true, "Số điện thoại là bắt buộc"],
    match: [
      /^(0|\+84)(\d{9})$/,
      "Số điện thoại không hợp lệ (VD: 0912345678 hoặc +84912345678)",
    ],
  },
  address: {
    type: String,
    required: [true, "Địa chỉ là bắt buộc"],
    minlength: [5, "Địa chỉ phải có ít nhất 5 ký tự"],
    maxlength: [200, "Địa chỉ không được vượt quá 200 ký tự"],
    trim: true,
  },
  role: {
    type: String,
    enum: ["Customer", "Manager", "Admin"],
    default: "Customer",
  },
  status: {
    type: String,
    enum: ["Active", "Inactive", "Pending", "Banned"],
    default: "Pending",
  },
  pendingSince: { type: Date, default: Date.now, expires: 60 * 60 * 24 * 10 },
  otpCode: { type: String, default: null },
  otpExpires: { type: Date, default: null },
  lastOtpSentAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
