const mongoose = require("mongoose");
const Booking = require("../models/booking");
const Payment = require("../models/payment");
const Ticket = require("../models/ticket");
const Showtime = require("../models/showtime");
const Cinema = require("../models/cinema");
const Room = require("../models/room");
const payos = require("../config/payos");
const { sendMail } = require("./mail");
const seatmapController = require("../controllers/seatmap.controller");

const DEFAULT_SEAT_PRICE = 75000;

const toIdString = (value) => value?.toString();

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const generateBookingCode = (prefix = "BK") =>
  `${prefix}${Date.now().toString(36).toUpperCase()}${Math.random()
    .toString(36)
    .slice(2, 6)
    .toUpperCase()}`;

const generateTicketCode = () =>
  `TK${Date.now().toString(36).toUpperCase()}${Math.random()
    .toString(36)
    .slice(2, 5)
    .toUpperCase()}`;

const generateQRCodeUrl = (data) => {
  const qrData = encodeURIComponent(JSON.stringify(data));
  return `https://chart.googleapis.com/chart?cht=qr&chl=${qrData}&chs=200x200&chco=4CAF50`;
};

const populateBookingQuery = (query) =>
  query
    .populate({
      path: "showtimeId",
      populate: { path: "movieId", select: "title duration posterUrl" },
    })
    .populate("cinemaId", "name address city")
    .populate("roomId", "name type capacity price")
    .populate("seats", "row number type status")
    .populate({
      path: "tickets",
      populate: { path: "seatId", select: "row number type" },
    })
    .populate("paymentId");

const populateBookingById = async (bookingId, session = null) => {
  const query = populateBookingQuery(Booking.findById(bookingId));
  if (session) query.session(session);
  return query;
};

const baseSeatPriceFromContext = (showtime, room) =>
  Number(showtime?.price || room?.price || DEFAULT_SEAT_PRICE);

const calculateSeatPrice = (seat, basePrice) =>
  seat.type === "Couple" ? basePrice * 2 : basePrice;

const calculateTotalPrice = (seats, basePrice) =>
  seats.reduce((total, seat) => total + calculateSeatPrice(seat, basePrice), 0);

const sortSeatIds = (seatIds = []) => [...seatIds].map(toIdString).sort();

const bookingHasSameSeats = (booking, seatIds) =>
  JSON.stringify(sortSeatIds(booking.seats || [])) === JSON.stringify(sortSeatIds(seatIds));

const buildCustomerOrderUrl = (bookingId) =>
  `${process.env.CLIENT_URL || "http://localhost:3000"}/order?bookingId=${bookingId}`;

const buildPayOSDescription = (bookingCode) => `BK${bookingCode.slice(-10)}`;

const createOrderCode = () =>
  Number(
    `${Date.now().toString().slice(-10)}${Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0")}`,
  );

const loadShowtimeContext = async (showtimeId, session = null) => {
  const query = Showtime.findById(showtimeId).populate("movieId").populate("roomId");
  if (session) query.session(session);
  const showtime = await query;

  if (!showtime) {
    throw createHttpError(404, "Showtime not found");
  }

  if (showtime.status !== "Scheduled") {
    throw createHttpError(400, "Showtime is not available for booking");
  }

  const roomQuery = Room.findById(showtime.roomId?._id || showtime.roomId).populate("cinemaId");
  if (session) roomQuery.session(session);
  const room = await roomQuery;

  if (!room) {
    throw createHttpError(404, "Room not found");
  }

  const cinema =
    room.cinemaId && room.cinemaId._id
      ? room.cinemaId
      : await Cinema.findById(room.cinemaId).session(session || null);

  if (!cinema) {
    throw createHttpError(404, "Cinema not found");
  }

  return { showtime, room, cinema };
};

