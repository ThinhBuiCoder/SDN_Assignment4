const express = require("express");
const authController = require("../controllers/authController");
const { authenticateToken } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.get("/me", authenticateToken, authController.getMe);
router.get("/users", authenticateToken, authController.listUsers);
router.patch("/users/:id/toggle", authenticateToken, authController.toggleUserStatus);

module.exports = router;
