const Booking = require("../models/booking");
const Ticket = require("../models/ticket");
const Showtime = require("../models/showtime");
const Cinema = require("../models/cinema");
const Room = require("../models/room");
const Seat = require("../models/seat");
const User = require("../models/user");
const mongoose = require("mongoose");
const { sendMail } = require("../utils/mail");

// Generate unique booking code
const generateBookingCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `BK${timestamp}${random}`;
};

// Generate unique ticket code
const generateTicketCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `TK${timestamp}${random}`;
};

// Generate QR code URL
const generateQRCodeUrl = (data) => {
  const qrData = encodeURIComponent(JSON.stringify(data));
  return `https://chart.googleapis.com/chart?cht=qr&chl=${qrData}&chs=200x200&chco=4CAF50`;
};

// Create new booking with tickets
// controllers/bookingController.js

exports.createBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      showtimeId,
      cinemaId,
      roomId,
      seatIds = [],           // Thay vì seats → đổi thành seatIds rõ ràng
      totalPrice,
      customerName,
      customerPhone,
      customerEmail,
      notes = "",
      paymentStatus = "Pending"
    } = req.body;

    // ==================== VALIDATION ====================
    if (!showtimeId || !cinemaId || !roomId) {
      return res.status(400).json({ 
        success: false, 
        message: "Thiếu thông tin suất chiếu, rạp hoặc phòng" 
      });
    }

    if (!seatIds || seatIds.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Vui lòng chọn ít nhất một ghế" 
      });
    }

    if (!totalPrice || totalPrice <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: "Tổng tiền không hợp lệ" 
      });
    }

    // Check showtime tồn tại
    const showtime = await Showtime.findById(showtimeId).populate("movieId");
    if (!showtime) {
      return res.status(404).json({ success: false, message: "Suất chiếu không tồn tại" });
    }

    // Check cinema & room
    const cinema = await Cinema.findById(cinemaId);
    const room = await Room.findById(roomId);

    if (!cinema) return res.status(404).json({ success: false, message: "Rạp không tồn tại" });
    if (!room) return res.status(404).json({ success: false, message: "Phòng không tồn tại" });

    // ==================== TẠO BOOKING ====================
    const bookingCode = generateBookingCode();

    const booking = new Booking({
      userId: req.user?.id || null,
      showtimeId,
      cinemaId,
      roomId,
      totalPrice,
      bookingCode,
      status: "Pending",
      paymentStatus,
      customerInfo: {
        fullName: customerName || "",
        phone: customerPhone || "",
        email: customerEmail || "",
        notes
      }
    });

    await booking.save({ session });

    // ==================== TẠO TICKETS ====================
    const tickets = [];
    const pricePerSeat = totalPrice / seatIds.length;

    for (const seatId of seatIds) {
      const ticketCode = generateTicketCode();

      const ticket = new Ticket({
        bookingId: booking._id,
        userId: req.user?.id || null,
        showtimeId,
        cinemaId,
        roomId,
        seatId: seatId,                    // Lưu seatId trực tiếp
        price: pricePerSeat,
        ticketCode,
        status: "Valid",
        qrCodeUrl: generateQRCodeUrl({
          ticketCode,
          bookingCode,
          movie: showtime.movieId?.title,
          showtime: showtime.startTime,
          cinema: cinema.name,
          room: room.name,
          seat: seatId   // tạm thời dùng seatId, sau có thể cải thiện
        })
      });

      await ticket.save({ session });
      tickets.push(ticket);
    }

    // Cập nhật lại booking
    booking.tickets = tickets.map(t => t._id);
    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Populate để trả về frontend
    const populatedBooking = await Booking.findById(booking._id)
      .populate("showtimeId")
      .populate("cinemaId")
      .populate("roomId")
      .populate("tickets");

    res.status(201).json({
      success: true,
      message: "Đặt vé thành công",
      booking: populatedBooking,
      tickets: tickets.map(t => ({
        ticketCode: t.ticketCode,
        qrCodeUrl: t.qrCodeUrl,
        seatId: t.seatId
      }))
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Create Booking Error:", error);

    res.status(500).json({
      success: false,
      message: "Lỗi server khi tạo đặt vé",
      error: process.env.NODE_ENV === "development" ? error.message : undefined
    });
  }
};

