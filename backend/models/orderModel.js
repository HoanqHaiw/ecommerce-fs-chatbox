import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        name: { type: String, required: true }, // tên người đặt hàng
        total: { type: Number, required: true }, // tổng tiền
        status: {
            type: String,
            enum: ["pending", "processing", "completed", "cancelled"],
            default: "pending",
        },
        orderDate: { type: Date, default: Date.now },
    },
    {
        timestamps: true,
    }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
