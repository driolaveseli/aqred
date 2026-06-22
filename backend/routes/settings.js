const express = require("express");
const router  = express.Router();
const requireAuth = require("../middleware/requireAuth");
const ctrl = require("../controllers/settingsController");

// All settings routes require authentication
router.use(requireAuth);

// Profile
router.get("/profile",    ctrl.getProfile);
router.put("/profile",    ctrl.updateProfile);

// Password
router.put("/password",   ctrl.changePassword);

// 2FA
router.post("/2fa/setup",  ctrl.setup2FA);
router.post("/2fa/verify", ctrl.verify2FA);
router.delete("/2fa",      ctrl.disable2FA);

// User preferences (notifications, theme, etc.)
router.get("/preferences", ctrl.getPreferences);
router.put("/preferences", ctrl.updatePreferences);

// System settings (all users can read; admin check is inside the PUT handler)
router.get("/system",         ctrl.getSystemSettings);
router.put("/system",         ctrl.updateSystemSettings);

// Backup status + manual trigger
router.get("/system/backup",  ctrl.getBackupStatus);
router.post("/system/backup", ctrl.triggerBackup);

module.exports = router;
