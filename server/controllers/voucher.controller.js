const Voucher = require("../models/voucher");

// Hàm kiểm tra và cập nhật trạng thái voucher tự động
const checkAndUpdateVoucherStatus = async (voucher) => {
  const now = new Date();
  let needsUpdate = false;
  
  // Nếu đã hết hạn hoặc đã hết lượt thì vô hiệu hóa
  if (voucher.isActive && (now > voucher.endDate || voucher.usedCount >= voucher.maxUsage)) {
    voucher.isActive = false;
    needsUpdate = true;
  }
  
  // Nếu chưa bắt đầu mà đang active thì vô hiệu hóa tạm thời
  if (voucher.isActive && now < voucher.startDate) {
    // Không vô hiệu hóa, chỉ không cho phép sử dụng
  }
  
  if (needsUpdate) {
    await voucher.save();
  }
  
  return voucher;
};

// Lấy danh sách tất cả voucher
exports.getAllVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.find().sort({ createdAt: -1 });
    
    // Cập nhật trạng thái cho từng voucher
    for (let voucher of vouchers) {
      await checkAndUpdateVoucherStatus(voucher);
    }
    
    // Lấy lại danh sách sau khi cập nhật
    const updatedVouchers = await Voucher.find().sort({ createdAt: -1 });
    res.json(updatedVouchers);
  } catch (error) {
    console.error("Get vouchers error:", error);
    res.status(500).json({ message: "Lỗi server khi lấy danh sách voucher" });
  }
};

// Lấy chi tiết một voucher
exports.getVoucherById = async (req, res) => {
  try {
    const voucher = await Voucher.findById(req.params.id);
    if (!voucher) {
      return res.status(404).json({ message: "Không tìm thấy voucher" });
    }
    res.json(voucher);
  } catch (error) {
    console.error("Get voucher error:", error);
    res.status(500).json({ message: "Lỗi server khi lấy thông tin voucher" });
  }
};

// Tạo voucher mới
exports.createVoucher = async (req, res) => {
  try {
    const {
      code,
      discountPercent,
      maxDiscount,
      maxUsage,
      maxUsagePerAccount,
      minOrderValue,
      startDate,
      endDate,
    } = req.body;

    // Validate
    if (!code || !discountPercent || !maxDiscount || !startDate || !endDate) {
      return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin" });
    }

    // Kiểm tra mã voucher đã tồn tại chưa
    const existingVoucher = await Voucher.findOne({ code: code.toUpperCase() });
    if (existingVoucher) {
      return res.status(400).json({ message: "Mã voucher đã tồn tại" });
    }

    if (discountPercent < 0 || discountPercent > 100) {
      return res.status(400).json({ message: "Phần giảm giá phải từ 0-100%" });
    }

    if (new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ message: "Ngày kết thúc phải sau ngày bắt đầu" });
    }

    const voucher = new Voucher({
      code: code.toUpperCase(),
      discountPercent,
      maxDiscount,
      maxUsage: maxUsage || 1,
      maxUsagePerAccount: maxUsagePerAccount || 1,
      minOrderValue: minOrderValue || 0,
      startDate,
      endDate,
      usedCount: 0,
    });

    await voucher.save();
    res.status(201).json(voucher);
  } catch (error) {
    console.error("Create voucher error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
    }
    if (error.code === 11000) {
      return res.status(400).json({ message: "Mã voucher đã tồn tại" });
    }
    res.status(500).json({ message: "Lỗi server khi tạo voucher" });
  }
};

