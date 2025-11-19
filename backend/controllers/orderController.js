// controllers/orderController.js
import Order from "../models/orderModel.js";
import mongoose from "mongoose";

export const createOrder = async (req, res) => {
    try {
        const {
            customerName,
            phone,
            email,
            address,
            items,
            subtotal,
            discount,
            total,
            paymentMethod
        } = req.body;

        console.log(" Creating new order for:", customerName, phone);

        const order = new Order({
            customerName,
            phone,
            email: email || "",
            address: address || {},
            items: items || [],
            subtotal: subtotal || 0,
            discount: discount || 0,
            total: total || 0,
            paymentMethod: paymentMethod || "cod",
            status: "pending"
        });

        const savedOrder = await order.save();

        console.log(" Order created successfully:", {
            orderId: savedOrder._id,
            customer: savedOrder.customerName,
            phone: savedOrder.phone,
            total: savedOrder.total
        });

        res.status(201).json({
            success: true,
            message: "Đặt hàng thành công!",
            order: savedOrder
        });

    } catch (error) {
        console.error(" Create order error:", error);


        if (error.name === 'ValidationError') {
            console.log(" Validation errors:", error.errors);
        }

        res.status(400).json({
            success: false,
            message: "Lỗi tạo đơn hàng: " + error.message
        });
    }
};


export const getOrders = async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });

        console.log(` Found ${orders.length} orders`);

        res.json({
            success: true,
            count: orders.length,
            orders: orders
        });
    } catch (error) {
        console.error(" Get orders error:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server"
        });
    }
};


export const getOrdersByCustomer = async (req, res) => {
    try {
        const { phone } = req.query;

        console.log(" Searching orders for phone:", phone);

        if (!phone) {
            return res.status(400).json({
                success: false,
                message: "Vui lòng cung cấp số điện thoại"
            });
        }

        const orders = await Order.find({ phone: phone }).sort({ createdAt: -1 });

        console.log(` Found ${orders.length} orders for phone: ${phone}`);

        res.json({
            success: true,
            count: orders.length,
            orders: orders
        });
    } catch (error) {
        console.error(" Get customer orders error:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server"
        });
    }
};


export const updateOrderStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        console.log(" Updating order status:", id, "->", status);

        const order = await Order.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đơn hàng"
            });
        }

        console.log(" Order status updated successfully");

        res.json({
            success: true,
            message: "Cập nhật trạng thái thành công",
            order: order
        });
    } catch (error) {
        console.error(" Update order error:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server"
        });
    }
};


export const deleteOrder = async (req, res) => {
    try {
        const { id } = req.params;

        console.log(" Deleting order:", id);

        const order = await Order.findByIdAndDelete(id);

        if (!order) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy đơn hàng"
            });
        }

        console.log(" Order deleted successfully");

        res.json({
            success: true,
            message: "Đã xóa đơn hàng"
        });
    } catch (error) {
        console.error(" Delete order error:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi server"
        });
    }
};