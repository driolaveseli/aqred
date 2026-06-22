const express = require("express");
const router = express.Router();
const salesController = require("../controllers/salesController");

router.get("/report",             salesController.getSalesReport);
router.get("/revenue-analytics",  salesController.getRevenueAnalytics);
router.get("/", salesController.getSales);
router.post("/", salesController.createSale);
router.get("/:id", salesController.getSaleById);
router.patch("/:id/status", salesController.updateSaleStatus);

module.exports = router;
