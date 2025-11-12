import React, { useState, useEffect } from "react";
import { getProducts, deleteProduct } from "../../../api/productService";
import AddProduct from "./AddProduct";
import EditProduct from "./EditProduct";
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
            console.error("Error loading products", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Are you sure you want to delete this product?")) {
            await deleteProduct(id);
            loadProducts();
        }
    };

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h2>Manage Products</h2>
                <button className="add-btn" onClick={() => setIsAdding(true)}>
                    + Add Product
                </button>
            </div>

            {/* Modal thêm / sửa */}
            {isAdding && <AddProduct onClose={() => setIsAdding(false)} onSave={loadProducts} />}
            {editingProduct && (
                <EditProduct
                    product={editingProduct}
                    onClose={() => setEditingProduct(null)}
                    onSave={loadProducts}
                />
            )}

            <table className="admin-table">
                <thead>
                    <tr>
                        <th>ID (MongoDB)</th>
                        <th>Name</th>
                        <th>Price</th>
                        <th>Category</th>
                        <th>Inventory</th>
                        <th>Size</th>
                        <th>Images</th>
                        <th>Description</th>
                        <th>Action</th>
                    </tr>
                </thead>
                <tbody>
                    {products.length > 0 ? (
                        products.map((p) => (
                            <tr key={p._id}>
                                {/* Hiển thị ID MongoDB */}
                                <td>{p._id}</td>
                                <td>{p.name}</td>
                                <td>{p.price?.toLocaleString()} đ</td>
                                <td>{p.category}</td>
                                <td>{p.stock}</td>
                                <td>{p.sizes?.map(s => `${s.size} (${s.quantity})`).join(", ")}</td>
                                <td>
                                    {p.images && p.images.length > 0 ? (
                                        p.images.map((img, i) => (
                                            <img
                                                key={i}
                                                src={`http://localhost:5000${img}`}
                                                alt={p.name}
                                                width="50"
                                                height="50"
                                                style={{
                                                    objectFit: "cover",
                                                    borderRadius: "4px",
                                                    marginRight: "5px"
                                                }}
                                            />
                                        ))
                                    ) : (
                                        <span>No Image</span>
                                    )}
                                </td>
                                <td className="desc">{p.description?.slice(0, 60)}...</td>
                                <td>
                                    <button className="edit-btn" onClick={() => setEditingProduct(p)}>
                                        Edit
                                    </button>
                                    <button className="delete-btn" onClick={() => handleDelete(p._id)}>
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="9" style={{ textAlign: "center" }}>
                                No Product
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            <div>
                <button className="back-home" onClick={() => window.history.back()}>
                    ← Back
                </button>
            </div>
        </div>
    );
};

export default ManageProducts;
