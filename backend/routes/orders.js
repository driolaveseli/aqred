const express = require("express");
const router = express.Router();
const { getOrders, getOrderById, getOrderItems, createOrder, updateOrder, deleteOrder } = require("../controllers/orderController");

router.get("/", getOrders);
router.get("/:id", getOrderById);
router.get("/:id/items", getOrderItems);
router.post("/", createOrder);
router.put("/:id", updateOrder);
router.delete("/:id", deleteOrder);

module.exports = router;
