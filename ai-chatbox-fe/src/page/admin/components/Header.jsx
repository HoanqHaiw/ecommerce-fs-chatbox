import React from "react";
import { useNavigate } from "react-router-dom";

const Header = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem("isAdmin");
        navigate("/admin/login");
    };

    return (
        <div className="admin-header">
            <h3>Dashboard Center</h3>
            <button onClick={handleLogout}>Logout</button>
        </div>
    );
};

export default Header;
