const express = require("express");
const router = express.Router();
const bookingController = require("../controllers/bookingController");
const { authenticateToken, requireRole } = require("../middlewares/authMiddleware");

router.get("/", authenticateToken, bookingController.getAllBookings);
router.get("/overdue-open", authenticateToken, bookingController.getOverdueOpenBookings);
router.post("/", authenticateToken, requireRole(["admin", "staff"]), bookingController.createBooking);
router.put("/:id", authenticateToken, requireRole(["admin", "staff"]), bookingController.updateBooking);
router.delete("/:id", authenticateToken, requireRole(["admin"]), bookingController.deleteBooking);

module.exports = router;
