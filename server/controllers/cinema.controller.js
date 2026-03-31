// controllers/cinema.controller.js
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
  try {
    // Remove capacity from request body - it will be calculated from seats
    const { capacity, ...roomData } = req.body;
    
    // Create room first (capacity will be calculated from seats)
    const room = new Room(roomData);
    await room.save();
    
    // Auto-generate seat layout with default capacity of 50
    const seats = buildSeatLayout(50);
    const seatIds = [];
    
    // Create seats for this room
    for (const seatData of seats) {
      // Check if seat with same row/number already exists in this room
      let seat = await Seat.findOne({ roomId: room._id, row: seatData.row, number: seatData.number });
      
      if (!seat) {
        // Create new seat for this room
        seat = await Seat.create({
          roomId: room._id,
          ...seatData
        });
      }
      
      seatIds.push(seat._id);
    }
    
    // Update room with seats and auto-calculate capacity from seats array
    room.seats = seatIds;
    room.capacity = seatIds.length;
    await room.save();
    
    // Cập nhật mảng rooms trong Cinema
    await Cinema.findByIdAndUpdate(req.body.cinemaId, {
      $push: { rooms: room._id }
    });
    
    res.status(201).json(room);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Cập nhật phòng
exports.updateRoom = async (req, res) => {
  try {
    const existingRoom = await Room.findById(req.params.id);
    
    // Remove capacity from request body - it will be calculated from seats
    const { capacity, ...roomData } = req.body;
    
    // Update room (capacity will be calculated from seats)
    const room = await Room.findByIdAndUpdate(req.params.id, roomData, { new: true });
    if (!room) {
      return res.status(404).json({ message: "Phòng không tồn tại" });
    }
    
    // Always regenerate seat layout with default capacity of 50
    // Delete old seats if exists
    if (existingRoom?.seats && existingRoom.seats.length > 0) {
      await Seat.deleteMany({ _id: { $in: existingRoom.seats } });
    }
    
    // Create new seat layout
    const seats = buildSeatLayout(50);
    const seatIds = [];
    
    // Create seats for this room
    for (const seatData of seats) {
      // Check if seat with same row/number already exists in this room
      let seat = await Seat.findOne({ roomId: room._id, row: seatData.row, number: seatData.number });
      
      if (!seat) {
        // Create new seat for this room
        seat = await Seat.create({
          roomId: room._id,
          ...seatData
        });
      }
      
      seatIds.push(seat._id);
    }
    
    // Update room with new seats and auto-calculate capacity from seats array
    room.seats = seatIds;
    room.capacity = seatIds.length;
    await room.save();
    
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
