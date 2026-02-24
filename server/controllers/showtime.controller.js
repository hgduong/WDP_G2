// controllers/showtimeController.js
const Showtime = require("../models/showtime");

exports.getShowtimesByMovie = async (req, res) => {
  try {
    const showtimes = await Showtime.find({
      movieId: req.params.movieId,
    }).populate("cinemaId roomId");
    res.json(showtimes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.getShowtimesByMovie = async (req, res) => {
  try {
    const showtimes = await Showtime.find({ movieId: req.params.movieId });
    const result = [];
    for (let s of showtimes) {
      const seatmap = await Seatmap.findById(s.seatMap).populate("seats");
      const availableSeats = seatmap.seats.filter(
        (seat) => seat.status === "Available",
      ).length;
      result.push({ ...s._doc, availableSeats });
    }
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
