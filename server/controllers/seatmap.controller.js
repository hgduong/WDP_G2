const mongoose = require("mongoose");
const Seatmap = require("../models/seatmap");
const Seat = require("../models/seat");
const Room = require("../models/room");
const Showtime = require("../models/showtime");

const HOLD_DURATION_MS = 5 * 60 * 1000;

const toIdString = (value) => value?.toString();

const buildSeatLayout = (totalSeats) => {
  const effectiveCapacity = Math.max(Number(totalSeats) || 0, 50);
  const seatsPerRow = 10;
  const seats = [];
  const totalRows = Math.ceil(effectiveCapacity / seatsPerRow);

  for (let rowIndex = 0; rowIndex < totalRows; rowIndex += 1) {
    const rowLetter = String.fromCharCode(65 + rowIndex);
    const seatsInThisRow = Math.min(
      seatsPerRow,
      effectiveCapacity - rowIndex * seatsPerRow,
    );
    const isLastRow = rowIndex === totalRows - 1;

    if (isLastRow) {
      for (let i = 0; i < 5; i += 1) {
        seats.push({
          row: rowLetter,
          number: i * 2 + 1,
          type: "Couple",
          status: "Available",
        });
      }
      continue;
    }

    for (let seatNum = 1; seatNum <= seatsInThisRow; seatNum += 1) {
      seats.push({
        row: rowLetter,
        number: seatNum,
        type: rowIndex >= 3 ? "VIP" : "Standard",
        status: "Available",
      });
    }
  }

  return seats;
};

const formatSeatLabel = (seat) => {
  if (!seat) {
    return "";
  }

  return seat.type === "Couple"
    ? `${seat.row}${seat.number}-${seat.number + 1}`
    : `${seat.row}${seat.number}`;
};

const mapSeatForClient = (seat, currentUserId = null) => {
  const now = Date.now();
  const heldByMe =
    currentUserId &&
    seat.status === "Holding" &&
    seat.heldBy &&
    toIdString(seat.heldBy) === toIdString(currentUserId) &&
    seat.heldUntil &&
    new Date(seat.heldUntil).getTime() > now;

  return {
    _id: seat._id,
    label: formatSeatLabel(seat),
    row: seat.row,
    number: seat.number,
    type: seat.type,
    status: seat.status === "Internal" ? "Blocked" : seat.status,
    heldUntil: seat.heldUntil,
    isHeldByMe: Boolean(heldByMe),
  };
};

const buildSeatSummary = (seats = []) =>
  seats.reduce(
    (summary, seat) => {
      if (seat.status === "Available") summary.availableSeats += 1;
      else if (seat.status === "Holding") summary.holdingSeats += 1;
      else if (seat.status === "Booked") summary.bookedSeats += 1;
      else summary.blockedSeats += 1;

      summary.totalSeats += 1;
      return summary;
    },
    {
      availableSeats: 0,
      holdingSeats: 0,
      bookedSeats: 0,
      blockedSeats: 0,
      totalSeats: 0,
    },
  );

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const emitShowtimeSeatsChanged = (showtimeId, meta = {}) => {
  try {
    const { emitShowtimeSeatsChanged: emit } = require("../socket");
    emit(showtimeId, meta);
  } catch (error) {
    console.error("Seat realtime emit failed:", error.message);
  }
};

const fetchShowtimeDocument = async (showtimeInput, session = null) => {
  if (
    showtimeInput &&
    typeof showtimeInput === "object" &&
    showtimeInput._id &&
    showtimeInput.roomId
  ) {
    return showtimeInput;
  }

  const query = Showtime.findById(showtimeInput);
  if (session) query.session(session);
  const showtime = await query;
  if (!showtime) {
    throw createHttpError(404, "Showtime not found");
  }

  return showtime;
};

const buildBlueprintFromTemplate = (templateSeats = []) =>
  templateSeats.map((seat) => ({
    row: seat.row,
    number: seat.number,
    type: seat.type || "Standard",
    status: "Available",
  }));

