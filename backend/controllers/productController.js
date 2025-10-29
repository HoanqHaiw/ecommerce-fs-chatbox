import Product from "../models/productModel.js";

// CREATE PRODUCT
export const createProduct = async (req, res) => {
    try {
        const { name, price, description, category, collections, stock, sizes } = req.body;

        // Validate bắt buộc
        if (!name || !price || !category || !collections) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: name, price, category, collections"
            });
        }

        // Xử lý images nếu có
        const imagePaths = req.files?.map((file) => `/uploads/${file.filename}`) || [];

        // Xử lý sizes: parse JSON nếu là string
        let formattedSizes = [];
        if (sizes) {
            try {
                formattedSizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes;
                formattedSizes = formattedSizes.map(s => ({
                    size: s.size,
                    quantity: Number(s.quantity) || 0
                }));
            } catch {
                return res.status(400).json({ success: false, message: "Sizes format invalid" });
            }
        }

        // Tạo product
        const product = await Product.create({
            name,
            price: Number(price),
            description,
            category,
            collections,
            stock: Number(stock) || 0,
            sizes: formattedSizes,
            images: imagePaths,
        });

        res.status(201).json({ success: true, product });

    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
// Xóa sản phẩm
export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }

        // Nếu muốn xóa cả file ảnh trên server, có thể thêm:
        /*
        const fs = require("fs");
        product.images.forEach(imgPath => {
            const fullPath = path.join(__dirname, "..", imgPath);
            if (fs.existsSync(fullPath)) fs.unlinkSync(fullPath);
        });
        */

        await product.remove();

        res.json({ success: true, message: "Product deleted" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};


// GET ALL PRODUCTS
export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.json({ success: true, products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

// GET PRODUCT BY ID
export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ success: false, message: "Product not found" });
        res.json({ success: true, product });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
