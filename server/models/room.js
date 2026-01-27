// models/Room.js
const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  cinemaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Cinema', required: true },
  name: { type: String, required: true },
  capacity: { type: Number, required: true },
  seatmapId: { type: mongoose.Schema.Types.ObjectId, ref: 'Seatmap' },
  type: { type: String, enum: ['Standard', 'VIP', 'IMAX'], default: 'Standard' },
  description: { type: String },
  status: { type: String, enum: ['Active', 'Inactive'], default: 'Active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Room', roomSchema);
