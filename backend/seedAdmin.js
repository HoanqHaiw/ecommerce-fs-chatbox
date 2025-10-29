import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import Admin from "./models/adminModel.js";

dotenv.config();

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Đã kết nối MongoDB");

        const existingAdmin = await Admin.findOne({ username: "admin" });
        if (existingAdmin) {
            console.log("⚠️ Admin đã tồn tại, không cần tạo thêm");
            process.exit(0);
        }

        const hashed = await bcrypt.hash("123456", 10);
        await Admin.create({ username: "admin", password: hashed });
        console.log("✅ Admin đã được tạo thành công!");
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

seedAdmin();