const populateSeatmap = async (seatmapId, session = null) => {
  const query = Seatmap.findById(seatmapId).populate("seats");
  if (session) query.session(session);
  return query;
};

const buildOrRestoreSeatmap = async (seatmap, showtime, room, session) => {
  const templateSeatmap =
    room.seatmapId &&
    (await Seatmap.findById(room.seatmapId).populate("seats").session(session));

  const blueprint =
    templateSeatmap?.seats?.length > 0
      ? buildBlueprintFromTemplate(templateSeatmap.seats)
      : buildSeatLayout(room.capacity || 60);

  const createdSeats = await Seat.insertMany(blueprint, { session });

  if (seatmap) {
    await Seatmap.findByIdAndUpdate(
      seatmap._id,
      {
        $set: {
          roomId: room._id,
          showtimes: showtime._id,
          seats: createdSeats.map((seat) => seat._id),
          isTemplate: false,
          capacity: blueprint.length,
        },
      },
      { session },
    );

    if (!showtime.seatMap || toIdString(showtime.seatMap) !== toIdString(seatmap._id)) {
      await Showtime.findByIdAndUpdate(
        showtime._id,
        { $set: { seatMap: seatmap._id } },
        { session },
      );
    }

    return populateSeatmap(seatmap._id, session);
  }

  const [createdSeatmap] = await Seatmap.create(
    [
      {
        roomId: room._id,
        showtimes: showtime._id,
        seats: createdSeats.map((seat) => seat._id),
        isTemplate: false,
        capacity: blueprint.length,
      },
    ],
    { session },
  );

  await Showtime.findByIdAndUpdate(
    showtime._id,
    { $set: { seatMap: createdSeatmap._id } },
    { session },
  );

  return populateSeatmap(createdSeatmap._id, session);
};

const ensureShowtimeSeatmap = async (showtimeInput, options = {}) => {
  const { session = null } = options;
  const showtime = await fetchShowtimeDocument(showtimeInput, session);
  const roomQuery = Room.findById(showtime.roomId);
  if (session) roomQuery.session(session);
  const room = await roomQuery;

  if (!room) {
    throw createHttpError(404, "Room not found");
  }

  let seatmap = null;

  if (showtime.seatMap) {
    seatmap = await populateSeatmap(showtime.seatMap, session);
  }

  if (!seatmap) {
    const fallbackQuery = Seatmap.findOne({ showtimes: showtime._id }).populate("seats");
    if (session) fallbackQuery.session(session);
    seatmap = await fallbackQuery;
  }

  if (seatmap?.seats?.length) {
    if (!showtime.seatMap || toIdString(showtime.seatMap) !== toIdString(seatmap._id)) {
      await Showtime.findByIdAndUpdate(
        showtime._id,
        { $set: { seatMap: seatmap._id } },
        { session },
      );
    }
    return seatmap;
  }

  return buildOrRestoreSeatmap(seatmap, showtime, room, session);
};

const validateSeatIds = (seatmap, rawSeatIds = []) => {
  const uniqueSeatIds = [...new Set((rawSeatIds || []).map(toIdString).filter(Boolean))];
  if (uniqueSeatIds.length === 0) {
    throw createHttpError(400, "Please select at least one seat");
  }

  const seatIdsInShowtime = new Set((seatmap.seats || []).map((seat) => toIdString(seat._id || seat)));
  const invalidSeatId = uniqueSeatIds.find((seatId) => !seatIdsInShowtime.has(seatId));
  if (invalidSeatId) {
    throw createHttpError(400, "One or more seats do not belong to this showtime");
  }

  return uniqueSeatIds;
};

const fetchSeatsByIds = async (seatIds, session = null) => {
  const query = Seat.find({ _id: { $in: seatIds } });
  if (session) query.session(session);
  const seats = await query;
  const seatMap = new Map(seats.map((seat) => [toIdString(seat._id), seat]));
  return seatIds.map((seatId) => seatMap.get(seatId)).filter(Boolean);
};

