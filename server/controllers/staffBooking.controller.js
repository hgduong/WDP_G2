const mongoose = require("mongoose");
const Booking = require("../models/booking");
const Showtime = require("../models/showtime");
const Ticket = require("../models/ticket");
const Voucher = require("../models/voucher");
const seatmapController = require("./seatmap.controller");
const { sendMail } = require("../utils/mail");

const DEFAULT_SEAT_PRICE = 75000;

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

const calculateSeatPrice = (seat, basePrice) =>
  seat.type === "Couple" ? basePrice * 2 : basePrice;

const checkAndUpdateVoucherStatus = async (voucher) => {
  const now = new Date();
  if (voucher.endDate && now > new Date(voucher.endDate)) {
    voucher.isActive = false;
    await voucher.save();
  }
};

const sendStaffBookingEmail = async ({ booking, showtime, movie, cinema, room, seats }) => {
  if (!booking?.customerInfo?.email) {
    return;
  }

  const seatLabels = seats.map(seatmapController.formatSeatLabel).join(", ");

  await sendMail({
    to: booking.customerInfo.email,
    subject: `Staff booking ${booking.bookingCode}`,
    text:
      `Hello ${booking.customerInfo.fullName || "Customer"},\n\n` +
      `Your booking ${booking.bookingCode} was created successfully.\n` +
      `Movie: ${movie?.title || "-"}\n` +
      `Cinema: ${cinema?.name || "-"}\n` +
      `Room: ${room?.name || "-"}\n` +
      `Showtime: ${new Date(showtime.startTime).toLocaleString("vi-VN")}\n` +
      `Seats: ${seatLabels}\n` +
      `Total: ${booking.totalPrice.toLocaleString("vi-VN")} VND\n` +
      `Payment status: ${booking.paymentStatus}\n`,
  });
};

exports.getStaffBookingShowtimes = async (req, res) => {
  try {
    const { date, movieId, cinemaId } = req.query;
    const filter = { status: "Scheduled" };

    if (movieId && mongoose.isValidObjectId(movieId)) {
      filter.movieId = movieId;
    }

    if (date) {
      const parts = date.split("-");
      if (parts.length === 3) {
        const startOfDay = new Date(
          Date.UTC(
            parseInt(parts[0], 10),
            parseInt(parts[1], 10) - 1,
            parseInt(parts[2], 10),
            0,
            0,
            0,
          ),
        );
        const endOfDay = new Date(
          Date.UTC(
            parseInt(parts[0], 10),
            parseInt(parts[1], 10) - 1,
            parseInt(parts[2], 10) + 1,
            0,
            0,
            0,
          ),
        );
        filter.startTime = { $gte: startOfDay, $lt: endOfDay };
      }
    }

    const showtimes = await Showtime.find(filter)
      .populate("movieId", "title duration posterUrl")
      .populate("roomId", "name type capacity price")
      .populate({
        path: "roomId",
        populate: { path: "cinemaId", select: "name address city" },
      })
      .sort({ startTime: 1 });

    const filteredShowtimes = cinemaId && mongoose.isValidObjectId(cinemaId)
      ? showtimes.filter((showtime) => {
          const showtimeCinemaId =
            showtime.roomId?.cinemaId?._id || showtime.roomId?.cinemaId;
          return showtimeCinemaId?.toString() === cinemaId;
        })
      : showtimes;

    const enrichedShowtimes = await Promise.all(
      filteredShowtimes.map(async (showtime) => {
        await seatmapController.cleanupExpiredHoldsForShowtime(showtime._id);
        const seatmap = await seatmapController.ensureShowtimeSeatmap(showtime);
        const summary = seatmapController.buildSeatSummary(seatmap.seats || []);

        return {
          ...showtime.toObject(),
          ...summary,
        };
      }),
    );

    return res.json(enrichedShowtimes);
  } catch (error) {
    console.error("Staff booking showtimes failed:", error);
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Failed to load staff booking showtimes" });
  }
};

exports.getSeatMapForStaffBooking = async (req, res) => {
  try {
    const showtime = await Showtime.findById(req.params.showtimeId)
      .populate("movieId", "title duration posterUrl")
      .populate("roomId", "name type capacity price")
      .populate({
        path: "roomId",
        populate: { path: "cinemaId", select: "name address city" },
      });

    if (!showtime) {
      return res.status(404).json({ message: "Showtime not found" });
    }

    await seatmapController.cleanupExpiredHoldsForShowtime(showtime._id);
    const seatmap = await seatmapController.ensureShowtimeSeatmap(showtime);
    const seats = [...(seatmap.seats || [])].sort((left, right) => {
      if (left.row === right.row) {
        return left.number - right.number;
      }
      return left.row.localeCompare(right.row);
    });

    return res.json({
      showtime,
      seats: seats.map((seat) => seatmapController.mapSeatForClient(seat, req.user?.id || null)),
      summary: seatmapController.buildSeatSummary(seats),
    });
  } catch (error) {
    console.error("Staff seat map failed:", error);
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Failed to load seat map" });
  }
};

