import User from "../models/userModel.js";
import Order from "../models/orderModel.js";


export const updateVIPStatus = async (req, res) => {
    try {
        console.log(" Starting VIP status update...");

        const orders = await Order.find();
        console.log(` Found ${orders.length} orders`);

        const userTotals = {};


        orders.forEach((order) => {
            const phone = order.phone;
            if (!phone) {
                console.log(" Order missing phone:", order._id);
                return;
            }

            if (!userTotals[phone]) {
                userTotals[phone] = {
                    totalSpent: 0,
                    customerName: order.customerName,
                    email: order.email || ""
                };
            }
            userTotals[phone].totalSpent += order.total || 0;
        });

        console.log(` Processing ${Object.keys(userTotals).length} unique users`);

        // Cập nhật VIP status
        const updates = [];
        const errors = [];

        for (const [phone, userData] of Object.entries(userTotals)) {
            try {
                const isVIP = userData.totalSpent >= 3000000;

                const updatedUser = await User.findOneAndUpdate(
                    { phone },
                    {
                        name: userData.customerName,
                        phone: phone,
                        email: userData.email,
                        totalSpent: userData.totalSpent,
                        isVIP: isVIP,
                        lastOrderDate: new Date()
                    },
                    {
                        upsert: true,
                        new: true,
                        setDefaultsOnInsert: true
                    }
                );

                updates.push({
                    phone: phone,
                    name: userData.customerName,
                    totalSpent: userData.totalSpent,
                    isVIP: isVIP,
                    status: "updated"
                });

                console.log(` Updated user: ${userData.customerName} (${phone}) - Total: ${userData.totalSpent} - VIP: ${isVIP}`);

            } catch (userError) {
                errors.push({
                    phone: phone,
                    name: userData.customerName,
                    error: userError.message
                });
                console.error(` Error updating user ${phone}:`, userError.message);
            }
        }

        res.json({
            success: true,
            message: "VIP status update completed",
            summary: {
                totalUsers: Object.keys(userTotals).length,
                updated: updates.length,
                errors: errors.length
            },
            updates: updates,
            errors: errors
        });

    } catch (error) {
        console.error(" Error in updateVIPStatus:", error);
        res.status(500).json({
            success: false,
            message: "Update failed",
            error: error.message
        });
    }
};

export const getUsers = async (req, res) => {
    try {
        const users = await User.find().sort({ totalSpent: -1 });

        res.json({
            success: true,
            count: users.length,
            users: users
        });

    } catch (error) {
        console.error(" Error in getUsers:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve users",
            error: error.message
        });
    }
};

export const getUserByPhone = async (req, res) => {
    try {
        const { phone } = req.params;

        const user = await User.findOne({ phone });
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        res.json({
            success: true,
            user: user
        });

    } catch (error) {
        console.error(" Error in getUserByPhone:", error);
        res.status(500).json({
            success: false,
            message: "Failed to retrieve user",
            error: error.message
        });
    }
};

export const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        console.log(`Attempting to delete user with ID: ${id}`);

        const user = await User.findById(id);
        if (!user) {
            console.log(`User not found with ID: ${id}`);
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }


        await User.findByIdAndDelete(id);

        console.log(`Successfully deleted user: ${user.name || user.email} (ID: ${id})`);


        res.status(200).json({
            success: true,
            message: "User deleted successfully",
            deletedUser: {
                id: user._id,
                name: user.name || user.email,
                email: user.email
            }
        });

    } catch (error) {
        console.error("Error deleting user:", error);
        res.status(500).json({
            success: false,
            message: "Failed to delete user",
            error: error.message
        });
    }
};