const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const axios = require("axios");
const { client_id, client_secret, redirect_uri } = require("../config/google");

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
    } else if (user.authProvider !== "local") {
      return res.status(400).json({ error: "Tài khoản này không thể gửi OTP" });
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
      text: `Xin chào ${user.fullName},\n\nMã OTP của bạn là: ${otp}\nMã này sẽ hết hạn sau 1 phút.\n\nTrân trọng.`,
    });

    res.json({ message: "OTP đã được gửi về email của bạn" });
  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({ error: "Lỗi server khi gửi OTP" });
  }
};

// Đăng ký
exports.register = async (req, res) => {
  try {
    const { email, fullName, gender, password, dob, phone, address } = req.body;

    // Kiểm tra email tồn tại
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
      // Hash mật khẩu
      const passwordHash = await bcrypt.hash(password, 10);

      // Tạo user mới
      const newUser = new User({
        email,
        fullName,
        gender,
        passwordHash,
        dob,
        idCard: null,
        phone,
        address,
        role: "Customer",
        status: "Pending",
      });

      await newUser.save();
      res.status(201).json({ message: "Đăng ký thành công" });
    } else if (existingUser.authProvider == "local") {
      return res.status(400).json({ message: "Email đã được đăng ký" });
    } else {
      return res.status(400).json({
        message: `Email đã được đăng ký bằng ${existingUser.authProvider}`,
      });
    }
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
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng" });
    } else if (user.authProvider !== "local") {
      return res.status(400).json({
        message: `Email đã được đăng ký bằng ${user.authProvider}`,
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(401).json({ message: "Sai mật khẩu" });
    if (user.status === "Pending")
      return res.status(200).json({
        message: "Tài khoản đang ở trạng thái Pending, cần xác thực OTP",
        requireOtp: true,
        user: { id: user._id, email: user.email },
      });
    if (user.status !== "Active")
      return res.status(401).json({ message: "Tài khoản chưa được kích hoạt" });
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    res.status(200).json({
      message: "Đăng nhập thành công",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl || null,
      },
    });
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

// Xác minh email tồn tại
exports.checkEmailExists = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email là bắt buộc" });
    }

    const user = await User.findOne({ email });

    if (user) {
      return res.json({
        exists: true,
        email: user.email,
        message: "Email đã tồn tại trong hệ thống, chuyển sang OTP Verify",
      });
    } else {
      return res.json({ exists: false, message: "Email chưa được đăng ký" });
    }
  } catch (error) {
    console.error("Check Email Error:", error);
    res.status(500).json({ error: "Lỗi server khi kiểm tra email" });
  }
};

// Xác thực OTP
exports.verifyOtp = async (req, res) => {
  try {
    const { email, otp, purpose } = req.body;

    if (!email || !otp || !purpose) {
      return res
        .status(400)
        .json({ error: "Email, OTP và Purpose là bắt buộc" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy user" });
    }

    if (!user.otpCode || !user.otpExpires) {
      return res.status(400).json({ error: "OTP chưa được tạo" });
    }

    if (new Date() > user.otpExpires) {
      return res.status(400).json({ error: "OTP đã hết hạn" });
    }

    if (user.otpCode !== otp) {
      return res.status(400).json({ error: "OTP không đúng" });
    }

    // OTP hợp lệ
    if (purpose === "register") {
      // Trường hợp đăng ký → kích hoạt tài khoản
      user.status = "Active";
      user.otpCode = null;
      user.otpExpires = null;
      user.pendingSince = undefined;
      await user.save();

      return res.json({ message: "Xác thực thành công, tài khoản đã Active" });
    }

    if (purpose === "forgotPassword") {
      if (user.status !== "Active") {
        return res.status(400).json({ error: "Tài khoản chưa được kích hoạt" });
      }
      // Trường hợp quên mật khẩu → không đổi status, chỉ cho phép reset
      // Xóa OTP để tránh reuse
      const resetToken = crypto.randomBytes(32).toString("hex");

      // Lưu reset token và thời hạn
      user.resetToken = resetToken;
      user.resetExpires = Date.now() + 15 * 60 * 1000; // 15 phút

      // Xóa OTP sau khi xác thực thành công
      user.otpCode = null;
      user.otpExpires = null;

      await user.save();

      // Tạo transporter gửi mail
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      // Tạo link reset password
      const resetUrl = `http://localhost:3000/reset_password?token=${resetToken}`;

      // Gửi email khôi phục mật khẩu
      await transporter.sendMail({
        from: process.env.SMTP_USER,
        to: user.email,
        subject: "Khôi phục mật khẩu",
        html: `
    <p>Bạn đã yêu cầu khôi phục mật khẩu.</p>
    <p>Click vào <a href="${resetUrl}">đây</a> để đặt lại mật khẩu:</p>
    <p>Link sẽ hết hạn sau 15 phút.</p>
  `,
      });

      return res.json({ message: "Xác thực thành công, hãy đặt lại mật khẩu" });
    }

    return res.status(400).json({ error: "Purpose không hợp lệ" });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return res.status(500).json({ error: "Lỗi server khi xác thực OTP" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res
        .status(400)
        .json({ error: "Token và mật khẩu mới là bắt buộc" });
    }

    // Tìm user theo resetToken
    const user = await User.findOne({
      resetToken: token,
      resetExpires: { $gt: Date.now() }, // token còn hạn
    });

    if (!user) {
      return res
        .status(400)
        .json({ error: "Token không hợp lệ hoặc đã hết hạn" });
    }

    // Hash mật khẩu mới
    const saltRounds = 10;
    user.passwordHash = await bcrypt.hash(newPassword, saltRounds);

    // Xóa token sau khi dùng
    user.resetToken = null;
    user.resetExpires = null;

    await user.save();

    return res.json({ message: "Mật khẩu đã được đặt lại thành công" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ error: "Lỗi server khi đặt lại mật khẩu" });
  }
};

exports.loginWithGoogle = (req, res) => {
  const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=code&scope=email profile`;
  res.redirect(url);
};

exports.googleCallback = async (req, res) => {
  const { code } = req.query;
  const tokenRes = await axios.post("https://oauth2.googleapis.com/token", {
    code,
    client_id,
    client_secret,
    redirect_uri,
    grant_type: "authorization_code",
  });
  const { access_token } = tokenRes.data;
  const userRes = await axios.get(
    "https://www.googleapis.com/oauth2/v3/userinfo",
    {
      headers: { Authorization: `Bearer ${access_token}` },
    },
  );
  const { email, name, picture } = userRes.data;
  let user = await User.findOne({ email });
  if (!user) {
    user = new User({
      email,
      fullName: name,
      avatarUrl: picture,
      status: "Active",
      authProvider: "google",
    });
    await user.save();
    const token = jwt.sign(
      {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl || null,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    res.redirect(`http://localhost:3000/?token=${token}`);
  } else if (user.authProvider !== "google") {
    return res.redirect(
      `http://localhost:3000/login?error=Email%20đã%20được%20đăng%20ký%20bằng%20phương%20thức%20khác`,
    );
  } else if (user.authProvider == "google") {
    const token = jwt.sign(
      {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl || null,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      },
    );

    res.redirect(`http://localhost:3000/?token=${token}`);
  }
};
