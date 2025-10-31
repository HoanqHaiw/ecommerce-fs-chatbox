import React, { useState } from "react";
import { addProduct } from "../../../api/productService";

const AddProduct = ({ onClose, onSave }) => {
    const [product, setProduct] = useState({
        name: "",
        price: "",
        description: "",
        category: "",
        collection: "No Collection",
        stock: 0,
        sizes: [{ size: "", quantity: 0 }],
        images: [],
    });

    const handleChange = (e) => {
        setProduct({ ...product, [e.target.name]: e.target.value });
    };

    const handleFileChange = (e) => {
        setProduct({ ...product, images: e.target.files });
    };

    // 🧩 Xử lý thêm/xóa/đổi size
    const handleSizeChange = (index, field, value) => {
        const updatedSizes = [...product.sizes];
        updatedSizes[index][field] = value;
        setProduct({ ...product, sizes: updatedSizes });
    };

    const addSizeRow = () => {
        setProduct({ ...product, sizes: [...product.sizes, { size: "", quantity: 0 }] });
    };

    const removeSizeRow = (index) => {
        const updatedSizes = product.sizes.filter((_, i) => i !== index);
        setProduct({ ...product, sizes: updatedSizes });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append("name", product.name);
        formData.append("price", product.price);
        formData.append("description", product.description);
        formData.append("category", product.category);
        formData.append("collections", product.collections);
        formData.append("stock", product.stock);

        // Gửi mảng sizes dưới dạng JSON
        formData.append("sizes", JSON.stringify(product.sizes));

        for (let i = 0; i < Math.min(product.images.length, 3); i++) {
            formData.append("images", product.images[i]);
        }

        await addProduct(formData);
        onSave();
        onClose();
    };

    return (
        <div className="modal">
            <form onSubmit={handleSubmit} encType="multipart/form-data">
                <h3>Thêm sản phẩm mới</h3>

                <input type="text" name="name" placeholder="Tên sản phẩm" onChange={handleChange} required />
                <input type="number" name="price" placeholder="Giá" onChange={handleChange} required />
                <textarea name="description" placeholder="Mô tả sản phẩm" onChange={handleChange}></textarea>
                <input type="text" name="category" placeholder="Danh mục" onChange={handleChange} required />

                {/* 🧺 Chọn bộ sưu tập */}
                <label>Bộ sưu tập:</label>
                <select name="collections" value={product.collections} onChange={handleChange}>
                    <option value="Summer 2025">Summer 2025</option>
                    <option value="Classic Streetwear">Classic Streetwear</option>
                    <option value="Best Seller">Best Seller</option>
                    <option value="New Arrivals">New Arrivals</option>
                    <option value="No Collections">No Collections</option>
                </select>

                <input
                    type="number"
                    name="stock"
                    placeholder="Tổng số lượng tồn kho"
                    onChange={handleChange}
                />

                {/* 👕 Quản lý size + số lượng */}
                <label>Kích cỡ và số lượng:</label>
                {product.sizes.map((s, index) => (
                    <div key={index} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                        <input
                            type="text"
                            placeholder="Size (vd: S, M, L)"
                            value={s.size}
                            onChange={(e) => handleSizeChange(index, "size", e.target.value)}
                            required
                        />
                        <input
                            type="number"
                            placeholder="Số lượng"
                            value={s.quantity}
                            onChange={(e) => handleSizeChange(index, "quantity", e.target.value)}
                            required
                        />
                        {product.sizes.length > 1 && (
                            <button type="button" onClick={() => removeSizeRow(index)}>−</button>
                        )}
                    </div>
                ))}
                <button type="button" onClick={addSizeRow}>+ Thêm size</button>

                <label>Chọn tối đa 3 ảnh:</label>
                <input type="file" name="images" multiple accept="image/*" onChange={handleFileChange} />

                <div className="actions">
                    <button type="submit">Lưu</button>
                    <button type="button" onClick={onClose}>Hủy</button>
                </div>
            </form>
        </div>
    );
};

export default AddProduct;
