import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../scss/checkOrder.scss"; // Tạo file scss riêng

const CheckOrder = () => {
    const navigate = useNavigate();

    const [orderId, setOrderId] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [order, setOrder] = useState(null);
    const [message, setMessage] = useState({ type: "", text: "" });

    // Chỉ cho nhập số với phone
    const handlePhoneChange = (e) => {
        const value = e.target.value.replace(/\D/g, "");
        setPhone(value);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!orderId.trim() || (!email.trim() && !phone.trim())) {
            setMessage({
                type: "error",
                text: "Vui lòng nhập Order ID và email hoặc số điện thoại.",
            });
            setOrder(null);
            return;
        }

        try {
            const res = await fetch("http://localhost:5000/api/orders/check", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ orderId, email, phone }),
            });

            if (!res.ok) throw new Error("Order không tồn tại hoặc thông tin không đúng");

            const data = await res.json();
            setOrder(data);
            setMessage({ type: "success", text: "Đơn hàng tìm thấy!" });
        } catch (error) {
            setOrder(null);
            setMessage({ type: "error", text: error.message });
        }
    };

    return (
        <div className="check-order-page container py-5">
            <h3>Tra cứu đơn hàng</h3>

            <form onSubmit={handleSubmit} className="mb-4">
                <div className="mb-3">
                    <label>Order ID (MongoDB ID)</label>
                    <input
                        type="text"
                        className="form-control"
                        value={orderId}
                        onChange={(e) => setOrderId(e.target.value)}
                        placeholder="Nhập ID đơn hàng từ bảng quản lý"
                        required
                    />
                </div>
                <div className="mb-3">
                    <label>Email</label>
                    <input
                        type="email"
                        className="form-control"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Nhập email hoặc số điện thoại"
                    />
                </div>
                <div className="mb-3">
                    <label>Số điện thoại</label>
                    <input
                        type="text"
                        className="form-control"
                        value={phone}
                        onChange={handlePhoneChange}
                        placeholder="Nhập số điện thoại"
                    />
                </div>
                <button className="btn btn-primary" type="submit">
                    Tra cứu
                </button>
            </form>

            {message.text && (
                <div
                    className={`alert mt-3 ${message.type === "error" ? "alert-danger" : "alert-success"
                        }`}
                >
                    {message.text}
                </div>
            )}

            {order && (
                <div className="order-details mt-4">
                    <h5>Thông tin đơn hàng</h5>
                    <p>
                        <strong>Order ID:</strong> {order._id}
                    </p>
                    <p>
                        <strong>Khách hàng:</strong> {order.customerName}
                    </p>
                    <p>
                        <strong>Email:</strong> {order.email}
                    </p>
                    <p>
                        <strong>Số điện thoại:</strong> {order.phone}
                    </p>
                    <p>
                        <strong>Địa chỉ:</strong> {order.address}
                    </p>
                    <p>
                        <strong>Trạng thái:</strong> {order.status}
                    </p>

                    <h6>Sản phẩm:</h6>
                    {order.items.map((item) => (
                        <div
                            key={item.productId}
                            className="d-flex justify-content-between border-bottom py-2"
                        >
                            <span>{item.name} x{item.quantity}</span>
                            <span>{item.price.toLocaleString()}₫</span>
                        </div>
                    ))}

                    <p className="mt-3">
                        <strong>Tổng tiền:</strong> {order.total.toLocaleString()}₫
                    </p>
                </div>
            )}

            <div className="mt-4">
                <button className="btn btn-secondary" onClick={() => navigate(-1)}>
                    ← Trở về
                </button>
            </div>
        </div>
    );
};

export default CheckOrder;
