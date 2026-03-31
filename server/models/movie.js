// models/Movie.js
const mongoose = require('mongoose');

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  genre: { type: [String], enum: ['Action', 'Comedy', 'Drama', 'Horror', 'Thriller', 'Romance', 'Sci-Fi', 'Animation', 'Documentary', 'Fantasy', 'Adventure', 'Crime', 'Mystery', 'Family', 'Musical', 'War', 'Western'] },
  duration: { type: Number }, // phút
  releaseDate: { type: Date },
  endDate: { type: Date }, // Ngày kết thúc lịch chiếu
  language: { type: String },
  directors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Director' }],
  cast: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Actor' }],
  rating: { type: Number, min: 0, max: 10 },
  posterUrl: { type: String },
  trailerUrl: { type: String },
  status: { type: String, enum: ['ComingSoon', 'NowShowing', 'Ended', 'Special'], default: 'ComingSoon' },
  cinemas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Cinema' }],
  showtimes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Showtime' }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Movie', movieSchema);
