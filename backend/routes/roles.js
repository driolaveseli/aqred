const express = require("express");
const router = express.Router();
const requireAdmin = require("../middleware/requireAdmin");
const { getPermissions, createRole, updatePermissions, deleteRole } = require("../controllers/rolesController");

router.get("/",           requireAdmin, getPermissions);
router.post("/",          requireAdmin, createRole);
router.put("/:role",      requireAdmin, updatePermissions);
router.delete("/:role",   requireAdmin, deleteRole);

module.exports = router;
