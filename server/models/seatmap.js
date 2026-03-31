// models/Seatmap.js
const mongoose = require('mongoose');

const seatmapSchema = new mongoose.Schema({
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  showtimes: { type: mongoose.Schema.Types.ObjectId, ref: 'Showtime' }, // Optional - can be null for room template
  seats: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Seat' }], // liên kết tới nhiều ghế (static seat info)
  seatStatuses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SeatStatus' }], // liên kết tới trạng thái ghế theo suất chiếu
  isTemplate: { type: Boolean, default: false }, // If true, this is a room template (not per showtime)
  capacity: { type: Number, default: 0 }, // Store the capacity for this layout
}, { timestamps: true });

// Index for querying by room
seatmapSchema.index({ roomId: 1 });

// Index for querying by showtime
seatmapSchema.index({ showtimes: 1 });

// Index for template seatmaps
seatmapSchema.index({ isTemplate: 1 });

module.exports = mongoose.model('Seatmap', seatmapSchema);
