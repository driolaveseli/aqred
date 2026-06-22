const router = require("express").Router();
const dashboardController = require("../controllers/dashboardController");

router.get("/stats",    dashboardController.getStats);
router.get("/overview", dashboardController.getOverview);

module.exports = router;
