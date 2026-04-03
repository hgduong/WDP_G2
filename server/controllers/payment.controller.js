const Payment = require("../models/payment");
const {
  syncPaymentState,
  processPaymentWebhook,
  populateBookingById,
} = require("../utils/qrBooking.service");

const canAccessPayment = async (req, paymentId) => {
  const payment = await Payment.findById(paymentId).populate("bookingId");
  if (!payment) {
    return { allowed: false, payment: null, statusCode: 404, message: "Payment not found" };
  }

  const role = req.user?.role;
  if (role === "Admin" || role === "Staff") {
    return { allowed: true, payment };
  }

  const isOwner =
    payment.bookingId?.userId &&
    payment.bookingId.userId.toString() === req.user?.id;

  if (!isOwner) {
    return {
      allowed: false,
      payment,
      statusCode: 403,
      message: "You do not have access to this payment",
    };
  }

  return { allowed: true, payment };
};

exports.getPaymentStatus = async (req, res) => {
  try {
    const access = await canAccessPayment(req, req.params.paymentId);
    if (!access.allowed) {
      return res.status(access.statusCode).json({ message: access.message });
    }

    let booking;

    try {
      booking = await syncPaymentState(access.payment._id);
    } catch (syncError) {
      console.error("Payment sync failed, returning local state:", syncError.message);
      booking = await populateBookingById(access.payment.bookingId?._id || access.payment.bookingId);
    }

    return res.json({
      booking,
      payment: booking?.paymentId || access.payment,
      status: booking?.paymentId?.status || access.payment.status,
    });
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Failed to load payment status" });
  }
};

exports.handlePayOSWebhook = async (req, res) => {
  try {
    const booking = await processPaymentWebhook(req.body);
    return res.json({
      success: true,
      bookingId: booking?._id || null,
      paymentStatus: booking?.paymentId?.status || null,
    });
  } catch (error) {
    console.error("PayOS webhook failed:", error);
    return res.status(400).json({
      success: false,
      message: error.message || "Webhook verification failed",
    });
  }
};
