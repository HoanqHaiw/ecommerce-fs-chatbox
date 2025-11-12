import React from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import '../scssa/admin.scss';


const AdminDashboard = () => {
    const navigate = useNavigate();

    React.useEffect(() => {
        const isAdmin = localStorage.getItem("isAdmin");
        if (!isAdmin) navigate("/admin/login");
    }, [navigate]);

    return (
        <div className="admin-layout">
            <Sidebar />
            <div className="admin-content">
                <Header />
                <div className="dashboard-main">
                    <h1>Welcome to Admin Dashboard</h1>
                    <div className="stats">
                        <div className="card">Total Products: 120</div>
                        <div className="card">Orders Today: 8</div>
                        <div className="card">New Users: 3</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
