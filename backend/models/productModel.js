import mongoose from "mongoose";

const sizeSchema = new mongoose.Schema({
    size: { type: String, required: true },
    quantity: { type: Number, default: 0 }
});

const productSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        price: { type: Number, required: true },
        description: { type: String },
        category: { type: String, required: true },
        collections: { type: String, required: true },
        stock: { type: Number, default: 0 },
        sizes: [sizeSchema],
        images: [String],
    },
    { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);

export default Product;
