const User = require("../models/user");
const Booking = require("../models/booking");
const Showtime = require("../models/showtime");
const Room = require("../models/room");
const Seat = require("../models/seat");
const SeatStatus = require("../models/seatStatus");
const Ticket = require("../models/ticket");
const Tax = require("../models/tax");
const bcrypt = require("bcrypt");
const { sendMail } = require("../utils/mail");
const mongoose = require("mongoose");

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

const buildSeatBlueprint = (capacity = 0) => {
  const effectiveCapacity = Math.max(Number(capacity) || 0, 50);
  const seatsPerRow = 10;
  const rowCount = Math.ceil(effectiveCapacity / seatsPerRow);
  const seats = [];

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const rowLetter = String.fromCharCode(65 + rowIndex);
    const seatsInThisRow = Math.min(seatsPerRow, effectiveCapacity - rowIndex * seatsPerRow);

    // All rows: standard seats
    for (let seatNum = 1; seatNum <= seatsInThisRow; seatNum++) {
      seats.push({
        row: rowLetter,
        number: seatNum,
        type: "Standard"
      });
    }
  }

  return seats;
};

const createBookingCode = () =>
  `STF${Date.now().toString(36).toUpperCase()}${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;

const createTicketCode = () =>
  `TK${Date.now().toString(36).toUpperCase()}${Math.random()
    .toString(36)
    .slice(2, 4)
    .toUpperCase()}`;

const getSeatsForShowtime = async (showtimeId) => {
  const showtime = await Showtime.findById(showtimeId).populate("roomId");
  if (!showtime) return null;
  
  // Get seats from Room
  const room = await Room.findById(showtime.roomId._id || showtime.roomId).populate("seats");
  if (!room) return null;
  
  // Get seatStatuses for this showtime
  const seatStatuses = await SeatStatus.find({ showtimeId: showtimeId });
  
  // Merge seats with their statuses
  const seatsWithStatus = room.seats.map(seat => {
    const status = seatStatuses.find(
      s => s.seatId.toString() === seat._id.toString()
    );
    return {
      ...seat.toObject(),
      status: status?.status || 'Available',
      price: status?.price || 0,
      heldBy: status?.heldBy,
      heldUntil: status?.heldUntil,
      bookedBy: status?.bookedBy
    };
  });
  
  return {
    roomId: room._id,
    showtimeId: showtimeId,
    seats: seatsWithStatus,
    capacity: room.seats.length
  };
};

const createSeatStatusesForShowtime = async (room, showtimeId) => {
  // Get seats from Room
  const roomWithSeats = await Room.findById(room._id || room).populate("seats");
  if (!roomWithSeats || !roomWithSeats.seats || roomWithSeats.seats.length === 0) {
    throw new Error("Room has no seats");
  }

  // Create SeatStatus for each seat in this showtime
  const seatStatusesData = roomWithSeats.seats.map(seat => ({
    seatId: seat._id,
    showtimeId: showtimeId,
    status: 'Available',
    price: 50000 // Default price
  }));
  
  const createdStatuses = await SeatStatus.insertMany(seatStatusesData);
  
  // Update showtime with seatStatuses references
  await Showtime.findByIdAndUpdate(showtimeId, { 
    seatStatuses: createdStatuses.map(s => s._id) 
  });
  
  return createdStatuses;
};

const ensureSeatsForShowtime = async (showtime, room) => {
  // Ensure we have the latest room data with correct capacity
  // If room is already populated, use it; otherwise fetch fresh data
  let roomData = room;
  if (!roomData?.capacity || roomData.capacity === 0) {
    const roomId = roomData?._id || roomData;
    if (roomId) {
      roomData = await Room.findById(roomId);
    }
  }
  
  const actualCapacity = roomData?.capacity || 60; // Default to 60 if still 0
  console.log("Ensuring seats with capacity:", actualCapacity);
  
  // Check if room already has seats
  if (roomData?.seats && roomData.seats.length > 0) {
    return createSeatStatusesForShowtime(roomData, showtime._id);
  }

  // If room has no seats, create them
  const seats = await Seat.insertMany(buildSeatBlueprint(actualCapacity));
  
  // Update room with seats
  await Room.findByIdAndUpdate(roomData._id, {
    seats: seats.map((seat) => seat._id),
    capacity: seats.length
  });
  
  return createSeatStatusesForShowtime(roomData, showtime._id);
};

const ensureShowtimeSeats = async (showtimeInput) => {
  console.log("=== ensureShowtimeSeats DEBUG ===");
  const showtime =
    showtimeInput?.populate && typeof showtimeInput.populate === "function"
      ? showtimeInput
      : await Showtime.findById(showtimeInput);

  if (!showtime) {
    const error = new Error("Suất chiếu không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  console.log("Showtime ID:", showtime._id);
  console.log("Showtime roomId:", showtime.roomId);

  // Check if seatStatuses already exist for this showtime
  const existingSeatStatuses = await SeatStatus.find({ showtimeId: showtime._id });
  
  if (existingSeatStatuses && existingSeatStatuses.length > 0) {
    console.log("Method 1: Found existing seatStatuses:", existingSeatStatuses.length);
    return getSeatsForShowtime(showtime._id);
  }

  // Get room and ensure it has seats
  const room = await Room.findById(showtime.roomId);
  console.log("Method 2: Room found:", room ? "yes" : "no", "| capacity:", room?.capacity);
  
  if (!room) {
    const error = new Error("Phòng chiếu không tồn tại");
    error.statusCode = 404;
    throw error;
  }
  
  const expectedCapacity = room?.capacity || 60;
  
  if (!room.seats || room.seats.length === 0) {
    console.log(`Staff: Room has ${room.seats?.length || 0} seats! Generating...`, room._id);
    
    const seats = await Seat.insertMany(buildSeatBlueprint(expectedCapacity));
    
    // Update room with seats
    await Room.findByIdAndUpdate(room._id, {
      $set: { seats: seats.map(s => s._id), capacity: seats.length }
    });
  }
  
  console.log("Staff: Creating seatStatuses with room capacity:", room.capacity);

  await ensureSeatsForShowtime(showtime, room);

  return getSeatsForShowtime(showtime._id);
};

const formatSeatLabel = (seat) => {
  if (seat.type === 'Couple') {
    return `${seat.row}${seat.number}-${seat.number + 1}`;
  }
  return `${seat.row}${seat.number}`;
};

const mapSeatForClient = (seat) => ({
  _id: seat._id,
  row: seat.row,
  number: seat.number,
  type: seat.type,
  status: seat.status,
  label: formatSeatLabel(seat),
});

const sendStaffBookingEmail = async ({ booking, showtime, movie, cinema, room, seats }) => {
  const customerEmail = booking?.customerInfo?.email;
  if (!customerEmail) {
    return;
  }

  const seatLabels = seats.map(formatSeatLabel).join(", ");

  await sendMail({
    to: customerEmail,
        subject: `Xác nhận đặt chỗ ${movie?.title || "tại rạp"}`,
        text:
          `Xin chào ${booking.customerInfo.fullName || "Quý khách"},\n\n` +
          `Nhân viên đã tạo đặt chỗ cho bạn với mã ${booking.bookingCode}.\n` +
          `Phim: ${movie?.title || "-"}\n` +
          `Rạp: ${cinema?.name || "-"}\n` +
          `Phòng: ${room?.name || "-"}\n` +
          `Suất chiếu: ${new Date(showtime.startTime).toLocaleString("vi-VN")}\n` +
          `Ghế: ${seatLabels}\n` +
          `Tổng tiền: ${booking.totalPrice.toLocaleString("vi-VN")} VND\n` +
          `Trạng thái thanh toán: ${booking.paymentStatus}\n`,
  });
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
      message: "Đăng ký staff thành công. Vui lòng chờ admin kích hoạt tài khoản.",
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
      return res.status(404).json({ message: "Nhân viên không tồn tại" });
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
      return res.status(404).json({ message: "Nhân viên không tồn tại" });
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
      return res.status(404).json({ message: "Nhân viên không tồn tại" });
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
      return res.status(400).json({ message: "Trạng thái không hợp lệ" });
    }

    const currentStaff = await User.findOne({ _id: req.params.id, role: "Staff" });

    if (!currentStaff) {
      return res.status(404).json({ message: "Nhân viên không tồn tại" });
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
      return res.status(404).json({ message: "Nhân viên không tồn tại" });
    }

    res.json({ message: "Doi mat khau thanh cong" });
  } catch (error) {
    console.error("Loi khi doi mat khau nhan vien:", error);
    res.status(500).json({ message: "Loi server" });
  }
};

exports.getStaffBookingShowtimes = async (req, res) => {
  try {
    const { date, movieId, cinemaId } = req.query;
    const filter = { status: "Scheduled" };

    if (movieId && mongoose.isValidObjectId(movieId)) {
      filter.movieId = movieId;
    }

    if (date) {
      // Parse the date in local UTC+7 timezone to avoid off-by-one day issues
      const parts = date.split('-'); // YYYY-MM-DD
      if (parts.length === 3) {
        const startOfDay = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 0, 0, 0));
        const endOfDay = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]) + 1, 0, 0, 0));
        filter.startTime = { $gte: startOfDay, $lt: endOfDay };
      }
    }
    // If no date is provided, return ALL scheduled showtimes (sorted ascending)

    const showtimes = await Showtime.find(filter)
      .populate("movieId", "title duration posterUrl")
      .populate("roomId", "name type capacity")
      .populate({
        path: "roomId",
        populate: { path: "cinemaId", select: "name address city" }
      })
      .sort({ startTime: 1 });

    // Filter by cinemaId if provided (through room)
    let filteredShowtimes = showtimes;
    if (cinemaId && mongoose.isValidObjectId(cinemaId)) {
      filteredShowtimes = showtimes.filter(st => 
        st.roomId?.cinemaId?._id?.toString() === cinemaId || 
        st.roomId?.cinemaId?.toString() === cinemaId
      );
    }

    const enrichedShowtimes = await Promise.all(
      filteredShowtimes.map(async (showtime) => {
        const seatData = await ensureShowtimeSeats(showtime);
        const seats = seatData.seats || [];
        const availableSeats = seats.filter((seat) => seat.status === "Available").length;
        const bookedSeats = seats.filter((seat) => seat.status === "Booked").length;

        return {
          ...showtime.toObject(),
          availableSeats,
          bookedSeats,
          totalSeats: seats.length,
        };
      }),
    );

    res.json(enrichedShowtimes);
  } catch (error) {
    console.error("Loi khi lay showtime cho staff booking:", error);
    res.status(error.statusCode || 500).json({ message: error.message || "Loi server" });
  }
};

exports.getSeatMapForStaffBooking = async (req, res) => {
  try {
    const showtime = await Showtime.findById(req.params.showtimeId)
      .populate("movieId", "title duration posterUrl")
      .populate("roomId", "name type capacity")
      .populate({
        path: "roomId",
        populate: { path: "cinemaId", select: "name address city" }
      });

    if (!showtime) {
      return res.status(404).json({ message: "Suất chiếu không tồn tại" });
    }

    const seatData = await ensureShowtimeSeats(showtime);
    const seats = [...(seatData.seats || [])].sort((a, b) => {
      if (a.row === b.row) return a.number - b.number;
      return a.row.localeCompare(b.row);
    });

    res.json({
      showtime,
      seats: seats.map(mapSeatForClient),
      summary: {
        availableSeats: seats.filter((seat) => seat.status === "Available").length,
        bookedSeats: seats.filter((seat) => seat.status === "Booked").length,
        blockedSeats: seats.filter((seat) => seat.status === "Blocked").length,
        totalSeats: seats.length,
      },
    });
  } catch (error) {
    console.error("Loi khi lay seat staff booking:", error);
    res.status(error.statusCode || 500).json({ message: error.message || "Loi server" });
  }
};

const Voucher = require("../models/voucher");

const checkAndUpdateVoucherStatus = async (voucher) => {
  const now = new Date();
  if (voucher.endDate && now > new Date(voucher.endDate)) {
    voucher.isActive = false;
    await voucher.save();
  }
};

exports.createStaffBooking = async (req, res) => {
  try {
    const {
      showtimeId,
      seatIds,
      customerName,
      customerPhone,
      customerEmail,
      notes,
      sendEmail = false,
      paymentStatus = "PayAtCounter",
      voucherCode,
      pricePerSeat,
    } = req.body;

    // Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (sendEmail) {
      if (!customerEmail) {
        return res.status(400).json({ message: "Vui lòng nhập Email nếu muốn gửi thông báo." });
      }
      if (!emailRegex.test(customerEmail)) {
        return res.status(400).json({ message: "Email không đúng định dạng." });
      }
    }

    if (!showtimeId || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ message: "Suất chiếu và ghế là bắt buộc" });
    }

    if (!customerName || !customerPhone) {
      return res.status(400).json({ message: "Tên và số điện thoại khách hàng là bắt buộc" });
    }

    const showtime = await Showtime.findById(showtimeId)
      .populate("movieId", "title duration")
      .populate("roomId", "name type capacity")
      .populate({
        path: "roomId",
        populate: { path: "cinemaId", select: "name address city" }
      });

    if (!showtime) {
      return res.status(404).json({ message: "Suất chiếu không tồn tại" });
    }

    if (showtime.status !== "Scheduled") {
      return res.status(400).json({ message: "Chỉ có thể đặt chỗ suất chiếu đang mở bán" });
    }

    const seatData = await ensureShowtimeSeats(showtime);
    const uniqueSeatIds = [...new Set(seatIds)];
    const selectedSeats = seatData.seats.filter((seat) =>
      uniqueSeatIds.includes(seat._id.toString()),
    );

    if (selectedSeats.length !== uniqueSeatIds.length) {
      return res.status(400).json({ message: "Một hoặc nhiều ghế không hợp lệ" });
    }

    const unavailableSeat = selectedSeats.find((seat) => seat.status !== "Available");
    if (unavailableSeat) {
      return res.status(409).json({
        message: `Ghế ${formatSeatLabel(unavailableSeat)} đã không còn trống`,
      });
    }

    const normalizedPaymentStatus = ["Unpaid", "PayAtCounter", "Paid"].includes(paymentStatus)
      ? paymentStatus
      : "PayAtCounter";

    // Calculate total price based on pricePerSeat from request
    const basePrice = pricePerSeat || 75000; // Default price if not provided
    let totalPrice = 0;
    selectedSeats.forEach(seat => {
      if (seat.type === "Couple") {
        totalPrice += basePrice * 2;
      } else {
        totalPrice += basePrice;
      }
    });
    let discountAmount = 0;
    let appliedVoucher = null;

    // Get active movie ticket tax
    const Tax = require("../models/tax");
    const activeTax = await Tax.findOne({ categoryName: "Movie Ticket", isActive: true });
    const taxRate = activeTax ? activeTax.taxRate : 8;
    const taxAmount = (totalPrice * taxRate) / 100;

    if (voucherCode) {
      const voucher = await Voucher.findOne({ code: voucherCode });
      if (voucher) {
        await checkAndUpdateVoucherStatus(voucher);
        const updatedVoucher = await Voucher.findById(voucher._id);
        
        if (updatedVoucher && updatedVoucher.isActive) {
          const now = new Date();
          if (now >= new Date(updatedVoucher.startDate) && now <= new Date(updatedVoucher.endDate)) {
            if (updatedVoucher.usedCount < updatedVoucher.maxUsage && totalPrice >= updatedVoucher.minOrderValue) {
              discountAmount = (totalPrice * updatedVoucher.discountPercent) / 100;
              if (discountAmount > updatedVoucher.maxDiscount) {
                discountAmount = updatedVoucher.maxDiscount;
              }
              appliedVoucher = updatedVoucher._id;
            }
          }
        }
      }
    }

    totalPrice = Math.max(0, totalPrice - discountAmount) + taxAmount;

    const cinemaId = showtime.roomId?.cinemaId?._id || showtime.roomId?.cinemaId;

    const booking = await Booking.create({
      userId: null,
      bookedByStaffId: req.user?.id || null,
      showtimeId: showtime._id,
      cinemaId: cinemaId,
      roomId: showtime.roomId?._id || showtime.roomId,
      seats: selectedSeats.map((seat) => seat._id),
      totalPrice,
      originalPrice: basePrice * selectedSeats.length,
      discountAmount,
      voucherId: appliedVoucher,
      bookingCode: createBookingCode(),
      status: "Confirmed",
      bookingSource: "Staff",
      paymentStatus: normalizedPaymentStatus,
      customerInfo: {
        fullName: customerName.trim(),
        phone: customerPhone.trim(),
        email: customerEmail?.trim()?.toLowerCase() || "",
        notes: notes?.trim() || "",
      },
    });

    // Update Movie Ticket tax applyTo with booking ID
    await Tax.updateOne(
      { categoryName: "Movie Ticket", isActive: true },
      { $addToSet: { applyTo: booking._id } }
    );

    if (appliedVoucher) {
      await Voucher.findByIdAndUpdate(appliedVoucher, { $inc: { usedCount: 1 } });
    }

    // Create tickets for each seat
    const ticketDocs = selectedSeats.map((seat) => ({
      bookingId: booking._id,
      userId: booking.userId || (req.user?.id && mongoose.Types.ObjectId.isValid(req.user.id) ? req.user.id : null),
      showtimeId: showtime._id,
      cinemaId: cinemaId, // Corrected from showtime.cinemasId
      roomId: showtime.roomId?._id || showtime.roomId,
      seatId: seat._id,
      price: seat.type === "Couple" ? basePrice * 2 : basePrice, // Corrected price from showtime.price
      ticketCode: createTicketCode(),
      status: "Valid",
    }));

    const savedTickets = await Ticket.insertMany(ticketDocs);

    // Update booking with ticket IDs
    await Booking.findByIdAndUpdate(booking._id, {
      $set: { tickets: savedTickets.map((t) => t._id) },
    });

    // Update seat status to 'Booked'
    await Seat.updateMany(
      { _id: { $in: selectedSeats.map((seat) => seat._id) } },
      {
        $set: {
          status: "Booked",
          updatedAt: new Date(),
        },
      },
    );

    if (sendEmail && customerEmail) {
      try {
        await sendStaffBookingEmail({
          booking,
          showtime,
          movie: showtime.movieId,
          cinema: showtime.roomId?.cinemaId,
          room: showtime.roomId,
          seats: selectedSeats,
        });
      } catch (mailError) {
        console.error("Loi khi gui email dat cho staff:", mailError);
        // If the mail error is specifically related to the recipient address, report it
        if (mailError.code === 'EENVELOPE' || (mailError.responseCode && mailError.responseCode >= 500)) {
           return res.status(400).json({ 
             message: "Không thể gửi email vì địa chỉ email không tồn tại hoặc bị từ chối. Vui lòng kiểm tra lại email khách hàng.",
             error: mailError.message 
           });
        }
      }
    }

    res.status(201).json({
      message: "Đặt chỗ thành công",
      booking: {
        ...booking.toObject(),
        showtime,
        seats: selectedSeats.map(mapSeatForClient),
      },
    });
  } catch (error) {
    console.error("Loi khi tao dat cho staff:", error);
    res.status(error.statusCode || 500).json({ message: error.message || "Loi server" });
  }
};

exports.getStaffDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const todayShowtimes = await Showtime.find({
      startTime: { $gte: startOfDay, $lt: endOfDay },
      status: "Scheduled",
    }).populate("movieId", "title").populate({
      path: "roomId",
      populate: { path: "cinemaId", select: "name" }
    });

    const totalShowtimes = todayShowtimes.length;
    const completedShowtimes = todayShowtimes.filter(s => new Date(s.startTime) < new Date()).length;
    const upcomingShowtimes = totalShowtimes - completedShowtimes;

    const activeBookingsCount = await Booking.countDocuments({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
      bookingSource: "Staff",
      status: { $ne: "Cancelled" },
    });

    const pendingPaymentsCount = await Booking.countDocuments({
      createdAt: { $gte: startOfDay, $lt: endOfDay },
      bookingSource: "Staff",
      paymentStatus: { $in: ["PayAtCounter", "Pending"] },
      status: { $ne: "Cancelled" },
    });

    const staffId = req.user?.id || req.user?._id;
    const staffBookingsToday = staffId 
      ? await Booking.countDocuments({
          bookedByStaffId: staffId,
          createdAt: { $gte: startOfDay, $lt: endOfDay },
          status: { $ne: "Cancelled" },
        })
      : 0;

    res.json({
      openShifts: 1,
      totalShowtimes,
      completedShowtimes,
      upcomingShowtimes,
      activeBookings: activeBookingsCount,
      pendingPayments: pendingPaymentsCount,
      staffBookingsToday,
      readyStatus: "Sẵn sàng phục vụ",
    });
  } catch (error) {
    console.error("Loi khi lay dashboard stats:", error);
    res.status(500).json({ message: "Loi server" });
  }
};

// Get bookings created by staff (with optional filters)
exports.getStaffBookings = async (req, res) => {
  try {
    const { date, status, paymentStatus, limit = 50 } = req.query;
    const filter = { bookingSource: "Staff" };

    if (date) {
      const parts = date.split('-');
      if (parts.length === 3) {
        const startOfDay = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 0, 0, 0));
        const endOfDay = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]) + 1, 0, 0, 0));
        filter.createdAt = { $gte: startOfDay, $lt: endOfDay };
      }
    }

    if (status) {
      filter.status = status;
    }

    if (paymentStatus) {
      filter.paymentStatus = paymentStatus;
    }

    const bookings = await Booking.find(filter)
      .populate("showtimeId", "startTime")
      .populate("showtimeId.movieId", "title")
      .populate("cinemaId", "name")
      .populate("roomId", "name")
      .populate("bookedByStaffId", "fullName")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    res.json(bookings);
  } catch (error) {
    console.error("Loi khi lay staff bookings:", error);
    res.status(500).json({ message: "Loi server" });
  }
};

// Get all bookings for ticket check-in (both Staff and Customer)
exports.getAllBookings = async (req, res) => {
  try {
    const { bookingCode, ticketCode, phone, date, status, limit = 50 } = req.query;
    const filter = {};

    if (bookingCode) {
      filter.bookingCode = bookingCode;
    } else if (phone) {
      filter["customerInfo.phone"] = phone;
    }

    if (date) {
      const parts = date.split('-');
      if (parts.length === 3) {
        const startOfDay = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]), 0, 0, 0));
        const endOfDay = new Date(Date.UTC(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]) + 1, 0, 0, 0));
        filter.createdAt = { $gte: startOfDay, $lt: endOfDay };
      }
    }

    if (status) {
      filter.status = status;
    }

    const bookings = await Booking.find(filter)
      .populate({
        path: "showtimeId",
        populate: { path: "movieId", select: "title" }
      })
      .populate("cinemaId", "name address city")
      .populate("roomId", "name")
      .populate("tickets")
      .populate("seats", "row number")
      .populate("bookedByStaffId", "fullName")
      .sort({ createdAt: -1 })
      .limit(parseInt(limit));

    let results = bookings;

    if (ticketCode) {
      results = bookings.filter(b => 
        b.tickets?.some(t => t.ticketCode === ticketCode)
      );
    }

    res.json(results);
  } catch (error) {
    console.error("Loi khi lay bookings:", error);
    res.status(500).json({ message: "Loi server" });
  }
};

// Verify or check-in ticket by booking code or ticket code
exports.verifyTicket = async (req, res) => {
  try {
    const { bookingCode, ticketCode, action = "verify" } = req.body;
    const staffId = req.user?.id;

    let booking;
    let ticket;

    if (bookingCode) {
      booking = await Booking.findOne({ bookingCode })
        .populate({
          path: "showtimeId",
          populate: { path: "movieId", select: "title" }
        })
        .populate("cinemaId")
        .populate("roomId")
        .populate("seats", "row number")
        .populate({
          path: "tickets",
          populate: { path: "seatId", select: "row number type" }
        });
    } else if (ticketCode) {
      ticket = await Ticket.findOne({ ticketCode })
        .populate("showtimeId")
        .populate("cinemaId")
        .populate("roomId")
        .populate("bookingId")
        .populate({ path: "seatId", select: "row number type" });
      if (ticket) {
        booking = await Booking.findById(ticket.bookingId)
          .populate({
            path: "showtimeId",
            populate: { path: "movieId", select: "title" }
          })
          .populate("cinemaId")
          .populate("roomId")
          .populate("seats", "row number")
          .populate({
            path: "tickets",
            populate: { path: "seatId", select: "row number type" }
          });
      }
    }

    if (!booking) {
      return res.status(404).json({ message: "Không tìm thấy đơn đặt vé" });
    }

    const response = {
      booking: {
        bookingCode: booking.bookingCode,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        customerInfo: booking.customerInfo,
        showtime: booking.showtimeId,
        cinema: booking.cinemaId,
        room: booking.roomId,
      },
      tickets: [],
      action,
    };

    if (action === "checkin" && ticket) {
      if (ticket.status === "Used") {
        return res.status(400).json({ message: "Vé đã được sử dụng", ticket });
      }

      if (ticket.status === "Cancelled") {
        return res.status(400).json({ message: "Vé đã bị hủy", ticket });
      }

      ticket.status = "Used";
      ticket.checkin = new Date().toISOString();
      await ticket.save();

      // Log the check-in action
      await logStaffAction(staffId, "TICKET_CHECKIN", {
        bookingCode: booking.bookingCode,
        ticketCode: ticket.ticketCode,
        showtimeId: booking.showtimeId?._id,
      });

      const formatSeatLabelLocal = (s) => {
        if (!s || !s.row) return "Ghế";
        return s.type === "Couple" ? `${s.row}${s.number}-${s.number + 1}` : `${s.row}${s.number}`;
      };

      const ticketsData = (booking.tickets && booking.tickets.length > 0)
        ? booking.tickets
            .filter(t => t !== null)
            .map(t => ({
              ticketCode: t.ticketCode,
              status: t.status,
              seatLabel: formatSeatLabelLocal(t.seatId),
            }))
        : (booking.seats || []).map((s, idx) => ({
            ticketCode: `${booking.bookingCode}-${idx + 1}`,
            status: "Valid",
            seatLabel: formatSeatLabelLocal(s),
          }));

      response.tickets = ticketsData;
      response.message = "Check-in thành công";
      response.checkedInTicket = ticket;
    } else {
      const formatSeatLabelLocal = (s) => {
        if (!s || !s.row) return "Ghế";
        return s.type === "Couple" ? `${s.row}${s.number}-${s.number + 1}` : `${s.row}${s.number}`;
      };

      const ticketsData = (booking.tickets && booking.tickets.length > 0)
        ? booking.tickets
            .filter(t => t !== null)
            .map(t => ({
              ticketCode: t.ticketCode,
              status: t.status,
              seatLabel: formatSeatLabelLocal(t.seatId),
            }))
        : (booking.seats || []).map((s, idx) => ({
            ticketCode: `${booking.bookingCode}-${idx + 1}`,
            status: "Valid",
            seatLabel: formatSeatLabelLocal(s),
          }));

      response.tickets = ticketsData;
      response.message = "Xác thực thành công";
    }

    res.json(response);
  } catch (error) {
    console.error("Loi khi verify ticket:", error);
    res.status(500).json({ message: "Loi server" });
  }
};

// Override seat status (for supervisor/manager)
exports.overrideSeatStatus = async (req, res) => {
  try {
    const { showtimeId, seatId, newStatus, reason } = req.body;
    const staffId = req.user?.id;
    const staffRole = req.user?.role;

    if (!["Supervisor", "Manager", "Admin", "Staff"].includes(staffRole)) {
      return res.status(403).json({ message: "Không có quyền override ghế" });
    }

    const seat = await Seat.findById(seatId);
    if (!seat) {
      return res.status(404).json({ message: "Ghế không tồn tại" });
    }

    const previousStatus = seat.status;
    seat.status = newStatus;
    seat.updatedAt = new Date();
    await seat.save();

    // Log the override action
    await logStaffAction(staffId, "SEAT_OVERRIDE", {
      showtimeId,
      seatId,
      previousStatus,
      newStatus,
      reason,
    });

    res.json({
      message: "Override ghế thành công",
      seat: {
        _id: seat._id,
        row: seat.row,
        number: seat.number,
        type: seat.type,
        status: seat.status,
      },
    });
  } catch (error) {
    console.error("Loi khi override seat:", error);
    res.status(500).json({ message: "Loi server" });
  }
};

// Unlock internal seats (for supervisor/manager)
exports.unlockInternalSeats = async (req, res) => {
  try {
    const { showtimeId } = req.body;
    const staffId = req.user?.id;
    const staffRole = req.user?.role;

    if (!["Supervisor", "Manager", "Admin", "Staff"].includes(staffRole)) {
      return res.status(403).json({ message: "Không có quyền mở khóa ghế nội bộ" });
    }

    // Get showtime and room
    const showtime = await Showtime.findById(showtimeId);
    if (!showtime) {
      return res.status(404).json({ message: "Không tìm thấy suất chiếu" });
    }

    const room = await Room.findById(showtime.roomId).populate("seats");
    if (!room || !room.seats || room.seats.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy ghế trong phòng" });
    }

    const internalSeats = await Seat.find({
      _id: { $in: room.seats.map(s => s._id) },
      status: "Internal",
    });

    if (internalSeats.length === 0) {
      return res.json({ message: "Không có ghế nội bộ nào để mở khóa" });
    }

    const seatIds = internalSeats.map(s => s._id);
    await Seat.updateMany(
      { _id: { $in: seatIds } },
      { $set: { status: "Available", updatedAt: new Date() } }
    );

    // Log the unlock action
    await logStaffAction(staffId, "UNLOCK_INTERNAL_SEATS", {
      showtimeId,
      seatCount: internalSeats.length,
    });

    res.json({
      message: `Đã mở khóa ${internalSeats.length} ghế nội bộ`,
      unlockedSeats: seatIds,
    });
  } catch (error) {
    console.error("Loi khi unlock seats:", error);
    res.status(500).json({ message: "Loi server" });
  }
};

// Update booking payment status (for counter payment)
exports.updateBookingPayment = async (req, res) => {
  try {
    const { bookingId, paymentStatus, paymentMethod } = req.body;
    const staffId = req.user?.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Đơn đặt vé không tồn tại" });
    }

    const previousStatus = booking.paymentStatus;
    booking.paymentStatus = paymentStatus;
    
    if (paymentStatus === "Paid" && booking.status === "Pending") {
      booking.status = "Confirmed";
    }

    booking.updatedAt = new Date();
    await booking.save();

    // Log the payment update
    await logStaffAction(staffId, "PAYMENT_UPDATE", {
      bookingId,
      previousStatus,
      newStatus: paymentStatus,
      paymentMethod,
    });

    res.json({
      message: "Cập nhật thanh toán thành công",
      booking: {
        _id: booking._id,
        bookingCode: booking.bookingCode,
        paymentStatus: booking.paymentStatus,
        status: booking.status,
      },
    });
  } catch (error) {
    console.error("Loi khi cap nhat thanh toan:", error);
    res.status(500).json({ message: "Loi server" });
  }
};

// Get audit logs
exports.getAuditLogs = async (req, res) => {
  try {
    const { staffId, action, startDate, endDate, limit = 100 } = req.query;
    const filter = {};

    if (staffId) {
      filter.staffId = staffId;
    }

    if (action) {
      filter.action = action;
    }

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) filter.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(filter)
      .populate("staffId", "fullName email")
      .sort({ timestamp: -1 })
      .limit(parseInt(limit));

    res.json(logs);
  } catch (error) {
    console.error("Loi khi lay audit logs:", error);
    res.status(500).json({ message: "Loi server" });
  }
};

// Helper: Log staff action
const logStaffAction = async (staffId, action, details) => {
  try {
    const AuditLog = require("../models/auditLog");
    await AuditLog.create({
      staffId,
      action,
      details,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error("Loi khi ghi audit log:", error);
  }
};