// Update payment status
exports.updatePaymentStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { paymentStatus } = req.body;

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Đặt vé không tồn tại" });
    }

    booking.paymentStatus = paymentStatus;
    if (paymentStatus === "Paid") {
      booking.status = "Done";
    }
    await booking.save();

    // If payment is successful, send email with ticket info
    if (paymentStatus === "Paid" && booking.customerInfo?.email) {
      await sendTicketEmail(booking);
    }

    res.json({ 
      message: "Cập nhật trạng thái thanh toán thành công",
      booking 
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật thanh toán:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Get booking by ID
exports.getBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId)
      .populate("showtimeId")
      .populate("cinemaId")
      .populate("roomId")
      .populate("tickets");

    if (!booking) {
      return res.status(404).json({ message: "Đặt vé không tồn tại" });
    }

    // Add movie, showtime, cinema, room fields for frontend compatibility
    // booking.showtimeId is already populated, so we need to get movieId from it
    const showtime = await Showtime.findById(booking.showtimeId._id).populate("movieId");
    
    const bookingObj = booking.toObject();
    bookingObj.movie = showtime?.movieId || null;
    bookingObj.showtime = {
      startTime: booking.showtimeId?.startTime,
      price: booking.showtimeId?.price
    };
    bookingObj.cinema = {
      name: booking.cinemaId?.name,
      address: booking.cinemaId?.address,
      city: booking.cinemaId?.city
    };
    bookingObj.room = {
      name: booking.roomId?.name
    };

    res.json(bookingObj);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin đặt vé:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Get booking by code
exports.getBookingByCode = async (req, res) => {
  try {
    const { bookingCode } = req.params;

    const booking = await Booking.findOne({ bookingCode })
      .populate("showtimeId")
      .populate("cinemaId")
      .populate("roomId")
      .populate("tickets");

    if (!booking) {
      return res.status(404).json({ message: "Đặt vé không tồn tại" });
    }

    // Add movie, showtime, cinema, room fields for frontend compatibility
    // booking.showtimeId is already populated, so we need to get movieId from it
    const showtime = await Showtime.findById(booking.showtimeId._id).populate("movieId");
    
    const bookingObj = booking.toObject();
    bookingObj.movie = showtime?.movieId || null;
    bookingObj.showtime = {
      startTime: booking.showtimeId?.startTime,
      price: booking.showtimeId?.price
    };
    bookingObj.cinema = {
      name: booking.cinemaId?.name,
      address: booking.cinemaId?.address,
      city: booking.cinemaId?.city
    };
    bookingObj.room = {
      name: booking.roomId?.name
    };

    res.json(bookingObj);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin đặt vé:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};

// Send ticket email
const sendTicketEmail = async (booking) => {
  try {
    const { customerInfo, bookingCode, totalPrice } = booking;
    
    if (!customerInfo?.email) {
      return;
    }

    const tickets = await Ticket.find({ bookingId: booking._id })
      .populate("showtimeId")
      .populate("cinemaId")
      .populate("roomId");

    const showtime = await Showtime.findById(booking.showtimeId).populate("movieId");
    const cinema = await Cinema.findById(booking.cinemaId);
    const room = await Room.findById(booking.roomId);

    const ticketList = tickets.map(t => `
      <tr>
        <td style="padding: 10px; border: 1px solid #ddd;">${t.ticketCode}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${showtime?.movieId?.title || "N/A"}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${new Date(showtime?.startTime).toLocaleString("vi-VN")}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${cinema?.name}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${room?.name}</td>
        <td style="padding: 10px; border: 1px solid #ddd;">${t.qrCodeUrl ? '<img src="' + t.qrCodeUrl + '" width="100" />' : 'N/A'}</td>
      </tr>
    `).join("");

    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Xác nhận đặt vé thành công!</h2>
        
        <p>Xin chào <strong>${customerInfo.fullName || "Quý khách"}</strong>,</p>
        
        <p>Cảm ơn quý khách đã đặt vé tại rạp <strong>${cinema?.name}</strong>!</p>
        
        <h3>Thông tin đặt vé:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 10px;"><strong>Mã đặt vé:</strong></td>
            <td style="padding: 10px;">${bookingCode}</td>
          </tr>
          <tr>
            <td style="padding: 10px;"><strong>Rạp:</strong></td>
            <td style="padding: 10px;">${cinema?.name}</td>
          </tr>
          <tr>
            <td style="padding: 10px;"><strong>Địa chỉ:</strong></td>
            <td style="padding: 10px;">${cinema?.address}, ${cinema?.city}</td>
          </tr>
          <tr>
            <td style="padding: 10px;"><strong>Tổng tiền:</strong></td>
            <td style="padding: 10px;">${totalPrice.toLocaleString("vi-VN")} VND</td>
          </tr>
        </table>

        <h3>Thông tin vé:</h3>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #ddd;">
          <thead>
            <tr style="background: #4CAF50; color: white;">
              <th style="padding: 10px; border: 1px solid #ddd;">Mã vé</th>
              <th style="padding: 10px; border: 1px solid #ddd;">Phim</th>
              <th style="padding: 10px; border: 1px solid #ddd;">Suất chiếu</th>
              <th style="padding: 10px; border: 1px solid #ddd;">Rạp</th>
              <th style="padding: 10px; border: 1px solid #ddd;">Phòng</th>
              <th style="padding: 10px; border: 1px solid #ddd;">QR Code</th>
            </tr>
          </thead>
          <tbody>
            ${ticketList}
          </tbody>
        </table>

        <p style="margin-top: 20px;">
          <strong>Lưu ý:</strong> Quý khách vui lòng đến trước giờ chiếu 15 phút và mang theo mã QR này để nhận vé tại quầy.
        </p>

        <p style="color: #666; font-size: 12px; margin-top: 30px;">
          Email này được gửi tự động từ hệ thống đặt vé của rạp ${cinema?.name}. 
          Nếu quý khách không thực hiện giao dịch này, vui lòng liên hệ với chúng tôi.
        </p>
      </div>
    `;

    await sendMail({
      to: customerInfo.email,
      subject: `Xác nhận đặt vé ${showtime?.movieId?.title} - ${bookingCode}`,
      html: htmlContent
    });

    console.log(`Email đã được gửi đến ${customerInfo.email}`);
  } catch (error) {
    console.error("Lỗi khi gửi email:", error);
  }
};

// Get user bookings
exports.getUserBookings = async (req, res) => {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ message: "Vui lòng đăng nhập" });
    }

    const bookings = await Booking.find({ userId })
      .populate("showtimeId")
      .populate("cinemaId")
      .populate("roomId")
      .populate("tickets")
      .sort({ createdAt: -1 });

    res.json(bookings);
  } catch (error) {
    console.error("Lỗi khi lấy danh sách đặt vé:", error);
    res.status(500).json({ message: "Lỗi server" });
  }
};
