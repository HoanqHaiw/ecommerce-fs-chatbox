import React, { useEffect, useState } from "react";
import "../scssa/admin.scss";
import {
    getOrders,
    updateOrderStatus,
    deleteOrder,
} from "../../../api/orderService";

const ManageOrders = () => {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            const data = await getOrders();
            setOrders(data || []);
        } catch (error) {
            console.error("❌ Error fetching orders:", error);
            setOrders([]);
        }
    };

    const handleStatusChange = async (id, status) => {
        try {
            await updateOrderStatus(id, status);
            fetchOrders();
        } catch (error) {
            console.error("❌ Error updating status:", error);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc muốn xóa đơn hàng này?")) {
            try {
                await deleteOrder(id);
                fetchOrders();
            } catch (error) {
                console.error("❌ Error deleting order:", error);
            }
        }
    };

    return (
        <div className="admin-container">
            <h2>Manage Orders</h2>
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>ID (MongoDB)</th>
                        <th>Customer Name</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Order Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.length > 0 ? (
                        orders.map((order) => (
                            // Dùng order._id làm key và ID hiển thị
                            <tr key={order._id}>
                                <td>{order._id}</td>
                                <td>{order.name || "No Name"}</td>
                                <td>{(order.total || 0).toLocaleString()}₫</td>
                                <td>
                                    <select
                                        value={order.status || "pending"}
                                        onChange={(e) =>
                                            handleStatusChange(order._id, e.target.value)
                                        }
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="processing">Processing</option>
                                        <option value="completed">Completed</option>
                                        <option value="cancelled">Cancelled</option>
                                    </select>
                                </td>
                                <td>
                                    {order.orderDate
                                        ? new Date(order.orderDate).toLocaleDateString('vi-VN')
                                        : "N/A"
                                    }
                                </td>
                                <td>
                                    <button
                                        className="details-btn"
                                        onClick={() => setSelectedOrder(order)}
                                    >
                                        Details
                                    </button>
                                    <button
                                        className="delete-btn"
                                        onClick={() => handleDelete(order._id)}
                                    >
                                        Xóa
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6" style={{ textAlign: "center" }}>
                                No orders found
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Chi tiết đơn hàng */}
            {selectedOrder && (
                <div className="order-detail">
                    <h3>Details of Order #{selectedOrder._id}</h3>

                    {(selectedOrder.items && selectedOrder.items.length > 0) ? (
                        <div>
                            <h4>Items:</h4>
                            <ul>
                                {selectedOrder.items.map((item, i) => (
                                    <li key={i}>
                                        {item.name || "Unknown product"} – Qty:{" "}
                                        {item.qty || item.quantity || 1} – Price:{" "}
                                        {(item.price || 0).toLocaleString()}₫
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <p>No items found for this order.</p>
                    )}

                    <p>
                        <strong>Total:</strong>{" "}
                        {(selectedOrder.total || 0).toLocaleString()}₫
                    </p>

                    <button className="close-btn" onClick={() => setSelectedOrder(null)}>Close</button>
                </div>
            )}

            <div>
                <button className="back-home" onClick={() => window.history.back()}>
                    ← Back
                </button>
            </div>
        </div>
    );
};

export default ManageOrders;