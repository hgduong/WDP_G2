// models/Ticket.js
const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  showtimeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Showtime', required: true },
  cinemaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cinema', required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  seatId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seat', required: true },
  price: { type: Number, required: true },
  ticketCode: { type: String, required: true, unique: true },
  status: { type: String, enum: ['Valid', 'Used', 'Cancelled'], default: 'Valid' },
  qrCodeUrl: { type: String },
  issuedAt: { type: Date, default: Date.now },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  checkin: { type: String } // có thể là thời gian hoặc trạng thái checkin
});

module.exports = mongoose.model('Ticket', ticketSchema);
