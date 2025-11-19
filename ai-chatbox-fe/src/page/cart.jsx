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

    // Kiểm tra đăng nhập
    const [user, setUser] = useState(null);

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
        // Load user info từ localStorage
        const userInfo = localStorage.getItem("userInfo");
        if (userInfo) {
            setUser(JSON.parse(userInfo));
            const userData = JSON.parse(userInfo);
            setName(userData.username || "");
        }

        setCities(Object.values(citiesData));
    }, []);

    // Xử lý chọn địa chỉ
    const handleCityChange = (e) => {
        if (!user) return;

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
        if (!user) return;

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
        if (!user) return;
        setSelectedWard(e.target.value);
    };

    const handlePhoneChange = (e) => {
        if (!user) return;

        const value = e.target.value.replace(/\D/g, "");
        setPhone(value);
        if (value.length !== 10) {
            setPhoneError("Số điện thoại phải đủ 10 số");
        } else {
            setPhoneError("");
        }
    };


    const getQRImage = () => {
        if (onlineMethod === "Momo")
            return "https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png";
        if (onlineMethod === "ZaloPay")
            return "https://upload.wikimedia.org/wikipedia/commons/3/3c/ZaloPay_Logo.png";
        if (onlineMethod === "VNPay")
            return "https://vnpayqr.vn/wp-content/uploads/2021/08/logo-vnpay-qr.svg";
        return "";
    };


    const handleApplyDiscount = () => {
        if (!user) {
            setMessage({ type: "error", text: "Bạn cần đăng nhập để sử dụng mã giảm giá!" });
            return;
        }

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


    const handleLoginToCheckout = () => {
        setMessage({ type: "info", text: "Đang chuyển hướng đến trang đăng nhập..." });
        setTimeout(() => {
            navigate("/login");
        }, 1000);
    };


    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation
        if (!name || !phone || phone.length !== 10) {
            setMessage({ type: "error", text: "Vui lòng nhập đầy đủ thông tin và số điện thoại hợp lệ" });
            return;
        }

        if (!selectedCity || !selectedDistrict || !selectedWard || !specificAddress) {
            setMessage({ type: "error", text: "Vui lòng nhập đầy đủ địa chỉ giao hàng" });
            return;
        }

        const finalTotal = subtotal - (subtotal * discountPercent) / 100;

        try {

            const orderData = {
                customerName: name,
                phone: phone,
                email: user?.email || "",
                address: {
                    city: cities.find(c => c.code === selectedCity)?.name,
                    district: districts.find(d => d.code === selectedDistrict)?.name,
                    ward: wards.find(w => w.code === selectedWard)?.name,
                    specific: specificAddress
                },
                items: cartItems.map(item => ({
                    productId: item.id || item._id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    image: item.image,
                    size: item.size,
                    color: item.color
                })),
                subtotal: subtotal,
                discount: discountPercent,
                total: finalTotal,
                paymentMethod: paymentMethod
            };

            console.log("=== FRONTEND: Sending SIMPLE order data ===");
            console.log("Order data:", orderData);

            // Gửi đơn hàng
            const res = await fetch("http://localhost:5000/api/orders", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(orderData),
            });

            console.log("Response status:", res.status);

            if (!res.ok) {
                const errorText = await res.text();
                console.log("Error response:", errorText);
                throw new Error(`Lỗi khi tạo đơn hàng: ${res.status} - ${errorText}`);
            }

            const result = await res.json();
            console.log(" Order created successfully:", result);

            // Xóa giỏ hàng
            clearCart();
            localStorage.removeItem("cartItems");

            setMessage({
                type: "success",
                text: ` Đặt hàng thành công! Mã đơn: ${result.order._id}`
            });

            // Chuyển hướng sau 2 giây
            setTimeout(() => {
                navigate("/check-order");
            }, 2000);

        } catch (error) {
            console.error(" Lỗi khi tạo đơn hàng:", error);
            setMessage({
                type: "error",
                text: error.message
            });
        }
    };

    const finalTotal = subtotal - (subtotal * discountPercent) / 100;

    return (
        <div className="cart-page container py-5 position-relative">
            <div className="row">
                {/*  Giỏ hàng */}
                <div className="col-md-7">
                    <div className="d-flex align-items-center mb-3">
                        <h4 className="mb-0">Giỏ hàng của bạn</h4>
                        {user && (
                            <span className="badge bg-primary ms-2">
                                {user.username}
                            </span>
                        )}
                    </div>

                    {cartItems.length === 0 ? (
                        <div className="text-center py-5">
                            <p className="text-muted">Giỏ hàng của bạn đang trống</p>
                            <button
                                className="btn btn-primary"
                                onClick={() => navigate("/products")}
                            >
                                Tiếp tục mua sắm
                            </button>
                        </div>
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

                {/*  Form thanh toán */}
                <div className="col-md-5">
                    <h4>Thông tin thanh toán</h4>

                    {/* Thông báo trạng thái đăng nhập */}
                    {!user && (
                        <div className="alert alert-info mb-3">
                            <i className="fas fa-info-circle me-2"></i>
                            Vui lòng đăng nhập để hoàn tất thanh toán
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Tất cả input đều bị disabled nếu chưa đăng nhập */}
                        <div className="mb-3">
                            <label>Họ tên</label>
                            <input
                                type="text"
                                className="form-control"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                                disabled={!user}
                                placeholder={!user ? "Vui lòng đăng nhập..." : ""}
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
                                disabled={!user}
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
                                    disabled={!user}
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
                                    disabled={!user}
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
                                disabled={!user}
                                placeholder={!user ? "Vui lòng đăng nhập..." : ""}
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
                                disabled={!user}
                                placeholder={!user ? "Vui lòng đăng nhập..." : ""}
                            />
                            {phoneError && <small className="text-danger">{phoneError}</small>}
                        </div>

                        <div className="mb-3">
                            <label>Email</label>
                            <input
                                type="email"
                                className="form-control"
                                required
                                disabled={!user}
                                placeholder={!user ? "Vui lòng đăng nhập..." : ""}
                            />
                        </div>

                        {/*  Thanh toán */}
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
                                        if (!user) return;
                                        setPaymentMethod("cod");
                                        setShowQR(false);
                                    }}
                                    disabled={!user}
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
                                    onChange={() => {
                                        if (!user) return;
                                        setPaymentMethod("online");
                                    }}
                                    disabled={!user}
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
                                    disabled={!user}
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

                        {/*  Mã giảm giá */}
                        <div className="mb-3 d-flex align-items-center">
                            <input
                                type="text"
                                className="form-control me-2"
                                placeholder={!user ? "Đăng nhập để sử dụng mã giảm giá" : "Nhập mã giảm giá"}
                                value={discountCode}
                                onChange={(e) => setDiscountCode(e.target.value)}
                                disabled={!user}
                            />
                            <button
                                type="button"
                                className="btn btn-secondary"
                                onClick={handleApplyDiscount}
                                disabled={!user}
                            >
                                Áp dụng
                            </button>
                        </div>

                        {/*  Hiển thị thông báo */}
                        {message.text && (
                            <div
                                className={`alert mt-3 alert-${message.type === "error" ? "danger" : message.type === "success" ? "success" : "info"}`}
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

                            {!user ? (
                                <button
                                    className="btn btn-primary"
                                    type="button"
                                    onClick={handleLoginToCheckout}
                                >
                                    Đăng nhập để thanh toán
                                </button>
                            ) : (
                                <button
                                    className="btn btn-success"
                                    type="submit"
                                    disabled={cartItems.length === 0}
                                >
                                    Thanh toán
                                </button>
                            )}
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