const ensureCustomerHolds = async ({ userId, showtimeId, seatIds, session }) => {
  const seatmap = await seatmapController.ensureShowtimeSeatmap(showtimeId, { session });
  await seatmapController.cleanupExpiredHoldsForShowtime(showtimeId, { session, seatmap });

  const normalizedSeatIds = [...new Set((seatIds || []).map(toIdString).filter(Boolean))];
  if (normalizedSeatIds.length === 0) {
    throw createHttpError(400, "Please select at least one seat");
  }

  const seatMap = new Map(
    (seatmap.seats || []).map((seat) => [toIdString(seat._id), seat]),
  );
  const selectedSeats = normalizedSeatIds.map((seatId) => seatMap.get(seatId)).filter(Boolean);

  if (selectedSeats.length !== normalizedSeatIds.length) {
    throw createHttpError(400, "One or more seats are invalid");
  }

  const invalidSeat = selectedSeats.find(
    (seat) =>
      seat.status !== "Holding" ||
      !seat.heldBy ||
      toIdString(seat.heldBy) !== toIdString(userId),
  );

  if (invalidSeat) {
    throw createHttpError(
      409,
      `Seat ${seatmapController.formatSeatLabel(invalidSeat)} is not currently held by you`,
    );
  }

  return {
    normalizedSeatIds,
    selectedSeats,
    expiresAt: new Date(
      Math.min(
        ...selectedSeats.map((seat) =>
          new Date(seat.heldUntil || Date.now() + seatmapController.HOLD_DURATION_MS).getTime(),
        ),
      ),
    ),
  };
};

const buildPayOSPayload = ({
  bookingId,
  bookingCode,
  orderCode,
  amount,
  customerInfo,
  expiresAt,
}) => ({
  orderCode,
  amount,
  description: buildPayOSDescription(bookingCode),
  cancelUrl: buildCustomerOrderUrl(bookingId),
  returnUrl: buildCustomerOrderUrl(bookingId),
  buyerName: customerInfo.fullName,
  buyerEmail: customerInfo.email,
  buyerPhone: customerInfo.phone,
  expiredAt: Math.floor(new Date(expiresAt).getTime() / 1000),
});

const shouldReusePendingBooking = (booking) => {
  if (!booking || booking.status !== "Pending" || booking.paymentStatus !== "Pending") {
    return false;
  }

  return booking.expiresAt && new Date(booking.expiresAt).getTime() > Date.now();
};

