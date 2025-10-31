// src/page/admin/orders/ManageOrders.js
import React, { useEffect, useState } from "react";
import '../scssa/admin.scss';


import { getOrders, updateOrderStatus, deleteOrder } from "../../../api/orderService";

const ManageOrders = () => {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        const data = await getOrders();
        setOrders(data);
    };

    const handleStatusChange = async (id, status) => {
        await updateOrderStatus(id, status);
        fetchOrders();
    };

    const handleDelete = async (id) => {
        if (window.confirm("You want to delete this order?")) {
            await deleteOrder(id);
            fetchOrders();
        }
    };

    return (
        <div className="admin-container">
            <h2>Manage Orders</h2>
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Customer Name</th>
                        <th>Total</th>
                        <th>Status</th>
                        <th>Order Date</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {orders.map((order) => (
                        <tr key={order.id}>
                            <td>{order.id}</td>
                            <td>{order.customer}</td>
                            <td>{order.total.toLocaleString()}₫</td>
                            <td>
                                <select
                                    value={order.status}
                                    onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                >
                                    <option>Processing</option>
                                    <option>Shipping</option>
                                    <option>Completed</option>
                                    <option>Cancelled</option>
                                </select>
                            </td>
                            <td>{order.date}</td>
                            <td>
                                <button onClick={() => setSelectedOrder(order)}>Details</button>
                                <button onClick={() => handleDelete(order.id)}>Xóa</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Chi tiết đơn hàng */}
            {selectedOrder && (
                <div className="order-detail">
                    <h3>Details of Order #{selectedOrder.id}</h3>
                    <ul>
                        {selectedOrder.items.map((item, i) => (
                            <li key={i}>
                                {item.name} - Quantity: {item.qty} - Price: {item.price.toLocaleString()}₫
                            </li>
                        ))}
                    </ul>
                    <p>Total: {selectedOrder.total.toLocaleString()}₫</p>
                    <button onClick={() => setSelectedOrder(null)}>Close</button>
                </div>
            )}
            <div>
                <button className="back-home" onClick={() => window.history.back()}>Back</button>
            </div>
        </div>
    );
};

export default ManageOrders;
