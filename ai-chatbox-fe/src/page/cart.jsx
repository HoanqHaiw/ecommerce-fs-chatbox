import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";

import citiesData from "../data/tinh_tp.json";
import districtsData from "../data/quan_huyen.json";
import wardsData from "../data/xa_phuong.json";
import discountData from "../data/discounts.json";

const Cart = () => {
    const navigate = useNavigate();
    const { cartItems, decreaseQuantity, addToCart, removeFromCart, subtotal, clearCart } = useCart();

    // Địa chỉ
    const [cities, setCities] = useState([]);
    const [districts, setDistricts] = useState([]);
    const [wards, setWards] = useState([]);

    const [selectedCity, setSelectedCity] = useState("");
    const [selectedDistrict, setSelectedDistrict] = useState("");
    const [selectedWard, setSelectedWard] = useState("");

    const [specificAddress, setSpecificAddress] = useState("");
    const [name, setName] = useState("");
    const [phone, setPhone] = useState("");
    const [phoneError, setPhoneError] = useState("");

    // Thông báo
    const [message, setMessage] = useState({ type: "", text: "" });

    // Thanh toán
    const [paymentMethod, setPaymentMethod] = useState("cod");
    const [onlineMethod, setOnlineMethod] = useState("");
    const [showQR, setShowQR] = useState(false);

    // Mã giảm giá
    const [discountCode, setDiscountCode] = useState("");
    const [discountPercent, setDiscountPercent] = useState(0);

    useEffect(() => {
        setCities(Object.values(citiesData));
    }, []);

    // Xử lý chọn địa chỉ
    const handleCityChange = (e) => {
        const code = e.target.value;
        setSelectedCity(code);
        setSelectedDistrict("");
        setSelectedWard("");
        setDistricts([]);
        setWards([]);

        if (code) {
            const filteredDistricts = Object.values(districtsData).filter(
                (d) => String(d.parent_code) === String(code)
            );
            setDistricts(filteredDistricts);
        }
    };

    const handleDistrictChange = (e) => {
        const code = e.target.value;
        setSelectedDistrict(code);
        setSelectedWard("");
        setWards([]);

        if (code) {
            const filteredWards = Object.values(wardsData).filter(
                (w) => String(w.parent_code) === String(code)
            );
            setWards(filteredWards);
        }
    };

    const handleWardChange = (e) => {
        const code = e.target.value;
        setSelectedWard(code);
    };

    // SĐT
    const handlePhoneChange = (e) => {
        const value = e.target.value.replace(/\D/g, "");
        setPhone(value);
        if (value.length !== 10) {
            setPhoneError("Số điện thoại phải đủ 10 số");
        } else {
            setPhoneError("");
        }
    };

    // QR logo
    const getQRImage = () => {
        if (onlineMethod === "Momo")
            return "https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png";
        if (onlineMethod === "ZaloPay")
            return "https://upload.wikimedia.org/wikipedia/commons/3/3c/ZaloPay_Logo.png";
        if (onlineMethod === "VNPay")
            return "https://vnpayqr.vn/wp-content/uploads/2021/08/logo-vnpay-qr.svg";
        return "";
    };

    // Áp dụng mã giảm giá
    const handleApplyDiscount = () => {
        const found = discountData.find(
            (d) => d.code.toUpperCase() === discountCode.trim().toUpperCase()
        );
        if (found) {
            setDiscountPercent(found.discount);
            setMessage({ type: "success", text: `Áp dụng mã ${found.code} giảm ${found.discount}% thành công!` });
        } else {
            setDiscountPercent(0);
            setMessage({ type: "error", text: "Mã giảm giá không hợp lệ!" });
        }
    };

    // 🧾 Thanh toán
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (phoneError || phone.length !== 10) {
            setMessage({ type: "error", text: "Vui lòng nhập đúng số điện thoại!" });
            return;
        }

        if (!selectedCity || !selectedDistrict || !selectedWard) {
            setMessage({ type: "error", text: "Vui lòng chọn đầy đủ địa chỉ!" });
            return;
        }

        if (paymentMethod === "online" && !onlineMethod) {
            setMessage({ type: "error", text: "Vui lòng chọn ví điện tử!" });
            return;
        }

        if (paymentMethod === "online" && !showQR) {
            setShowQR(true);
            return;
        }

        const finalTotal = subtotal - (subtotal * discountPercent) / 100;

        try {
            const orderData = {
                name: name || "Khách hàng",
                total: finalTotal,
                status: "pending",
            };

            // Gửi đơn hàng lên backend
            const res = await fetch("http://localhost:5000/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderData),
            });

            if (!res.ok) throw new Error("Lỗi khi tạo đơn hàng");

            // Xoá giỏ hàng sau khi thanh toán
            clearCart();
            localStorage.removeItem("cartItems");

            setMessage({ type: "success", text: "✅ Thanh toán thành công!" });
            setTimeout(() => navigate("/"), 2000);
        } catch (error) {
            console.error("Lỗi khi tạo đơn hàng:", error);
            setMessage({ type: "error", text: "Đã xảy ra lỗi khi tạo đơn hàng!" });
        }
    };

    const finalTotal = subtotal - (subtotal * discountPercent) / 100;

    return (
        <div className="cart-page container py-5 position-relative">
            <div className="row">
                {/* 🛒 Giỏ hàng */}
                <div className="col-md-7">
                    <h4>Giỏ hàng của bạn</h4>
                    {cartItems.length === 0 ? (
                        <p>Giỏ hàng trống</p>
                    ) : (
                        cartItems.map((item) => (
                            <div key={item.id} className="cart-item d-flex align-items-center border-bottom py-3">
                                <img
                                    src={
                                        item.image?.startsWith("http")
                                            ? item.image
                                            : `http://localhost:5000/${item.image}`
                                    }
                                    alt={item.name}
                                    style={{ width: "100px", height: "auto" }}
                                />
                                <div className="ms-3 flex-grow-1">
                                    <h6>{item.name}</h6>
                                    <p>{item.price.toLocaleString()}₫</p>
                                    <div className="quantity d-flex align-items-center">
                                        <button
                                            onClick={() => decreaseQuantity(item.id)}
                                            className="btn btn-outline-secondary btn-sm"
                                        >
                                            -
                                        </button>
                                        <span className="mx-2">{item.quantity}</span>
                                        <button
                                            onClick={() => addToCart(item)}
                                            className="btn btn-outline-secondary btn-sm"
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => removeFromCart(item.id)}
                                >
                                    Xóa
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* 🧾 Form thanh toán */}
                <div className="col-md-5">
                    <h4>Thông tin thanh toán</h4>
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label>Họ tên</label>
                            <input
                                type="text"
                                className="form-control"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>

                        {/* Địa chỉ */}
                        <div className="mb-3">
                            <label>Tỉnh/Thành phố</label>
                            <select
                                className="form-select"
                                value={selectedCity}
                                onChange={handleCityChange}
                                required
                            >
                                <option value="">-- Chọn Tỉnh/Thành phố --</option>
                                {cities.map((city) => (
                                    <option key={city.code} value={city.code}>
                                        {city.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {districts.length > 0 && (
                            <div className="mb-3">
                                <label>Quận/Huyện</label>
                                <select
                                    className="form-select"
                                    value={selectedDistrict}
                                    onChange={handleDistrictChange}
                                    required
                                >
                                    <option value="">-- Chọn Quận/Huyện --</option>
                                    {districts.map((district) => (
                                        <option key={district.code} value={district.code}>
                                            {district.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {wards.length > 0 && (
                            <div className="mb-3">
                                <label>Phường/Xã</label>
                                <select
                                    className="form-select"
                                    value={selectedWard}
                                    onChange={handleWardChange}
                                    required
                                >
                                    <option value="">-- Chọn Phường/Xã --</option>
                                    {wards.map((ward) => (
                                        <option key={ward.code} value={ward.code}>
                                            {ward.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="mb-3">
                            <label>Địa chỉ cụ thể</label>
                            <input
                                type="text"
                                className="form-control"
                                value={specificAddress}
                                onChange={(e) => setSpecificAddress(e.target.value)}
                                required
                            />
                        </div>

                        <div className="mb-3">
                            <label>Số điện thoại</label>
                            <input
                                type="text"
                                className="form-control"
                                value={phone}
                                onChange={handlePhoneChange}
                                required
                            />
                            {phoneError && <small className="text-danger">{phoneError}</small>}
                        </div>

                        <div className="mb-3">
                            <label>Email</label>
                            <input type="email" className="form-control" required />
                        </div>

                        {/* 💳 Thanh toán */}
                        <div className="mb-3">
                            <label>Phương thức thanh toán</label>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name="payment"
                                    value="cod"
                                    checked={paymentMethod === "cod"}
                                    onChange={() => {
                                        setPaymentMethod("cod");
                                        setShowQR(false);
                                    }}
                                />
                                <label className="form-check-label">Thanh toán khi nhận hàng</label>
                            </div>
                            <div className="form-check">
                                <input
                                    className="form-check-input"
                                    type="radio"
                                    name="payment"
                                    value="online"
                                    checked={paymentMethod === "online"}
                                    onChange={() => setPaymentMethod("online")}
                                />
                                <label className="form-check-label">Thanh toán online</label>
                            </div>
                        </div>

                        {paymentMethod === "online" && (
                            <div className="mb-3">
                                <label>Chọn ví điện tử</label>
                                <select
                                    className="form-select"
                                    value={onlineMethod}
                                    onChange={(e) => setOnlineMethod(e.target.value)}
                                >
                                    <option value="">-- Chọn ví --</option>
                                    <option value="Momo">Momo</option>
                                    <option value="ZaloPay">ZaloPay</option>
                                    <option value="VNPay">VNPay</option>
                                </select>
                            </div>
                        )}

                        {showQR && paymentMethod === "online" && (
                            <div className="text-center mb-3">
                                <img
                                    src={getQRImage()}
                                    alt="QR thanh toán"
                                    style={{ width: 120, height: 120 }}
                                />
                                <p className="text-muted mt-2">
                                    Quét mã để thanh toán qua {onlineMethod}
                                </p>
                            </div>
                        )}

                        {/* 🎟️ Mã giảm giá */}
                        <div className="mb-3 d-flex align-items-center">
                            <input
                                type="text"
                                className="form-control me-2"
                                placeholder="Nhập mã giảm giá"
                                value={discountCode}
                                onChange={(e) => setDiscountCode(e.target.value)}
                            />
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleApplyDiscount}
                            >
                                Áp
                            </button>
                        </div>

                        {/* 🔔 Hiển thị thông báo */}
                        {message.text && (
                            <div
                                className={`alert mt-3 alert-${message.type === "error" ? "danger" : "success"
                                    }`}
                            >
                                {message.text}
                            </div>
                        )}

                        {/* Nút thanh toán */}
                        <div className="mt-4 d-flex justify-content-between align-items-center">
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={() => navigate(-1)}
                            >
                                ← Trở về
                            </button>
                            <button className="btn btn-success" type="submit">
                                Thanh toán
                            </button>
                        </div>

                        <div className="mt-3 text-end">
                            <p>Tạm tính: <strong>{subtotal.toLocaleString()}₫</strong></p>
                            {discountPercent > 0 && (
                                <p className="text-success">
                                    Giảm giá ({discountPercent}%): -
                                    {((subtotal * discountPercent) / 100).toLocaleString()}₫
                                </p>
                            )}
                            <p>
                                Tổng tiền: <strong>{finalTotal.toLocaleString()}₫</strong>
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Cart;