const createPendingQrBooking = async ({ userId, showtimeId, seatIds, customerInfo }) => {
  const validationSession = await mongoose.startSession();
  let validationSessionOpen = true;

  try {
    validationSession.startTransaction();
    const { showtime, room, cinema } = await loadShowtimeContext(showtimeId, validationSession);
    const holdState = await ensureCustomerHolds({
      userId,
      showtimeId,
      seatIds,
      session: validationSession,
    });

    const existingQuery = populateBookingQuery(
      Booking.find({
        userId,
        showtimeId,
        status: "Pending",
        paymentStatus: "Pending",
      }).sort({ createdAt: -1 }),
    );
    existingQuery.session(validationSession);
    const existingPendingBookings = await existingQuery;
    const reusableBooking = existingPendingBookings.find(
      (booking) =>
        shouldReusePendingBooking(booking) && bookingHasSameSeats(booking, holdState.normalizedSeatIds),
    );

    await validationSession.commitTransaction();
    validationSession.endSession();
    validationSessionOpen = false;

    if (reusableBooking?.paymentId?.checkoutUrl) {
      return {
        booking: reusableBooking,
        payment: reusableBooking.paymentId,
        paymentUrl: reusableBooking.paymentId.checkoutUrl,
        qrData: reusableBooking.paymentId.qrData,
        orderCode: reusableBooking.paymentId.orderCode,
        expiresAt: reusableBooking.paymentId.expiresAt || reusableBooking.expiresAt,
      };
    }

    const basePrice = baseSeatPriceFromContext(showtime, room);
    const amount = calculateTotalPrice(holdState.selectedSeats, basePrice);
    const bookingCode = generateBookingCode("BK");
    const orderCode = createOrderCode();

    const draftBooking = new Booking({
      userId,
      showtimeId: showtime._id,
      cinemaId: cinema._id,
      roomId: room._id,
      seats: holdState.normalizedSeatIds,
      totalPrice: amount,
      bookingCode,
      status: "Pending",
      bookingSource: "Customer",
      paymentStatus: "Pending",
      customerInfo: {
        fullName: customerInfo.fullName?.trim() || "",
        phone: customerInfo.phone?.trim() || "",
        email: customerInfo.email?.trim()?.toLowerCase() || "",
        notes: customerInfo.notes?.trim() || "",
      },
      expiresAt: holdState.expiresAt,
    });

    const payosResponse = await payos.paymentRequests.create(
      buildPayOSPayload({
        bookingId: draftBooking._id,
        bookingCode,
        orderCode,
        amount,
        customerInfo: draftBooking.customerInfo,
        expiresAt: holdState.expiresAt,
      }),
    );

    const createSession = await mongoose.startSession();
    let createSessionOpen = true;
    try {
      createSession.startTransaction();

      await ensureCustomerHolds({
        userId,
        showtimeId,
        seatIds: holdState.normalizedSeatIds,
        session: createSession,
      });

      await draftBooking.save({ session: createSession });

      const [payment] = await Payment.create(
        [
          {
            bookingId: draftBooking._id,
            userId,
            amount,
            currency: payosResponse.currency || "VND",
            method: "PayOS",
            paymentLinkId: payosResponse.paymentLinkId || null,
            orderCode: payosResponse.orderCode || orderCode,
            qrData: payosResponse.qrCode || null,
            checkoutUrl: payosResponse.checkoutUrl || null,
            providerStatus: payosResponse.status || "PENDING",
            status: "Pending",
            expiresAt: payosResponse.expiredAt
              ? new Date(Number(payosResponse.expiredAt) * 1000)
              : holdState.expiresAt,
          },
        ],
        { session: createSession },
      );

      draftBooking.paymentId = payment._id;
      draftBooking.expiresAt = payment.expiresAt || draftBooking.expiresAt;
      await draftBooking.save({ session: createSession });

      await createSession.commitTransaction();
      createSession.endSession();
      createSessionOpen = false;

      const populatedBooking = await populateBookingById(draftBooking._id);

      return {
        booking: populatedBooking,
        payment: populatedBooking.paymentId,
        paymentUrl: populatedBooking.paymentId?.checkoutUrl,
        qrData: populatedBooking.paymentId?.qrData,
        orderCode: populatedBooking.paymentId?.orderCode,
        expiresAt: populatedBooking.paymentId?.expiresAt || populatedBooking.expiresAt,
      };
    } catch (dbError) {
      if (createSessionOpen) {
        await createSession.abortTransaction();
        createSession.endSession();
      }

      try {
        await payos.paymentRequests.cancel(
          payosResponse.orderCode || orderCode,
          "Booking creation failed",
        );
      } catch (cancelError) {
        console.error("Failed to cancel orphan PayOS payment link:", cancelError.message);
      }

      throw dbError;
    }
  } catch (error) {
    if (validationSessionOpen) {
      await validationSession.abortTransaction();
      validationSession.endSession();
    }
    throw error;
  }
};

const createTicketsForBooking = async ({
  booking,
  showtime,
  cinema,
  room,
  seats,
  basePrice,
  session,
}) => {
  if (booking.tickets?.length) {
    return Ticket.find({ _id: { $in: booking.tickets } }).session(session || null);
  }

  const ticketDocs = seats.map((seat) => ({
    bookingId: booking._id,
    userId: booking.userId,
    showtimeId: showtime._id,
    cinemaId: cinema._id,
    roomId: room._id,
    seatId: seat._id,
    price: calculateSeatPrice(seat, basePrice),
    ticketCode: generateTicketCode(),
    status: "Valid",
    qrCodeUrl: generateQRCodeUrl({
      bookingCode: booking.bookingCode,
      showtimeId: showtime._id,
      ticketSeat: seatmapController.formatSeatLabel(seat),
    }),
  }));

  const savedTickets = await Ticket.insertMany(ticketDocs, { session });
  booking.tickets = savedTickets.map((ticket) => ticket._id);
  await booking.save({ session });
  return savedTickets;
};

