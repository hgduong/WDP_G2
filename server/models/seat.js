// models/Seat.js
const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  row: { type: String, required: true },      // Ví dụ: "A", "B", "C"
  number: { type: Number, required: true },   // Ví dụ: 1, 2, 3
  type: { type: String, enum: ['Standard', 'VIP', 'Couple'], default: 'Standard' },
  // Status is now tracked per-showtime in SeatStatus model
  // This model only stores the static seat information
}, { timestamps: true });

// Compound unique index to prevent duplicate seats with same row and number
seatSchema.index({ row: 1, number: 1 }, { unique: true });

module.exports = mongoose.model('Seat', seatSchema);
