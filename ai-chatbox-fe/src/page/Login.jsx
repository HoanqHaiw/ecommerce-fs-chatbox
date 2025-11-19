import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/userApi";
import "../scss/auth.scss";

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const handleLogin = async () => {
        try {
            const res = await loginUser({ email, password });
            localStorage.setItem("userToken", res.data.token);
            localStorage.setItem("userInfo", JSON.stringify(res.data.user));
            alert("Đăng nhập thành công!");
            navigate("/");
        } catch (err) {
            alert("Sai email hoặc mật khẩu!");
        }
    };

    return (
        <div className="auth-container">
            <h2>Đăng nhập</h2>

            <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
            />

            <input
                type="password"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />

            <button className="auth-btn" onClick={handleLogin}>Đăng nhập</button>
            <button className="auth-btn" onClick={() => navigate("/register")}>
                Đăng ký
            </button>
        </div>
    );
};

export default Login;
