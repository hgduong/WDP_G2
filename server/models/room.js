// models/Room.js
const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  cinemaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cinema', required: true },
  name: { type: String, required: true },
  capacity: { type: Number},
  seats: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Seat' }], // liên kết tới nhiều ghế (static seat info)
  type: { type: String, enum: ['Standard', 'VIP', 'IMAX', 'Double'], default: 'Standard' },
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }, // Phim đang chiếu (denormalized for quick display)
  timeSlots: [{ type: String }], // Mảng khung giờ cố định, ví dụ: ["09:00", "13:00", "17:00", "21:00"]
  description: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', roomSchema);
