import React, { useState } from "react";
import { updateProduct } from "../../../api/productService";

const EditProduct = ({ product, onClose, onSave }) => {
    const [form, setForm] = useState({
        name: product.name || "",
        price: product.price || "",
        category: product.category || "",
        description: product.description || "",
        stock: product.stock || 0,
        collections: product.collections || "",
        sizes: product.sizes || [{ size: "", quantity: 0 }],
        images: [],
    });

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setForm({ ...form, images: Array.from(e.target.files) });
    };

    const handleSizeChange = (index, field, value) => {
        const updatedSizes = [...form.sizes];
        updatedSizes[index][field] = field === "quantity" ? Number(value) : value;
        setForm({ ...form, sizes: updatedSizes });
    };

    const addSizeRow = () => {
        setForm({ ...form, sizes: [...form.sizes, { size: "", quantity: 0 }] });
    };

    const removeSizeRow = (index) => {
        const updatedSizes = form.sizes.filter((_, i) => i !== index);
        setForm({ ...form, sizes: updatedSizes });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("name", form.name);
        formData.append("price", form.price);
        formData.append("category", form.category);
        formData.append("description", form.description);
        formData.append("stock", form.stock);
        formData.append("collections", form.collections);
        formData.append("sizes", JSON.stringify(form.sizes));

        form.images.forEach((file) => {
            formData.append("images", file);
        });

        try {
            await updateProduct(product._id, formData);
            onSave(); // refresh list
            onClose(); // đóng modal
        } catch (error) {
            console.error(" Error update products", error);
        }
    };

    return (
        <div className="modal">
            <form onSubmit={handleSubmit} encType="multipart/form-data" className="edit-product-form">
                <h3>Update Products</h3>

                <label>Name Product</label>
                <input type="text" name="name" value={form.name} onChange={handleChange} required />

                <label>Price</label>
                <input type="number" name="price" value={form.price} onChange={handleChange} required />

                <label>Category</label>
                <input type="text" name="category" value={form.category} onChange={handleChange} />

                <label>Collections (collections)</label>
                <select
                    name="collections"
                    value={form.collections || "No collections"}
                    onChange={handleChange}
                    required
                >
                    <option value="No collections">No collections</option>
                    <option value="Summer 2025">Summer 2025</option>
                    <option value="Classic Streetwear">Classic Streetwear</option>
                    <option value="Best Seller">Best Seller</option>
                    <option value="New Arrivals">New Arrivals</option>
                </select>

                <label>inventory</label>
                <input type="number" name="stock" value={form.stock} onChange={handleChange} />

                <label>Size and Quantity</label>
                {form.sizes.map((s, index) => (
                    <div key={index} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input
                            type="text"
                            value={s.size}
                            onChange={(e) => handleSizeChange(index, "size", e.target.value)}
                            required
                        />
                        <input
                            type="number"
                            value={s.quantity}
                            onChange={(e) => handleSizeChange(index, "quantity", e.target.value)}
                            required
                        />
                        {form.sizes.length > 1 && (
                            <button type="button" onClick={() => removeSizeRow(index)}>−</button>
                        )}
                    </div>
                ))}
                <button type="button" onClick={addSizeRow}>+ Thêm size</button>

                <label>Decriptions</label>
                <textarea
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    rows="3"
                ></textarea>

                <label>Add Product Img (max 3 img)</label>
                <input type="file" name="images" multiple accept="image/*" onChange={handleFileChange} />

                <div className="current-images">
                    {product.images?.length > 0 ? (
                        product.images.map((img, i) => (
                            <img
                                key={i}
                                src={`http://localhost:5000${img}`}
                                alt="current"
                                width="70"
                                height="70"
                                style={{ objectFit: "cover", borderRadius: "6px", margin: "5px" }}
                            />
                        ))
                    ) : (
                        <p>No IMG</p>
                    )}
                </div>

                <div className="form-actions">
                    <button type="submit" className="save-btn">Save</button>
                    <button type="button" onClick={onClose} className="cancel-btn">Cancel</button>
                </div>
            </form>
        </div>
    );
};

export default EditProduct;
