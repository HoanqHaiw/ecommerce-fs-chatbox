import Product from "../models/productModel.js";


export const createProduct = async (req, res) => {
    try {
        const { name, price, description, category, collection, stock, sizes } = req.body;



        const imagePaths = req.files?.map((file) => `/uploads/${file.filename}`) || [];

        const product = await Product.create({
            name,
            price,
            description,
            category,
            stock,
            sizes: sizes ? sizes.split(",") : [],
            images: imagePaths,
        });

        res.status(201).json({ success: true, product });
    } catch (error) {
        console.error("Error creating product:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};


export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.json({ success: true, products });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};


export const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: "Không tìm thấy sản phẩm" });
        res.json({ success: true, product });
    } catch (error) {
        res.status(500).json({ success: false, message: "Server error" });
    }
};
