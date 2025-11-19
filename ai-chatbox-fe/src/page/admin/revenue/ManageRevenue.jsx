// src/page/admin/revenue/ManageRevenue.js
import React, { useState, useEffect } from "react";
import {
    LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip,
    ResponsiveContainer, BarChart, Bar, Legend
} from "recharts";
import '../scssa/revenue.scss';

const ManageRevenue = () => {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");
    const [revenueData, setRevenueData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [stats, setStats] = useState({
        totalOrders: 0,
        totalRevenue: 0,
        averageRevenue: 0,
        completedOrders: 0
    });

    useEffect(() => {
        fetchRevenueData();
    }, []);

    const fetchRevenueData = async (start = "", end = "") => {
        try {
            setLoading(true);
            setError("");

            // Gọi API backend để lấy dữ liệu doanh thu
            const apiUrl = `http://localhost:5000/api/orders/revenue?startDate=${start}&endDate=${end}`;
            console.log(" Fetching revenue from:", apiUrl);

            const response = await fetch(apiUrl);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log(" Revenue data from backend:", data);

            if (data.success) {
                // Nếu backend có API revenue riêng
                setRevenueData(data.revenueData || []);
                setStats(data.stats || calculateStats(data.revenueData || []));
            } else {
                // Nếu backend trả về data trực tiếp
                setRevenueData(data || []);
                setStats(calculateStats(data || []));
            }

        } catch (error) {
            console.error(" Error fetching revenue data:", error);

            // Thử endpoint khác: lấy tất cả orders và tính toán
            await fetchAndCalculateFromOrders(start, end);
        } finally {
            setLoading(false);
        }
    };

    // Fallback: Lấy orders và tính toán doanh thu
    const fetchAndCalculateFromOrders = async (start = "", end = "") => {
        try {
            console.log(" Trying to calculate revenue from orders...");

            const ordersResponse = await fetch('http://localhost:5000/api/orders');
            if (!ordersResponse.ok) {
                throw new Error('Cannot fetch orders');
            }

            const ordersData = await ordersResponse.json();
            console.log(" Orders data for revenue calculation:", ordersData);

            // Xử lý dữ liệu orders thành revenue data
            const { revenueData, stats } = processOrdersToRevenue(ordersData, start, end);
            setRevenueData(revenueData);
            setStats(stats);

        } catch (error) {
            console.error(" Error calculating revenue from orders:", error);
            setError("Không thể kết nối đến server. Vui lòng thử lại sau.");
            setRevenueData([]);
            setStats({
                totalOrders: 0,
                totalRevenue: 0,
                averageRevenue: 0,
                completedOrders: 0
            });
        }
    };

    const processOrdersToRevenue = (ordersData, startDate = "", endDate = "") => {
        let ordersArray = [];

        // Xử lý cấu trúc response khác nhau
        if (Array.isArray(ordersData)) {
            ordersArray = ordersData;
        } else if (ordersData && Array.isArray(ordersData.orders)) {
            ordersArray = ordersData.orders;
        } else if (ordersData && Array.isArray(ordersData.data)) {
            ordersArray = ordersData.data;
        } else {
            console.warn(" Unexpected orders data structure:", ordersData);
            return {
                revenueData: [], stats: {
                    totalOrders: 0, totalRevenue: 0, averageRevenue: 0, completedOrders: 0
                }
            };
        }

        console.log(` Processing ${ordersArray.length} orders for revenue...`);

        // Lọc orders theo ngày nếu có
        let filteredOrders = ordersArray;
        if (startDate || endDate) {
            filteredOrders = ordersArray.filter(order => {
                const orderDate = new Date(order.createdAt || order.orderDate).toISOString().split('T')[0];
                return (!startDate || orderDate >= startDate) && (!endDate || orderDate <= endDate);
            });
        }

        // Nhóm orders theo ngày và tính doanh thu
        const revenueByDate = {};
        let totalRevenue = 0;
        let completedOrders = 0;

        filteredOrders.forEach(order => {
            // Chỉ tính các đơn đã hoàn thành và có tổng tiền
            if ((order.status === 'completed' || order.status === 'finished') && order.total) {
                const date = new Date(order.createdAt || order.orderDate).toISOString().split('T')[0];

                if (!revenueByDate[date]) {
                    revenueByDate[date] = {
                        revenue: 0,
                        orders: 0
                    };
                }

                revenueByDate[date].revenue += order.total;
                revenueByDate[date].orders += 1;
                totalRevenue += order.total;
                completedOrders++;
            }
        });

        // Chuyển đổi thành mảng cho biểu đồ
        const revenueData = Object.keys(revenueByDate)
            .map(date => ({
                date: formatDisplayDate(date),
                revenue: revenueByDate[date].revenue,
                orders: revenueByDate[date].orders,
                rawDate: date // Giữ để sort
            }))
            .sort((a, b) => new Date(a.rawDate) - new Date(b.rawDate));

        const stats = {
            totalOrders: filteredOrders.length,
            totalRevenue: totalRevenue,
            averageRevenue: completedOrders > 0 ? Math.round(totalRevenue / completedOrders) : 0,
            completedOrders: completedOrders
        };

        console.log(" Processed revenue data:", { revenueData, stats });
        return { revenueData, stats };
    };

    const calculateStats = (revenueData) => {
        const totalRevenue = revenueData.reduce((sum, item) => sum + (item.revenue || 0), 0);
        const totalOrders = revenueData.reduce((sum, item) => sum + (item.orders || 0), 0);

        return {
            totalOrders: totalOrders,
            totalRevenue: totalRevenue,
            averageRevenue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
            completedOrders: totalOrders
        };
    };

    const formatDisplayDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit'
        });
    };

    const handleFilter = () => {
        fetchRevenueData(startDate, endDate);
    };

    const handleReset = () => {
        setStartDate("");
        setEndDate("");
        fetchRevenueData();
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN').format(amount || 0) + '₫';
    };

    if (loading) {
        return (
            <div className="admin-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Đang tải dữ liệu doanh thu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="admin-container">
            <div className="admin-header">
                <h2>📊 Thống kê doanh thu</h2>
                <div className="header-actions">
                    <button className="refresh-btn" onClick={() => fetchRevenueData()}>
                        🔄 Làm mới
                    </button>
                </div>
            </div>

            {error && (
                <div className="error-message">
                    <span>⚠️ {error}</span>
                    <button onClick={() => fetchRevenueData()}>Thử lại</button>
                </div>
            )}

            {/* Bộ lọc */}
            <div className="filter-section revenue-filter">
                <div className="filter-group">
                    <label>Từ ngày:</label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                    />
                </div>

                <div className="filter-group">
                    <label>Đến ngày:</label>
                    <input
                        type="date"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                    />
                </div>

                <div className="filter-actions">
                    <button className="filter-btn" onClick={handleFilter}>
                        🔍 Lọc dữ liệu
                    </button>
                    <button className="reset-btn" onClick={handleReset}>
                        🔄 Reset
                    </button>
                </div>
            </div>

            {/* Thống kê tổng quan */}
            <div className="stats-grid">
                <div className="stat-card primary">
                    <div className="stat-icon">📦</div>
                    <div className="stat-content">
                        <h3>Tổng đơn hàng</h3>
                        <p className="stat-number">{stats.totalOrders}</p>
                        <small>{stats.completedOrders} đơn hoàn thành</small>
                    </div>
                </div>

                <div className="stat-card success">
                    <div className="stat-icon">💰</div>
                    <div className="stat-content">
                        <h3>Tổng doanh thu</h3>
                        <p className="stat-number">{formatCurrency(stats.totalRevenue)}</p>
                        <small>Doanh thu thực tế</small>
                    </div>
                </div>

                <div className="stat-card warning">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                        <h3>Doanh thu trung bình</h3>
                        <p className="stat-number">{formatCurrency(stats.averageRevenue)}</p>
                        <small>Trên mỗi đơn hàng</small>
                    </div>
                </div>

                <div className="stat-card info">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <h3>Tỷ lệ hoàn thành</h3>
                        <p className="stat-number">
                            {stats.totalOrders > 0
                                ? Math.round((stats.completedOrders / stats.totalOrders) * 100)
                                : 0
                            }%
                        </p>
                        <small>Đơn hàng thành công</small>
                    </div>
                </div>
            </div>

            {/* Biểu đồ doanh thu */}
            <div className="chart-section">
                <h3>📈 Biểu đồ doanh thu theo thời gian</h3>
                <div className="chart-container">
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis
                                dataKey="date"
                                stroke="#666"
                                fontSize={12}
                            />
                            <YAxis
                                stroke="#666"
                                fontSize={12}
                                tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                            />
                            <Tooltip
                                formatter={(value) => [formatCurrency(value), 'Doanh thu']}
                                labelFormatter={(label) => `Ngày: ${label}`}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="#667eea"
                                strokeWidth={3}
                                dot={{ fill: '#667eea', strokeWidth: 2, r: 4 }}
                                activeDot={{ r: 6, fill: '#764ba2' }}
                                name="Doanh thu"
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Biểu đồ số lượng đơn hàng */}
            {revenueData.length > 0 && (
                <div className="chart-section">
                    <h3>📦 Biểu đồ số lượng đơn hàng</h3>
                    <div className="chart-container">
                        <ResponsiveContainer width="100%" height={400}>
                            <BarChart data={revenueData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="date"
                                    stroke="#666"
                                    fontSize={12}
                                />
                                <YAxis
                                    stroke="#666"
                                    fontSize={12}
                                />
                                <Tooltip
                                    formatter={(value) => [value, 'Số đơn']}
                                    labelFormatter={(label) => `Ngày: ${label}`}
                                />
                                <Legend />
                                <Bar
                                    dataKey="orders"
                                    fill="#48bb78"
                                    radius={[4, 4, 0, 0]}
                                    name="Số đơn hàng"
                                />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Bảng chi tiết doanh thu */}
            <div className="revenue-table-section">
                <h3>📋 Chi tiết doanh thu</h3>
                <div className="table-container">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Ngày</th>
                                <th>Doanh thu</th>
                                <th>Số đơn hàng</th>
                                <th>Doanh thu trung bình</th>
                            </tr>
                        </thead>
                        <tbody>
                            {revenueData.length > 0 ? (
                                revenueData.map((item, index) => (
                                    <tr key={index}>
                                        <td>{item.date}</td>
                                        <td className="total-amount">{formatCurrency(item.revenue)}</td>
                                        <td>{item.orders}</td>
                                        <td>{formatCurrency(Math.round(item.revenue / item.orders))}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="no-data">
                                        <div className="empty-state">
                                            <p>📊 Không có dữ liệu doanh thu</p>
                                            <small>Không có đơn hàng nào trong khoảng thời gian này</small>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="admin-footer">
                <button className="back-home" onClick={() => window.history.back()}>
                    ← Quay lại
                </button>
            </div>
        </div>
    );
};

export default ManageRevenue;