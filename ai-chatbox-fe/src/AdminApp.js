import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginAdmin from "./page/admin/LoginAdmin";
import AdminDashboard from './page/admin/dashboard/AdminDashboard';
import ManageProducts from "./page/admin/products/ManageProducts";
import ManageOrders from "./page/admin/orders/ManageOrders";
import ManageInventory from "./page/admin/inventory/ManageInventory";
import ManageUsers from "./page/admin/users/ManageUsers";
import ManageRevenue from "./page/admin/revenue/ManageRevenue";

function AdminApp() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/admin/login" element={<LoginAdmin />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/products" element={<ManageProducts />} />
                <Route path="/admin/orders" element={<ManageOrders />} />
                <Route path="/admin/inventory" element={<ManageInventory />} />
                <Route path="/admin/revenue" element={<ManageRevenue />} />
                <Route path="/admin/users" element={<ManageUsers />} />
            </Routes>
        </BrowserRouter>
    );
}

export default AdminApp;
