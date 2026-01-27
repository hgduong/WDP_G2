const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  fullName: { type: String, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  passwordHash: { type: String, required: true },
  dob: { type: Date },
  idCard: { type: Number },
  phone: { type: Number },
  address: { type: String },
  role: { type: String, enum: ['Customer', 'Manager', 'Admin'], default: 'Customer' },
  status: { type: String, enum: ['Active', 'Inactive', 'Banned'], default: 'Active' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);
