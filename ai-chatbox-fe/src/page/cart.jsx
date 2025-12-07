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
    const [qrLoading, setQrLoading] = useState(false);

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
        setShowQR(false); // Reset QR khi thay đổi địa chỉ

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
        setShowQR(false);

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
        setShowQR(false);
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
        setShowQR(false);
    };

    // Hàm lấy QR code image
    const getQRImage = () => {
        // Tạo QR code động với thông tin thanh toán
        const qrData = JSON.stringify({
            method: onlineMethod,
            amount: finalTotal,
            orderId: `ORDER_${Date.now()}`,
            time: new Date().toISOString(),
            account: "STORE_ACCOUNT_123"
        });

        // Sử dụng API tạo QR code online
        return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrData)}`;
    };

    // Xử lý áp dụng mã giảm giá
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
        setShowQR(false);
    };

    // Xử lý hiển thị QR code
    const handleShowQR = () => {
        if (!onlineMethod) {
            setMessage({ type: "error", text: "Vui lòng chọn ví điện tử trước!" });
            return;
        }

        if (cartItems.length === 0) {
            setMessage({ type: "error", text: "Giỏ hàng trống!" });
            return;
        }

        setQrLoading(true);

        // Giả lập loading 1.5 giây
        setTimeout(() => {
            setShowQR(true);
            setQrLoading(false);

            // Lưu thông tin thanh toán tạm thời
            const paymentInfo = {
                method: onlineMethod,
                amount: finalTotal,
                time: new Date().toISOString(),
                orderId: `ORDER_${Date.now()}`,
                status: "pending"
            };
            localStorage.setItem('pendingPayment', JSON.stringify(paymentInfo));

            setMessage({
                type: "success",
                text: `Mã QR ${onlineMethod} đã sẵn sàng. Quét mã để thanh toán ${formatPrice(finalTotal)}.`
            });
        }, 1500);
    };

    const handleLoginToCheckout = () => {
        setMessage({ type: "info", text: "Đang chuyển hướng đến trang đăng nhập..." });
        setTimeout(() => {
            navigate("/login");
        }, 1000);
    };

    // Hàm lấy size hiển thị
    const getDisplaySize = (item) => {
        return item.selectedSize || item.size || "Không có size";
    };

    // Hàm xử lý tăng số lượng với kiểm tra tồn kho
    const handleIncreaseQuantity = (item) => {
        if (!item.stock || item.quantity < item.stock) {
            addToCart(item);
        } else {
            alert(`Số lượng tối đa cho size ${getDisplaySize(item)} là ${item.stock}`);
        }
    };

    // Xử lý submit order
    const handleSubmit = async (e) => {
        e.preventDefault();

        // Validation cơ bản
        if (!name || !phone || phone.length !== 10) {
            setMessage({ type: "error", text: "Vui lòng nhập đầy đủ thông tin và số điện thoại hợp lệ" });
            return;
        }

        if (!selectedCity || !selectedDistrict || !selectedWard || !specificAddress) {
            setMessage({ type: "error", text: "Vui lòng nhập đầy đủ địa chỉ giao hàng" });
            return;
        }

        // Validation thanh toán online
        if (paymentMethod === "online" && !showQR) {
            setMessage({ type: "error", text: "Vui lòng hiển thị và quét mã QR để thanh toán online" });
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
                    size: getDisplaySize(item),
                    color: item.color
                })),
                subtotal: subtotal,
                discount: discountPercent,
                total: finalTotal,
                paymentMethod: paymentMethod,
                paymentStatus: paymentMethod === "online" ? "paid" : "pending",
                onlineMethod: paymentMethod === "online" ? onlineMethod : null
            };

            console.log("=== FRONTEND: Sending order data ===");
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
            console.log("Order created successfully:", result);

            // Xóa giỏ hàng
            clearCart();
            localStorage.removeItem("cartItems");
            localStorage.removeItem("pendingPayment"); // Xóa payment info

            setMessage({
                type: "success",
                text: `Đặt hàng thành công! Mã đơn: ${result.order._id}. ${paymentMethod === "online" ? "Đã thanh toán online." : "Thanh toán khi nhận hàng."}`
            });

            // Chuyển hướng sau 3 giây
            setTimeout(() => {
                navigate("/check-order");
            }, 3000);

        } catch (error) {
            console.error("Lỗi khi tạo đơn hàng:", error);
            setMessage({
                type: "error",
                text: error.message || "Có lỗi xảy ra khi đặt hàng. Vui lòng thử lại."
            });
        }
    };

    const finalTotal = subtotal - (subtotal * discountPercent) / 100;

    const formatPrice = (price) =>
        new Intl.NumberFormat("vi-VN").format(price) + " ₫";

    return (
        <div className="cart-page container py-5 position-relative">
            <div className="row">
                {/* Phần giỏ hàng */}
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
                        <div className="cart-items-container">
                            {cartItems.map((item) => (
                                <div key={`${item.id}_${getDisplaySize(item)}`} className="cart-item d-flex align-items-center border-bottom py-3">
                                    <div className="cart-item-image">
                                        <img
                                            src={
                                                item.image?.startsWith("http")
                                                    ? item.image
                                                    : `http://localhost:5000/${item.image}`
                                            }
                                            alt={item.name}
                                            className="img-fluid rounded"
                                            style={{ width: "100px", height: "100px", objectFit: "cover" }}
                                            onError={(e) => {
                                                e.target.src = "https://via.placeholder.com/100x100?text=No+Image";
                                            }}
                                        />
                                    </div>
                                    <div className="cart-item-info ms-3 flex-grow-1">
                                        <h6 className="fw-bold mb-1">{item.name}</h6>

                                        {/* Hiển thị size */}
                                        <div className="mb-2">
                                            <span className="badge bg-secondary">
                                                Size: {getDisplaySize(item)}
                                            </span>
                                        </div>

                                        <p className="text-primary fw-bold mb-2">
                                            {formatPrice(item.price)}
                                        </p>

                                        <div className="quantity-controls d-flex align-items-center mb-2">
                                            <button
                                                onClick={() => decreaseQuantity(item.id)}
                                                className="btn btn-outline-secondary btn-sm"
                                                style={{ width: "30px", height: "30px" }}
                                            >
                                                -
                                            </button>
                                            <span className="mx-3 fw-bold">{item.quantity}</span>
                                            <button
                                                onClick={() => handleIncreaseQuantity(item)}
                                                className="btn btn-outline-secondary btn-sm"
                                                style={{ width: "30px", height: "30px" }}
                                                disabled={item.stock && item.quantity >= item.stock}
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                    <div className="cart-item-actions">
                                        <button
                                            className="btn btn-outline-danger btn-sm"
                                            onClick={() => removeFromCart(item.id)}
                                            title="Xóa sản phẩm"
                                        >
                                            <i className="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tổng tiền tạm tính */}
                    {cartItems.length > 0 && (
                        <div className="cart-summary mt-4 p-3 bg-light rounded">
                            <div className="d-flex justify-content-between mb-2">
                                <span>Tạm tính:</span>
                                <span className="fw-bold">{formatPrice(subtotal)}</span>
                            </div>
                            {discountPercent > 0 && (
                                <div className="d-flex justify-content-between mb-2 text-success">
                                    <span>Giảm giá ({discountPercent}%):</span>
                                    <span>-{formatPrice((subtotal * discountPercent) / 100)}</span>
                                </div>
                            )}
                            <div className="d-flex justify-content-between mb-2 pt-2 border-top">
                                <span className="fw-bold">Tổng cộng:</span>
                                <span className="fw-bold text-primary fs-5">
                                    {formatPrice(finalTotal)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Phần thanh toán */}
                <div className="col-md-5">
                    <div className="checkout-card p-4 shadow rounded">
                        <h4 className="mb-4">Thông tin thanh toán</h4>

                        {/* Thông báo đăng nhập */}
                        {!user && (
                            <div className="alert alert-info mb-3">
                                <i className="fas fa-info-circle me-2"></i>
                                Vui lòng đăng nhập để hoàn tất thanh toán
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            {/* Thông tin cá nhân */}
                            <div className="mb-3">
                                <label className="form-label">Họ tên *</label>
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
                                <label className="form-label">Tỉnh/Thành phố *</label>
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
                                    <label className="form-label">Quận/Huyện *</label>
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
                                    <label className="form-label">Phường/Xã *</label>
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
                                <label className="form-label">Địa chỉ cụ thể *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={specificAddress}
                                    onChange={(e) => setSpecificAddress(e.target.value)}
                                    required
                                    disabled={!user}
                                    placeholder={!user ? "Vui lòng đăng nhập..." : "Số nhà, tên đường..."}
                                />
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Số điện thoại *</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={phone}
                                    onChange={handlePhoneChange}
                                    required
                                    disabled={!user}
                                    maxLength="10"
                                />
                                {phoneError && <small className="text-danger">{phoneError}</small>}
                            </div>

                            <div className="mb-3">
                                <label className="form-label">Email</label>
                                <input
                                    type="email"
                                    className="form-control"
                                    defaultValue={user?.email || ""}
                                    disabled={!user}
                                    placeholder={!user ? "Vui lòng đăng nhập..." : "email@example.com"}
                                />
                            </div>

                            {/* Phương thức thanh toán */}
                            <div className="mb-3">
                                <label className="form-label">Phương thức thanh toán *</label>
                                <div className="form-check mb-2">
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
                                    <label className="form-check-label">Thanh toán khi nhận hàng (COD)</label>
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
                                            setShowQR(false);
                                        }}
                                        disabled={!user}
                                    />
                                    <label className="form-check-label">Thanh toán online</label>
                                </div>
                            </div>

                            {/* Chọn ví điện tử (chỉ hiện khi chọn online) */}
                            {paymentMethod === "online" && (
                                <div className="mb-3">
                                    <label className="form-label">Chọn ví điện tử *</label>
                                    <select
                                        className="form-select mb-2"
                                        value={onlineMethod}
                                        onChange={(e) => {
                                            setOnlineMethod(e.target.value);
                                            setShowQR(false);
                                        }}
                                        disabled={!user}
                                    >
                                        <option value="">-- Chọn ví --</option>
                                        <option value="Momo">Momo</option>
                                        <option value="ZaloPay">ZaloPay</option>
                                        <option value="VNPay">VNPay</option>
                                    </select>

                                    {/* Nút hiển thị QR */}
                                    {onlineMethod && !showQR && (
                                        <button
                                            type="button"
                                            className="btn btn-info w-100 mb-3"
                                            onClick={handleShowQR}
                                            disabled={!user || qrLoading}
                                        >
                                            {qrLoading ? (
                                                <>
                                                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                                                    Đang tạo mã QR...
                                                </>
                                            ) : (
                                                <>
                                                    <i className="fas fa-qrcode me-2"></i>
                                                    Hiển thị mã QR thanh toán
                                                </>
                                            )}
                                        </button>
                                    )}
                                </div>
                            )}

                            {/* Hiển thị QR code */}
                            {showQR && paymentMethod === "online" && onlineMethod && (
                                <div className="text-center mb-3 p-3 border rounded bg-white">
                                    <h6 className="mb-3">Quét mã để thanh toán qua {onlineMethod}</h6>
                                    <div className="qr-container mb-3">
                                        <img
                                            src={getQRImage()}
                                            alt={`QR thanh toán ${onlineMethod}`}
                                            className="img-fluid border"
                                            style={{ maxWidth: "200px", height: "auto" }}
                                            onError={(e) => {
                                                e.target.src = "https://via.placeholder.com/200x200?text=QR+Not+Available";
                                            }}
                                        />
                                    </div>

                                    <div className="payment-info text-start bg-light p-3 rounded">
                                        <p className="mb-1"><strong>Số tiền:</strong> {formatPrice(finalTotal)}</p>
                                        <p className="mb-1"><strong>Nội dung:</strong> Thanh toán đơn hàng</p>
                                        <p className="mb-0 text-danger">
                                            <i className="fas fa-exclamation-triangle me-1"></i>
                                            Mã QR có hiệu lực trong 15 phút
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Mã giảm giá */}
                            <div className="mb-3">
                                <label className="form-label">Mã giảm giá</label>
                                <div className="d-flex align-items-center">
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
                            </div>

                            {/* Hiển thị thông báo */}
                            {message.text && (
                                <div
                                    className={`alert mt-3 alert-${message.type === "error" ? "danger" : message.type === "success" ? "success" : "info"}`}
                                >
                                    {message.text}
                                </div>
                            )}

                            {/* Nút hành động */}
                            <div className="mt-4 d-flex justify-content-between align-items-center">
                                <button
                                    type="button"
                                    className="btn btn-outline-secondary"
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
                                        style={{ minWidth: '150px' }}
                                    >
                                        <i className="fas fa-shopping-cart me-2"></i>
                                        {paymentMethod === "online" && !showQR ? "Hiển thị QR trước" : "Thanh toán"}
                                    </button>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Cart;