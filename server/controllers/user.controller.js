const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
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

    // Kiểm tra xem email mới đã tồn tại chưa (nếu đổi email)
    if (email) {
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== userId) {
        return res.status(400).json({ message: "Email đã được sử dụng bởi tài khoản khác" });
      }
    }

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

    // res.json(updatedUser);
    const newToken = jwt.sign(
      {
        id: updatedUser._id,
        fullName: updatedUser.fullName,
        email: updatedUser.email,
        role: updatedUser.role,
        avatarUrl: updatedUser.avatarUrl || null,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    // Xóa cookie cũ trước khi set cookie mới
    res.clearCookie("jwt", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    // Set cookie mới với các tham số đầy đủ
    res.cookie("jwt", newToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 24 * 60 * 60 * 1000, // 1 ngày
    });

    res.json({ user: updatedUser, token: newToken });
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

    if (currentPassword == newPassword) {
      return res
        .status(400)
        .json({
          message: "Mật khẩu mới không được trùng với mật khẩu hiện tại",
        });
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

// Xóa tài khoản (đổi trạng thái thành Inactive)
exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id;

    if (!password) {
      return res.status(400).json({ message: "Vui lòng nhập mật khẩu xác nhận" });
    }

    const user = await User.findById(userId).select("+passwordHash");
    if (!user) {
      return res.status(404).json({ message: "User không tồn tại" });
    }

    // Kiểm tra nếu tài khoản đã bị vô hiệu hóa
    if (user.status === "Inactive") {
      return res.status(400).json({ message: "Tài khoản đã bị vô hiệu hóa trước đó" });
    }

    // So sánh mật khẩu với database
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Mật khẩu xác nhận không đúng" });
    }

    // Cập nhật trạng thái thành Inactive
    user.status = "Inactive";
    await user.save();

    // Xóa cookie JWT
    res.clearCookie("jwt", {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
    });

    res.json({ message: "Tài khoản đã được vô hiệu hóa thành công" });
  } catch (error) {
    console.error("Lỗi khi xóa tài khoản:", error);
    res.status(500).json({ message: "Có lỗi xảy ra" });
  }
};

