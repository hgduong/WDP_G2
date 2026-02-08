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
    required: function () {
      return this.authProvider === "local";
    },
    minlength: [2, "Tên phải có ít nhất 2 ký tự"],
    maxlength: [50, "Tên không được vượt quá 50 ký tự"],
    trim: true,
    validate: {
      validator(value) {
        return this.authProvider !== "local" || /^[\p{L}\s]+$/u.test(value);
      },
      message: "Tên chỉ được chứa chữ cái và khoảng trắng",
    },

    // match: [/^[\p{L}\s]+$/u, "Tên chỉ được chứa chữ cái và khoảng trắng"],
  },
  gender: {
    type: String,
    enum: ["Male", "Female", "Other"],
    required: function () {
      return this.authProvider === "local";
    },
  },
  passwordHash: {
    type: String,
    required: function () {
      return this.authProvider === "local";
    },
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
    default: null,
  },
  phone: {
    type: String,
    required: function () {
      return this.authProvider === "local";
    },
    match: [
      /^(0|\+84)(\d{9})$/,
      "Số điện thoại không hợp lệ (VD: 0912345678 hoặc +84912345678)",
    ],
  },
  address: {
    type: String,
    required: function () {
      return this.authProvider === "local";
    },
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
  authProvider: {
    type: String,
    enum: ["local", "google", "facebook"],
    default: "local",
    required: true,
  },
  avatarUrl: { type: String, default: null },
  pendingSince: { type: Date, default: Date.now, expires: 60 * 60 },
  otpCode: { type: String, default: null },
  otpExpires: { type: Date, default: null },
  lastOtpSentAt: { type: Date, default: null },
  resetToken: { type: String, default: null },
  resetExpires: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("User", userSchema);
