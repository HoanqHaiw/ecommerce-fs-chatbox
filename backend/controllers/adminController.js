import bcrypt from "bcryptjs";
import Admin from "../models/adminModel.js";

export const loginAdmin = async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await Admin.findOne({ username });

        if (!admin) {
            return res.status(400).json({ message: "No account found" });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Wrong password" });
        }

        return res.json({ success: true, message: "Login successful" });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ message: "Server error" });
    }
};