// Cập nhật voucher
exports.updateVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      code,
      discountPercent,
      maxDiscount,
      maxUsage,
      maxUsagePerAccount,
      minOrderValue,
      startDate,
      endDate,
    } = req.body;

    const voucher = await Voucher.findById(id);
    if (!voucher) {
      return res.status(404).json({ message: "Không tìm thấy voucher" });
    }

    // Validate
    if (discountPercent && (discountPercent < 0 || discountPercent > 100)) {
      return res.status(400).json({ message: "Phần giảm giá phải từ 0-100%" });
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({ message: "Ngày kết thúc phải sau ngày bắt đầu" });
    }

    // Cập nhật các trường
    if (code) voucher.code = code.toUpperCase();
    if (discountPercent !== undefined) voucher.discountPercent = discountPercent;
    if (maxDiscount !== undefined) voucher.maxDiscount = maxDiscount;
    if (maxUsage !== undefined) voucher.maxUsage = maxUsage;
    if (maxUsagePerAccount !== undefined) voucher.maxUsagePerAccount = maxUsagePerAccount;
    if (minOrderValue !== undefined) voucher.minOrderValue = minOrderValue;
    if (startDate) voucher.startDate = startDate;
    if (endDate) voucher.endDate = endDate;

    await voucher.save();
    res.json(voucher);
  } catch (error) {
    console.error("Update voucher error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: "Dữ liệu không hợp lệ" });
    }
    res.status(500).json({ message: "Lỗi server khi cập nhật voucher" });
  }
};

// Xóa voucher
exports.deleteVoucher = async (req, res) => {
  try {
    const { id } = req.params;
    const voucher = await Voucher.findByIdAndDelete(id);
    
    if (!voucher) {
      return res.status(404).json({ message: "Không tìm thấy voucher" });
    }
    
    res.json({ message: "Xóa voucher thành công" });
  } catch (error) {
    console.error("Delete voucher error:", error);
    res.status(500).json({ message: "Lỗi server khi xóa voucher" });
  }
};

// Áp dụng voucher (kiểm tra và sử dụng)
exports.applyVoucher = async (req, res) => {
  try {
    // Hỗ trợ cả hai format: code/voucherCode và orderValue/totalPrice
    const { code, voucherCode, orderValue, totalPrice, userId } = req.body;
    const voucherCodeToUse = (code || voucherCode || "").toUpperCase().trim();
    const orderValueToUse = orderValue || totalPrice || 0;

    // Tìm voucher theo code (thêm điều kiện isActive nếu cần)
    console.log("Searching voucher with code:", voucherCodeToUse);
    const voucher = await Voucher.findOne({ code: voucherCodeToUse });
    if (!voucher) {
      return res.status(404).json({ message: "Mã voucher không hợp lệ" });
    }

    // Kiểm tra và cập nhật trạng thái voucher
    await checkAndUpdateVoucherStatus(voucher);
    
    // Refresh voucher after status check
    const updatedVoucher = await Voucher.findById(voucher._id);

    // Kiểm tra voucher có đang active không
    if (!updatedVoucher.isActive) {
      return res.status(400).json({ message: "Voucher đã bị vô hiệu hóa" });
    }

    // Kiểm tra thời gian hiệu lực
    const now = new Date();
    if (now < new Date(updatedVoucher.startDate)) {
      return res.status(400).json({ message: "Voucher chưa bắt đầu có hiệu lực" });
    }

    if (now > new Date(updatedVoucher.endDate)) {
      return res.status(400).json({ message: "Voucher đã hết hạn" });
    }

    // Kiểm tra số lượng sử dụng
    if (updatedVoucher.usedCount >= updatedVoucher.maxUsage) {
      return res.status(400).json({ message: "Voucher đã hết lượt sử dụng" });
    }

    // Kiểm tra giá trị đơn hàng tối thiểu
    if (orderValueToUse < updatedVoucher.minOrderValue) {
      return res.status(400).json({ 
        message: `Đơn hàng tối thiểu ${updatedVoucher.minOrderValue.toLocaleString()} VND` 
      });
    }

    // Tính giảm giá
    let discountAmount = (orderValueToUse * updatedVoucher.discountPercent) / 100;
    if (discountAmount > updatedVoucher.maxDiscount) {
      discountAmount = updatedVoucher.maxDiscount;
    }

    res.json({
      valid: true,
      discountPercent: updatedVoucher.discountPercent,
      discountAmount,
      maxDiscount: updatedVoucher.maxDiscount,
    });
  } catch (error) {
    console.error("Apply voucher error:", error);
    res.status(500).json({ message: "Lỗi server khi áp dụng voucher" });
  }
};
