const express = require("express");
const router = express.Router();
const { requireRole } = require("../middleware/authMiddleware");
const { getLogs, clearOldLogs, getModules } = require("../controllers/logsController");

// Accessible by company admin and platform super_admin
router.use(requireRole("admin", "super_admin"));

router.get("/", getLogs);
router.get("/modules", getModules);
router.delete("/old", clearOldLogs);

module.exports = router;
