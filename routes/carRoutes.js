const express = require("express");
const router = express.Router();
const carController = require("../controllers/carController");
const { authenticateToken, requireRole } = require("../middlewares/authMiddleware");

router.get("/", authenticateToken, carController.getAllCars);
router.get("/:carNumber", authenticateToken, carController.getCarByNumber);
router.post("/", authenticateToken, requireRole(["admin", "staff"]), carController.createCar);
router.put("/:carNumber", authenticateToken, requireRole(["admin", "staff"]), carController.updateCar);
router.delete("/:carNumber", authenticateToken, requireRole(["admin"]), carController.deleteCar);

module.exports = router;
