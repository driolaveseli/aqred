const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const { verifyToken } = require("../middleware/authMiddleware");

router.post("/login", authController.login);
router.post("/2fa/verify", authController.verify2FALogin);
router.post("/register", authController.register);
router.get("/check-company", authController.checkCompany);
router.post("/invite-teammates", verifyToken, authController.inviteTeammates);
router.post("/forgot-password", authController.forgotPassword);
router.post("/logout", authController.logout);
router.get("/me", verifyToken, authController.me);

module.exports = router;
