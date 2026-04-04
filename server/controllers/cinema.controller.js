// controllers/cinema.controller.js
const mongoose = require('mongoose');
const Cinema = require("../models/cinema");
const Room = require("../models/room");
const Seat = require("../models/seat");

// Helper function to build seat layout
const buildSeatLayout = (totalSeats) => {
  const effectiveCapacity = Math.max(Number(totalSeats) || 0, 50);
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
        // status removed - tracked in SeatStatus per showtime
      });
    }
  }

  return seats;
};

// Lấy danh sách tất cả rạp
exports.getAllCinemas = async (req, res) => {
  try {
    const cinemas = await Cinema.find().populate("rooms");
    res.json(cinemas);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy rạp theo id
exports.getCinemaById = async (req, res) => {
  try {
    const cinema = await Cinema.findById(req.params.id).populate("rooms");
    if (!cinema) {
      return res.status(404).json({ message: "Rạp không tồn tại" });
    }
    res.json(cinema);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Thêm rạp mới
exports.addCinema = async (req, res) => {
  try {
    const cinema = new Cinema(req.body);
    await cinema.save();
    res.status(201).json(cinema);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Cập nhật rạp
exports.updateCinema = async (req, res) => {
  try {
    const cinema = await Cinema.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cinema) {
      return res.status(404).json({ message: "Rạp không tồn tại" });
    }
    res.json(cinema);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Xóa rạp
exports.deleteCinema = async (req, res) => {
  try {
    const cinema = await Cinema.findByIdAndDelete(req.params.id);
    if (!cinema) {
      return res.status(404).json({ message: "Rạp không tồn tại" });
    }
    // Xóa các phòng liên quan
    await Room.deleteMany({ cinemaId: req.params.id });
    res.json({ message: "Rạp đã được xóa" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// === Room Controllers ===

// Lấy danh sách phòng của một rạp
exports.getRoomsByCinema = async (req, res) => {
  try {
    const rooms = await Room.find({ cinemaId: req.params.cinemaId });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy phòng theo id
exports.getRoomById = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: "Phòng không tồn tại" });
    }
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Thêm phòng mới
exports.addRoom = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { capacity, name, cinemaId, movieIds, ...roomData } = req.body;

    if (!name) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Tên phòng là bắt buộc" });
    }

    if (!cinemaId) {
      await session.abortTransaction();
      return res.status(400).json({ message: "cinemaId là bắt buộc" });
    }

    // Handle movieIds properly (array)
    if (movieIds && Array.isArray(movieIds)) {
      roomData.movieIds = movieIds.filter(Boolean);
    }

    const existingRoom = await Room.findOne({ name: name.trim(), cinemaId }).session(session);

    if (existingRoom) {
      await session.abortTransaction();
      return res.status(400).json({ message: "Tên phòng đã tồn tại trong rạp này" });
    }

    const room = new Room({
      name: name.trim(),
      cinemaId,
      ...roomData
    });
    await room.save({ session });
    
    const seats = buildSeatLayout(50);
    const seatIds = [];
    
    for (const seatData of seats) {
      let seat = await Seat.findOne({ roomId: room._id, row: seatData.row, number: seatData.number }).session(session);
      
      if (!seat) {
        seat = await Seat.create([{ roomId: room._id, ...seatData }], { session });
        seat = seat[0];
      }
      
      seatIds.push(seat._id);
    }
    
    room.seats = seatIds;
    room.capacity = seatIds.length;
    await room.save({ session });
    
    await Cinema.findByIdAndUpdate(cinemaId, { $push: { rooms: room._id } }, { session });
    
    await session.commitTransaction();
    res.status(201).json(room);
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
};

// Cập nhật phòng
exports.updateRoom = async (req, res) => {
  try {
    const existingRoom = await Room.findById(req.params.id);
    if (!existingRoom) {
      return res.status(404).json({ message: "Phòng không tồn tại" });
    }

    const { capacity, name, cinemaId, regenerateSeats, movieIds, ...roomData } = req.body;

    // Handle movieIds properly (array) - convert empty string to empty array
    if (movieIds && Array.isArray(movieIds)) {
      roomData.movieIds = movieIds.filter(Boolean);
    } else {
      roomData.movieIds = [];
    }

    // Check duplicate room name if name is being updated
    if (name && name !== existingRoom.name) {
      const query = {
        name: name.trim(),
        cinemaId: cinemaId || existingRoom.cinemaId,
        _id: { $ne: req.params.id }
      };

      const duplicateRoom = await Room.findOne(query);

      if (duplicateRoom) {
        return res.status(400).json({ message: "Tên phòng đã tồn tại trong rạp này" });
      }
      roomData.name = name.trim();
    }

    // Only regenerate seats when explicitly requested
    if (regenerateSeats) {
      if (existingRoom?.seats && existingRoom.seats.length > 0) {
        await Seat.deleteMany({ _id: { $in: existingRoom.seats } });
      }

      const seats = buildSeatLayout(50);
      const seatIds = [];

      for (const seatData of seats) {
        let seat = await Seat.findOne({ roomId: existingRoom._id, row: seatData.row, number: seatData.number });

        if (!seat) {
          seat = await Seat.create({
            roomId: existingRoom._id,
            ...seatData
          });
        }

        seatIds.push(seat._id);
      }

      roomData.seats = seatIds;
      roomData.capacity = seatIds.length;
    }

    const room = await Room.findByIdAndUpdate(req.params.id, roomData, { new: true });
    
    res.json(room);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Xóa phòng
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) {
      return res.status(404).json({ message: "Phòng không tồn tại" });
    }
    
    // Clean up seats
    if (room.seats && room.seats.length > 0) {
      await Seat.deleteMany({ _id: { $in: room.seats } });
    }
    
    // Delete room
    await Room.findByIdAndDelete(req.params.id);
    
    // Xóa khỏi mảng rooms trong Cinema
    await Cinema.findByIdAndUpdate(room.cinemaId, {
      $pull: { rooms: req.params.id }
    });
    
    res.json({ message: "Phòng đã được xóa" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
