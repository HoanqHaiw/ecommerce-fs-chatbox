import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./scssa/admin.scss";

const LoginAdmin = () => {
    const navigate = useNavigate();
    const [form, setForm] = useState({ username: "", password: "" });
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch("http://localhost:5000/api/admin/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const data = await res.json();
            if (data.success) {
                localStorage.setItem("isAdmin", true);
                navigate("/admin/dashboard");
            } else {
                setError(data.message);
            }
        } catch (err) {
            setError("Not connected to server");
        }
    };

    return (
        <div className="admin-login">
            <div className="login-box">
                <h2>Login Admin</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        name="username"
                        placeholder="Username"
                        value={form.username}
                        onChange={handleChange}
                        required
                    />
                    <input
                        type="password"
                        name="password"
                        placeholder="Password"
                        value={form.password}
                        onChange={handleChange}
                        required
                    />
                    {error && <p className="error">{error}</p>}
                    <button type="submit">Login</button>
                </form>
            </div>
        </div>
    );
};

export default LoginAdmin;
