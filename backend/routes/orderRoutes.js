// routes/orders.js
import express from "express";
import {
    createOrder,
    getOrders,
    getOrdersByCustomer,
    updateOrderStatus,
    deleteOrder
} from "../controllers/orderController.js";

const router = express.Router();


router.post("/", createOrder);
router.get("/customer", getOrdersByCustomer);

// ADMIN ROUTES  
router.get("/", getOrders);
router.put("/:id/status", updateOrderStatus);
router.delete("/:id", deleteOrder);

export default router;