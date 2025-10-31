// src/page/admin/revenue/ManageRevenue.js
import React, { useState } from "react";
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import '../scssa/revenue.scss';

const ManageRevenue = () => {
    const [startDate, setStartDate] = useState("");
    const [endDate, setEndDate] = useState("");

    // Dữ liệu giả để hiển thị
    const mockRevenueData = [
        { date: "2025-10-01", revenue: 3200000 },
        { date: "2025-10-02", revenue: 4500000 },
        { date: "2025-10-03", revenue: 2800000 },
        { date: "2025-10-04", revenue: 5100000 },
        { date: "2025-10-05", revenue: 4200000 },
        { date: "2025-10-06", revenue: 6400000 },
    ];

    const totalOrders = 42;
    const totalRevenue = mockRevenueData.reduce((sum, item) => sum + item.revenue, 0);

    const handleFilter = () => {
        console.log("Lọc doanh thu từ", startDate, "đến", endDate);
        // Sau này sẽ gọi API backend để lọc dữ liệu thật
    };

    return (
        <div className="admin-page">
            <h2>Revenue Statistics</h2>

            <div className="filter-section">
                <label>From Date:</label>
                <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />

                <label>To Date:</label>
                <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />

                <button onClick={handleFilter}>Filter</button>
            </div>

            <div className="summary">
                <div className="card">
                    <h4>Total Orders</h4>
                    <p>{totalOrders}</p>
                </div>
                <div className="card">
                    <h4>Total Revenue</h4>
                    <p>{totalRevenue.toLocaleString()} VNĐ</p>
                </div>
                <div className="card">
                    <h4>Average Revenue</h4>
                    <p>{(totalRevenue / totalOrders).toLocaleString()} VNĐ / order</p>
                </div>
            </div>

            <div className="chart-container">
                <ResponsiveContainer width="100%" height={400}>
                    <LineChart data={mockRevenueData}>
                        <Line type="monotone" dataKey="revenue" stroke="#ff9800" strokeWidth={3} />
                        <CartesianGrid stroke="#ccc" strokeDasharray="5 5" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                    </LineChart>
                </ResponsiveContainer>
            </div>
            <div>
                <h3>Revenue Details</h3>
                <table className="revenue-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Revenue (VNĐ)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {mockRevenueData.map((item) => (
                            <tr key={item.date}>
                                <td>{item.date}</td>
                                <td>{item.revenue.toLocaleString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div>
                <button className="back-home" onClick={() => window.history.back()}>Back</button>
            </div>
        </div>
    );
};

export default ManageRevenue;
