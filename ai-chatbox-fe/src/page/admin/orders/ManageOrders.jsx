import React, { useEffect, useState } from "react";
import "../scssa/manageOrder.scss";
import {
    getOrders,
    updateOrderStatus,
    deleteOrder,
} from "../../../api/orderService";

const ManageOrders = () => {
    const [orders, setOrders] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        fetchOrders();
    }, []);

    const fetchOrders = async () => {
        try {
            setLoading(true);
            setError("");
            const data = await getOrders();
            setOrders(data || []);
        } catch (error) {
            console.error("❌ Error fetching orders:", error);
            setError("Không thể tải danh sách đơn hàng");
            setOrders([]);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id, status) => {
        try {
            // Cập nhật local state trước cho mượt
            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order._id === id ? { ...order, status } : order
                )
            );

            await updateOrderStatus(id, status);

            console.log(` Đã cập nhật database: ${id} -> ${status}`);
        } catch (error) {
            console.error(" Lỗi cập nhật database:", error);
            // Revert changes nếu API fail
            fetchOrders(); // Load lại data từ server
            alert("Không thể cập nhật trạng thái. Vui lòng thử lại.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc muốn xóa đơn hàng này?")) {
            try {
                // GỌI API THẬT - XÓA TRONG DATABASE
                await deleteOrder(id);

                // Xóa khỏi local state sau khi API thành công
                setOrders(prevOrders => prevOrders.filter(order => order._id !== id));

                console.log(` Đã xóa đơn ${id} khỏi database`);
            } catch (error) {
                console.error(" Lỗi xóa database:", error);
                alert("Không thể xóa đơn hàng. Vui lòng thử lại.");
            }
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN').format(amount || 0) + '₫';
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString("vi-VN", {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusBadge = (status) => {
        const statusConfig = {
            "pending": { class: "warning", text: "Chờ xác nhận" },
            "confirmed": { class: "primary", text: "Đã xác nhận" },
            "shipping": { class: "primary", text: "Đang giao hàng" },
            "completed": { class: "success", text: "Đã hoàn thành" },
            "cancelled": { class: "danger", text: "Đã hủy" }
        };
        return statusConfig[status] || { class: "secondary", text: status };
    };

    if (loading) {
        return (
            <div className="admin-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Đang tải danh sách đơn hàng...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h2>Quản lý đơn hàng</h2>
                <div className="header-actions">
                    <button className="refresh-btn" onClick={fetchOrders}>
                        🔄 Làm mới
                    </button>
                    <div className="order-count">
                        Tổng: <strong>{orders.length}</strong> đơn hàng
                    </div>
                </div>
            </div>

            <div style={{ background: '#e8f5e8', padding: '10px', borderRadius: '5px', marginBottom: '15px' }}>
                <strong>Chế độ thật:</strong> Thay đổi sẽ được lưu vào database
            </div>

            {error && (
                <div className="error-message">
                    <span>{error}</span>
                    <button onClick={fetchOrders}>Thử lại</button>
                </div>
            )}

            <div className="table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Mã đơn</th>
                            <th>Khách hàng</th>
                            <th>Email</th>
                            <th>SĐT</th>
                            <th>Tổng tiền</th>
                            <th>Trạng thái</th>
                            <th>Ngày đặt</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length > 0 ? (
                            orders.map((order) => {
                                const status = getStatusBadge(order.status);
                                return (
                                    <tr key={order._id}>
                                        <td className="order-id">#{order._id?.slice(-8).toUpperCase()}</td>
                                        <td>
                                            <div className="customer-info">
                                                <strong>{order.customerName || "N/A"}</strong>
                                            </div>
                                        </td>
                                        <td>
                                            <div className="email-info">
                                                {order.email || "N/A"}
                                            </div>
                                        </td>
                                        <td>{order.phone || "N/A"}</td>
                                        <td className="total-amount">{formatCurrency(order.total)}</td>
                                        <td>
                                            <select
                                                className={`status-select status-${status.class}`}
                                                value={order.status || "pending"}
                                                onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                            >
                                                <option value="pending">Chờ xác nhận</option>
                                                <option value="confirmed">Đã xác nhận</option>
                                                <option value="shipping">Đang giao hàng</option>
                                                <option value="completed">Đã hoàn thành</option>
                                                <option value="cancelled">Đã hủy</option>
                                            </select>
                                        </td>
                                        <td className="order-date">{formatDate(order.createdAt)}</td>
                                        <td>
                                            <div className="action-buttons">
                                                <button
                                                    className="details-btn"
                                                    onClick={() => setSelectedOrder(order)}
                                                >
                                                    👁️ Chi tiết
                                                </button>
                                                <button
                                                    className="delete-btn"
                                                    onClick={() => handleDelete(order._id)}
                                                >
                                                    🗑️ Xóa
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        ) : (
                            <tr>
                                <td colSpan="8" className="no-orders">
                                    <div className="empty-state">
                                        <p>📦 Không có đơn hàng nào</p>
                                        <small>Chưa có đơn hàng nào được tạo trong hệ thống</small>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal chi tiết đơn hàng - GIỮ NGUYÊN */}
            {selectedOrder && (
                <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
                    <div className="order-detail-modal" onClick={(e) => e.stopPropagation()}>
                        {/* ... giữ nguyên modal content ... */}
                    </div>
                </div>
            )}

            <div className="admin-footer">
                <button className="back-home" onClick={() => window.history.back()}>
                    ← Quay lại
                </button>
            </div>
        </div>
    );
};

export default ManageOrders;