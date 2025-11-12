import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        total: { type: Number, required: true },
        status: {
            type: String,
            enum: ["pending", "processing", "completed", "cancelled"],
            default: "pending",
        },
        orderDate: { type: Date, default: Date.now },

        // 🔥 PHẦN CẦN THIẾT ĐỂ LƯU CHI TIẾT SẢN PHẨM
        items: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product',
                    required: true
                },
                name: { type: String, required: true },
                quantity: { type: Number, required: true },
                price: { type: Number, required: true },
            }
        ],
    },
    {
        timestamps: true,
    }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;