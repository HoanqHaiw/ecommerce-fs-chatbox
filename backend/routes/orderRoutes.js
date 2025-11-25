// routes/orders.js
import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import {
    createOrder,
    getOrders,
    getOrdersByCustomer,
    updateOrderStatus,
    deleteOrder
} from "../controllers/orderController.js";

const router = express.Router();


router.post("/", protect, createOrder);
router.get("/customer", getOrdersByCustomer);

// ADMIN ROUTES  
router.get("/", getOrders);
router.put("/:id/status", updateOrderStatus);
router.delete("/:id", deleteOrder);

export default router;