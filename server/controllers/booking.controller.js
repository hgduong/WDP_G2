const Booking = require("../models/booking");
const {
  createPendingQrBooking,
  populateBookingById,
  populateBookingQuery,
  updatePendingBookingState,
  createHttpError,
} = require("../utils/qrBooking.service");

const canAccessBooking = (req, booking) => {
  const role = req.user?.role;
  if (role === "Admin" || role === "Staff") {
    return true;
  }

  return booking.userId && booking.userId.toString() === req.user?.id;
};

const serializeBooking = async (bookingId) => {
  const booking = await populateBookingById(bookingId);
  if (!booking) {
    throw createHttpError(404, "Booking not found");
  }
  return booking;
};

exports.prepareQrBooking = async (req, res) => {
  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { showtimeId, seatIds, customerInfo = {} } = req.body;

    if (!customerInfo.fullName || !customerInfo.email || !customerInfo.phone) {
      return res.status(400).json({
        message: "Customer full name, email and phone are required",
      });
    }

    const result = await createPendingQrBooking({
      userId: req.user.id,
      showtimeId,
      seatIds,
      customerInfo,
    });

    return res.status(201).json({
      message: "QR payment prepared successfully",
      booking: result.booking,
      payment: result.payment,
      paymentUrl: result.paymentUrl,
      qrData: result.qrData,
      orderCode: result.orderCode,
      expiresAt: result.expiresAt,
    });
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Failed to prepare QR payment" });
  }
};

exports.cancelPendingBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId);
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (!canAccessBooking(req, booking)) {
      return res.status(403).json({ message: "You do not have access to this booking" });
    }

    if (booking.paymentStatus !== "Pending" || booking.status !== "Pending") {
      return res.status(400).json({ message: "Only pending bookings can be cancelled" });
    }

    const updatedBooking = await updatePendingBookingState({
      bookingId: booking._id,
      bookingStatus: "Cancelled",
      paymentStatus: "Cancelled",
      cancelProvider: true,
      cancellationReason: "Cancelled by user",
    });

    return res.json({
      message: "Booking cancelled successfully",
      booking: updatedBooking,
      payment: updatedBooking.paymentId,
    });
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Failed to cancel booking" });
  }
};

exports.getBooking = async (req, res) => {
  try {
    const booking = await serializeBooking(req.params.bookingId);
    if (!canAccessBooking(req, booking)) {
      return res.status(403).json({ message: "You do not have access to this booking" });
    }

    return res.json(booking);
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Failed to load booking" });
  }
};

exports.getBookingByCode = async (req, res) => {
  try {
    const query = populateBookingQuery(
      Booking.findOne({ bookingCode: req.params.bookingCode }),
    );
    const booking = await query;

    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }

    if (!canAccessBooking(req, booking)) {
      return res.status(403).json({ message: "You do not have access to this booking" });
    }

    return res.json(booking);
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Failed to load booking" });
  }
};

exports.getUserBookings = async (req, res) => {
  try {
    const role = req.user?.role;
    const filter =
      role === "Admin" || role === "Staff" ? {} : { userId: req.user?.id };

    const query = populateBookingQuery(
      Booking.find(filter).sort({ createdAt: -1 }),
    );
    const bookings = await query;
    return res.json(bookings);
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Failed to load bookings" });
  }
};
