const User = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const passport = require("passport");

const STAFF_ALLOWED_ROLES = ["Staff", "Admin"];
const STAFF_LOGIN_OTP_EXPIRES_MS = 5 * 60 * 1000;

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function createSmtpTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

function buildAuthPayload(user) {
  return {
    id: user._id,
    fullName: user.fullName,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl || null,
  };
}

function issueAuthCookie(res, user) {
  const token = jwt.sign(buildAuthPayload(user), process.env.JWT_SECRET, {
    expiresIn: "1d",
  });

  res.cookie("jwt", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 24 * 60 * 60 * 1000,
  });
}

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
        errors: error.errors,
      });
    }

    // Các lỗi khác
    console.error("Server Error:", error);
    res.status(500).json({ message: "Lỗi server" });
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

      return res.json({ message: "Xác thực thành công, vui lòng đăng nhập" });
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
      const transporter = createSmtpTransporter();

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

      return res.json({ message: "Xác thực thành công, hãy kiểm tra email để đặt lại mật khẩu" });
    }

    if (purpose === "adminLogin") {
      // Trường hợp admin đăng nhập → xác thực OTP và tạo JWT
      if (user.role !== "Admin") {
        return res.status(403).json({ error: "Tài khoản không phải Admin" });
      }

      // Xóa OTP sau khi xác thực thành công
      user.otpCode = null;
      user.otpExpires = null;
      await user.save();

      // Tạo JWT cho admin
      const token = jwt.sign(
        {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl || null,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1d" },
      );

      // Gửi JWT dưới dạng HttpOnly cookie
      res.cookie("jwt", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // 1 ngày
      });

      return res.status(200).json({
        message: "Đăng nhập Admin thành công",
        user: {
          id: user._id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatarUrl || null,
        },
      });
    }

    return res.status(400).json({ error: "Purpose không hợp lệ" });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return res.status(500).json({ error: "Lỗi server khi xác thực OTP" });
  }
};

exports.requestStaffLoginOtp = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "Email và mật khẩu là bắt buộc" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản" });
    }

    if (!STAFF_ALLOWED_ROLES.includes(user.role)) {
      return res.status(403).json({ message: "Tài khoản không thuộc khu vực staff" });
    }

    if (user.authProvider !== "local") {
      return res.status(400).json({ message: "Tài khoản này không hỗ trợ đăng nhập OTP" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ message: "Sai mật khẩu" });
    }

    if (user.status !== "Active") {
      return res.status(403).json({ message: "Tài khoản staff đang chờ admin xác nhận" });
    }

    if (
      user.lastOtpSentAt &&
      Date.now() - user.lastOtpSentAt.getTime() < 60 * 1000
    ) {
      return res.status(400).json({ message: "Bạn chỉ có thể gửi lại OTP sau 60 giây" });
    }

    const otp = generateOTP();
    user.otpCode = otp;
    user.otpExpires = new Date(Date.now() + STAFF_LOGIN_OTP_EXPIRES_MS);
    user.lastOtpSentAt = new Date();
    await user.save();

    const transporter = createSmtpTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: user.email,
      subject: "Mã OTP đăng nhập staff",
      text:
        `Xin chào ${user.fullName},\n\n` +
        `Mã OTP đăng nhập của bạn là: ${otp}\n` +
        "Mã này sẽ hết hạn sau 5 phút.\n",
    });

    return res.json({
      message: "Mã OTP đăng nhập đã được gửi qua Gmail",
      email: user.email,
    });
  } catch (error) {
    console.error("Staff OTP Request Error:", error);
    return res.status(500).json({ message: "Lỗi server khi gửi OTP đăng nhập" });
  }
};

