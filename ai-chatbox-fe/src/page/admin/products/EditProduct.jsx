import React, { useState, useEffect } from "react";
import { updateProduct, getProducts } from "../../../api/productService";

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

    const [allProducts, setAllProducts] = useState([]);
    const [errors, setErrors] = useState({});

    // Load products để check tên trùng (TC_UP_04)
    useEffect(() => {
        const loadProducts = async () => {
            try {
                const products = await getProducts();
                // QUAN TRỌNG: Loại trừ sản phẩm HIỆN TẠI khỏi danh sách check
                setAllProducts(products.filter(p => p._id !== product._id));
            } catch (error) {
                console.error("Error loading products:", error);
            }
        };
        loadProducts();
    }, [product._id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({
            ...form,
            [name]: name === "price" || name === "stock" ? parseFloat(value) || 0 : value
        });
        if (errors[name]) setErrors({ ...errors, [name]: "" });
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

    // VALIDATION CHÍNH: FIX TC_UP_03 và TC_UP_04
    const validateForm = () => {
        const newErrors = {};

        // TC_UP_04: Check tên trùng (CHỈ với sản phẩm KHÁC)
        if (!form.name.trim()) {
            newErrors.name = "Tên sản phẩm là bắt buộc";
        } else if (form.name.trim() !== product.name) {
            // CHỈ check nếu tên thay đổi so với ban đầu
            const isDuplicate = allProducts.some(
                p => p.name.toLowerCase().trim() === form.name.toLowerCase().trim()
            );
            if (isDuplicate) {
                newErrors.name = "Tên sản phẩm đã tồn tại!";
            }
        }
        // Nếu tên không đổi (form.name === product.name) → KHÔNG check

        // TC_UP_03: Check giá âm
        if (!form.price || form.price === "") {
            newErrors.price = "Giá là bắt buộc";
        } else if (parseFloat(form.price) <= 0) {
            newErrors.price = "Giá phải lớn hơn 0";
        }

        // Check số lượng size không âm
        form.sizes.forEach((size, index) => {
            if (size.quantity < 0) {
                newErrors[`size_${index}`] = "Số lượng không được âm";
            }
        });

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validate trước khi submit
        if (!validateForm()) {
            alert("Vui lòng sửa các lỗi trước khi lưu!");
            return;
        }

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
            onSave();
            onClose();
        } catch (error) {
            console.error(" Error update products", error);
            alert("Lỗi: " + (error.message || "Vui lòng thử lại"));
        }
    };

    return (
        <div className="modal">
            <form onSubmit={handleSubmit} encType="multipart/form-data" className="edit-product-form">
                <h3>Update Products</h3>

                {/* Tên sản phẩm với validation TC_UP_04 */}
                <label>Name Product</label>
                <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className={errors.name ? "error" : ""}
                />
                {errors.name && <span className="error-text">{errors.name}</span>}

                {/* Giá với validation TC_UP_03 */}
                <label>Price</label>
                <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleChange}
                    required
                    className={errors.price ? "error" : ""}
                />
                {errors.price && <span className="error-text">{errors.price}</span>}

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
                            className={errors[`size_${index}`] ? "error" : ""}
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