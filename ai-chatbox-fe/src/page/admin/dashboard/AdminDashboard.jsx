import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import axios from "axios";
import "../scssa/admin.scss";
import "../scssa/dashboard.scss";

const AdminDashboard = () => {
    const navigate = useNavigate();

    const [stats, setStats] = useState({
        totalProducts: 0,
        ordersToday: 0,
        newUsers: 0,
        lowStockProducts: 0,
        totalRevenue: 0,
    });

    const [recentOrders, setRecentOrders] = useState([]);
    const [recentUsers, setRecentUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Check admin
    useEffect(() => {
        const isAdmin = localStorage.getItem("isAdmin");
        if (!isAdmin) navigate("/admin/login");
    }, [navigate]);

    // Fetch dashboard data
    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        try {
            setLoading(true);
            setError("");

            // Sử dụng Promise.all để gọi nhiều API cùng lúc
            const [productsRes, ordersRes, usersRes] = await Promise.allSettled([
                axios.get("http://localhost:5000/api/products"),
                axios.get("http://localhost:5000/api/orders"),
                axios.get("http://localhost:5000/api/users")
            ]);

            console.log("📊 API Responses:", { productsRes, ordersRes, usersRes });

            // Kiểm tra lỗi từ các API
            const errors = [];
            let products = [];
            let orders = [];
            let users = [];

            // Xử lý products response
            if (productsRes.status === 'fulfilled') {
                const productsData = productsRes.value.data;
                if (Array.isArray(productsData)) {
                    products = productsData;
                } else if (productsData && Array.isArray(productsData.products)) {
                    products = productsData.products;
                } else if (productsData && Array.isArray(productsData.data)) {
                    products = productsData.data;
                } else {
                    errors.push("Không thể lấy dữ liệu sản phẩm");
                }
            } else {
                errors.push("Lỗi kết nối API sản phẩm");
            }

            // Xử lý orders response
            if (ordersRes.status === 'fulfilled') {
                const ordersData = ordersRes.value.data;
                if (Array.isArray(ordersData)) {
                    orders = ordersData;
                } else if (ordersData && Array.isArray(ordersData.orders)) {
                    orders = ordersData.orders;
                } else if (ordersData && Array.isArray(ordersData.data)) {
                    orders = ordersData.data;
                } else {
                    errors.push("Không thể lấy dữ liệu đơn hàng");
                }
            } else {
                errors.push("Lỗi kết nối API đơn hàng");
            }

            // Xử lý users response
            if (usersRes.status === 'fulfilled') {
                const usersData = usersRes.value.data;
                if (Array.isArray(usersData)) {
                    users = usersData;
                } else if (usersData && Array.isArray(usersData.users)) {
                    users = usersData.users;
                } else if (usersData && Array.isArray(usersData.data)) {
                    users = usersData.data;
                } else {
                    errors.push("Không thể lấy dữ liệu người dùng");
                }
            } else {
                errors.push("Lỗi kết nối API người dùng");
            }

            // Nếu có lỗi từ các API
            if (errors.length > 0) {
                setError(errors.join(". "));

            }


            const today = new Date().toISOString().split('T')[0];

            const ordersToday = orders.filter(order => {
                if (!order.createdAt && !order.orderDate) return false;
                const orderDate = new Date(order.createdAt || order.orderDate).toISOString().split('T')[0];
                return orderDate === today;
            });


            const newUsersToday = users.filter(user => {
                if (!user.createdAt && !user.registeredAt) return false;
                const userDate = new Date(user.createdAt || user.registeredAt).toISOString().split('T')[0];
                return userDate === today;
            });


            const lowStockProducts = products.filter(p => {
                const stock = p.stock || p.quantity || 0;
                const minStock = p.minStock || 10;
                return stock <= minStock;
            }).length;

            const totalRevenue = orders
                .filter(order => (order.status === 'completed' || order.status === 'finished') && order.total)
                .reduce((sum, order) => sum + (order.total || 0), 0);

            const sortedOrders = [...orders]
                .sort((a, b) => {
                    const dateA = new Date(a.createdAt || a.orderDate || 0);
                    const dateB = new Date(b.createdAt || b.orderDate || 0);
                    return dateB - dateA;
                })
                .slice(0, 5)
                .map(order => ({
                    _id: order._id,
                    customerName: order.customerName || order.name || "Khách hàng",
                    total: order.total || 0,
                    status: order.status || "pending",
                    createdAt: order.createdAt || order.orderDate,
                    email: order.email || "",
                    phone: order.phone || ""
                }));

            // Lấy 5 users gần nhất
            const sortedUsers = [...users]
                .sort((a, b) => {
                    const dateA = new Date(a.createdAt || a.registeredAt || 0);
                    const dateB = new Date(b.createdAt || b.registeredAt || 0);
                    return dateB - dateA;
                })
                .slice(0, 5)
                .map(user => ({
                    _id: user._id,
                    name: user.name || user.username || "Người dùng",
                    email: user.email || "",
                    createdAt: user.createdAt || user.registeredAt
                }));

            // Cập nhật state với dữ liệu từ backend
            setStats({
                totalProducts: products.length,
                ordersToday: ordersToday.length,
                newUsers: newUsersToday.length,
                lowStockProducts: lowStockProducts,
                totalRevenue: totalRevenue,
            });

            setRecentOrders(sortedOrders);
            setRecentUsers(sortedUsers);

        } catch (error) {
            console.error("❌ Lỗi load dashboard:", error);
            setError("Không thể kết nối đến server. Vui lòng kiểm tra kết nối và thử lại.");

            // Đặt dữ liệu rỗng thay vì mock data
            setStats({
                totalProducts: 0,
                ordersToday: 0,
                newUsers: 0,
                lowStockProducts: 0,
                totalRevenue: 0,
            });
            setRecentOrders([]);
            setRecentUsers([]);
        } finally {
            setLoading(false);
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
            "confirmed": { class: "info", text: "Đã xác nhận" },
            "packing": { class: "primary", text: "Đang đóng gói" },
            "shipping": { class: "primary", text: "Đang giao hàng" },
            "completed": { class: "success", text: "Đã hoàn thành" },
            "cancelled": { class: "danger", text: "Đã hủy" }
        };
        return statusConfig[status] || { class: "secondary", text: status };
    };

    if (loading) {
        return (
            <div className="admin-layout">
                <Sidebar />
                <div className="admin-content">
                    <Header />
                    <div className="dashboard-main">
                        <div className="loading-spinner">
                            <div className="spinner"></div>
                            <p>Đang tải dữ liệu dashboard...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-layout">
            <Sidebar />
            <div className="admin-content">
                <Header />
                <div className="dashboard-main">
                    <div className="dashboard-header">
                        <h1>📊 Dashboard Quản trị</h1>
                        <button className="refresh-btn" onClick={fetchDashboard}>
                            🔄 Làm mới
                        </button>
                    </div>

                    {error && (
                        <div className="error-message">
                            <span>⚠️ {error}</span>
                            <button onClick={fetchDashboard}>Thử lại</button>
                        </div>
                    )}

                    {/* Stats Cards */}
                    <div className="stats-grid">
                        <div className="stat-card primary">
                            <div className="stat-icon">📦</div>
                            <div className="stat-content">
                                <h3>Tổng sản phẩm</h3>
                                <p className="stat-number">{stats.totalProducts}</p>
                                <small>Sản phẩm trong hệ thống</small>
                            </div>
                        </div>

                        <div className="stat-card success">
                            <div className="stat-icon">🛒</div>
                            <div className="stat-content">
                                <h3>Đơn hàng hôm nay</h3>
                                <p className="stat-number">{stats.ordersToday}</p>
                                <small>Đơn hàng mới</small>
                            </div>
                        </div>

                        <div className="stat-card warning">
                            <div className="stat-icon">👥</div>
                            <div className="stat-content">
                                <h3>Người dùng mới</h3>
                                <p className="stat-number">{stats.newUsers}</p>
                                <small>Đăng ký hôm nay</small>
                            </div>
                        </div>

                        <div className="stat-card danger">
                            <div className="stat-icon">⚠️</div>
                            <div className="stat-content">
                                <h3>Sắp hết hàng</h3>
                                <p className="stat-number">{stats.lowStockProducts}</p>
                                <small>Cần nhập thêm</small>
                            </div>
                        </div>

                        <div className="stat-card info">
                            <div className="stat-icon">💰</div>
                            <div className="stat-content">
                                <h3>Tổng doanh thu</h3>
                                <p className="stat-number">{formatCurrency(stats.totalRevenue)}</p>
                                <small>Doanh thu tích lũy</small>
                            </div>
                        </div>
                    </div>

                    {/* Recent Orders và Users */}
                    <div className="dashboard-sections">
                        {/* Recent Orders */}
                        <div className="recent-section">
                            <div className="section-header">
                                <h3>📋 Đơn hàng gần đây</h3>
                                <button
                                    className="view-all-btn"
                                    onClick={() => navigate('/admin/orders')}
                                >
                                    Xem tất cả →
                                </button>
                            </div>
                            <div className="table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Mã đơn</th>
                                            <th>Khách hàng</th>
                                            <th>Tổng tiền</th>
                                            <th>Trạng thái</th>
                                            <th>Ngày đặt</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentOrders.length > 0 ? (
                                            recentOrders.map((order) => {
                                                const status = getStatusBadge(order.status);
                                                return (
                                                    <tr key={order._id}>
                                                        <td className="order-id">#{order._id?.slice(-8).toUpperCase()}</td>
                                                        <td>
                                                            <div className="customer-info">
                                                                <strong>{order.customerName}</strong>
                                                                <small>{order.email}</small>
                                                            </div>
                                                        </td>
                                                        <td className="total-amount">{formatCurrency(order.total)}</td>
                                                        <td>
                                                            <span className={`status-badge status-${status.class}`}>
                                                                {status.text}
                                                            </span>
                                                        </td>
                                                        <td className="order-date">{formatDate(order.createdAt)}</td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan="5" className="no-data">
                                                    <div className="empty-state">
                                                        <p>📦 Chưa có đơn hàng nào</p>
                                                        <small>Không có đơn hàng gần đây</small>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Recent Users */}
                        <div className="recent-section">
                            <div className="section-header">
                                <h3>👥 Người dùng mới</h3>
                                <button
                                    className="view-all-btn"
                                    onClick={() => navigate('/admin/users')}
                                >
                                    Xem tất cả →
                                </button>
                            </div>
                            <div className="table-container">
                                <table className="admin-table">
                                    <thead>
                                        <tr>
                                            <th>Tên</th>
                                            <th>Email</th>
                                            <th>Ngày tham gia</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {recentUsers.length > 0 ? (
                                            recentUsers.map((user) => (
                                                <tr key={user._id}>
                                                    <td>
                                                        <div className="user-info">
                                                            <strong>{user.name}</strong>
                                                        </div>
                                                    </td>
                                                    <td className="email-info">{user.email}</td>
                                                    <td className="order-date">{formatDate(user.createdAt)}</td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="3" className="no-data">
                                                    <div className="empty-state">
                                                        <p>👤 Chưa có người dùng nào</p>
                                                        <small>Không có người dùng mới</small>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;