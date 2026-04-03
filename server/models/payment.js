// models/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'VND' },
  method: {
    type: String,
    enum: ['Cash', 'CreditCard', 'Momo', 'ZaloPay', 'PayOS', 'QR', 'Manual'],
    required: true,
  },
  providerTxnId: { type: String, default: null },
  paymentLinkId: { type: String, default: null },
  orderCode: { type: Number, default: null },
  qrData: { type: String, default: null },
  checkoutUrl: { type: String, default: null },
  providerStatus: { type: String, default: null },
  status: {
    type: String,
    enum: ['Pending', 'Paid', 'Failed', 'Cancelled', 'Expired'],
    default: 'Pending',
  },
  invoiceUrl: { type: String, default: null },
  expiresAt: { type: Date, default: null },
  lastWebhookPayload: { type: mongoose.Schema.Types.Mixed, default: null },
  paidAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Payment', paymentSchema);
