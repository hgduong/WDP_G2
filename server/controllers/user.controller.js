const User = require("../models/user");
const bcrypt = require("bcrypt");

// Lấy thông tin user
exports.getUserProfile = async (req, res) => {
  try {
    // Kiểm tra req.user trước
    if (!req.user || !req.user.id) {
      return res
        .status(401)
        .json({ message: "Token không hợp lệ hoặc chưa đăng nhập" });
    }

    const user = await User.findById(req.user.id).select("-passwordHash");
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy user" });
    }

    res.json(user);
  } catch (err) {
    console.error("Lỗi getUserProfile:", err);
    res.status(500).json({ message: "Lỗi server", error: err.message });
  }
};

// Cập nhật thông tin user
exports.updateUserProfile = async (req, res) => {
  try {
    const { fullName, avatarUrl } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { fullName, avatarUrl },
      { new: true },
    ).select("-passwordHash");
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err });
  }
};

// Đổi mật khẩu
exports.changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id);
    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) return res.status(400).json({ message: "Sai mật khẩu cũ" });

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    await user.save();
    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (err) {
    res.status(500).json({ message: "Lỗi server", error: err });
  }
};
