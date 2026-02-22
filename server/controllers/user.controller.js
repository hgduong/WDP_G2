const User = require("../models/user");
const bcrypt = require("bcrypt");

// Lấy thông tin user
exports.getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User không tồn tại" });
    res.json(user);
  } catch (error) {
    console.error("Lỗi khi lấy profile:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Cập nhật thông tin user

exports.updateUserProfile = async (req, res) => {
  try {
    // req.user.id được gắn từ middleware authenticateToken (JWT decode)
    const userId = req.user.id;

    // Lấy dữ liệu từ body
    const {
      fullName,
      email,
      gender,
      dob,
      phone,
      province,
      district,
      ward,
      street,
    } = req.body;

    // Cập nhật user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        fullName,
        email,
        gender,
        dob,
        phone,
        address: {
          province,
          district,
          ward,
          street,
        },
      },
      { new: true }, // trả về document sau khi update
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User không tồn tại" });
    }

    res.json(updatedUser);
  } catch (error) {
    console.error("Lỗi khi cập nhật profile:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({ message: "Thiếu dữ liệu" });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "Mật khẩu mới không khớp" });
    }

    const user = await User.findById(req.user.id).select("+passwordHash");
    if (!user) return res.status(404).json({ message: "Không tìm thấy user" });

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Mật khẩu hiện tại không đúng" });
    }

    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);

    await user.save();

    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    console.error("Lỗi đổi mật khẩu:", error);
    res.status(500).json({ message: "Có lỗi xảy ra" });
  }
};
