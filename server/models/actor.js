// models/Actor.js
const mongoose = require('mongoose');

const actorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    nameLower: { type: String, required: true, unique: true },
    dateOfBirth: { type: Date },
    gender: { type: String, enum: ["Nam", "Nữ"], default: null },
    nationality: { type: String, trim: true },
    description: { type: String },
    movies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }]
  },
  { timestamps: true }
);

actorSchema.pre('validate', function () {
  if (this.name) {
    this.nameLower = this.name.trim().toLowerCase();
  }
});

module.exports = mongoose.model('Actor', actorSchema);
