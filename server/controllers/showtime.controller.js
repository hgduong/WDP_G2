// controllers/showtime.controller.js
const Showtime = require("../models/showtime");
const Seatmap = require("../models/seatmap");
const Seat = require("../models/seat");
const Movie = require("../models/movie");
const Cinema = require("../models/cinema");
const Room = require("../models/room");
// ensure related models are registered for populate
require("../models/cinema");
require("../models/room");
require("../models/seat");

const mongoose = require('mongoose');

// Lấy tất cả lịch chiếu
exports.getAllShowtimes = async (req, res) => {
  try {
    const showtimes = await Showtime.find()
      .populate("movieId", "title posterUrl duration")
      .populate("cinemasId", "name address city")
      .populate("roomId", "name type")
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
      .populate("cinemasId", "name address city")
      .populate("roomId", "name type");
    
    if (!showtime) {
      return res.status(404).json({ message: "Lịch chiếu không tồn tại" });
    }
    res.json(showtime);
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
      .populate("cinemasId", "name address city")
      .populate("roomId", "name capacity");

    const result = [];
    for (let s of showtimes) {
      try {
        // Use the same logic as ensureShowtimeSeatmap to auto-create seatmap if missing
        let seatmap = null;
        
        // Method 1: Check showtime.seatMap
        if (s.seatMap) {
          seatmap = await Seatmap.findById(s.seatMap).populate("seats");
        }
        
        // Method 2: Find by showtimes field
        if (!seatmap) {
          seatmap = await Seatmap.findOne({ showtimes: s._id }).populate("seats");
        }
        
        // Method 3: Clone from room's seatmapId (if available)
        if (!seatmap && s.roomId) {
          const room = await Room.findById(s.roomId._id || s.roomId);
          console.log("ShowtimesByMovie - Room capacity:", room?.capacity);
          if (room?.seatmapId) {
            const roomSeatmap = await Seatmap.findById(room.seatmapId).populate("seats");
            if (roomSeatmap && roomSeatmap.seats?.length > 0) {
              // Clone seats
              const clonedSeats = await Seat.insertMany(
                (roomSeatmap.seats || []).map((seat) => ({
                  row: seat.row,
                  number: seat.number,
                  type: seat.type || "Standard",
                  status: "Available",
                }))
              );
              seatmap = await Seatmap.create({
                roomId: roomSeatmap.roomId,
                showtimes: s._id,
                seats: clonedSeats.map((seat) => seat._id),
              });
              seatmap = await Seatmap.findById(seatmap._id).populate("seats");
              
              // Update showtime with seatMap reference using findByIdAndUpdate
              await Showtime.findByIdAndUpdate(s._id, { $set: { seatMap: seatmap._id } });
            }
          }
        }
        
        // Method 4: Create new seatmap from room capacity
        if (!seatmap && s.roomId) {
          const room = await Room.findById(s.roomId._id || s.roomId);
          console.log("ShowtimesByMovie - Creating with capacity:", room?.capacity);
          if (room) {
            const seatmapController = require("./seatmap.controller");
            const seatsData = seatmapController.buildSeatLayout(room.capacity || 50);
            const createdSeats = await Seat.insertMany(seatsData);
            seatmap = await Seatmap.create({
              roomId: room._id,
              showtimes: s._id,
              seats: createdSeats.map((seat) => seat._id),
            });
            seatmap = await Seatmap.findById(seatmap._id).populate("seats");
            
            // Update showtime with seatMap reference using findByIdAndUpdate
            await Showtime.findByIdAndUpdate(s._id, { $set: { seatMap: seatmap._id } });
          }
        }
        
        // Method 5: Removed seat count mismatch regeneration to preserve existing seat IDs
        
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
    
    const showtimes = await Showtime.find({ cinemasId: cinemaId })
      .populate("movieId", "title posterUrl duration")
      .populate("cinemasId", "name address city")
      .populate("roomId", "name type")
      .sort({ startTime: 1 });
    
    res.json(showtimes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Thêm lịch chiếu mới
exports.addShowtime = async (req, res) => {
  try {
    const { movieId, cinemasId, roomId, startTime, price, language } = req.body;
    
    // Kiểm tra phim tồn tại
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ message: "Phim không tồn tại" });
    }
    
    // Kiểm tra rạp tồn tại
    const cinema = await Cinema.findById(cinemasId);
    if (!cinema) {
      return res.status(404).json({ message: "Rạp không tồn tại" });
    }
    
    // Kiểm tra phòng tồn tại và thuộc rạp
    const room = await Room.findById(roomId);
    if (!room) {
      return res.status(404).json({ message: "Phòng không tồn tại" });
    }
    if (room.cinemaId.toString() !== cinemasId) {
      return res.status(400).json({ message: "Phòng không thuộc rạp này" });
    }
    
    // Tạo lịch chiếu
    const showtime = new Showtime({
      movieId,
      cinemasId,
      roomId,
      startTime,
      price,
      language: language || 'Tiếng Việt'
    });
    
    await showtime.save();
    
    // Cập nhật mảng showtimes trong Movie và Cinema
    await Movie.findByIdAndUpdate(movieId, {
      $push: { showtimes: showtime._id }
    });
    
    await Cinema.findByIdAndUpdate(cinemasId, {
      $push: { showtimes: showtime._id }
    });
    
    const populatedShowtime = await Showtime.findById(showtime._id)
      .populate("movieId", "title posterUrl duration")
      .populate("cinemasId", "name address city")
      .populate("roomId", "name type");
    
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
      .populate("cinemasId", "name address city")
      .populate("roomId", "name type");
    
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
    
    // Xóa khỏi mảng showtimes trong Movie và Cinema
    await Movie.findByIdAndUpdate(showtime.movieId, {
      $pull: { showtimes: req.params.id }
    });
    
    await Cinema.findByIdAndUpdate(showtime.cinemasId, {
      $pull: { showtimes: req.params.id }
    });
    
    res.json({ message: "Lịch chiếu đã được xóa" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
