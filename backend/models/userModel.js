import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        email: { type: String, unique: true },
        phone: { type: String },
        isVIP: { type: Boolean, default: false },
        totalSpent: { type: Number, default: 0 },
    },
    { timestamps: true }
);

const User = mongoose.model("User", userSchema);
export default User;
