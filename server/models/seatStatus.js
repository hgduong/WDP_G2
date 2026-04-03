// models/SeatStatus.js
const mongoose = require('mongoose');

const seatStatusSchema = new mongoose.Schema({
  seatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seat', required: true },
  showtimeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Showtime', required: true },
  status: { 
    type: String, 
    enum: ['Available', 'Booked', 'Blocked', 'Holding'], 
    default: 'Available' 
  },
  heldBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  heldUntil: { type: Date },
  bookedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  price: { type: Number, default: 0 } // Giá theo suất chiếu
}, { timestamps: true });

// Compound index to ensure unique seat-showtime combination
seatStatusSchema.index({ seatId: 1, showtimeId: 1 }, { unique: true });

// Index for querying by showtime
seatStatusSchema.index({ showtimeId: 1 });

// Index for querying by status
seatStatusSchema.index({ status: 1 });

// Index for cleanup of expired holds
seatStatusSchema.index({ heldUntil: 1, status: 1 });

module.exports = mongoose.model('SeatStatus', seatStatusSchema);
