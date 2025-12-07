import React, { useEffect, useState, useRef } from "react";
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
    const [autoConfirmEnabled, setAutoConfirmEnabled] = useState(true);
    const [autoPackEnabled, setAutoPackEnabled] = useState(true);
    const [autoConfirmTime, setAutoConfirmTime] = useState(5); // phút
    const [autoPackTime, setAutoPackTime] = useState(1440); // phút (24h = 1440 phút)
    const [timers, setTimers] = useState({});
    const timerRefs = useRef({});
    const intervalRef = useRef(null);

    useEffect(() => {
        fetchOrders();
        startAutoStatusCheck();
        return () => {
            stopAutoStatusCheck();
            clearAllTimers();
        };
    }, []);

    useEffect(() => {
        if (orders.length > 0) {
            setupAutoTimers();
        }
    }, [orders, autoConfirmEnabled, autoPackEnabled, autoConfirmTime, autoPackTime]);

    const startAutoStatusCheck = () => {
        intervalRef.current = setInterval(() => {
            checkAndUpdateOrderStatuses();
        }, 60000); // Kiểm tra mỗi 1 phút
    };

    const stopAutoStatusCheck = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }
    };

    const clearAllTimers = () => {
        Object.values(timerRefs.current).forEach(timer => {
            if (timer) clearTimeout(timer);
        });
        timerRefs.current = {};
    };

    const setupAutoTimers = () => {
        clearAllTimers();
        const newTimers = {};

        orders.forEach(order => {
            if (order.status === "pending" && autoConfirmEnabled) {
                const createdAt = new Date(order.createdAt);
                const now = new Date();
                const diffInMinutes = Math.floor((now - createdAt) / (1000 * 60));

                if (diffInMinutes >= autoConfirmTime) {
                    // Đã quá thời gian, tự động xác nhận ngay
                    autoConfirmOrder(order._id);
                } else {
                    // Lập lịch xác nhận
                    const remainingTime = (autoConfirmTime - diffInMinutes) * 60000;
                    const timerId = setTimeout(() => {
                        autoConfirmOrder(order._id);
                    }, remainingTime);

                    timerRefs.current[order._id] = timerId;
                    newTimers[order._id] = {
                        action: "confirm",
                        remaining: remainingTime,
                        targetTime: new Date(createdAt.getTime() + autoConfirmTime * 60000)
                    };
                }
            }

            if (order.status === "confirmed" && autoPackEnabled) {
                const createdAt = new Date(order.createdAt);
                const now = new Date();
                const diffInMinutes = Math.floor((now - createdAt) / (1000 * 60));

                if (diffInMinutes >= autoPackTime) {
                    // Đã quá thời gian, tự động đóng gói ngay
                    autoPackOrder(order._id);
                } else {
                    // Lập lịch đóng gói
                    const remainingTime = (autoPackTime - diffInMinutes) * 60000;
                    const timerId = setTimeout(() => {
                        autoPackOrder(order._id);
                    }, remainingTime);

                    timerRefs.current[order._id] = timerId;
                    newTimers[order._id] = {
                        action: "pack",
                        remaining: remainingTime,
                        targetTime: new Date(createdAt.getTime() + autoPackTime * 60000)
                    };
                }
            }
        });

        setTimers(newTimers);
    };

    const autoConfirmOrder = async (orderId) => {
        try {
            console.log(`🔄 Tự động xác nhận đơn hàng ${orderId}`);
            await updateOrderStatus(orderId, "confirmed");

            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order._id === orderId ? { ...order, status: "confirmed" } : order
                )
            );

            // Xóa timer sau khi đã xử lý
            if (timerRefs.current[orderId]) {
                clearTimeout(timerRefs.current[orderId]);
                delete timerRefs.current[orderId];
            }

            // Gửi thông báo
            showNotification(`Đơn hàng #${orderId.slice(-8).toUpperCase()} đã được tự động xác nhận`, "success");
        } catch (error) {
            console.error("❌ Lỗi tự động xác nhận đơn hàng:", error);
            showNotification(`Không thể tự động xác nhận đơn hàng ${orderId.slice(-8).toUpperCase()}`, "error");
        }
    };

    const autoPackOrder = async (orderId) => {
        try {
            console.log(`📦 Tự động đóng gói đơn hàng ${orderId}`);
            await updateOrderStatus(orderId, "packing");

            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order._id === orderId ? { ...order, status: "packing" } : order
                )
            );

            // Xóa timer sau khi đã xử lý
            if (timerRefs.current[orderId]) {
                clearTimeout(timerRefs.current[orderId]);
                delete timerRefs.current[orderId];
            }

            // Gửi thông báo
            showNotification(`Đơn hàng #${orderId.slice(-8).toUpperCase()} đã được tự động đóng gói`, "success");
        } catch (error) {
            console.error("❌ Lỗi tự động đóng gói đơn hàng:", error);
            showNotification(`Không thể tự động đóng gói đơn hàng ${orderId.slice(-8).toUpperCase()}`, "error");
        }
    };

    const checkAndUpdateOrderStatuses = async () => {
        if (!autoConfirmEnabled && !autoPackEnabled) return;

        const now = new Date();
        orders.forEach(order => {
            if (order.status === "pending" && autoConfirmEnabled) {
                const createdAt = new Date(order.createdAt);
                const diffInMinutes = Math.floor((now - createdAt) / (1000 * 60));

                if (diffInMinutes >= autoConfirmTime) {
                    autoConfirmOrder(order._id);
                }
            }

            if (order.status === "confirmed" && autoPackEnabled) {
                const createdAt = new Date(order.createdAt);
                const diffInMinutes = Math.floor((now - createdAt) / (1000 * 60));

                if (diffInMinutes >= autoPackTime) {
                    autoPackOrder(order._id);
                }
            }
        });
    };

    const showNotification = (message, type = "info") => {
        // Tạo thông báo tạm thời
        const notification = document.createElement("div");
        notification.className = `auto-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <span class="notification-icon">${type === "success" ? "✅" : "⚠️"}</span>
                <span class="notification-message">${message}</span>
                <button class="notification-close">&times;</button>
            </div>
        `;

        notification.querySelector(".notification-close").onclick = () => {
            notification.remove();
        };

        document.body.appendChild(notification);

        // Tự động xóa sau 5 giây
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    };

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
            setOrders(prevOrders =>
                prevOrders.map(order =>
                    order._id === id ? { ...order, status } : order
                )
            );

            await updateOrderStatus(id, status);
            console.log(`✅ Đã cập nhật database: ${id} -> ${status}`);

            // Reset timer nếu đã thay đổi trạng thái
            if (timerRefs.current[id]) {
                clearTimeout(timerRefs.current[id]);
                delete timerRefs.current[id];
            }

            // Setup lại timer nếu cần
            setupAutoTimers();
        } catch (error) {
            console.error("❌ Lỗi cập nhật database:", error);
            fetchOrders();
            alert("Không thể cập nhật trạng thái. Vui lòng thử lại.");
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm("Bạn có chắc muốn xóa đơn hàng này?")) {
            try {
                await deleteOrder(id);
                setOrders(prevOrders => prevOrders.filter(order => order._id !== id));
                console.log(`🗑️ Đã xóa đơn ${id} khỏi database`);

                // Xóa timer
                if (timerRefs.current[id]) {
                    clearTimeout(timerRefs.current[id]);
                    delete timerRefs.current[id];
                }
            } catch (error) {
                console.error("❌ Lỗi xóa database:", error);
                alert("Không thể xóa đơn hàng. Vui lòng thử lại.");
            }
        }
    };

    const getTimeRemaining = (orderId) => {
        const timer = timers[orderId];
        if (!timer) return null;

        const now = new Date();
        const diff = timer.targetTime - now;

        if (diff <= 0) return "Đang xử lý...";

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        return `${hours}h ${minutes}m ${seconds}s`;
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
            "packing": { class: "info", text: "Đang đóng gói" },
            "shipping": { class: "primary", text: "Đang giao hàng" },
            "completed": { class: "success", text: "Đã hoàn thành" },
            "cancelled": { class: "danger", text: "Đã hủy" }
        };
        return statusConfig[status] || { class: "secondary", text: status };
    };

    const handleAutoConfirmToggle = () => {
        setAutoConfirmEnabled(!autoConfirmEnabled);
        if (!autoConfirmEnabled) {
            showNotification("Đã bật tự động xác nhận đơn hàng", "success");
        } else {
            showNotification("Đã tắt tự động xác nhận đơn hàng", "info");
        }
    };

    const handleAutoPackToggle = () => {
        setAutoPackEnabled(!autoPackEnabled);
        if (!autoPackEnabled) {
            showNotification("Đã bật tự động đóng gói đơn hàng", "success");
        } else {
            showNotification("Đã tắt tự động đóng gói đơn hàng", "info");
        }
    };

    const getPendingOrdersCount = () => {
        return orders.filter(order => order.status === "pending").length;
    };

    const getConfirmedOrdersCount = () => {
        return orders.filter(order => order.status === "confirmed").length;
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
                <h2>📦 Quản lý đơn hàng</h2>
                <div className="header-actions">
                    <button className="refresh-btn" onClick={fetchOrders}>
                        🔄 Làm mới
                    </button>
                    <div className="order-count">
                        Tổng: <strong>{orders.length}</strong> đơn hàng
                    </div>
                </div>
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
                            <th>Thời gian còn lại</th>
                            <th>Ngày đặt</th>
                            <th>Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length > 0 ? (
                            orders.map((order) => {
                                const status = getStatusBadge(order.status);
                                const timeRemaining = getTimeRemaining(order._id);

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
                                            <div className="status-container">
                                                <select
                                                    className={`status-select status-${status.class}`}
                                                    value={order.status || "pending"}
                                                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                                                >
                                                    <option value="pending">Chờ xác nhận</option>
                                                    <option value="confirmed">Đã xác nhận</option>
                                                    <option value="packing">Đang đóng gói</option>
                                                    <option value="shipping">Đang giao hàng</option>
                                                    <option value="completed">Đã hoàn thành</option>
                                                    <option value="cancelled">Đã hủy</option>
                                                </select>
                                                {(order.status === "pending" || order.status === "confirmed") && timeRemaining && (
                                                    <div className="auto-timer">
                                                        <span className="timer-icon">⏰</span>
                                                        <span className="timer-text">{timeRemaining}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="time-remaining">
                                            {timeRemaining ? (
                                                <div className="remaining-time">
                                                    <span className="time-icon">⏳</span>
                                                    {timeRemaining}
                                                </div>
                                            ) : (
                                                <span className="no-timer">-</span>
                                            )}
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
                                <td colSpan="9" className="no-orders">
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

            {/* MODAL CHI TIẾT ĐƠN HÀNG */}
            {selectedOrder && (
                <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
                    <div className="order-detail-modal" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>📋 Chi tiết đơn hàng</h3>
                            <button className="close-btn" onClick={() => setSelectedOrder(null)}>
                                &times;
                            </button>
                        </div>

                        <div className="modal-body">
                            {/* Auto Status Info */}
                            {(selectedOrder.status === "pending" || selectedOrder.status === "confirmed") && (
                                <div className="auto-status-info">
                                    <div className="auto-status-item">
                                        <span className="auto-status-label">Tự động xác nhận:</span>
                                        <span className={`auto-status-value ${autoConfirmEnabled ? 'enabled' : 'disabled'}`}>
                                            {autoConfirmEnabled ? `Bật (${autoConfirmTime} phút)` : 'Tắt'}
                                        </span>
                                    </div>
                                    <div className="auto-status-item">
                                        <span className="auto-status-label">Tự động đóng gói:</span>
                                        <span className={`auto-status-value ${autoPackEnabled ? 'enabled' : 'disabled'}`}>
                                            {autoPackEnabled ? `Bật (${autoPackTime / 60} giờ)` : 'Tắt'}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Thông tin khách hàng */}
                            <div className="order-section">
                                <h4>👤 Thông tin khách hàng</h4>
                                <div className="info-grid">
                                    <div className="info-item">
                                        <span className="label">Mã đơn:</span>
                                        <span className="value">#{selectedOrder._id?.slice(-8).toUpperCase()}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="label">Khách hàng:</span>
                                        <span className="value">{selectedOrder.customerName || "N/A"}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="label">Email:</span>
                                        <span className="value">{selectedOrder.email || "N/A"}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="label">SĐT:</span>
                                        <span className="value">{selectedOrder.phone || "N/A"}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="label">Ngày đặt:</span>
                                        <span className="value">{formatDate(selectedOrder.createdAt)}</span>
                                    </div>
                                    <div className="info-item">
                                        <span className="label">Trạng thái:</span>
                                        <span className={`status-badge status-${getStatusBadge(selectedOrder.status).class}`}>
                                            {getStatusBadge(selectedOrder.status).text}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Địa chỉ giao hàng */}
                            {selectedOrder.address && (
                                <div className="order-section">
                                    <h4>📍 Địa chỉ giao hàng</h4>
                                    <div className="address-info">
                                        {selectedOrder.address.specific && <p>{selectedOrder.address.specific}</p>}
                                        {selectedOrder.address.ward && <p>Phường/Xã: {selectedOrder.address.ward}</p>}
                                        {selectedOrder.address.district && <p>Quận/Huyện: {selectedOrder.address.district}</p>}
                                        {selectedOrder.address.city && <p>Tỉnh/Thành phố: {selectedOrder.address.city}</p>}
                                    </div>
                                </div>
                            )}

                            {/* Sản phẩm trong đơn hàng */}
                            <div className="order-section">
                                <h4>🛒 Sản phẩm đã đặt</h4>
                                <div className="products-list">
                                    {selectedOrder.items && selectedOrder.items.length > 0 ? (
                                        <table className="products-table">
                                            <thead>
                                                <tr>
                                                    <th>STT</th>
                                                    <th>Sản phẩm</th>
                                                    <th>Size</th>
                                                    <th>Giá</th>
                                                    <th>Số lượng</th>
                                                    <th>Thành tiền</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {selectedOrder.items.map((item, index) => (
                                                    <tr key={index}>
                                                        <td>{index + 1}</td>
                                                        <td>
                                                            <div className="product-info">
                                                                {item.image && (
                                                                    <img
                                                                        src={item.image.startsWith('http') ? item.image : `http://localhost:5000${item.image}`}
                                                                        alt={item.name}
                                                                        className="product-image"
                                                                    />
                                                                )}
                                                                <span>{item.name}</span>
                                                            </div>
                                                        </td>
                                                        <td>{item.size || "N/A"}</td>
                                                        <td>{formatCurrency(item.price)}</td>
                                                        <td>{item.quantity}</td>
                                                        <td className="item-total">{formatCurrency(item.price * item.quantity)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <p className="no-items">Không có sản phẩm trong đơn hàng</p>
                                    )}
                                </div>
                            </div>

                            {/* Thông tin thanh toán */}
                            <div className="order-section">
                                <h4>💰 Thông tin thanh toán</h4>
                                <div className="payment-info">
                                    <div className="payment-row">
                                        <span className="label">Tạm tính:</span>
                                        <span className="value">{formatCurrency(selectedOrder.subtotal)}</span>
                                    </div>
                                    {selectedOrder.discount > 0 && (
                                        <div className="payment-row discount">
                                            <span className="label">Giảm giá ({selectedOrder.discount}%):</span>
                                            <span className="value">-{formatCurrency((selectedOrder.subtotal * selectedOrder.discount) / 100)}</span>
                                        </div>
                                    )}
                                    <div className="payment-row total">
                                        <span className="label">Tổng cộng:</span>
                                        <span className="value">{formatCurrency(selectedOrder.total)}</span>
                                    </div>
                                    <div className="payment-row">
                                        <span className="label">Phương thức:</span>
                                        <span className="value">
                                            {selectedOrder.paymentMethod === "cod"
                                                ? "Thanh toán khi nhận hàng (COD)"
                                                : `Thanh toán online (${selectedOrder.onlineMethod || selectedOrder.paymentMethod})`}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Ghi chú đơn hàng (nếu có) */}
                            {selectedOrder.note && (
                                <div className="order-section">
                                    <h4>📝 Ghi chú</h4>
                                    <p className="order-note">{selectedOrder.note}</p>
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button
                                className="close-modal-btn"
                                onClick={() => setSelectedOrder(null)}
                            >
                                Đóng
                            </button>
                        </div>
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