const User = require("../models/user");
const Booking = require("../models/booking");
const Showtime = require("../models/showtime");
const Room = require("../models/room");
const Seat = require("../models/seat");
const Seatmap = require("../models/seatmap");
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

const seatmapController = require("./seatmap.controller");

const buildSeatBlueprint = (capacity = 0) => {
  // Use the shared function from seatmapController
  return seatmapController.buildSeatLayout(capacity);
};

const createBookingCode = () =>
  `STF${Date.now().toString(36).toUpperCase()}${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;

const populateSeatmap = async (seatmapId) =>
  Seatmap.findById(seatmapId).populate("seats");

const cloneRoomSeatmapToShowtime = async (roomSeatmap, showtimeId) => {
  const clonedSeats = await Seat.insertMany(
    (roomSeatmap.seats || []).map((seat) => ({
      row: seat.row,
      number: seat.number,
      type: seat.type || "Standard",
      status: "Available",
    })),
  );

  return Seatmap.create({
    roomId: roomSeatmap.roomId,
    showtimes: showtimeId,
    seats: clonedSeats.map((seat) => seat._id),
  });
};

const createSeatmapForShowtime = async (showtime, room) => {
  if (room.seatmapId) {
    const roomSeatmap = await Seatmap.findById(room.seatmapId).populate("seats");
    if (roomSeatmap) {
      return cloneRoomSeatmapToShowtime(roomSeatmap, showtime._id);
    }
  }

  const seats = await Seat.insertMany(buildSeatBlueprint(room.capacity));
  return Seatmap.create({
    roomId: room._id,
    showtimes: showtime._id,
    seats: seats.map((seat) => seat._id),
  });
};

const ensureShowtimeSeatmap = async (showtimeInput) => {
  const showtime =
    showtimeInput?.populate && typeof showtimeInput.populate === "function"
      ? showtimeInput
      : await Showtime.findById(showtimeInput);

  if (!showtime) {
    const error = new Error("Suất chiếu không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  if (showtime.seatMap) {
    const existingSeatmap = await populateSeatmap(showtime.seatMap);
    if (existingSeatmap) {
      return existingSeatmap;
    }
  }

  let seatmap = await Seatmap.findOne({ showtimes: showtime._id }).populate("seats");
  if (seatmap) {
    if (!showtime.seatMap || showtime.seatMap.toString() !== seatmap._id.toString()) {
      showtime.seatMap = seatmap._id;
      await showtime.save();
    }
    return seatmap;
  }

  const room = await Room.findById(showtime.roomId);
  if (!room) {
    const error = new Error("Phòng chiếu không tồn tại");
    error.statusCode = 404;
    throw error;
  }

  seatmap = await createSeatmapForShowtime(showtime, room);
  showtime.seatMap = seatmap._id;
  await showtime.save();

  return populateSeatmap(seatmap._id);
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

    if (cinemaId && mongoose.isValidObjectId(cinemaId)) {
      filter.cinemasId = cinemaId;
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
      .populate("cinemasId", "name address city")
      .populate("roomId", "name type capacity")
      .sort({ startTime: 1 });

    const enrichedShowtimes = await Promise.all(
      showtimes.map(async (showtime) => {
        const seatmap = await ensureShowtimeSeatmap(showtime);
        const seats = seatmap.seats || [];
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
      .populate("cinemasId", "name address city")
      .populate("roomId", "name type capacity");

    if (!showtime) {
      return res.status(404).json({ message: "Suất chiếu không tồn tại" });
    }

    const seatmap = await ensureShowtimeSeatmap(showtime);
    const seats = [...(seatmap.seats || [])].sort((a, b) => {
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
    console.error("Loi khi lay seatmap staff booking:", error);
    res.status(error.statusCode || 500).json({ message: error.message || "Loi server" });
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
    } = req.body;

    if (!showtimeId || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ message: "Suất chiếu và ghế là bắt buộc" });
    }

    if (!customerName || !customerPhone) {
      return res.status(400).json({ message: "Tên và số điện thoại khách hàng là bắt buộc" });
    }

    const showtime = await Showtime.findById(showtimeId)
      .populate("movieId", "title duration")
      .populate("cinemasId", "name address city")
      .populate("roomId", "name type capacity");

    if (!showtime) {
      return res.status(404).json({ message: "Suất chiếu không tồn tại" });
    }

    if (showtime.status !== "Scheduled") {
      return res.status(400).json({ message: "Chỉ có thể đặt chỗ suất chiếu đang mở bán" });
    }

    const seatmap = await ensureShowtimeSeatmap(showtime);
    const uniqueSeatIds = [...new Set(seatIds)];
    const selectedSeats = seatmap.seats.filter((seat) =>
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

    const totalPrice = Number(showtime.price || 0) * selectedSeats.length;
    const booking = await Booking.create({
      userId: null,
      bookedByStaffId: req.user?.id || null,
      showtimeId: showtime._id,
      cinemaId: showtime.cinemasId?._id || showtime.cinemasId,
      roomId: showtime.roomId?._id || showtime.roomId,
      seats: selectedSeats.map((seat) => seat._id),
      totalPrice,
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
          cinema: showtime.cinemasId,
          room: showtime.roomId,
          seats: selectedSeats,
        });
      } catch (mailError) {
        console.error("Loi khi gui email dat cho staff:", mailError);
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
