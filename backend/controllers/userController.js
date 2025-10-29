import User from "../models/userModel.js";
import Order from "../models/orderModel.js";

// Cập nhật trạng thái VIP dựa trên tổng chi tiêu
export const updateVIPStatus = async (req, res) => {
    try {
        const orders = await Order.find();
        const userTotals = {};

        // total used spent calculation
        orders.forEach((order) => {
            const name = order.name;
            if (!userTotals[name]) userTotals[name] = 0;
            userTotals[name] += order.total;
        });

        // update vip success
        const updates = await Promise.all(
            Object.entries(userTotals).map(async ([name, total]) => {
                const isVIP = total >= 3000000;
                return await User.findOneAndUpdate(
                    { name },
                    { name, totalSpent: total, isVIP },
                    { upsert: true, new: true }
                );
            })
        );

        res.json({ message: "Update successful", users: updates });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// retrieve user list
export const getUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
