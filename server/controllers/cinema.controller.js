// controllers/cinema.controller.js
const Cinema = require("../models/cinema");
const Room = require("../models/room");
const Seatmap = require("../models/seatmap");
const Seat = require("../models/seat");

// Helper function to build seat layout
const buildSeatLayout = (totalSeats) => {
  const effectiveCapacity = Math.max(Number(totalSeats) || 0, 50);
  const seatsPerRow = 10;
  const rowCount = Math.ceil(effectiveCapacity / seatsPerRow);
  const seats = [];

  for (let rowIndex = 0; rowIndex < rowCount; rowIndex++) {
    const rowLetter = String.fromCharCode(65 + rowIndex);
    const isLastRow = rowIndex === rowCount - 1;
    const seatsInThisRow = Math.min(seatsPerRow, effectiveCapacity - rowIndex * seatsPerRow);

    if (isLastRow && seatsInThisRow > 0) {
      // Last row: couple seats
      for (let i = 0; i < seatsInThisRow; i += 2) {
        seats.push({
          row: rowLetter,
          number: i + 1,
          type: "Couple",
          status: "Available"
        });
      }
    } else {
      // Other rows: standard/VIP seats
      for (let seatNum = 1; seatNum <= seatsInThisRow; seatNum++) {
        seats.push({
          row: rowLetter,
          number: seatNum,
          type: rowIndex >= 3 ? "VIP" : "Standard",
          status: "Available"
        });
      }
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
    const { capacity } = req.body;
    
    // Create room first
    const room = new Room(req.body);
    await room.save();
    
    // Auto-generate seat layout if capacity is provided
    if (capacity && capacity > 0) {
      const seats = buildSeatLayout(capacity);
      const createdSeats = await Seat.insertMany(seats);
      
      const seatmap = await Seatmap.create({
        roomId: room._id,
        showtimes: null,
        seats: createdSeats.map(s => s._id),
        isTemplate: true,
        capacity: capacity
      });
      
      // Update room with seatmap reference
      room.seatmapId = seatmap._id;
      await room.save();
    }
    
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
    const { capacity } = req.body;
    const existingRoom = await Room.findById(req.params.id);
    
    // Update room
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!room) {
      return res.status(404).json({ message: "Phòng không tồn tại" });
    }
    
    // If capacity changed, regenerate seat layout
    if (capacity && capacity !== existingRoom?.capacity) {
      // Delete old seats and seatmap if exists
      if (existingRoom?.seatmapId) {
        const oldSeatmap = await Seatmap.findById(existingRoom.seatmapId);
        if (oldSeatmap && oldSeatmap.seats) {
          await Seat.deleteMany({ _id: { $in: oldSeatmap.seats } });
        }
        await Seatmap.findByIdAndDelete(existingRoom.seatmapId);
      }
      
      // Create new seat layout
      const seats = buildSeatLayout(capacity);
      const createdSeats = await Seat.insertMany(seats);
      
      const seatmap = await Seatmap.create({
        roomId: room._id,
        showtimes: null,
        seats: createdSeats.map(s => s._id),
        isTemplate: true,
        capacity: capacity
      });
      
      room.seatmapId = seatmap._id;
      await room.save();
    }
    
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
    
    // Clean up seats and seatmap
    if (room.seatmapId) {
      const seatmap = await Seatmap.findById(room.seatmapId);
      if (seatmap && seatmap.seats) {
        await Seat.deleteMany({ _id: { $in: seatmap.seats } });
      }
      await Seatmap.findByIdAndDelete(room.seatmapId);
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