exports.verifyStaffLoginOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email và OTP là bắt buộc" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy tài khoản" });
    }

    if (!STAFF_ALLOWED_ROLES.includes(user.role)) {
      return res.status(403).json({ message: "Tài khoản không thuộc khu vực staff" });
    }

    if (user.status !== "Active") {
      return res.status(403).json({ message: "Tài khoản staff đang chờ admin xác nhận" });
    }

    if (!user.otpCode || !user.otpExpires) {
      return res.status(400).json({ message: "OTP chưa được tạo" });
    }

    if (new Date() > user.otpExpires) {
      return res.status(400).json({ message: "OTP đã hết hạn" });
    }

    if (user.otpCode !== otp.trim()) {
      return res.status(400).json({ message: "OTP không đúng" });
    }

    user.otpCode = null;
    user.otpExpires = null;
    user.lastOtpSentAt = null;
    await user.save();

    issueAuthCookie(res, user);

    return res.status(200).json({
      message: "Đăng nhập thành công",
      user: buildAuthPayload(user),
    });
  } catch (error) {
    console.error("Staff OTP Verify Error:", error);
    return res.status(500).json({ message: "Lỗi server khi xác thực OTP đăng nhập" });
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

// Đăng nhập bằng Local Strategy
const loginWithLocalStrategy = (req, res, next, options = {}) => {
  const { staffOnly = false } = options;

  passport.authenticate("local", { session: false }, async (err, user, info) => {
    if (err) {
      return res.status(500).json({ message: "Lỗi server", error: err });
    }
    
    // Nếu info có requireOtp (ví dụ: Admin cần xác thực OTP)
    if (!user && info?.requireOtp) {
      const { email } = req.body;
      
      // Tìm user để gửi OTP
      const foundUser = await User.findOne({ email });
      if (foundUser) {
        // Kiểm tra thời gian gửi OTP gần nhất
        if (
          foundUser.lastOtpSentAt &&
          Date.now() - foundUser.lastOtpSentAt.getTime() < 60 * 1000
        ) {
          return res.status(400).json({ 
            message: "Bạn chỉ có thể gửi lại OTP sau 60 giây" 
          });
        }
        
        // Sinh OTP mới
        const otp = generateOTP();
        foundUser.otpCode = otp;
        foundUser.otpExpires = new Date(Date.now() + 5 * 60 * 1000); // 5 phút
        foundUser.lastOtpSentAt = new Date();
        await foundUser.save();
        
        // Gửi email OTP
        const transporter = createSmtpTransporter();
        await transporter.sendMail({
          from: process.env.SMTP_USER,
          to: foundUser.email,
          subject: "Mã xác thực OTP đăng nhập Admin",
          text: `Xin chào ${foundUser.fullName},\n\nMã OTP đăng nhập Admin của bạn là: ${otp}\nMã này sẽ hết hạn sau 5 phút.\n\nTrân trọng.`,
        });
      }
      
      return res.status(401).json(info);
    }
    
    if (!user) {
      // info chứa message từ strategy (VD: sai mật khẩu, chưa kích hoạt)
      return res.status(401).json(info);
    }

    if (staffOnly && !STAFF_ALLOWED_ROLES.includes(user.role)) {
      return res.status(403).json({
        message: "Tài khoản không có quyền truy cập khu vực staff",
      });
    }

    // Nếu xác thực thành công → tạo JWT
    const token = jwt.sign(
      {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl || null,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    // gửi JWT dưới dạng HttpOnly cookie
    res.cookie("jwt", token, {
      httpOnly: true, // ngăn JS truy cập
      secure: process.env.NODE_ENV === "production", // chỉ bật khi production
      sameSite: "strict", // chống CSRF
      maxAge: 24 * 60 * 60 * 1000, // 1 ngày
    });

    return res.status(200).json({
      message: "Đăng nhập thành công",
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl || null,
      },
    });
  })(req, res, next);
};

// Đăng nhập bằng Local Strategy (khách hàng)
exports.login = (req, res, next) => {
  return loginWithLocalStrategy(req, res, next);
};

// Đăng nhập cho khu vực Staff/Admin
exports.staffLogin = (req, res, next) => {
  return loginWithLocalStrategy(req, res, next, { staffOnly: true });
};
// Đăng nhập bằng Facebook Strategy
exports.loginWithFacebook = (req, res, next) => {
  passport.authenticate("facebook", { scope: ["email"] })(req, res, next);
};

exports.facebookCallback = (req, res, next) => {
  passport.authenticate("facebook", { session: false }, (err, user, info) => {
    if (err) return res.status(500).json({ message: "Lỗi server", error: err });
    if (!user) {
      return res.redirect(
        "http://localhost:3000/login?error=Không%20thể%20lấy%20email%20từ%20facebook",
      );
    }

    // Tạo JWT
    const token = jwt.sign(
      {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl || null,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );
    res.cookie("jwt", token, {
      httpOnly: true, // ngăn JS đọc cookie
      secure: process.env.NODE_ENV === "production", // chỉ bật khi production
      sameSite: "strict", // chống CSRF
      maxAge: 24 * 60 * 60 * 1000, // 1 ngày
    });
    // Redirect về frontend kèm token
    res.redirect(`http://localhost:3000/`);
  })(req, res, next);
};

// Đăng nhập bằng Google Strategy
exports.loginWithGoogle = (req, res, next) => {
  passport.authenticate("google", { scope: ["profile", "email"] })(
    req,
    res,
    next,
  );
};

exports.googleCallback = (req, res, next) => {
  passport.authenticate("google", { session: false }, (err, user, info) => {
    if (err) return res.status(500).json({ message: "Lỗi server", error: err });

    if (!user) {
      // Nếu strategy trả về message cụ thể
      if (info && info.message === "Email đã đăng ký bằng phương thức khác") {
        return res.redirect(
          "http://localhost:3000/login?error=Email%20đã%20đăng%20ký%20bằng%20phương%20thức%20khác",
        );
      }
      return res.redirect(
        "http://localhost:3000/login?error=Không%20thể%20lấy%20email%20từ%20google",
      );
    }

    // Nếu thành công → tạo JWT
    const token = jwt.sign(
      {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl || null,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" },
    );

    res.cookie("jwt", token, {
      httpOnly: true, // ngăn JS đọc cookie
      secure: process.env.NODE_ENV === "production", // chỉ bật khi production
      sameSite: "strict", // chống CSRF
      maxAge: 24 * 60 * 60 * 1000, // 1 ngày
    });

    // Sau đó redirect mà không cần token trên URL
    res.redirect("http://localhost:3000/");
  })(req, res, next);
};

// Đăng xuất
exports.logout = (req, res) => {
  res.clearCookie("jwt", { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production" });
  res.status(200).json({ message: "Đăng xuất thành công" });
};

// Lấy thông tin người dùng từ token
exports.getUserIdentity = (req, res) => {
  res.json({
    message: "Thông tin người dùng",
    user: {
      id: req.user.id,
      fullName: req.user.fullName,
      email: req.user.email,
      role: req.user.role,
      avatarUrl: req.user.avatarUrl || null,
    },
  });
};
