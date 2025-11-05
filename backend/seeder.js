import fs from "fs";
import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import Product from "./models/productModel.js";

dotenv.config();
connectDB();

const importData = async () => {
    try {
        const data = JSON.parse(fs.readFileSync("./data/products.json", "utf-8"));
        await Product.deleteMany();
        await Product.insertMany(data.products);
        console.log("✅ Import thành công!");
        process.exit();
    } catch (error) {
        console.error("❌ Import thất bại:", error);
        process.exit(1);
    }
};

importData();
