import React, { useState, useEffect } from "react";
import { getProducts, deleteProduct } from "../../../api/productService";
import AddProduct from "./AddProduct";
import EditProduct from "./EditProduct";
import Header from "../components/Header";
import "../scssa/products.scss";

const ManageProducts = () => {
    const [products, setProducts] = useState([]);
    const [isAdding, setIsAdding] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const data = await getProducts();
            setProducts(data);
        } catch (error) {
            console.error("Lỗi tải sản phẩm:", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc muốn xóa sản phẩm này không?")) {
            await deleteProduct(id);
            loadProducts();
        }
    };
    const generateRandomId = () => Math.floor(Math.random() * (9999 - 1000 + 1)) + 1000;

    return (
        <div className="admin-container">
            {/* <Headers /> */}
            <div className="admin-header">
                <h2>Quản lý sản phẩm</h2>
                <button className="add-btn" onClick={() => setIsAdding(true)}>+ Thêm sản phẩm</button>
            </div>

            {/* Modal thêm / sửa */}
            {isAdding && <AddProduct onClose={() => setIsAdding(false)} onSave={loadProducts} />}
            {editingProduct && (
                <EditProduct product={editingProduct} onClose={() => setEditingProduct(null)} onSave={loadProducts} />
            )}

            <table className="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Tên</th>
                        <th>Giá</th>
                        <th>Danh mục</th>
                        <th>Tồn kho</th>
                        <th>Kích cỡ</th>
                        <th>Ảnh</th>
                        <th>Mô tả</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {products.length > 0 ? (
                        products.map((p) => (
                            <tr key={p._id}>
                                <td>{generateRandomId()}</td>
                                <td>{p.name}</td>
                                <td>{p.price?.toLocaleString()} đ</td>
                                <td>{p.category}</td>
                                <td>{p.stock}</td>
                                <td>{p.sizes?.map(s => `${s.size} (${s.quantity})`).join(", ")}</td>
                                <td>
                                    {p.images && p.images.length > 0 ? (
                                        p.images.map((img, i) => (
                                            <img key={i} src={`http://localhost:5000/${img}`} alt={p.name} width="50" height="50" style={{ objectFit: "cover", borderRadius: "4px", marginRight: "5px" }} />
                                        ))
                                    ) : (
                                        <span>Không có ảnh</span>
                                    )}
                                </td>
                                <td className="desc">{p.description?.slice(0, 60)}...</td>
                                <td>
                                    <button className="edit-btn" onClick={() => setEditingProduct(p)}>Sửa</button>
                                    <button className="delete-btn" onClick={() => handleDelete(p._id)}>Xóa</button>
                                </td>
                            </tr>

                        ))
                    ) : (
                        <tr>
                            <td colSpan="9" style={{ textAlign: "center" }}>Chưa có sản phẩm nào</td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div>
                <button className="back-home" onClick={() => window.history.back()}>← Quay lại</button>
            </div>
        </div>
    );
};

export default ManageProducts;
