// require("../config/passport");
const express = require("express");
const router = express.Router();
// const passport = require("passport");
const {
  getUserProfile,
  updateUserProfile,
  changePassword,
} = require("../controllers/user.controller");

// Middleware xác thực bằng JWT (ví dụ dùng passport-jwt)
// const jwtAuth = passport.authenticate("jwt", { session: false });

// Lấy thông tin user (cần đăng nhập)
router.get("/profile", getUserProfile);

// Cập nhật thông tin user (cần đăng nhập)
router.put("/profile", updateUserProfile);

// Đổi mật khẩu (cần đăng nhập)
router.put("/change-password", changePassword);

module.exports = router;
