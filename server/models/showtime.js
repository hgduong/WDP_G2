// models/Showtime.js
const mongoose = require('mongoose');

const showtimeSchema = new mongoose.Schema({
  movieId: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  startTime: { type: Date},
  seatStatuses: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SeatStatus' }], // liên kết tới trạng thái ghế theo suất chiếu này
  duration: { type: Number, min: 0 },
  language: { type: String, default: 'Tiếng Việt' },
  status: { type: String, enum: ['Scheduled', 'Cancelled', 'Completed'], default: 'Scheduled' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Index for querying by movie
showtimeSchema.index({ movieId: 1 });

// Index for querying by room
showtimeSchema.index({ roomId: 1 });

// Index for querying by start time
showtimeSchema.index({ startTime: 1 });

// Index for querying by status
showtimeSchema.index({ status: 1 });

// Compound index for finding showtimes by movie and date range
showtimeSchema.index({ movieId: 1, startTime: 1, status: 1 });

module.exports = mongoose.model('Showtime', showtimeSchema);
