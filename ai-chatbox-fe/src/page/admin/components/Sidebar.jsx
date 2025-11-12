import React from "react";
import { Link } from "react-router-dom";

const Sidebar = () => {
    return (
        <div className="admin-sidebar">
            <h2>ADMIN</h2>
            <ul>
                <li><Link to="/admin/dashboard">Dashboard</Link></li>
                <li><Link to="/admin/products">Products</Link></li>
                <li><Link to="/admin/orders">Orders</Link></li>
                <li><Link to="/admin/inventory">Inventory</Link></li>
                <li><Link to="/admin/revenue">Revenue</Link></li>
                <li><Link to="/admin/users">Users</Link></li>
            </ul>
        </div>
    );
};

export default Sidebar;
