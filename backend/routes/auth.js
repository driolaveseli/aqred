const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/login", authController.login);
router.post("/2fa/verify", authController.verify2FALogin);
router.post("/register", authController.register);
router.post("/forgot-password", authController.forgotPassword);
router.post("/logout", authController.logout);
router.get("/me", verifyToken, authController.me);

module.exports = router;
