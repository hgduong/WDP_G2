// models/auditLog.js
const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  staffId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  action: { 
    type: String, 
    required: true,
    enum: [
      'TICKET_CHECKIN',
      'SEAT_OVERRIDE',
      'UNLOCK_INTERNAL_SEATS',
      'PAYMENT_UPDATE',
      'BOOKING_CREATE',
      'BOOKING_CANCEL',
      'SEAT_BOOK',
      'STAFF_LOGIN',
      'STAFF_LOGOUT',
    ]
  },
  details: { type: mongoose.Schema.Types.Mixed },
  timestamp: { type: Date, default: Date.now }
});

auditLogSchema.index({ staffId: 1, timestamp: -1 });
auditLogSchema.index({ action: 1, timestamp: -1 });

module.exports = mongoose.model('AuditLog', auditLogSchema);
