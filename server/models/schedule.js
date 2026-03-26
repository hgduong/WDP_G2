const mongoose = require("mongoose");

const scheduleSchema = new mongoose.Schema(
  {
    staffId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    fullName: {
      type: String,
      required: true
    },
    role: {
      type: String,
      default: "Staff"
    },
    date: {
      type: Date,
      required: true
    },
    shift: {
      type: String,
      enum: ["Sáng", "Chiều", "Tối"],
      required: true
    },
    createBy: {
      type: String,
      required: true
    },
    createAt: {
      type: Date,
      default: Date.now
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Index for efficient queries
scheduleSchema.index({ date: 1, shift: 1 });
scheduleSchema.index({ staffId: 1, date: 1 });

module.exports = mongoose.model("Schedule", scheduleSchema);