// controllers/showtime.controller.js
const Showtime = require("../models/showtime");
const Seatmap = require("../models/seatmap");
const Seat = require("../models/seat");
const Movie = require("../models/movie");
const Room = require("../models/room");
// ensure related models are registered for populate
require("../models/room");
require("../models/seat");

const mongoose = require('mongoose');

// Lấy tất cả lịch chiếu
exports.getAllShowtimes = async (req, res) => {
  try {
    const showtimes = await Showtime.find()
      .populate("movieId", "title posterUrl duration")
      .populate("roomId", "name capacity seatmapId type cinemaId")
      .populate({
        path: "roomId",
        populate: { path: "cinemaId", select: "name address city" }
      })
      .sort({ startTime: 1 });
    res.json(showtimes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy lịch chiếu theo id
exports.getShowtimeById = async (req, res) => {
  try {
    const showtime = await Showtime.findById(req.params.id)
      .populate("movieId", "title posterUrl duration")
      .populate("roomId", "name capacity seatmapId type cinemaId")
      .populate({
        path: "roomId",
        populate: { path: "cinemaId", select: "name address city" }
      });
    
    if (!showtime) {
      return res.status(404).json({ message: "Lịch chiếu không tồn tại" });
    }
    res.json(showtime);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy nhiều lịch chiếu theo danh sách id
exports.getShowtimesByIds = async (req, res) => {
  try {
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "ids phải là mảng không rỗng" });
    }
    
    // Validate all ids
    for (const id of ids) {
      if (!mongoose.isValidObjectId(id)) {
        return res.status(400).json({ message: `Invalid id: ${id}` });
      }
    }
    
    const showtimes = await Showtime.find({ _id: { $in: ids } })
      .populate("movieId", "title posterUrl duration")
      .populate("roomId", "name capacity seatmapId type cinemaId")
      .populate({
        path: "roomId",
        populate: { path: "cinemaId", select: "name address city" }
      })
      .sort({ startTime: 1 });
    
    res.json(showtimes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Lấy lịch chiếu theo phim
exports.getShowtimesByMovie = async (req, res) => {
  try {
    const movieId = req.params.movieId;

    // validate id format early
    if (!mongoose.isValidObjectId(movieId)) {
      console.error("Invalid movieId passed to showtimes:", movieId);
      return res.status(400).json({ message: "Invalid movieId" });
    }

    // include cinema and room basic info so frontend can display name, language, etc.
    const showtimes = await Showtime.find({
      movieId,
    })
      .populate("roomId", "name capacity seatmapId type cinemaId")
      .populate({
        path: "roomId",
        populate: { path: "cinemaId", select: "name address city" }
      });

    const result = [];
    for (let s of showtimes) {
      try {
        // Get seatmap if exists (without auto-creating)
        let seatmap = null;
        
        // Method 1: Check showtime.seatMap
        if (s.seatMap) {
          seatmap = await Seatmap.findById(s.seatMap).populate("seats");
        }
        
        // Method 2: Find by showtimes field
        if (!seatmap) {
          seatmap = await Seatmap.findOne({ showtimes: s._id }).populate("seats");
        }
        
        const seats = seatmap?.seats || [];
        const availableSeats = seats.filter((seat) => seat.status === "Available").length;

        result.push({
          ...s.toObject(),
          availableSeats,
        });
      } catch (seatErr) {
        console.error("Error fetching seatmap for showtime", s._id, seatErr);
        result.push({
          ...s.toObject(),
          availableSeats: 0,
        });
      }
    }
    res.json(result);
  } catch (error) {
    console.error("getShowtimesByMovie failed", error);
    res.status(500).json({ message: error.message, stack: error.stack });
  }
};

// Lấy lịch chiếu theo rạp
exports.getShowtimesByCinema = async (req, res) => {
  try {
    const cinemaId = req.params.cinemaId;
    
    // Find rooms in this cinema first
    const rooms = await Room.find({ cinemaId }).select('_id');
    const roomIds = rooms.map(r => r._id);
    
    const showtimes = await Showtime.find({ roomId: { $in: roomIds } })
      .populate("movieId", "title posterUrl duration")
      .populate("roomId", "name capacity seatmapId type cinemaId")
      .populate({
        path: "roomId",
        populate: { path: "cinemaId", select: "name address city" }
      })
      .sort({ startTime: 1 });
    
    res.json(showtimes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Thêm lịch chiếu mới
exports.addShowtime = async (req, res) => {
  try {
    const { movieId, roomId, startTime, duration, language, status } = req.body;
    
    // Validate startTime is provided
    if (!startTime) {
      return res.status(400).json({ message: "Thời gian chiếu là bắt buộc" });
    }
    
    // Kiểm tra phim tồn tại
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ message: "Phim không tồn tại" });
    }
    
    // Kiểm tra phòng tồn tại
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Phòng không tồn tại" });
    }
    
    // Validate duration
    const finalDuration = duration || movie.duration || 120;
    if (finalDuration < 0) {
      return res.status(400).json({ message: "Thời lượng phim không hợp lệ" });
    }
    
    // Tạo lịch chiếu
    const showtime = new Showtime({
      movieId,
      roomId,
      startTime,
      duration: finalDuration,
      language: language || 'Tiếng Việt',
      status: status || 'Scheduled'
    });
    
    await showtime.save();
    
    // Cập nhật mảng showtimes trong Movie
    await Movie.findByIdAndUpdate(movieId, {
      $push: { showtimes: showtime._id }
    });
    
    const populatedShowtime = await Showtime.findById(showtime._id)
      .populate("movieId", "title posterUrl duration")
      .populate("roomId", "name capacity seatmapId type cinemaId")
      .populate({
        path: "roomId",
        populate: { path: "cinemaId", select: "name address city" }
      });
    
    res.status(201).json(populatedShowtime);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Cập nhật lịch chiếu
exports.updateShowtime = async (req, res) => {
  try {
    const showtime = await Showtime.findByIdAndUpdate(
      req.params.id, 
      req.body, 
      { new: true }
    )
      .populate("movieId", "title posterUrl duration")
      .populate("roomId", "name capacity seatmapId type cinemaId")
      .populate({
        path: "roomId",
        populate: { path: "cinemaId", select: "name address city" }
      });
    
    if (!showtime) {
      return res.status(404).json({ message: "Lịch chiếu không tồn tại" });
    }
    res.json(showtime);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Xóa lịch chiếu
exports.deleteShowtime = async (req, res) => {
  try {
    const showtime = await Showtime.findByIdAndDelete(req.params.id);
    
    if (!showtime) {
      return res.status(404).json({ message: "Lịch chiếu không tồn tại" });
    }
    
    // Xóa khỏi mảng showtimes trong Movie
    await Movie.findByIdAndUpdate(showtime.movieId, {
      $pull: { showtimes: req.params.id }
    });
    
    res.json({ message: "Lịch chiếu đã được xóa" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
