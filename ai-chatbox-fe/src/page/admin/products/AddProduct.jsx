import React, { useState, useEffect } from "react";
import { addProduct, getProducts, checkProductExists } from "../../../api/productService";

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

    const [allProducts, setAllProducts] = useState([]); // Lưu danh sách sản phẩm hiện có
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [submitMessage, setSubmitMessage] = useState({ type: "", text: "" });

    // Load danh sách sản phẩm khi component mount
    useEffect(() => {
        const loadProducts = async () => {
            try {
                const products = await getProducts();
                setAllProducts(products);
            } catch (error) {
                console.error("Error loading products:", error);
            }
        };
        loadProducts();
    }, []);

    // Validate real-time
    useEffect(() => {
        const newErrors = {};

        // Validate price (TC_AP_04)
        if (product.price !== "" && parseFloat(product.price) <= 0) {
            newErrors.price = "Giá phải lớn hơn 0";
        }

        // Validate name length
        if (product.name && product.name.length < 3) {
            newErrors.name = "Tên sản phẩm phải có ít nhất 3 ký tự";
        }

        // Validate stock
        if (product.stock < 0) {
            newErrors.stock = "Số lượng tồn kho không được âm";
        }

        // Validate sizes
        product.sizes.forEach((size, index) => {
            if (size.quantity < 0) {
                newErrors[`size_${index}`] = `Số lượng size ${size.size || index + 1} không được âm`;
            }
        });

        setErrors(newErrors);
    }, [product]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProduct({
            ...product,
            [name]: name === "price" || name === "stock" ? parseFloat(value) || 0 : value
        });

        // Clear error khi user gõ
        if (errors[name]) {
            setErrors({ ...errors, [name]: "" });
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 3) {
            alert("Chỉ được chọn tối đa 3 ảnh!");
            e.target.value = "";
            return;
        }
        setProduct({ ...product, images: files });
    };

    // Quản lý kích cỡ và số lượng
    const handleSizeChange = (index, field, value) => {
        const updatedSizes = [...product.sizes];
        updatedSizes[index][field] = field === "quantity" ? parseInt(value) || 0 : value;
        setProduct({ ...product, sizes: updatedSizes });
    };

    const addSizeRow = () => {
        setProduct({
            ...product,
            sizes: [...product.sizes, { size: "", quantity: 0 }],
        });
    };

    const removeSizeRow = (index) => {
        if (product.sizes.length <= 1) {
            alert("Phải có ít nhất 1 size!");
            return;
        }
        const updatedSizes = product.sizes.filter((_, i) => i !== index);
        setProduct({ ...product, sizes: updatedSizes });
    };

    // Validate form trước khi submit
    const validateForm = () => {
        const newErrors = {};

        // 1. Validate name (TC_AP_05)
        if (!product.name.trim()) {
            newErrors.name = "Tên sản phẩm là bắt buộc";
        } else if (product.name.trim().length < 3) {
            newErrors.name = "Tên sản phẩm phải có ít nhất 3 ký tự";
        } else {
            // Kiểm tra tên sản phẩm trùng LOCALLY
            const exists = allProducts.some(
                p => p.name.toLowerCase().trim() === product.name.toLowerCase().trim()
            );
            if (exists) {
                newErrors.name = "Tên sản phẩm đã tồn tại! Vui lòng chọn tên khác.";
            }
        }

        // 2. Validate price (TC_AP_04)
        if (!product.price || product.price === "") {
            newErrors.price = "Giá là bắt buộc";
        } else if (parseFloat(product.price) <= 0) {
            newErrors.price = "Giá phải lớn hơn 0";
        }

        // 3. Validate category
        if (!product.category.trim()) {
            newErrors.category = "Danh mục là bắt buộc";
        }

        // 4. Validate sizes
        product.sizes.forEach((size, index) => {
            if (!size.size.trim()) {
                newErrors[`size_${index}`] = "Tên size là bắt buộc";
            }
            if (size.quantity < 0) {
                newErrors[`size_${index}`] = `Số lượng size ${size.size} không được âm`;
            }
        });

        // 5. Validate images
        if (product.images.length === 0) {
            newErrors.images = "Vui lòng chọn ít nhất 1 ảnh";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Reset message
        setSubmitMessage({ type: "", text: "" });

        // Validate form (LOCAL VALIDATION)
        const isValid = validateForm();
        if (!isValid) {
            setSubmitMessage({
                type: "error",
                text: "Vui lòng sửa các lỗi trước khi lưu!"
            });
            return;
        }

        setLoading(true);

        try {
            // Tạo FormData
            const formData = new FormData();
            formData.append("name", product.name.trim());
            formData.append("price", parseFloat(product.price));
            formData.append("description", product.description.trim());
            formData.append("category", product.category.trim());
            formData.append("collections", product.collection); // Note: backend expects "collections" not "collection"
            formData.append("stock", calculateTotalStock()); // Tổng stock từ các size

            // Gửi mảng sizes dưới dạng JSON
            formData.append("sizes", JSON.stringify(
                product.sizes.map(s => ({
                    size: s.size.trim(),
                    quantity: parseInt(s.quantity) || 0
                }))
            ));

            // Gửi ảnh
            product.images.forEach((image) => {
                formData.append("images", image);
            });

            // Debug: log FormData
            console.log("FormData contents:");
            for (let [key, value] of formData.entries()) {
                console.log(key, value);
            }

            // Gọi API
            const result = await addProduct(formData);
            console.log("Add product success:", result);

            setSubmitMessage({
                type: "success",
                text: "Thêm sản phẩm thành công!"
            });

            // Đóng modal sau 1.5 giây
            setTimeout(() => {
                onSave();
                onClose();
            }, 1500);

        } catch (error) {
            console.error("Error adding product:", error);

            let errorMessage = "Lỗi khi thêm sản phẩm";
            if (error.message.includes("Price must be greater than 0")) {
                errorMessage = "Giá sản phẩm phải lớn hơn 0";
                setErrors({ ...errors, price: errorMessage });
            } else if (error.message.includes("Missing required fields")) {
                errorMessage = "Thiếu thông tin bắt buộc: tên, giá, danh mục";
            } else {
                errorMessage = error.message || "Lỗi không xác định";
            }

            setSubmitMessage({
                type: "error",
                text: errorMessage
            });
        } finally {
            setLoading(false);
        }
    };

    // Tính tổng stock từ các size
    const calculateTotalStock = () => {
        return product.sizes.reduce((total, size) => total + (parseInt(size.quantity) || 0), 0);
    };

    return (
        <div className="modal">
            <form onSubmit={handleSubmit} encType="multipart/form-data">
                <h3>Thêm sản phẩm</h3>

                {/* Thông báo */}
                {submitMessage.text && (
                    <div className={`alert ${submitMessage.type === "error" ? "alert-danger" : "alert-success"}`}>
                        {submitMessage.text}
                    </div>
                )}

                {/* Tên sản phẩm */}
                <div className="form-group">
                    <input
                        type="text"
                        name="name"
                        placeholder="Tên sản phẩm *"
                        value={product.name}
                        onChange={handleChange}
                        className={errors.name ? "error" : ""}
                        disabled={loading}
                    />
                    {errors.name && <span className="error-text">{errors.name}</span>}
                </div>

                {/* Giá */}
                <div className="form-group">
                    <input
                        type="number"
                        name="price"
                        placeholder="Giá *"
                        value={product.price}
                        onChange={handleChange}
                        className={errors.price ? "error" : ""}
                        min="0"
                        disabled={loading}
                    />
                    {errors.price && <span className="error-text">{errors.price}</span>}
                </div>

                {/* Mô tả */}
                <div className="form-group">
                    <textarea
                        name="description"
                        placeholder="Mô tả"
                        value={product.description}
                        onChange={handleChange}
                        disabled={loading}
                    />
                </div>

                {/* Danh mục */}
                <div className="form-group">
                    <input
                        type="text"
                        name="category"
                        placeholder="Danh mục *"
                        value={product.category}
                        onChange={handleChange}
                        className={errors.category ? "error" : ""}
                        disabled={loading}
                    />
                    {errors.category && <span className="error-text">{errors.category}</span>}
                </div>

                {/* Bộ sưu tập */}
                <div className="form-group">
                    <label>Bộ sưu tập:</label>
                    <select
                        name="collection"
                        value={product.collection}
                        onChange={handleChange}
                        disabled={loading}
                    >
                        <option value="Summer 2025">Summer 2025</option>
                        <option value="Classic Streetwear">Classic Streetwear</option>
                        <option value="Best Seller">Best Seller</option>
                        <option value="New Arrivals">New Arrivals</option>
                        <option value="No Collection">Không thuộc bộ sưu tập</option>
                    </select>
                </div>

                {/* Size và số lượng */}
                <div className="form-group">
                    <label>Size và số lượng:</label>
                    {product.sizes.map((s, index) => (
                        <div key={index} className="size-row">
                            <input
                                type="text"
                                placeholder="Size"
                                value={s.size}
                                onChange={(e) => handleSizeChange(index, "size", e.target.value)}
                                className={errors[`size_${index}`] ? "error" : ""}
                                disabled={loading}
                            />
                            <input
                                type="number"
                                placeholder="Số lượng"
                                value={s.quantity}
                                onChange={(e) => handleSizeChange(index, "quantity", e.target.value)}
                                min="0"
                                className={errors[`size_${index}`] ? "error" : ""}
                                disabled={loading}
                            />
                            {product.sizes.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => removeSizeRow(index)}
                                    disabled={loading}
                                >
                                    −
                                </button>
                            )}
                        </div>
                    ))}
                    <button type="button" onClick={addSizeRow} disabled={loading}>
                        + Thêm Size
                    </button>
                    {/* Hiển thị lỗi size */}
                    {Object.keys(errors).map(key => {
                        if (key.startsWith('size_')) {
                            return <span key={key} className="error-text">{errors[key]}</span>;
                        }
                        return null;
                    })}
                </div>

                {/* Ảnh */}
                <div className="form-group">
                    <label>Chọn ảnh (tối đa 3) *</label>
                    <input
                        type="file"
                        name="images"
                        multiple
                        accept="image/*"
                        onChange={handleFileChange}
                        className={errors.images ? "error" : ""}
                        disabled={loading}
                    />
                    {errors.images && <span className="error-text">{errors.images}</span>}
                    {product.images.length > 0 && (
                        <small>Đã chọn {product.images.length} ảnh</small>
                    )}
                </div>

                {/* Nút hành động */}
                <div className="actions">
                    <button
                        type="submit"
                        disabled={loading || Object.keys(errors).length > 0}
                    >
                        {loading ? "Đang xử lý..." : "Lưu"}
                    </button>
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Hủy
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddProduct;