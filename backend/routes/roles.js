const express = require("express");
const router = express.Router();
const { requireRole } = require("../middleware/authMiddleware");
const { getPermissions, createRole, updatePermissions, deleteRole } = require("../controllers/rolesController");

// Already passed through the global verifyToken (+ blockSuperAdmin +
// requirePasswordChange) chain in server.js before reaching here — just the
// role check is needed, not another full token re-verification.
const requireAdmin = requireRole("admin");

router.get("/",           requireAdmin, getPermissions);
router.post("/",          requireAdmin, createRole);
router.put("/:role",      requireAdmin, updatePermissions);
router.delete("/:role",   requireAdmin, deleteRole);

module.exports = router;
