import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser } from "../api/userApi";
import "../scss/auth.scss";

const Register = () => {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        username: "",
        email: "",
        password: "",
        phone: ""
    });

    const handleRegister = async () => {
        try {
            await registerUser(form);
            alert("Đăng ký thành công!");
            navigate("/login");
        } catch (err) {
            alert("Lỗi đăng ký!");
        }
    };

    return (
        <div className="auth-container">
            <h2>Đăng ký</h2>

            <input
                placeholder="Tên đăng nhập"
                onChange={(e) => setForm({ ...form, username: e.target.value })}
            />

            <input
                type="email"
                placeholder="Email"
                onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <input
                type="password"
                placeholder="Mật khẩu"
                onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            {/* xac nhan mk */}
            <input
                type="password"
                placeholder="Xác nhận mật khẩu"
                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
            />

            <input
                type="text"
                placeholder="Số điện thoại"
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />

            <button className="auth-btn" onClick={handleRegister}>Tạo tài khoản</button>
            <button className="auth-btn" onClick={() => navigate("/login")}>
                Quay lại đăng nhập
            </button>
        </div>
    );
};

export default Register;
