const Car = require("../models/carModel");
const Booking = require("../models/bookingModel");

function parseFeatures(featuresText = "") {
  return featuresText
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function parseDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function calculateTotalAmount(startDate, endDate, pricePerDay) {
  if (!endDate) return undefined;
  const days = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24));
  return days * pricePerDay;
}

exports.dashboard = async (req, res) => {
  const [carsCount, bookingsCount, openBookings, overdueBookings] = await Promise.all([
    Car.countDocuments(),
    Booking.countDocuments(),
    Booking.countDocuments({ $or: [{ endDate: null }, { endDate: { $exists: false } }] }),
    Booking.countDocuments({
      startDate: { $lte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      $or: [{ endDate: null }, { endDate: { $exists: false } }]
    })
  ]);

  res.render("index", {
    pageTitle: "Dashboard",
    carsCount,
    bookingsCount,
    openBookings,
    overdueBookings
  });
};

exports.carsPage = async (req, res) => {
  const { status, q } = req.query;

  const query = {};
  if (status) query.status = status;
  if (q) query.carNumber = { $regex: q, $options: "i" };

  const cars = await Car.find(query).sort({ carNumber: 1 });

  res.render("cars", {
    pageTitle: "Quản lý xe",
    cars,
    filters: { status: status || "", q: q || "" },
    error: req.query.error || "",
    success: req.query.success || ""
  });
};

exports.createCarFromForm = async (req, res) => {
  try {
    const { carNumber, capacity, status, pricePerDay, features } = req.body;

    await Car.create({
      carNumber,
      capacity: Number(capacity),
      status,
      pricePerDay: Number(pricePerDay),
      features: parseFeatures(features)
    });

    res.redirect("/cars?success=Thêm xe thành công");
  } catch (err) {
    if (err.code === 11000) {
      return res.redirect("/cars?error=Biển số đã tồn tại");
    }
    res.redirect(`/cars?error=${encodeURIComponent(err.message)}`);
  }
};

exports.updateCarFromForm = async (req, res) => {
  try {
    const { carNumber } = req.params;
    const { capacity, status, pricePerDay, features } = req.body;

    const updated = await Car.findOneAndUpdate(
      { carNumber },
      {
        capacity: Number(capacity),
        status,
        pricePerDay: Number(pricePerDay),
        features: parseFeatures(features)
      },
      { new: true }
    );

    if (!updated) {
      return res.redirect("/cars?error=Không tìm thấy xe để cập nhật");
    }

    res.redirect("/cars?success=Cập nhật xe thành công");
  } catch (err) {
    res.redirect(`/cars?error=${encodeURIComponent(err.message)}`);
  }
};

exports.deleteCarFromForm = async (req, res) => {
  try {
    const { carNumber } = req.params;
    const deleted = await Car.findOneAndDelete({ carNumber });

    if (!deleted) {
      return res.redirect("/cars?error=Không tìm thấy xe để xoá");
    }

    res.redirect("/cars?success=Xoá xe thành công");
  } catch (err) {
    res.redirect(`/cars?error=${encodeURIComponent(err.message)}`);
  }
};

exports.bookingsPage = async (req, res) => {
  const [cars, bookings] = await Promise.all([
    Car.find().sort({ carNumber: 1 }),
    Booking.find().sort({ createdAt: -1 })
  ]);

  res.render("bookings", {
    pageTitle: "Quản lý booking",
    cars,
    bookings,
    error: req.query.error || "",
    success: req.query.success || ""
  });
};

exports.createBookingFromForm = async (req, res) => {
  try {
    const { customerName, carNumber, startDate, endDate } = req.body;

    const start = parseDate(startDate);
    const end = parseDate(endDate);

    if (!start || (endDate && !end)) {
      return res.redirect("/bookings?error=Ngày không hợp lệ");
    }

    if (end && start >= end) {
      return res.redirect("/bookings?error=Khoảng thời gian không hợp lệ");
    }

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
      return res.redirect("/bookings?error=Xe đã được đặt trong khoảng thời gian này");
    }

    const car = await Car.findOne({ carNumber });
    if (!car) {
      return res.redirect("/bookings?error=Không tìm thấy xe");
    }

    await Booking.create({
      customerName,
      carNumber,
      startDate: start,
      endDate: end,
      totalAmount: calculateTotalAmount(start, end, car.pricePerDay)
    });

    res.redirect("/bookings?success=Tạo booking thành công");
  } catch (err) {
    res.redirect(`/bookings?error=${encodeURIComponent(err.message)}`);
  }
};

exports.updateBookingFromForm = async (req, res) => {
  try {
    const { id } = req.params;
    const { customerName, carNumber, startDate, endDate } = req.body;

    const start = parseDate(startDate);
    const end = parseDate(endDate);

    if (!start || (endDate && !end)) {
      return res.redirect("/bookings?error=Ngày không hợp lệ");
    }

    if (end && start >= end) {
      return res.redirect("/bookings?error=Khoảng thời gian không hợp lệ");
    }

    const conflictQuery = end
      ? {
          _id: { $ne: id },
          carNumber,
          startDate: { $lt: end },
          $or: [{ endDate: null }, { endDate: { $exists: false } }, { endDate: { $gt: start } }]
        }
      : {
          _id: { $ne: id },
          carNumber,
          $or: [{ endDate: null }, { endDate: { $exists: false } }, { endDate: { $gt: start } }]
        };

    const conflict = await Booking.findOne(conflictQuery);
    if (conflict) {
      return res.redirect("/bookings?error=Xe đã được đặt trong khoảng thời gian này");
    }

    const car = await Car.findOne({ carNumber });
    if (!car) {
      return res.redirect("/bookings?error=Không tìm thấy xe");
    }

    const updated = await Booking.findByIdAndUpdate(
      id,
      {
        customerName,
        carNumber,
        startDate: start,
        endDate: end,
        totalAmount: calculateTotalAmount(start, end, car.pricePerDay)
      },
      { new: true }
    );

    if (!updated) {
      return res.redirect("/bookings?error=Không tìm thấy booking để cập nhật");
    }

    res.redirect("/bookings?success=Cập nhật booking thành công");
  } catch (err) {
    res.redirect(`/bookings?error=${encodeURIComponent(err.message)}`);
  }
};

exports.deleteBookingFromForm = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Booking.findByIdAndDelete(id);

    if (!deleted) {
      return res.redirect("/bookings?error=Không tìm thấy booking để xoá");
    }

    res.redirect("/bookings?success=Xoá booking thành công");
  } catch (err) {
    res.redirect(`/bookings?error=${encodeURIComponent(err.message)}`);
  }
};
