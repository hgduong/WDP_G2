// models/Showtime.js
const mongoose = require('mongoose');

const showtimeSchema = new mongoose.Schema({
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  cinemasId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cinema', required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  startTime: { type: Date, required: true },
  seatMap: { type: mongoose.Schema.Types.ObjectId, ref: 'Seatmap' },
  price: { type: Number, required: true },
  duration: { type: Number, required: true, min: 0 },
  language: { type: String, default: 'Tiếng Việt' },
  status: { type: String, enum: ['Scheduled', 'Cancelled', 'Completed'], default: 'Scheduled' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Showtime', showtimeSchema);
