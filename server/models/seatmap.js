// models/Seatmap.js
const mongoose = require('mongoose');

const seatmapSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  showtimeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Showtime', required: true },
  seats: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Seat' }], // liên kết tới nhiều ghế
}, { timestamps: true });

module.exports = mongoose.model('Seatmap', seatmapSchema);
