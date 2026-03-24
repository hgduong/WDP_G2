// models/Room.js
const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  cinemaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cinema', required: true },
  name: { type: String, required: true },
  capacity: { type: Number, required: true },
  seatmapId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seatmap' },
  type: { type: String, enum: ['Standard', 'VIP', 'IMAX'], default: 'Standard' },
  description: { type: String },
  timeSlots: [{ type: String }], // Mảng khung giờ cố định, ví dụ: ["09:00", "13:00", "17:00", "21:00"]
  // Thông tin phim đang chiếu
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie' },
  startTime: { type: Date }, // Ngày giờ bắt đầu chiếu
  price: { type: Number }, // Giá vé
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', roomSchema);
