// backend/routes/userAuth.js
import express from "express";
import bcrypt from "bcryptjs";
import User from "../models/userModel.js";

const router = express.Router();

router.post("/register", async (req, res) => {
    try {
        const { username, email, password, phone } = req.body;
        if (!username || !email || !password) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin" });
        }

        const existingEmail = await User.findOne({ email: email.toLowerCase() });
        if (existingEmail) return res.status(400).json({ success: false, message: "Email đã được sử dụng" });

        const existingUsername = await User.findOne({ username });
        if (existingUsername) return res.status(400).json({ success: false, message: "Tên đăng nhập đã tồn tại" });

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashed = await bcrypt.hash(password, salt);

        const newUser = new User({
            username,
            email: email.toLowerCase(),
            password: hashed,
            phone,
        });

        const savedUser = await newUser.save();

        const userSafe = {
            _id: savedUser._id,
            username: savedUser.username,
            email: savedUser.email,
            phone: savedUser.phone,
            createdAt: savedUser.createdAt
        };

        return res.status(201).json({ success: true, message: "Đăng ký thành công", user: userSafe });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
});

// --- Route: Đăng nhập user ---
router.post("/login", async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ success: false, message: "Thiếu thông tin" });
        }


        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(400).json({ success: false, message: "Email hoặc mật khẩu không đúng" });


        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ success: false, message: "Email hoặc mật khẩu không đúng" });

        const userSafe = {
            _id: user._id,
            username: user.username,
            email: user.email,
            phone: user.phone,
            createdAt: user.createdAt
        };

        return res.status(200).json({ success: true, message: "Đăng nhập thành công", user: userSafe });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ success: false, message: "Lỗi server" });
    }
});

export default router;
