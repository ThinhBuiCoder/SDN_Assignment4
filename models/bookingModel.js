const mongoose = require("mongoose");

const BookingSchema = new mongoose.Schema({
  customerName: {
    type: String,
    required: true
  },
  carNumber: {
    type: String,
    required: true
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: {
    type: Date,
    default: null
  },
  totalAmount: {
    type: Number
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Virtual populate: Booking.carNumber -> Car.carNumber
BookingSchema.virtual("car", {
  ref: "Car",
  localField: "carNumber",
  foreignField: "carNumber",
  justOne: true
});

module.exports = mongoose.model("Booking", BookingSchema);
