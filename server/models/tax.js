const mongoose = require("mongoose");

const FOOD_BEVERAGE_COMBOS = [
  "combo-snoopy",
  "combo-mario-bottle",
  "combo-blanket",
  "combo-set-mario",
  "combo-premium-cgv",
  "combo-premium-my",
  "combo-cgv",
  "combo-my"
];

const taxSchema = new mongoose.Schema(
  {
    taxType: {
      type: String,
      enum: ["category", "room_type", "showtime_rule"],
      default: "category",
    },
    categoryName: {
      type: String,
      enum: ["Movie Ticket", "Food & Beverage", null],
    },
    taxRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    description: {
      type: String,
      default: "",
    },
    applyFrom: {
      type: Date,
      required: true,
    },
    applyTo: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    lastUpdatedBy: {
      type: String,
      default: "",
    },
    cinemaId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    roomType: {
      type: String,
      enum: ["Standard", "VIP", "IMAX", "Double", null],
      default: null,
    },
    roomTypePriority: {
      type: Number,
      default: 1,
      min: 1,
      max: 10,
    },
    showtimeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Showtime",
      default: null,
    },
    daysOfWeek: {
      type: [String],
      enum: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      default: [],
    },
    timeStart: {
      type: String,
      default: null,
    },
    timeEnd: {
      type: String,
      default: null,
    },
    adjustmentType: {
      type: String,
      enum: ["add", "replace", null],
      default: null,
    },
    additionalRate: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    priority: {
      type: Number,
      default: 1,
      min: 1,
      max: 10,
    },
  },
  {
    timestamps: true,
  }
);

taxSchema.index({ categoryName: 1, applyFrom: 1, taxType: 1 });
taxSchema.index({ isActive: 1 });
taxSchema.index({ cinemaId: 1, roomType: 1, categoryName: 1, taxType: 1 });
taxSchema.index({ cinemaId: 1, showtimeId: 1, categoryName: 1, taxType: 1 });
taxSchema.index({ priority: -1 });

taxSchema.statics.FOOD_BEVERAGE_COMBOS = FOOD_BEVERAGE_COMBOS;

taxSchema.virtual("status").get(function () {
  if (!this.isActive) return "Tạm dừng";
  const now = new Date();
  if (now < this.applyFrom) return "Chưa bắt đầu";
  if (this.applyTo && this.categoryName === "Movie Ticket" && new Date(this.applyTo) < now) return "Đã hết hạn";
  return "Hoạt động";
});

taxSchema.set("toJSON", { virtuals: true });
taxSchema.set("toObject", { virtuals: true });

const Tax = mongoose.model("Tax", taxSchema);

module.exports = Tax;