const cleanupExpiredHoldsForShowtime = async (showtimeId, options = {}) => {
  const { session = null, seatmap = null } = options;
  const activeSeatmap = seatmap || (await ensureShowtimeSeatmap(showtimeId, { session }));
  const seatIds = (activeSeatmap.seats || []).map((seat) => toIdString(seat._id || seat));

  if (seatIds.length === 0) {
    return { releasedSeatIds: [] };
  }

  const now = new Date();
  const query = {
    _id: { $in: seatIds },
    status: "Holding",
    $or: [{ heldUntil: { $lte: now } }, { heldUntil: null }],
  };

  const expiredSeatsQuery = Seat.find(query);
  if (session) expiredSeatsQuery.session(session);
  const expiredSeats = await expiredSeatsQuery;

  if (expiredSeats.length === 0) {
    return { releasedSeatIds: [] };
  }

  const releasedSeatIds = expiredSeats.map((seat) => toIdString(seat._id));
  const updateQuery = Seat.updateMany(
    { _id: { $in: releasedSeatIds } },
    {
      $set: {
        status: "Available",
        heldBy: null,
        heldUntil: null,
        updatedAt: now,
      },
    },
  );
  if (session) updateQuery.session(session);
  await updateQuery;

  return { releasedSeatIds };
};

const holdSeatsForUser = async ({ showtimeId, seatIds, userId, session }) => {
  const seatmap = await ensureShowtimeSeatmap(showtimeId, { session });
  await cleanupExpiredHoldsForShowtime(showtimeId, { session, seatmap });

  const normalizedSeatIds = validateSeatIds(seatmap, seatIds);
  const selectedSeats = await fetchSeatsByIds(normalizedSeatIds, session);

  if (selectedSeats.length !== normalizedSeatIds.length) {
    throw createHttpError(400, "One or more seats are invalid");
  }

  const conflictingSeat = selectedSeats.find((seat) => {
    const heldByAnotherUser =
      seat.status === "Holding" &&
      seat.heldBy &&
      toIdString(seat.heldBy) !== toIdString(userId);

    return (
      seat.status === "Booked" ||
      seat.status === "Blocked" ||
      seat.status === "Internal" ||
      heldByAnotherUser
    );
  });

  if (conflictingSeat) {
    throw createHttpError(
      409,
      `Seat ${formatSeatLabel(conflictingSeat)} is no longer available`,
    );
  }

  const holdUntil = new Date(Date.now() + HOLD_DURATION_MS);
  const updateQuery = Seat.updateMany(
    { _id: { $in: normalizedSeatIds } },
    {
      $set: {
        status: "Holding",
        heldBy: userId,
        heldUntil: holdUntil,
        updatedAt: new Date(),
      },
    },
  );
  if (session) updateQuery.session(session);
  await updateQuery;

  return { holdUntil, seatIds: normalizedSeatIds };
};

const releaseSeatsForUser = async ({ showtimeId, seatIds, userId, session }) => {
  const seatmap = await ensureShowtimeSeatmap(showtimeId, { session });
  const normalizedSeatIds = seatIds?.length
    ? validateSeatIds(seatmap, seatIds)
    : (seatmap.seats || []).map((seat) => toIdString(seat._id || seat));

  const updateQuery = Seat.updateMany(
    {
      _id: { $in: normalizedSeatIds },
      status: "Holding",
      heldBy: userId,
    },
    {
      $set: {
        status: "Available",
        heldBy: null,
        heldUntil: null,
        updatedAt: new Date(),
      },
    },
  );
  if (session) updateQuery.session(session);
  const result = await updateQuery;

  return {
    releasedSeatIds: normalizedSeatIds,
    modifiedCount: result.modifiedCount || result.nModified || 0,
  };
};

