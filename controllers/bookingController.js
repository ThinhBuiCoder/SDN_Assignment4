const Booking = require("../models/bookingModel");
const Car = require("../models/carModel");

// GET /bookings
exports.getAllBookings = async (req, res) => {
  const bookings = await Booking.find();
  res.json(bookings);
};

// GET /bookings/overdue-open
exports.getOverdueOpenBookings = async (req, res) => {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const bookings = await Booking.find({
      startDate: { $lte: cutoff },
      $or: [{ endDate: null }, { endDate: { $exists: false } }]
    }).populate("car");

    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /bookings
exports.createBooking = async (req, res) => {
  try {
    const { customerName, carNumber, startDate, endDate } = req.body;

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : null;

    if (Number.isNaN(start.getTime()) || (end && Number.isNaN(end.getTime()))) {
      return res.status(400).json({ message: "Invalid date" });
    }

    if (end && start >= end) {
      return res.status(400).json({ message: "Invalid date range" });
    }

    // Check overlap booking
    const conflictQuery = end
      ? {
          carNumber,
          startDate: { $lt: end },
          $or: [{ endDate: null }, { endDate: { $exists: false } }, { endDate: { $gt: start } }]
        }
      : {
          carNumber,
          $or: [{ endDate: null }, { endDate: { $exists: false } }, { endDate: { $gt: start } }]
        };

    const conflict = await Booking.findOne(conflictQuery);

    if (conflict) {
      return res.status(409).json({ message: "Car already booked in this period" });
    }

    const car = await Car.findOne({ carNumber });
    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    let totalAmount;
    if (end) {
      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      totalAmount = days * car.pricePerDay;
    }

    const booking = await Booking.create({
      customerName,
      carNumber,
      startDate: start,
      endDate: end,
      totalAmount
    });

    res.status(201).json(booking);

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /bookings/:id
exports.updateBooking = async (req, res) => {
  const booking = await Booking.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(booking);
};

// DELETE /bookings/:id
exports.deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndDelete(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: "Booking not found" });
    }
    
    res.json({ message: "Booking deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
