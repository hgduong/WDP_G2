// controllers/cinema.controller.js
const Cinema = require("../models/cinema");
const Room = require("../models/room");

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
    const room = new Room(req.body);
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
    const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!room) {
      return res.status(404).json({ message: "Phòng không tồn tại" });
    }
    res.json(room);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Xóa phòng
exports.deleteRoom = async (req, res) => {
  try {
    const room = await Room.findByIdAndDelete(req.params.id);
    if (!room) {
      return res.status(404).json({ message: "Phòng không tồn tại" });
    }
    
    // Xóa khỏi mảng rooms trong Cinema
    await Cinema.findByIdAndUpdate(room.cinemaId, {
      $pull: { rooms: req.params.id }
    });
    
    res.json({ message: "Phòng đã được xóa" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
