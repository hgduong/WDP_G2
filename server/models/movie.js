// models/Movie.js
const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  genre: { type: String },
  duration: { type: Number }, // phút
  releaseDate: { type: Date },
  language: { type: String },
  director: { type: String },
  cast: { type: String }, // có thể chuyển thành mảng nếu cần
  rating: { type: Number, min: 0, max: 10 },
  posterUrl: { type: String },
  trailerUrl: { type: String },
  status: { type: String, enum: ['ComingSoon', 'NowShowing', 'Ended'], default: 'ComingSoon' },
  cinemas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Cinema' }],
  showtimes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Showtime' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Movie', movieSchema);