const claimSeatsForBooking = async ({
  showtimeId,
  seatIds,
  actorUserId = null,
  requireHeldByActor = true,
  allowAvailable = false,
  session,
}) => {
  const seatmap = await ensureShowtimeSeatmap(showtimeId, { session });
  await cleanupExpiredHoldsForShowtime(showtimeId, { session, seatmap });

  const normalizedSeatIds = validateSeatIds(seatmap, seatIds);
  const selectedSeats = await fetchSeatsByIds(normalizedSeatIds, session);

  if (selectedSeats.length !== normalizedSeatIds.length) {
    throw createHttpError(400, "One or more seats are invalid");
  }

  const invalidSeat = selectedSeats.find((seat) => {
    if (seat.status === "Booked" || seat.status === "Blocked" || seat.status === "Internal") {
      return true;
    }

    if (seat.status === "Holding") {
      if (!actorUserId) {
        return true;
      }
      return toIdString(seat.heldBy) !== toIdString(actorUserId);
    }

    if (seat.status === "Available") {
      return !allowAvailable && requireHeldByActor;
    }

    return true;
  });

  if (invalidSeat) {
    throw createHttpError(
      409,
      `Seat ${formatSeatLabel(invalidSeat)} cannot be booked`,
    );
  }

  const updateQuery = Seat.updateMany(
    { _id: { $in: normalizedSeatIds } },
    {
      $set: {
        status: "Booked",
        heldBy: null,
        heldUntil: null,
        updatedAt: new Date(),
      },
    },
  );
  if (session) updateQuery.session(session);
  await updateQuery;

  return selectedSeats;
};

const serializeSeatmapForResponse = (seatmap, currentUserId = null) => {
  const seats = [...(seatmap.seats || [])].sort((left, right) => {
    if (left.row === right.row) {
      return left.number - right.number;
    }
    return left.row.localeCompare(right.row);
  });

  return {
    _id: seatmap._id,
    roomId: seatmap.roomId,
    showtimeId: seatmap.showtimes,
    seats: seats.map((seat) => mapSeatForClient(seat, currentUserId)),
    summary: buildSeatSummary(seats),
  };
};

const cleanupExpiredHoldsGlobally = async () => {
  const now = new Date();
  const expiredSeats = await Seat.find({
    status: "Holding",
    $or: [{ heldUntil: { $lte: now } }, { heldUntil: null }],
  }).select("_id");

  if (expiredSeats.length === 0) {
    return [];
  }

  const expiredSeatIds = expiredSeats.map((seat) => seat._id);
  await Seat.updateMany(
    { _id: { $in: expiredSeatIds } },
    {
      $set: {
        status: "Available",
        heldBy: null,
        heldUntil: null,
        updatedAt: now,
      },
    },
  );

  const seatmaps = await Seatmap.find({
    showtimes: { $ne: null },
    seats: { $in: expiredSeatIds },
  }).select("showtimes");

  return [...new Set(seatmaps.map((seatmap) => toIdString(seatmap.showtimes)).filter(Boolean))];
};

let holdCleanupTimer = null;

const startHoldCleanupJob = () => {
  if (holdCleanupTimer) {
    return holdCleanupTimer;
  }

  holdCleanupTimer = setInterval(async () => {
    try {
      const changedShowtimeIds = await cleanupExpiredHoldsGlobally();
      changedShowtimeIds.forEach((showtimeId) =>
        emitShowtimeSeatsChanged(showtimeId, { reason: "hold_expired" }),
      );
    } catch (error) {
      console.error("Seat hold cleanup failed:", error);
    }
  }, 5000);

  return holdCleanupTimer;
};

exports.buildSeatLayout = buildSeatLayout;
exports.formatSeatLabel = formatSeatLabel;
exports.mapSeatForClient = mapSeatForClient;
exports.buildSeatSummary = buildSeatSummary;
exports.ensureShowtimeSeatmap = ensureShowtimeSeatmap;
exports.cleanupExpiredHoldsForShowtime = cleanupExpiredHoldsForShowtime;
exports.holdSeatsForUser = holdSeatsForUser;
exports.releaseSeatsForUser = releaseSeatsForUser;
exports.claimSeatsForBooking = claimSeatsForBooking;
exports.startHoldCleanupJob = startHoldCleanupJob;
exports.HOLD_DURATION_MS = HOLD_DURATION_MS;
exports.emitShowtimeSeatsChanged = emitShowtimeSeatsChanged;

