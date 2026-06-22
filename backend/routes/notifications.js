const express = require("express");
const router  = express.Router();
const { getNotifications, markRead, markAllRead } = require("../controllers/notificationsController");

router.get("/",            getNotifications);
router.patch("/read-all",  markAllRead);
router.patch("/:id/read",  markRead);

module.exports = router;
