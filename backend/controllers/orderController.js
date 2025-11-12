import Order from "../models/orderModel.js";

// FIX: Sử dụng 'export const' cho tất cả các hàm controller
export const getOrders = async (req, res) => {
    try {
        const orders = await Order.find();
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// FIX: Đảm bảo trích xuất và lưu trường 'items'
export const createOrder = async (req, res) => {
    const { name, total, items, status } = req.body;

    if (!name || !total || !items || items.length === 0) {
        return res.status(400).json({ message: "Missing required fields: name, total, and items." });
    }

    try {
        const newOrder = new Order({
            name,
            total,
            items, // <-- LƯU TRƯỜNG ITEMS VÀO DATABASE
            status: status || 'pending',
            orderDate: new Date(),
        });

        const savedOrder = await newOrder.save();
        res.status(201).json(savedOrder);
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(400).json({ message: error.message });
    }
};

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

// Bạn cũng cần kiểm tra và thêm hàm deleteOrder nếu đang sử dụng nó.