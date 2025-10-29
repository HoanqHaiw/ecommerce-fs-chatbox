import Order from "../models/orderModel.js";

export const getRevenueStats = async (req, res) => {
    try {
        const orders = await Order.find();

        const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);

        res.json({ totalRevenue, count: orders.length });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
