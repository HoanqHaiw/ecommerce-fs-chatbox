import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: String,
    price: Number,
    category: String,
    description: String,
    size: [Number],
    image: String,
    stock: Number,
});

const Product = mongoose.model("Product", productSchema);
export default Product;
