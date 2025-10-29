import Order from "../models/orderModel.js";

// Lấy danh sách đơn hàng
export const getOrders = async (req, res) => {
    try {
        const orders = await Order.find();
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// Thêm đơn hàng mới
export const createOrder = async (req, res) => {
    try {
        const newOrder = new Order(req.body);
        const savedOrder = await newOrder.save();
        res.status(201).json(savedOrder);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// Cập nhật trạng thái đơn hàng
export const updateOrderStatus = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ message: "Order not found" });

        order.status = req.body.status || order.status;
        const updated = await order.save();
        res.json(updated);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
