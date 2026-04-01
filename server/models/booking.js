// models/Booking.js
const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  bookedByStaffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  showtimeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Showtime', required: true },
  cinemaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cinema', required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  seats: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Seat', required: true }],
  totalPrice: { type: Number, required: true },
  originalPrice: { type: Number },
  discountAmount: { type: Number, default: 0 },
  voucherId: { type: mongoose.Schema.Types.ObjectId, ref: 'Voucher', default: null },
  bookingCode: { type: String, required: true, unique: true },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Done', 'Cancelled', 'Expired'], default: 'Pending' },
  bookingSource: {
    type: String,
    enum: ['Customer', 'Staff'],
    default: 'Customer',
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Paid', 'Cancelled', 'Expired', 'PayAtCounter'],
    default: 'Pending',
  },
  customerInfo: {
    fullName: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    notes: { type: String, trim: true },
  },
  paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
  tickets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Ticket' }],
  expiresAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Booking', bookingSchema);