exports.generateSeatLayout = async (req, res) => {
  try {
    const { roomId, capacity } = req.body;

    if (!roomId || !capacity) {
      return res.status(400).json({ message: "roomId and capacity are required" });
    }

    const createdSeats = await Seat.insertMany(buildSeatLayout(capacity));
    const seatmap = await Seatmap.create({
      roomId,
      showtimes: null,
      seats: createdSeats.map((seat) => seat._id),
      isTemplate: true,
      capacity: createdSeats.length,
    });

    await Room.findByIdAndUpdate(roomId, { seatmapId: seatmap._id });

    return res.json({
      message: "Seat layout created successfully",
      seatmap,
      seats: createdSeats,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.getSeatmapByShowtime = async (req, res) => {
  try {
    const { showtimeId } = req.params;
    await cleanupExpiredHoldsForShowtime(showtimeId);
    const seatmap = await ensureShowtimeSeatmap(showtimeId);

    return res.json(serializeSeatmapForResponse(seatmap, req.user?.id || null));
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Failed to load seats" });
  }
};

exports.getHeldSeats = async (req, res) => {
  try {
    const { showtimeId } = req.params;
    await cleanupExpiredHoldsForShowtime(showtimeId);
    const seatmap = await ensureShowtimeSeatmap(showtimeId);
    const now = new Date();
    const heldSeats = (seatmap.seats || []).filter(
      (seat) => seat.status === "Holding" && seat.heldUntil && seat.heldUntil > now,
    );

    return res.json(heldSeats.map((seat) => mapSeatForClient(seat, req.user?.id || null)));
  } catch (error) {
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Failed to load held seats" });
  }
};

exports.holdSeats = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { showtimeId, seatIds } = req.body;
    await session.startTransaction();

    const result = await holdSeatsForUser({
      showtimeId,
      seatIds,
      userId: req.user.id,
      session,
    });

    await session.commitTransaction();
    emitShowtimeSeatsChanged(showtimeId, {
      reason: "hold",
      seatIds: result.seatIds,
    });

    return res.json({
      message: "Seats held successfully",
      holdUntil: result.holdUntil,
      seatIds: result.seatIds,
      showtimeId,
    });
  } catch (error) {
    await session.abortTransaction();
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Failed to hold seats" });
  } finally {
    session.endSession();
  }
};

exports.releaseSeats = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { showtimeId, seatIds } = req.body;
    await session.startTransaction();

    const result = await releaseSeatsForUser({
      showtimeId,
      seatIds,
      userId: req.user.id,
      session,
    });

    await session.commitTransaction();
    if (result.modifiedCount > 0) {
      emitShowtimeSeatsChanged(showtimeId, {
        reason: "release",
        seatIds: result.releasedSeatIds,
      });
    }

    return res.json({
      message: "Seats released successfully",
      seatIds: result.releasedSeatIds,
      showtimeId,
    });
  } catch (error) {
    await session.abortTransaction();
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Failed to release seats" });
  } finally {
    session.endSession();
  }
};

exports.bookSeats = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    if (!req.user?.id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const { showtimeId, seatIds } = req.body;
    await session.startTransaction();

    const bookedSeats = await claimSeatsForBooking({
      showtimeId,
      seatIds,
      actorUserId: req.user.id,
      requireHeldByActor: true,
      allowAvailable: false,
      session,
    });

    await session.commitTransaction();
    emitShowtimeSeatsChanged(showtimeId, {
      reason: "book",
      seatIds: bookedSeats.map((seat) => toIdString(seat._id)),
    });

    return res.json({
      message: "Seats booked successfully",
      seatIds: bookedSeats.map((seat) => seat._id),
      showtimeId,
    });
  } catch (error) {
    await session.abortTransaction();
    return res
      .status(error.statusCode || 500)
      .json({ message: error.message || "Failed to book seats" });
  } finally {
    session.endSession();
  }
};
