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
    categoryName: {
      type: String,
      required: true,
      enum: ["Movie Ticket", "Food & Beverage"],
    },
    taxRate: {
      type: Number,
      required: true,
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
  },
  {
    timestamps: true,
  }
);

taxSchema.index({ categoryName: 1, applyFrom: 1 });
taxSchema.index({ isActive: 1 });

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