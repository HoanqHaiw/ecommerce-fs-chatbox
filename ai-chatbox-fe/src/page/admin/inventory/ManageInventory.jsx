import React, { useEffect, useState } from "react";
import axios from "axios";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import "../scssa/inventory.scss";

const ITEMS_PER_PAGE = 10;

const ManageInventory = () => {
    const [inventory, setInventory] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [categoryFilter, setCategoryFilter] = useState("All");
    const [currentPage, setCurrentPage] = useState(1);

    // State cho modal cập nhật
    const [editingItem, setEditingItem] = useState(null);
    const [sizeQuantities, setSizeQuantities] = useState({});
    const [updating, setUpdating] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/products");
            const data = res.data.products;

            const formatted = data.map((item) => ({
                id: item._id,
                product: item.name,
                quantity: item.stock,
                sizes: item.sizes || [],
                category: item.category || "Other",
                status:
                    item.stock === 0
                        ? "Sold Out"
                        : item.stock <= 10
                            ? "Running Low"
                            : "In Stock",
                image: item.images?.[0] || "",
            }));

            setInventory(formatted);
        } catch (error) {
            console.error("Lỗi load inventory:", error);
        }
    };

    // Mở modal cập nhật với data từng size
    const handleEditClick = (item) => {
        setEditingItem(item);

        // Khởi tạo object quantities cho từng size
        const initialQuantities = {};
        item.sizes.forEach(size => {
            initialQuantities[size.size] = size.quantity.toString();
        });
        setSizeQuantities(initialQuantities);
        setErrors({});
    };

    // Handle change quantity cho từng size
    const handleSizeQuantityChange = (sizeName, value) => {
        setSizeQuantities(prev => ({
            ...prev,
            [sizeName]: value
        }));

        // Clear error khi user gõ
        if (errors[sizeName]) {
            setErrors(prev => ({ ...prev, [sizeName]: "" }));
        }
    };

    // Validate từng size quantity (FIX TC_UT_02 và TC_UT_03)
    const validateSizeQuantities = () => {
        const newErrors = {};
        let totalStock = 0;

        Object.entries(sizeQuantities).forEach(([sizeName, quantity]) => {
            const numValue = parseInt(quantity);

            // Kiểm tra số hợp lệ
            if (isNaN(numValue) || quantity === "") {
                newErrors[sizeName] = "Vui lòng nhập số hợp lệ";
                return;
            }

            // TC_UT_02: Không cho phép số âm
            if (numValue < 0) {
                newErrors[sizeName] = "Số lượng không được âm!";
                return;
            }

            // TC_UT_03: Giới hạn 1,000,000
            if (numValue > 1000000) {
                newErrors[sizeName] = "Số lượng không được vượt quá 1,000,000!";
                return;
            }

            totalStock += numValue;
        });

        // Kiểm tra tổng stock
        if (totalStock > 1000000) {
            newErrors.total = "Tổng số lượng tất cả size không được vượt quá 1,000,000!";
        }

        setErrors(newErrors);
        return {
            isValid: Object.keys(newErrors).length === 0,
            totalStock
        };
    };

    // Xử lý cập nhật stock cho từng size
    const handleUpdateStock = async () => {
        if (!editingItem) return;

        // Validate tất cả size
        const validation = validateSizeQuantities();
        if (!validation.isValid) {
            return;
        }

        setUpdating(true);

        try {
            // Chuẩn bị data sizes mới
            const updatedSizes = editingItem.sizes.map(size => ({
                size: size.size,
                quantity: parseInt(sizeQuantities[size.size]) || 0
            }));

            // Cập nhật trên server
            const res = await axios.put(`http://localhost:5000/api/products/${editingItem.id}`, {
                sizes: updatedSizes,
                stock: validation.totalStock // Tổng stock
            });

            console.log("Cập nhật stock thành công:", res.data);

            // Cập nhật local state
            setInventory(prev => prev.map(item =>
                item.id === editingItem.id
                    ? {
                        ...item,
                        quantity: validation.totalStock,
                        sizes: updatedSizes,
                        status:
                            validation.totalStock === 0
                                ? "Sold Out"
                                : validation.totalStock <= 10
                                    ? "Running Low"
                                    : "In Stock"
                    }
                    : item
            ));

            // Đóng modal
            setEditingItem(null);
            setSizeQuantities({});

        } catch (error) {
            console.error("Lỗi cập nhật stock:", error);
            setErrors(prev => ({
                ...prev,
                server: "Lỗi khi cập nhật: " + (error.response?.data?.message || "Vui lòng thử lại")
            }));
        } finally {
            setUpdating(false);
        }
    };

    // Tính tổng stock từ sizeQuantities
    const calculateTotalStock = () => {
        return Object.values(sizeQuantities).reduce((total, qty) => {
            const num = parseInt(qty);
            return total + (isNaN(num) ? 0 : num);
        }, 0);
    };

    // Filter + search
    const filteredInventory = inventory.filter((item) => {
        const matchesSearch =
            item.product.toLowerCase().includes(search.toLowerCase()) ||
            item.id.includes(search);

        const matchesStatus =
            statusFilter === "All" || item.status === statusFilter;

        const matchesCategory =
            categoryFilter === "All" || item.category === categoryFilter;

        return matchesSearch && matchesStatus && matchesCategory;
    });

    // Pagination
    const totalPages = Math.ceil(filteredInventory.length / ITEMS_PER_PAGE);
    const paginatedData = filteredInventory.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const handleExport = () => {
        const dataToExport = filteredInventory.map((item) => ({
            ID: item.id,
            Product: item.product,
            Category: item.category,
            TotalStock: item.quantity,
            Sizes: item.sizes.map((s) => `${s.size}:${s.quantity}`).join(", "),
            Status: item.status,
        }));

        const worksheet = XLSX.utils.json_to_sheet(dataToExport);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
        const excelBuffer = XLSX.write(workbook, {
            bookType: "xlsx",
            type: "array",
        });
        const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
        saveAs(blob, "Inventory.xlsx");
    };

    return (
        <div className="admin-container">
            <div className="admin-main">
                <div className="admin-content">
                    <h2>Manage Inventory</h2>

                    {/* Search + Filters + Export */}
                    <div className="inventory-tools">
                        <input
                            type="text"
                            placeholder="Search by name or ID"
                            value={search}
                            onChange={(e) => {
                                setSearch(e.target.value);
                                setCurrentPage(1);
                            }}
                        />

                        <select
                            value={statusFilter}
                            onChange={(e) => {
                                setStatusFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="All">All Status</option>
                            <option value="In Stock">In Stock</option>
                            <option value="Running Low">Running Low</option>
                            <option value="Sold Out">Sold Out</option>
                        </select>

                        <select
                            value={categoryFilter}
                            onChange={(e) => {
                                setCategoryFilter(e.target.value);
                                setCurrentPage(1);
                            }}
                        >
                            <option value="All">All Categories</option>
                            {Array.from(new Set(inventory.map((i) => i.category))).map(
                                (cat) => (
                                    <option key={cat} value={cat}>
                                        {cat}
                                    </option>
                                )
                            )}
                        </select>

                        <button onClick={handleExport}>Export Excel</button>
                    </div>

                    {/* Table */}
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Image</th>
                                <th>ID</th>
                                <th>Product</th>
                                <th>Category</th>
                                <th>Total Stock</th>
                                <th>Sizes</th>
                                <th>Status</th>
                                <th>Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedData.map((item) => (
                                <tr key={item.id}>
                                    <td>
                                        {item.image ? (
                                            <img
                                                src={`http://localhost:5000${item.image}`}
                                                alt={item.product}
                                                style={{ width: 50, height: 50, objectFit: "cover" }}
                                            />
                                        ) : (
                                            "No Image"
                                        )}
                                    </td>
                                    <td>{item.id}</td>
                                    <td>{item.product}</td>
                                    <td>{item.category}</td>
                                    <td>
                                        <span className="stock-value">{item.quantity}</span>
                                    </td>
                                    <td>
                                        <div className="sizes-list">
                                            {item.sizes.map((s) => (
                                                <div key={s._id || s.size} className="size-item">
                                                    <span className="size-name">{s.size}:</span>
                                                    <span className="size-quantity">{s.quantity}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </td>
                                    <td>
                                        <span className={`status-badge status-${item.status.replace(/\s+/g, '-').toLowerCase()}`}>
                                            {item.status}
                                        </span>
                                    </td>
                                    <td>
                                        <button
                                            className="update-btn"
                                            onClick={() => handleEditClick(item)}
                                        >
                                            Update Stock
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    {/* Pagination */}
                    <div className="pagination">
                        <button
                            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                            disabled={currentPage === 1}
                        >
                            Prev
                        </button>
                        <span>
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                            disabled={currentPage === totalPages}
                        >
                            Next
                        </button>
                    </div>

                    {/* Summary */}
                    <div className="inventory-summary">
                        <p>
                            <strong>Total Products:</strong> {filteredInventory.length}
                        </p>
                        <p>
                            <strong>Sold Out:</strong>{" "}
                            {filteredInventory.filter((i) => i.status === "Sold Out").length}
                        </p>
                        <p>
                            <strong>Running Low:</strong>{" "}
                            {filteredInventory.filter((i) => i.status === "Running Low").length}
                        </p>
                    </div>
                </div>
            </div>

            {/* Modal cập nhật stock theo size */}
            {editingItem && (
                <div className="modal-overlay" onClick={() => !updating && setEditingItem(null)}>
                    <div className="update-stock-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Cập nhật tồn kho theo Size</h3>
                            <button
                                className="close-btn"
                                onClick={() => !updating && setEditingItem(null)}
                                disabled={updating}
                            >
                                &times;
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="product-info">
                                {editingItem.image && (
                                    <img
                                        src={`http://localhost:5000${editingItem.image}`}
                                        alt={editingItem.product}
                                        className="product-image"
                                    />
                                )}
                                <div>
                                    <h4>{editingItem.product}</h4>
                                    <p><strong>ID:</strong> {editingItem.id}</p>
                                    <p><strong>Category:</strong> {editingItem.category}</p>
                                    <p><strong>Current Total Stock:</strong> {editingItem.quantity}</p>
                                </div>
                            </div>

                            <div className="sizes-update-section">
                                <h4>Nhập số lượng cho từng Size:</h4>

                                {editingItem.sizes.map((size, index) => (
                                    <div key={index} className="size-input-row">
                                        <div className="size-label">
                                            <span className="size-name">Size {size.size}:</span>
                                            <span className="current-quantity">(Hiện tại: {size.quantity})</span>
                                        </div>
                                        <div className="size-input-group">
                                            <input
                                                type="number"
                                                value={sizeQuantities[size.size] || ""}
                                                onChange={(e) => handleSizeQuantityChange(size.size, e.target.value)}
                                                min="0"
                                                max="1000000"
                                                disabled={updating}
                                                className={errors[size.size] ? "error-input" : ""}
                                                placeholder="Nhập số lượng"
                                            />
                                            <span className="input-unit">sản phẩm</span>
                                        </div>
                                        {errors[size.size] && (
                                            <div className="size-error-message">
                                                ⚠️ {errors[size.size]}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                <div className="total-stock-summary">
                                    <div className="total-row">
                                        <span className="label">Tổng số lượng:</span>
                                        <span className="value">{calculateTotalStock()} sản phẩm</span>
                                    </div>
                                    {errors.total && (
                                        <div className="total-error-message">
                                            ⚠️ {errors.total}
                                        </div>
                                    )}
                                </div>

                                {errors.server && (
                                    <div className="server-error-message">
                                        ⚠️ {errors.server}
                                    </div>
                                )}
                            </div>

                            <div className="status-preview">
                                <p><strong>Trạng thái sẽ thay đổi thành:</strong></p>
                                <span className={`status-badge status-${calculateTotalStock() === 0
                                        ? "sold-out"
                                        : calculateTotalStock() <= 10
                                            ? "running-low"
                                            : "in-stock"
                                    }`}>
                                    {calculateTotalStock() === 0
                                        ? "Sold Out"
                                        : calculateTotalStock() <= 10
                                            ? "Running Low"
                                            : "In Stock"
                                    }
                                </span>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button
                                className="cancel-btn"
                                onClick={() => setEditingItem(null)}
                                disabled={updating}
                            >
                                Hủy
                            </button>
                            <button
                                className="save-btn"
                                onClick={handleUpdateStock}
                                disabled={updating || Object.keys(errors).length > 0}
                            >
                                {updating ? (
                                    <>
                                        <span className="spinner"></span> Đang cập nhật...
                                    </>
                                ) : (
                                    "Lưu thay đổi"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div>
                <button className="back-home" onClick={() => window.history.back()}>
                    Back
                </button>
            </div>
        </div>
    );
};

export default ManageInventory;