import fs from "fs";
import Product from "../models/productModel.js";


export const createProduct = async (req, res) => {
    try {
        const { name, price, description, category, collections, stock, sizes } = req.body;

        if (!name || !price || !category || !collections) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields: name, price, category, collections",
            });
        }

        // Lưu đường dẫn ảnh
        const imagePaths = req.files?.map((file) => `/uploads/${file.filename}`) || [];

        // Xử lý sizes
        let formattedSizes = [];
        if (sizes) {
            try {
                formattedSizes = typeof sizes === "string" ? JSON.parse(sizes) : sizes;
                formattedSizes = formattedSizes.map((s) => ({
                    size: s.size,
                    quantity: Number(s.quantity) || 0,
                }));
            } catch {
                return res.status(400).json({ success: false, message: "Sizes format invalid" });
            }
        }

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
        console.error(" Error creating product:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateProduct = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, price, category, description, stock, sizes, collections } = req.body;

        const parsedSizes = sizes ? JSON.parse(sizes) : [];

        const product = await Product.findById(id);
        if (!product) return res.status(404).json({ message: "products not value" });

        // Cập nhật dữ liệu
        product.name = name;
        product.price = price;
        product.category = category;
        product.description = description;
        product.stock = stock;
        product.collections = collections;
        product.sizes = parsedSizes;

        // Nếu có ảnh mới thì thay thế
        if (req.files && req.files.length > 0) {
            // Xóa ảnh cũ
            product.images.forEach((img) => {
                const filePath = `.${img}`;
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            });

            // Lưu ảnh mới
            product.images = req.files.map((file) => `/uploads/${file.filename}`);
        }

        await product.save();
        res.json({ message: "Update Product Success !", product });
    } catch (error) {
        console.error(" Lỗi updateProduct:", error);
        res.status(500).json({ message: "Update Fall", error: error.message });
    }
};


export const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ success: false, message: "Product not found" });
        }


        product.images.forEach((imgPath) => {
            const filePath = `.${imgPath}`;
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });

        await Product.deleteOne({ _id: req.params.id });

        res.json({ success: true, message: "Product deleted successfully!" });
    } catch (error) {
        console.error(" Error Delete Product", error);
        res.status(500).json({ success: false, message: error.message });
    }
};


export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.json({ success: true, products });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product)
            return res.status(404).json({ success: false, message: "Product not found" });
        res.json({ success: true, product });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


export const getProductsByCollection = async (req, res) => {
    try {
        const { collectionName } = req.params;
        const products = await Product.find({ collections: collectionName });
        res.json({ success: true, products });
    } catch (error) {
        console.error(" Error product get by collections", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
