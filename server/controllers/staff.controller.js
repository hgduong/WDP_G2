const User = require("../models/user");
const bcrypt = require("bcrypt");

// Lấy danh sách tất cả nhân viên
exports.getAllStaff = async (req, res) => {
  try {
    const staff = await User.find({ role: "Staff" }).sort({ createdAt: -1 });
    res.json(staff);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách nhân viên:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Lấy thông tin nhân viên theo ID
exports.getStaffById = async (req, res) => {
  try {
    const staff = await User.findOne({ _id: req.params.id, role: "Staff" });
    if (!staff) {
      return res.status(404).json({ message: "Nhân viên không tồn tại" });
    }
    res.json(staff);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin nhân viên:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Tạo nhân viên mới
exports.createStaff = async (req, res) => {
  try {
    const { email, fullName, gender, password, phone, dob, idCard, address, status } = req.body;

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email đã được sử dụng" });
    }

    // Mã hóa mật khẩu
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
    
    // Trả về thông tin nhân viên (không bao gồm passwordHash)
    const staffResponse = newStaff.toObject();
    delete staffResponse.passwordHash;
    
    res.status(201).json(staffResponse);
  } catch (error) {
    console.error("Lỗi khi tạo nhân viên:", error);
    res.status(400).json({ message: error.message });
  }
};

// Cập nhật thông tin nhân viên
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
      { new: true }
    );

    if (!updatedStaff) {
      return res.status(404).json({ message: "Nhân viên không tồn tại" });
    }

    // Không trả về passwordHash
    const staffResponse = updatedStaff.toObject();
    delete staffResponse.passwordHash;

    res.json(staffResponse);
  } catch (error) {
    console.error("Lỗi khi cập nhật nhân viên:", error);
    res.status(400).json({ message: error.message });
  }
};

// Xóa nhân viên (chuyển trạng thái thành Inactive)
exports.deleteStaff = async (req, res) => {
  try {
    const staff = await User.findOneAndUpdate(
      { _id: req.params.id, role: "Staff" },
      { status: "Inactive", updatedAt: Date.now() },
      { new: true }
    );

    if (!staff) {
      return res.status(404).json({ message: "Nhân viên không tồn tại" });
    }

    res.json({ message: "Nhân viên đã bị vô hiệu hóa" });
  } catch (error) {
    console.error("Lỗi khi xóa nhân viên:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Cập nhật trạng thái nhân viên
exports.updateStaffStatus = async (req, res) => {
  try {
    const { status } = req.body;

    // Kiểm tra trạng thái hợp lệ
    const validStatuses = ["Active", "Inactive", "Pending", "Banned"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    const updatedStaff = await User.findOneAndUpdate(
      { _id: req.params.id, role: "Staff" },
      { status, updatedAt: Date.now() },
      { new: true }
    );

    if (!updatedStaff) {
      return res.status(404).json({ message: "Nhân viên không tồn tại" });
    }

    // Không trả về passwordHash
    const staffResponse = updatedStaff.toObject();
    delete staffResponse.passwordHash;

    res.json(staffResponse);
  } catch (error) {
    console.error("Lỗi khi cập nhật trạng thái nhân viên:", error);
    res.status(400).json({ message: error.message });
  }
};

// Đổi mật khẩu nhân viên
exports.changeStaffPassword = async (req, res) => {
  try {
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({ message: "Mật khẩu mới là bắt buộc" });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    const updatedStaff = await User.findOneAndUpdate(
      { _id: req.params.id, role: "Staff" },
      { passwordHash, updatedAt: Date.now() },
      { new: true }
    );

    if (!updatedStaff) {
      return res.status(404).json({ message: "Nhân viên không tồn tại" });
    }

    res.json({ message: "Đổi mật khẩu thành công" });
  } catch (error) {
    console.error("Lỗi khi đổi mật khẩu nhân viên:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};
