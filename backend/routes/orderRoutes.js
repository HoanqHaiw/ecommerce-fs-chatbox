import express from "express";
import {
    createOrder,
    getOrders,
    getOrdersByCustomer,
    updateOrderStatus,
    updateOrder,
    deleteOrder
} from "../controllers/orderController.js";

const router = express.Router();
router.get("/customer", getOrdersByCustomer);


router.post("/", createOrder);
router.get("/", getOrders);
router.put("/:id", updateOrder);
router.put("/:id/status", updateOrderStatus);
router.delete("/:id", deleteOrder);


router.put("/public/:id/status", updateOrderStatus);

export default router;