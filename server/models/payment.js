// models/Payment.js
const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'VND' },
  method: { type: String, enum: ['Cash', 'CreditCard', 'Momo', 'ZaloPay'], required: true },
  providerTxnId: { type: String }, // mã giao dịch từ nhà cung cấp
  status: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
  invoiceUrl: { type: String }, // đường dẫn hóa đơn nếu có
  paidAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Payment', paymentSchema);