const sendBookingConfirmationEmail = async (bookingId) => {
  const booking = await populateBookingById(bookingId);
  if (!booking?.customerInfo?.email) {
    return;
  }

  const movieTitle = booking.showtimeId?.movieId?.title || "Movie";
  const showtimeText = booking.showtimeId?.startTime
    ? new Date(booking.showtimeId.startTime).toLocaleString("vi-VN")
    : "N/A";

  const ticketRows = (booking.tickets || [])
    .map(
      (ticket) => `
        <tr>
          <td style="padding:8px;border:1px solid #ddd;">${ticket.ticketCode}</td>
          <td style="padding:8px;border:1px solid #ddd;">${
            seatmapController.formatSeatLabel(ticket.seatId)
          }</td>
          <td style="padding:8px;border:1px solid #ddd;">${ticket.price.toLocaleString(
            "vi-VN",
          )} VND</td>
        </tr>
      `,
    )
    .join("");

  await sendMail({
    to: booking.customerInfo.email,
    subject: `Booking confirmed ${booking.bookingCode}`,
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
        <h2 style="color:#2f855a;">Booking confirmed</h2>
        <p>Hello ${booking.customerInfo.fullName || "Customer"},</p>
        <p>Your payment has been confirmed successfully.</p>
        <table style="width:100%;border-collapse:collapse;margin:16px 0;">
          <tr><td style="padding:8px;"><strong>Booking code</strong></td><td style="padding:8px;">${booking.bookingCode}</td></tr>
          <tr><td style="padding:8px;"><strong>Movie</strong></td><td style="padding:8px;">${movieTitle}</td></tr>
          <tr><td style="padding:8px;"><strong>Showtime</strong></td><td style="padding:8px;">${showtimeText}</td></tr>
          <tr><td style="padding:8px;"><strong>Cinema</strong></td><td style="padding:8px;">${booking.cinemaId?.name || "N/A"}</td></tr>
          <tr><td style="padding:8px;"><strong>Room</strong></td><td style="padding:8px;">${booking.roomId?.name || "N/A"}</td></tr>
          <tr><td style="padding:8px;"><strong>Total</strong></td><td style="padding:8px;">${booking.totalPrice.toLocaleString("vi-VN")} VND</td></tr>
        </table>
        <table style="width:100%;border-collapse:collapse;border:1px solid #ddd;">
          <thead>
            <tr style="background:#2f855a;color:#fff;">
              <th style="padding:8px;border:1px solid #ddd;">Ticket</th>
              <th style="padding:8px;border:1px solid #ddd;">Seat</th>
              <th style="padding:8px;border:1px solid #ddd;">Price</th>
            </tr>
          </thead>
          <tbody>${ticketRows}</tbody>
        </table>
      </div>
    `,
  });
};

const finalizePaidBooking = async ({ paymentId, providerPayment = null, webhookData = null }) => {
  const session = await mongoose.startSession();
  let sessionOpen = true;
  let bookingIdToReturn = null;
  let seatIdsToEmit = [];

  try {
    session.startTransaction();

    const paymentQuery = Payment.findById(paymentId);
    paymentQuery.session(session);
    const payment = await paymentQuery;

    if (!payment) {
      throw createHttpError(404, "Payment not found");
    }

    const booking = await Booking.findById(payment.bookingId).session(session);
    if (!booking) {
      throw createHttpError(404, "Booking not found");
    }

    bookingIdToReturn = booking._id;

    if (payment.status === "Paid" && booking.status === "Confirmed") {
      await session.commitTransaction();
      session.endSession();
      sessionOpen = false;
      return populateBookingById(booking._id);
    }

    const { showtime, room, cinema } = await loadShowtimeContext(booking.showtimeId, session);
    const basePrice = baseSeatPriceFromContext(showtime, room);
    const seats = await seatmapController.claimSeatsForBooking({
      showtimeId: booking.showtimeId,
      seatIds: booking.seats,
      actorUserId: booking.userId,
      requireHeldByActor: false,
      allowAvailable: true,
      session,
    });

    await createTicketsForBooking({
      booking,
      showtime,
      cinema,
      room,
      seats,
      basePrice,
      session,
    });

    booking.status = "Confirmed";
    booking.paymentStatus = "Paid";
    booking.updatedAt = new Date();
    await booking.save({ session });

    payment.status = "Paid";
    payment.providerStatus = providerPayment?.status || payment.providerStatus || "PAID";
    payment.providerTxnId =
      providerPayment?.transactions?.[0]?.reference ||
      webhookData?.reference ||
      payment.providerTxnId;
    payment.paidAt = new Date();
    payment.lastWebhookPayload = webhookData || providerPayment || payment.lastWebhookPayload;
    payment.updatedAt = new Date();
    await payment.save({ session });

    seatIdsToEmit = booking.seats.map(toIdString);
    await session.commitTransaction();
    session.endSession();
    sessionOpen = false;
  } catch (error) {
    if (sessionOpen) {
      await session.abortTransaction();
      session.endSession();
    }
    throw error;
  }

  const booking = await populateBookingById(bookingIdToReturn);

  seatmapController.emitShowtimeSeatsChanged(booking.showtimeId?._id || booking.showtimeId, {
    reason: "payment_paid",
    seatIds: seatIdsToEmit,
  });

  try {
    await sendBookingConfirmationEmail(bookingIdToReturn);
  } catch (error) {
    console.error("Booking confirmation email failed:", error);
  }

  return booking;
};

const updatePendingBookingState = async ({
  bookingId,
  bookingStatus,
  paymentStatus,
  providerPayment = null,
  webhookData = null,
  cancelProvider = false,
  cancellationReason = null,
}) => {
  const session = await mongoose.startSession();
  let sessionOpen = true;
  let bookingIdToReturn = null;
  let showtimeIdToEmit = null;
  let seatIdsToEmit = [];
  let shouldEmit = false;
  let providerOrderCode = null;

  try {
    session.startTransaction();

    const booking = await Booking.findById(bookingId).session(session);
    if (!booking) {
      throw createHttpError(404, "Booking not found");
    }

    bookingIdToReturn = booking._id;
    showtimeIdToEmit = booking.showtimeId;
    seatIdsToEmit = booking.seats.map(toIdString);

    const payment = booking.paymentId
      ? await Payment.findById(booking.paymentId).session(session)
      : null;

    if (payment?.status === "Paid" || booking.paymentStatus === "Paid") {
      await session.commitTransaction();
      session.endSession();
      sessionOpen = false;
      return populateBookingById(booking._id);
    }

    const releaseResult = await seatmapController.releaseSeatsForUser({
      showtimeId: booking.showtimeId,
      seatIds: booking.seats,
      userId: booking.userId,
      session,
    });

    booking.status = bookingStatus;
    booking.paymentStatus = paymentStatus;
    booking.updatedAt = new Date();
    await booking.save({ session });

    if (payment) {
      payment.status = paymentStatus;
      payment.providerStatus =
        providerPayment?.status ||
        payment.providerStatus ||
        paymentStatus.toUpperCase();
      payment.lastWebhookPayload =
        webhookData || providerPayment || payment.lastWebhookPayload;
      payment.updatedAt = new Date();
      await payment.save({ session });
      providerOrderCode = payment.orderCode;
    }

    await session.commitTransaction();
    session.endSession();
    sessionOpen = false;
    shouldEmit = releaseResult.modifiedCount > 0;
  } catch (error) {
    if (sessionOpen) {
      await session.abortTransaction();
      session.endSession();
    }
    throw error;
  }

  if (shouldEmit) {
    seatmapController.emitShowtimeSeatsChanged(showtimeIdToEmit, {
      reason: `payment_${paymentStatus.toLowerCase()}`,
      seatIds: seatIdsToEmit,
    });
  }

  if (cancelProvider && providerOrderCode) {
    try {
      await payos.paymentRequests.cancel(
        providerOrderCode,
        cancellationReason || `Booking ${paymentStatus.toLowerCase()}`,
      );
    } catch (error) {
      console.error("Failed to cancel PayOS payment link:", error.message);
    }
  }

  return populateBookingById(bookingIdToReturn);
};

const mapProviderStatus = async ({ payment, providerPayment, webhookData = null }) => {
  if (!providerPayment) {
    return populateBookingById(payment.bookingId);
  }

  if (providerPayment.status === "PAID") {
    return finalizePaidBooking({
      paymentId: payment._id,
      providerPayment,
      webhookData,
    });
  }

  if (providerPayment.status === "CANCELLED") {
    return updatePendingBookingState({
      bookingId: payment.bookingId,
      bookingStatus: "Cancelled",
      paymentStatus: "Cancelled",
      providerPayment,
      webhookData,
      cancelProvider: false,
    });
  }

  if (providerPayment.status === "EXPIRED") {
    return updatePendingBookingState({
      bookingId: payment.bookingId,
      bookingStatus: "Expired",
      paymentStatus: "Expired",
      providerPayment,
      webhookData,
      cancelProvider: false,
    });
  }

  await Payment.findByIdAndUpdate(payment._id, {
    $set: {
      providerStatus: providerPayment.status || payment.providerStatus,
      updatedAt: new Date(),
    },
  });

  return populateBookingById(payment.bookingId);
};

const syncPaymentState = async (paymentId) => {
  const payment = await Payment.findById(paymentId);
  if (!payment) {
    throw createHttpError(404, "Payment not found");
  }

  if (payment.status !== "Pending") {
    return populateBookingById(payment.bookingId);
  }

  if (!payment.orderCode && !payment.paymentLinkId) {
    return populateBookingById(payment.bookingId);
  }

  const providerPayment = await payos.paymentRequests.get(
    payment.orderCode || payment.paymentLinkId,
  );

  return mapProviderStatus({ payment, providerPayment });
};

const processPaymentWebhook = async (payload) => {
  const webhookData = await payos.webhooks.verify(payload);
  const payment = await Payment.findOne({ orderCode: webhookData.orderCode });

  if (!payment) {
    return null;
  }

  const providerPayment = await payos.paymentRequests.get(
    payment.orderCode || payment.paymentLinkId,
  );

  return mapProviderStatus({ payment, providerPayment, webhookData });
};

let pendingPaymentCleanupTimer = null;

const startPendingPaymentCleanupJob = () => {
  if (pendingPaymentCleanupTimer) {
    return pendingPaymentCleanupTimer;
  }

  pendingPaymentCleanupTimer = setInterval(async () => {
    try {
      const expiredBookings = await Booking.find({
        status: "Pending",
        paymentStatus: "Pending",
        expiresAt: { $lte: new Date() },
      }).select("_id");

      for (const booking of expiredBookings) {
        await updatePendingBookingState({
          bookingId: booking._id,
          bookingStatus: "Expired",
          paymentStatus: "Expired",
          cancelProvider: true,
          cancellationReason: "Booking expired",
        });
      }
    } catch (error) {
      console.error("Pending payment cleanup failed:", error);
    }
  }, 5000);

  return pendingPaymentCleanupTimer;
};

module.exports = {
  DEFAULT_SEAT_PRICE,
  createPendingQrBooking,
  populateBookingById,
  populateBookingQuery,
  finalizePaidBooking,
  updatePendingBookingState,
  syncPaymentState,
  processPaymentWebhook,
  startPendingPaymentCleanupJob,
  createHttpError,
  sortSeatIds,
  bookingHasSameSeats,
};
