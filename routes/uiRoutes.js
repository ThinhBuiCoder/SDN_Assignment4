const express = require("express");
const uiController = require("../controllers/uiController");

const router = express.Router();

router.get("/", uiController.dashboard);

router.get("/cars", uiController.carsPage);
router.post("/cars", uiController.createCarFromForm);
router.post("/cars/:carNumber/update", uiController.updateCarFromForm);
router.post("/cars/:carNumber/delete", uiController.deleteCarFromForm);

router.get("/bookings", uiController.bookingsPage);
router.post("/bookings", uiController.createBookingFromForm);
router.post("/bookings/:id/update", uiController.updateBookingFromForm);
router.post("/bookings/:id/delete", uiController.deleteBookingFromForm);

module.exports = router;
