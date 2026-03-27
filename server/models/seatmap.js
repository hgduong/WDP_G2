// models/Seatmap.js
const mongoose = require('mongoose');

const seatmapSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  showtimes: { type: mongoose.Schema.Types.ObjectId, ref: 'Showtime' }, // Optional - can be null for room template
  seats: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Seat' }], // liên kết tới nhiều ghế
  isTemplate: { type: Boolean, default: false }, // If true, this is a room template (not per showtime)
  capacity: { type: Number, default: 0 }, // Store the capacity for this layout
}, { timestamps: true });

module.exports = mongoose.model('Seatmap', seatmapSchema);
