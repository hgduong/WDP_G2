// models/Seat.js
const mongoose = require('mongoose');

const seatSchema = new mongoose.Schema({
  row: { type: String, required: true },      // Ví dụ: "A", "B", "C"
  number: { type: Number, required: true },   // Ví dụ: 1, 2, 3
  type: { type: String, enum: ['Standard', 'VIP', 'Couple'], default: 'Standard' },
  status: { type: String, enum: ['Available', 'Booked', 'Blocked'], default: 'Available' }
}, { timestamps: true });

module.exports = mongoose.model('Seat', seatSchema);
