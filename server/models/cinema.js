// models/Cinema.js
const mongoose = require('mongoose');

const cinemaSchema = new mongoose.Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  description: { type: String },
  rooms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Room' }],
  movies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
  showtimes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Showtime' }],
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Cinema', cinemaSchema);
