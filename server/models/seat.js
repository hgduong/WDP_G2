// models/Seat.js
const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },  // Liên kết đến phòng
  row: { type: String, required: true },      // Ví dụ: "A", "B", "C"
  number: { type: Number, required: true },   // Ví dụ: 1, 2, 3
  type: { type: String, enum: ['Standard', 'VIP', 'Couple'], default: 'Standard' },
  status: { type: String, enum: ['Available', 'Deleted'], default: 'Available' },  // Trạng thái ghế (Available: Còn sử dụng, Deleted: Đã ẩn)
  // Status is now tracked per-showtime in SeatStatus model
  // This model only stores the static seat information
}, { timestamps: true });

// Compound unique index to prevent duplicate seats within the same room
seatSchema.index({ roomId: 1, row: 1, number: 1 }, { unique: true });

module.exports = mongoose.model('Seat', seatSchema);