exports.createStaffBooking = async (req, res) => {
  const session = await mongoose.startSession();

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

    if (!req.user?.id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!showtimeId || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({ message: "Showtime and seats are required" });
    }

    if (!customerName || !customerPhone) {
      return res.status(400).json({ message: "Customer name and phone are required" });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (sendEmail && (!customerEmail || !emailRegex.test(customerEmail))) {
      return res.status(400).json({ message: "A valid email is required to send confirmation" });
    }

    const showtime = await Showtime.findById(showtimeId)
      .populate("movieId", "title duration")
      .populate("roomId", "name type capacity price")
      .populate({
        path: "roomId",
        populate: { path: "cinemaId", select: "name address city" },
      });

    if (!showtime) {
      return res.status(404).json({ message: "Showtime not found" });
    }

    if (showtime.status !== "Scheduled") {
      return res.status(400).json({ message: "Only scheduled showtimes can be booked" });
    }

    session.startTransaction();

    const claimedSeats = await seatmapController.claimSeatsForBooking({
      showtimeId,
      seatIds,
      actorUserId: req.user.id,
      requireHeldByActor: true,
      allowAvailable: false,
      session,
    });

    const basePrice = Number(pricePerSeat || showtime.roomId?.price || DEFAULT_SEAT_PRICE);
    const normalizedPaymentStatus = ["PayAtCounter", "Paid"].includes(paymentStatus)
      ? paymentStatus
      : "PayAtCounter";

    let totalPrice = claimedSeats.reduce(
      (sum, seat) => sum + calculateSeatPrice(seat, basePrice),
      0,
    );
    let discountAmount = 0;
    let appliedVoucher = null;

    if (voucherCode) {
      const voucher = await Voucher.findOne({ code: voucherCode }).session(session);
      if (voucher) {
        await checkAndUpdateVoucherStatus(voucher);
        if (
          voucher.isActive &&
          new Date() >= new Date(voucher.startDate) &&
          new Date() <= new Date(voucher.endDate) &&
          voucher.usedCount < voucher.maxUsage &&
          totalPrice >= voucher.minOrderValue
        ) {
          discountAmount = (totalPrice * voucher.discountPercent) / 100;
          if (discountAmount > voucher.maxDiscount) {
            discountAmount = voucher.maxDiscount;
          }
          totalPrice = Math.max(0, totalPrice - discountAmount);
          appliedVoucher = voucher._id;
          voucher.usedCount += 1;
          await voucher.save({ session });
        }
      }
    }

    const booking = new Booking({
      userId: null,
      bookedByStaffId: req.user.id,
      showtimeId: showtime._id,
      cinemaId: showtime.roomId?.cinemaId?._id || showtime.roomId?.cinemaId,
      roomId: showtime.roomId?._id || showtime.roomId,
      seats: claimedSeats.map((seat) => seat._id),
      totalPrice,
      originalPrice: claimedSeats.length * basePrice,
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

    await booking.save({ session });

    const ticketDocs = claimedSeats.map((seat) => ({
      bookingId: booking._id,
      userId: req.user.id,
      showtimeId: showtime._id,
      cinemaId: booking.cinemaId,
      roomId: booking.roomId,
      seatId: seat._id,
      price: calculateSeatPrice(seat, basePrice),
      ticketCode: createTicketCode(),
      status: "Valid",
    }));

    const savedTickets = await Ticket.insertMany(ticketDocs, { session });
    booking.tickets = savedTickets.map((ticket) => ticket._id);
    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    seatmapController.emitShowtimeSeatsChanged(showtime._id, {
      reason: "staff_booking",
      seatIds: claimedSeats.map((seat) => seat._id.toString()),
    });

    if (sendEmail && customerEmail) {
      await sendStaffBookingEmail({
        booking,
        showtime,
        movie: showtime.movieId,
        cinema: showtime.roomId?.cinemaId,
        room: showtime.roomId,
        seats: claimedSeats,
      });
    }

    return res.status(201).json({
      message: "Staff booking created successfully",
      booking: {
        ...booking.toObject(),
        showtime,
        seats: claimedSeats.map((seat) => seatmapController.mapSeatForClient(seat)),
        tickets: savedTickets,
      },
    });
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("Create staff booking failed:", error);
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Failed to create staff booking" });
  }
};
