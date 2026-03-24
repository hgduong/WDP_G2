const User = require("../models/user");
const bcrypt = require("bcrypt");
const { sendMail } = require("../utils/mail");

const sanitizeStaff = (staff) => {
  if (!staff) return staff;

  const staffObject =
    typeof staff.toObject === "function" ? staff.toObject() : { ...staff };

  delete staffObject.passwordHash;
  delete staffObject.otpCode;
  delete staffObject.otpExpires;
  delete staffObject.lastOtpSentAt;
  delete staffObject.resetToken;
  delete staffObject.resetExpires;

  return staffObject;
};

const sendStaffApprovalEmail = async (staff, status) => {
  if (!staff?.email) {
    return;
  }

  try {
    if (status === "Active") {
      await sendMail({
        to: staff.email,
        subject: "Yeu cau dang ky staff da duoc phe duyet",
        text:
          `Xin chao ${staff.fullName},\n\n` +
          "Admin da phe duyet tai khoan staff cua ban. Ban co the dang nhap va nhan OTP qua email de su dung he thong.\n",
      });
    }

    if (status === "Inactive") {
      await sendMail({
        to: staff.email,
        subject: "Yeu cau dang ky staff da bi tu choi",
        text:
          `Xin chao ${staff.fullName},\n\n` +
          "Yeu cau dang ky staff cua ban da bi tu choi hoac tai khoan da bi vo hieu hoa. Vui long lien he admin de biet them chi tiet.\n",
      });
    }
  } catch (error) {
    console.error("Loi khi gui email thong bao staff:", error);
  }
};

const createStaffRecord = async (payload = {}, options = {}) => {
  const {
    email,
    fullName,
    gender,
    password,
    phone,
    dob,
    idCard,
    address,
    status,
  } = payload;
  const { defaultStatus = "Active" } = options;

  const normalizedEmail = email?.trim()?.toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    const error = new Error("Email da duoc su dung");
    error.statusCode = 400;
    throw error;
  }

  if (!password) {
    const error = new Error("Mat khau la bat buoc");
    error.statusCode = 400;
    throw error;
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newStaff = new User({
    email: normalizedEmail,
    fullName,
    gender,
    passwordHash,
    phone,
    dob,
    idCard,
    address,
    role: "Staff",
    status: status || defaultStatus,
    authProvider: "local",
    pendingSince: null,
  });

  await newStaff.save();
  return newStaff;
};

exports.registerStaff = async (req, res) => {
  try {
    const newStaff = await createStaffRecord(req.body, { defaultStatus: "Pending" });
    res.status(201).json({
      message: "Dang ky staff thanh cong. Vui long cho admin kich hoat tai khoan.",
      staff: sanitizeStaff(newStaff),
    });
  } catch (error) {
    console.error("Loi khi dang ky staff:", error);
    res.status(error.statusCode || 400).json({ message: error.message });
  }
};

exports.getAllStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: "Staff" }).sort({ createdAt: -1 });
    res.json(staff.map(sanitizeStaff));
  } catch (error) {
    console.error("Loi khi lay danh sach nhan vien:", error);
    res.status(500).json({ message: "Loi server" });
  }
};

exports.getStaffById = async (req, res) => {
  try {
    const staff = await User.findOne({ _id: req.params.id, role: "Staff" });

    if (!staff) {
      return res.status(404).json({ message: "Nhan vien khong ton tai" });
    }

    res.json(sanitizeStaff(staff));
  } catch (error) {
    console.error("Loi khi lay thong tin nhan vien:", error);
    res.status(500).json({ message: "Loi server" });
  }
};

exports.createStaff = async (req, res) => {
  try {
    const newStaff = await createStaffRecord(req.body, { defaultStatus: "Active" });
    res.status(201).json(sanitizeStaff(newStaff));
  } catch (error) {
    console.error("Loi khi tao nhan vien:", error);
    res.status(error.statusCode || 400).json({ message: error.message });
  }
};

exports.updateStaff = async (req, res) => {
  try {
    const { fullName, gender, phone, dob, idCard, address, status } = req.body;

    const updatedStaff = await User.findOneAndUpdate(
      { _id: req.params.id, role: "Staff" },
      {
        fullName,
        gender,
        phone,
        dob,
        idCard,
        address,
        status,
        updatedAt: Date.now(),
      },
      { new: true, runValidators: true },
    );

    if (!updatedStaff) {
      return res.status(404).json({ message: "Nhan vien khong ton tai" });
    }

    res.json(sanitizeStaff(updatedStaff));
  } catch (error) {
    console.error("Loi khi cap nhat nhan vien:", error);
    res.status(400).json({ message: error.message });
  }
};

exports.deleteStaff = async (req, res) => {
  try {
    const staff = await User.findOneAndUpdate(
      { _id: req.params.id, role: "Staff" },
      { status: "Inactive", updatedAt: Date.now() },
      { new: true },
    );

    if (!staff) {
      return res.status(404).json({ message: "Nhan vien khong ton tai" });
    }

    res.json({
      message: "Nhan vien da bi vo hieu hoa",
      staff: sanitizeStaff(staff),
    });
  } catch (error) {
    console.error("Loi khi vo hieu hoa nhan vien:", error);
    res.status(500).json({ message: "Loi server" });
  }
};

exports.updateStaffStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ["Active", "Inactive", "Pending", "Banned"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Trang thai khong hop le" });
    }

    const currentStaff = await User.findOne({ _id: req.params.id, role: "Staff" });

    if (!currentStaff) {
      return res.status(404).json({ message: "Nhan vien khong ton tai" });
    }

    const previousStatus = currentStaff.status;
    currentStaff.status = status;
    currentStaff.updatedAt = Date.now();
    await currentStaff.save();

    if (previousStatus !== status && ["Active", "Inactive"].includes(status)) {
      await sendStaffApprovalEmail(currentStaff, status);
    }
    res.json(sanitizeStaff(currentStaff));
  } catch (error) {
    console.error("Loi khi cap nhat trang thai nhan vien:", error);
    res.status(400).json({ message: error.message });
  }
};

exports.changeStaffPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: "Mat khau moi la bat buoc" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const updatedStaff = await User.findOneAndUpdate(
      { _id: req.params.id, role: "Staff" },
      { passwordHash, updatedAt: Date.now() },
      { new: true },
    );

    if (!updatedStaff) {
      return res.status(404).json({ message: "Nhan vien khong ton tai" });
    }

    res.json({ message: "Doi mat khau thanh cong" });
  } catch (error) {
    console.error("Loi khi doi mat khau nhan vien:", error);
    res.status(500).json({ message: "Loi server" });
  }
};
