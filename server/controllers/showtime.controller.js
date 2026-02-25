// controllers/showtime.controller.js
const Showtime = require("../models/showtime");
const Seatmap = require("../models/seatmap");

exports.getShowtimesByMovie = async (req, res) => {
  try {
    const showtimes = await Showtime.find({ 
      movieId: req.params.movieId 
    });
    
    const result = [];
    for (let s of showtimes) {
      try {
        const seatmap = await Seatmap.findById(s.seatMap).populate("seats");
        const availableSeats = seatmap?.seats?.filter(
          (seat) => seat.status === "Available"
        ).length || 0;
        
        result.push({ 
          ...s.toObject(), 
          availableSeats 
        });
      } catch (seatErr) {
        result.push({ 
          ...s.toObject(), 
          availableSeats: 0 
        });
      }
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};