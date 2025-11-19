// models/Order.js
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
    {
        customerName: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String },
        address: {
            city: String,
            district: String,
            ward: String,
            specific: String
        },

        items: [
            {
                productId: String,
                name: { type: String, required: true },
                size: String,
                color: String,
                price: { type: Number, required: true },
                quantity: { type: Number, required: true },
                image: String
            }
        ],

        subtotal: { type: Number, required: true },
        discount: { type: Number, default: 0 },
        total: { type: Number, required: true },
        paymentMethod: { type: String, default: "cod" },
        status: {
            type: String,
            enum: ["pending", "confirmed", "shipping", "completed", "cancelled"],
            default: "pending"
        }
    },
    {
        timestamps: true,
    }
);

export default mongoose.model("Order", orderSchema);