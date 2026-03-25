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
exports.createBooking = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const {
      userId,
      showtimeId,
      cinemaId,
      roomId,
      seats,
      totalPrice,
      customerInfo,
      paymentStatus = "Unpaid"
    } = req.body;

    // Validate required fields
    if (!showtimeId || !cinemaId || !roomId || !seats || seats.length === 0 || !totalPrice) {
      return res.status(400).json({ message: "Thiếu thông tin bắt buộc" });
    }

    // Check if showtime exists
    const showtime = await Showtime.findById(showtimeId).populate("movieId");
    if (!showtime) {
      return res.status(404).json({ message: "Suất chiếu không tồn tại" });
    }

    // Check if cinema exists
    const cinema = await Cinema.findById(cinemaId);
    if (!cinema) {
      return res.status(404).json({ message: "Rạp không tồn tại" });
    }

    // Check if room exists
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Phòng không tồn tại" });
    }

    // Create booking
    const bookingCode = generateBookingCode();
    const booking = new Booking({
      userId: userId || null,
      showtimeId,
      cinemaId,
      roomId,
      seats: [],
      totalPrice,
      bookingCode,
      status: "Pending",
      paymentStatus,
      customerInfo: {
        fullName: customerInfo?.fullName || "",
        phone: customerInfo?.phone || "",
        email: customerInfo?.email || "",
        notes: customerInfo?.notes || ""
      }
    });

    await booking.save({ session });

    // Create tickets for each seat
    const tickets = [];
    for (const seat of seats) {
      const ticketCode = generateTicketCode();
      const ticketData = {
        bookingId: booking._id,
        userId: userId || null,
        showtimeId,
        cinemaId,
        roomId,
        seatId: seat._id || seat.id,
        price: showtime.price,
        ticketCode,
        status: "Valid",
        qrCodeUrl: generateQRCodeUrl({
          ticketCode,
          bookingCode,
          movie: showtime.movieId?.title,
          showtime: showtime.startTime,
          cinema: cinema.name,
          room: room.name,
          seat: seat.label
        })
      };

      const ticket = new Ticket(ticketData);
      await ticket.save({ session });
      tickets.push(ticket);
    }

    // Update booking with ticket IDs
    booking.seats = tickets.map(t => t._id);
    booking.tickets = tickets.map(t => t._id);
    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    // Populate response data
    const populatedBooking = await Booking.findById(booking._id)
      .populate("showtimeId")
      .populate("cinemaId")
      .populate("roomId")
      .populate("tickets");

    res.status(201).json({
      message: "Đặt vé thành công",
      booking: {
        ...populatedBooking.toObject(),
        movie: showtime.movieId,
        showtime: {
          startTime: showtime.startTime,
          price: showtime.price
        },
        cinema: {
          name: cinema.name,
          address: cinema.address,
          city: cinema.city
        },
        room: {
          name: room.name
        },
        seats: tickets.map(t => ({
          label: seats.find(s => s._id?.toString() === t.seatId?.toString() || s.id === t.seatId)?.label || "Unknown"
        })),
        tickets: tickets.map(t => ({
          ticketCode: t.ticketCode,
          seatLabel: seats.find(s => s._id?.toString() === t.seatId?.toString() || s.id === t.seatId)?.label || "Unknown",
          qrCodeUrl: t.qrCodeUrl
        })),
        purchaseDate: new Date(),
        paymentStatus
      }
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Lỗi khi tạo đặt vé:", error);
    res.status(500).json({ message: "Lỗi server khi tạo đặt vé" });
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

    res.json(booking);
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

    res.json(booking);
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
