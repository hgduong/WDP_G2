const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

exports.sendOtp = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email là bắt buộc" });
    }

    // Tìm user theo email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy user" });
    }

    if (
      user.lastOtpSentAt &&
      Date.now() - user.lastOtpSentAt.getTime() < 60 * 1000
    ) {
      return res
        .status(400)
        .json({ error: "Bạn chỉ có thể gửi lại OTP sau 60 giây" });
    }

    // Sinh OTP 6 chữ số
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Lưu OTP và thời hạn (1 phút)
    user.otpCode = otp;
    user.otpExpires = new Date(Date.now() + 60 * 1000);
    user.lastOtpSentAt = new Date();
    await user.save();

    // Cấu hình transporter SMTP
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // Gửi email OTP
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: user.email,
      subject: "Mã xác thực OTP",
      text: `Xin chào ${user.fullName},\n\nMã OTP của bạn là: ${otp}\nMã này sẽ hết hạn sau 15 phút.\n\nTrân trọng.`,
    });

    res.json({ message: "OTP đã được gửi về email của bạn" });
  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({ error: "Lỗi server khi gửi OTP" });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate input
    if (!email || !otp) {
      return res.status(400).json({
        error: "Email và OTP là bắt buộc",
      });
    }

    // Tìm user theo email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        error: "Không tìm thấy user",
      });
    }

    // Kiểm tra OTP tồn tại
    if (!user.otpCode || !user.otpExpires) {
      return res.status(400).json({
        error: "OTP chưa được tạo",
      });
    }

    // Kiểm tra OTP hết hạn
    if (new Date() > user.otpExpires) {
      return res.status(400).json({
        error: "OTP đã hết hạn",
      });
    }

    // Kiểm tra OTP đúng hay không
    if (user.otpCode !== otp) {
      return res.status(400).json({
        error: "OTP không đúng",
      });
    }

    // Nếu OTP hợp lệ → cập nhật trạng thái user
    user.status = "Active";
    user.otpCode = undefined;
    user.otpExpires = undefined;
    user.pendingSince = undefined;

    await user.save();

    return res.json({
      message: "Xác thực thành công, tài khoản đã Active",
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return res.status(500).json({
      error: "Lỗi server khi xác thực OTP",
    });
  }
};

exports.register = async (req, res) => {
  try {
    const { email, fullName, gender, password, dob, idCard, phone, address } =
      req.body;

    // Kiểm tra email tồn tại
    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "Email đã tồn tại" });

    // Hash mật khẩu
    const passwordHash = await bcrypt.hash(password, 10);

    // Tạo user mới
    const newUser = new User({
      email,
      fullName,
      gender,
      passwordHash,
      dob,
      idCard,
      phone,
      address,
      role: "Customer",
      status: "Pending",
    });

    await newUser.save();
    res.status(201).json({ message: "Đăng ký thành công" });
  } catch (error) {
    if (error.name === "ValidationError") {
      console.error("Validation Error:", error.errors);
      return res.status(400).json({
        message: "Dữ liệu không hợp lệ",
      });
    }

    // Các lỗi khác
    console.error("Server Error:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Đăng nhập
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ message: "Sai mật khẩu" });

    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    res.status(200).json({ message: "Đăng nhập thành công", token });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
};

// Lấy thông tin người dùng
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select("-passwordHash");
    if (!user)
      return res.status(404).json({ message: "Không tìm thấy người dùng" });

    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
};

// Cập nhật thông tin người dùng
exports.updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    if (updates.password) {
      updates.passwordHash = await bcrypt.hash(updates.password, 10);
      delete updates.password;
    }

    const updatedUser = await User.findByIdAndUpdate(req.user.userId, updates, {
      new: true,
    });
    res.status(200).json({ message: "Cập nhật thành công", updatedUser });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error });
  }
};
