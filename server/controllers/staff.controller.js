const User = require("../models/user");
const bcrypt = require("bcrypt");

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
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email da duoc su dung" });
    }

    if (!password) {
      return res.status(400).json({ message: "Mat khau la bat buoc" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newStaff = new User({
      email,
      fullName,
      gender,
      passwordHash,
      phone,
      dob,
      idCard,
      address,
      role: "Staff",
      status: status || "Active",
      authProvider: "local",
    });

    await newStaff.save();

    res.status(201).json(sanitizeStaff(newStaff));
  } catch (error) {
    console.error("Loi khi tao nhan vien:", error);
    res.status(400).json({ message: error.message });
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

    const updatedStaff = await User.findOneAndUpdate(
      { _id: req.params.id, role: "Staff" },
      { status, updatedAt: Date.now() },
      { new: true, runValidators: true },
    );

    if (!updatedStaff) {
      return res.status(404).json({ message: "Nhan vien khong ton tai" });
    }

    res.json(sanitizeStaff(updatedStaff));
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
