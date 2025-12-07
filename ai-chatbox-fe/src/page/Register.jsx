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
        confirmPassword: "",
        phone: ""
    });

    const [errors, setErrors] = useState({});
    const [touched, setTouched] = useState({});

    const validateForm = () => {
        const newErrors = {};


        if (!form.username.trim()) {
            newErrors.username = "Tên đăng nhập là bắt buộc";
        } else if (form.username.length < 3) {
            newErrors.username = "Tên đăng nhập phải có ít nhất 3 ký tự";
        }

        if (!form.email.trim()) {
            newErrors.email = "Email là bắt buộc";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
            newErrors.email = "Email phải có định dạng hợp lệ (ví dụ: user@example.com)";
        }


        if (!form.password) {
            newErrors.password = "Mật khẩu là bắt buộc";
        } else if (form.password.length < 6) {
            newErrors.password = "Mật khẩu phải có ít nhất 6 ký tự";
        }


        if (!form.confirmPassword) {
            newErrors.confirmPassword = "Xác nhận mật khẩu là bắt buộc";
        } else if (form.password !== form.confirmPassword) {
            newErrors.confirmPassword = "Mật khẩu không khớp";
        }


        if (!form.phone.trim()) {
            newErrors.phone = "Số điện thoại là bắt buộc";
        } else if (!/^(0[3|5|7|8|9])[0-9]{8}$/.test(form.phone)) {
            newErrors.phone = "Số điện thoại phải có 10 số và bắt đầu bằng 0 (ví dụ: 0987654321)";
        }

        return newErrors;
    };


    const handleBlur = (field) => {
        setTouched({ ...touched, [field]: true });
        const newErrors = validateForm();
        setErrors(newErrors);
    };


    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm({ ...form, [name]: value });


        if (errors[name]) {
            setErrors({ ...errors, [name]: "" });
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        const newErrors = validateForm();
        setErrors(newErrors);
        setTouched({
            username: true,
            email: true,
            password: true,
            confirmPassword: true,
            phone: true
        });

        if (Object.keys(newErrors).length > 0) {
            alert("Vui lòng sửa các lỗi trước khi đăng ký!");
            return;
        }

        try {
            const { confirmPassword, ...userData } = form;
            await registerUser(userData);
            alert("Đăng ký thành công!");
            navigate("/login");
        } catch (err) {
            alert(err.response?.data?.message || "Lỗi đăng ký! Vui lòng thử lại.");
        }
    };

    const isFormValid = () => {
        return (
            form.username.trim() &&
            form.email.trim() &&
            form.password.length >= 6 &&
            form.confirmPassword &&
            form.password === form.confirmPassword &&
            /^(0[3|5|7|8|9])[0-9]{8}$/.test(form.phone) &&
            !errors.username &&
            !errors.email &&
            !errors.password &&
            !errors.confirmPassword &&
            !errors.phone
        );
    };

    return (
        <div className="auth-container">
            <h2>Đăng ký</h2>

            <form onSubmit={handleRegister}>
                {/* Username field */}
                <div className="form-group">
                    <input
                        name="username"
                        placeholder="Tên đăng nhập *"
                        value={form.username}
                        onChange={handleChange}
                        onBlur={() => handleBlur("username")}
                        className={errors.username && touched.username ? "error" : ""}
                    />
                    {errors.username && touched.username && (
                        <div className="error-message">{errors.username}</div>
                    )}
                </div>

                {/* Email field */}
                <div className="form-group">
                    <input
                        name="email"
                        type="email"
                        placeholder="Email *"
                        value={form.email}
                        onChange={handleChange}
                        onBlur={() => handleBlur("email")}
                        className={errors.email && touched.email ? "error" : ""}
                    />
                    {errors.email && touched.email && (
                        <div className="error-message">{errors.email}</div>
                    )}
                </div>

                {/* Password field */}
                <div className="form-group">
                    <input
                        name="password"
                        type="password"
                        placeholder="Mật khẩu (ít nhất 6 ký tự) *"
                        value={form.password}
                        onChange={handleChange}
                        onBlur={() => handleBlur("password")}
                        className={errors.password && touched.password ? "error" : ""}
                    />
                    {errors.password && touched.password && (
                        <div className="error-message">{errors.password}</div>
                    )}
                </div>

                {/* Confirm Password field */}
                <div className="form-group">
                    <input
                        name="confirmPassword"
                        type="password"
                        placeholder="Xác nhận mật khẩu *"
                        value={form.confirmPassword}
                        onChange={handleChange}
                        onBlur={() => handleBlur("confirmPassword")}
                        className={errors.confirmPassword && touched.confirmPassword ? "error" : ""}
                    />
                    {errors.confirmPassword && touched.confirmPassword && (
                        <div className="error-message">{errors.confirmPassword}</div>
                    )}
                </div>

                {/* Phone field */}
                <div className="form-group">
                    <input
                        name="phone"
                        type="text"
                        placeholder="Số điện thoại (ví dụ: 0987654321) *"
                        value={form.phone}
                        onChange={handleChange}
                        onBlur={() => handleBlur("phone")}
                        className={errors.phone && touched.phone ? "error" : ""}
                    />
                    {errors.phone && touched.phone && (
                        <div className="error-message">{errors.phone}</div>
                    )}
                </div>

                <button
                    type="submit"
                    className={`auth-btn ${!isFormValid() ? "disabled" : ""}`}
                    disabled={!isFormValid()}
                >
                    Tạo tài khoản
                </button>
            </form>

            <button
                className="auth-btn secondary"
                onClick={() => navigate("/login")}
            >
                Quay lại đăng nhập
            </button>
        </div>
    );
};

export default Register;