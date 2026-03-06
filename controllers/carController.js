const Car = require("../models/carModel");
exports.getAllCars = async (req, res) => {
  try {
    const { status } = req.query;
    
    // If status query param is provided, filter by status
    const query = status ? { status } : {};
    
    const cars = await Car.find(query);
    res.json(cars);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.getCarByNumber = async (req, res) => {
  try {
    const car = await Car.findOne({ carNumber: req.params.carNumber });

    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    res.json(car);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
exports.createCar = async (req, res) => {
  try {
    const car = await Car.create(req.body);
    res.status(201).json(car);
  } catch (err) {
    // Handle duplicate carNumber error
    if (err.code === 11000 && err.keyPattern && err.keyPattern.carNumber) {
      return res.status(400).json({ error: "carNumber must be unique" });
    }
    res.status(400).json({ error: err.message });
  }
};
exports.updateCar = async (req, res) => {
  try {
    const car = await Car.findOneAndUpdate(
      { carNumber: req.params.carNumber },
      req.body,
      { new: true }
    );

    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    res.json(car);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
exports.deleteCar = async (req, res) => {
  try {
    const car = await Car.findOneAndDelete({
      carNumber: req.params.carNumber
    });

    if (!car) {
      return res.status(404).json({ message: "Car not found" });
    }

    res.json({ message: "Car deleted" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
