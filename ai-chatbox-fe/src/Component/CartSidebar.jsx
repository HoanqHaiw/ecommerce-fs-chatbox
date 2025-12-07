import React from "react";
import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";
import "../scss/cartSidebar.scss";

const CartSidebar = () => {
    const {
        cartItems,
        decreaseQuantity,
        addToCart,
        removeFromCart,
        subtotal,
        isSidebarOpen,
        closeSidebar,
    } = useCart();

    const formatPrice = (price) =>
        new Intl.NumberFormat("vi-VN").format(price) + " ₫";

    return (
        <>
            {/* Overlay mờ nền */}
            <div
                className={`cart-overlay ${isSidebarOpen ? "show" : ""}`}
                onClick={closeSidebar}
            ></div>

            {/* Sidebar giỏ hàng */}
            <div className={`cart-sidebar ${isSidebarOpen ? "open" : ""}`}>
                <div className="sidebar-header">
                    <h5>Giỏ hàng</h5>
                    <button onClick={closeSidebar} className="close-btn">
                        ×
                    </button>
                </div>

                {/* Nếu giỏ hàng trống */}
                {cartItems.length === 0 ? (
                    <p className="empty">Giỏ hàng trống</p>
                ) : (
                    <div className="sidebar-content">
                        {cartItems.map((item) => (
                            <div
                                key={`${item.id}_${item.selectedSize || item.size || 'nosize'}`}
                                className="cart-item d-flex align-items-center"
                            >
                                <img
                                    src={item.image || "/default-product.jpg"}
                                    alt={item.name}
                                    className="cart-item-img"
                                />

                                <div className="info flex-grow-1 ms-2">
                                    <h6 className="mb-1">{item.name}</h6>

                                    {/* HIỂN THỊ SIZE NẾU CÓ */}
                                    {(item.selectedSize || item.size) && (
                                        <div className="size-info mb-1">
                                            <span className="badge bg-secondary">
                                                Size: {item.selectedSize || item.size}
                                            </span>
                                        </div>
                                    )}

                                    <p className="text-muted mb-1">
                                        {formatPrice(item.price)}
                                    </p>

                                    <div className="quantity d-flex align-items-center">
                                        <button
                                            onClick={() => decreaseQuantity(item.id)}
                                            className="btn-qty"
                                        >
                                            -
                                        </button>
                                        <span className="mx-2">{item.quantity}</span>
                                        <button
                                            onClick={() => addToCart(item)}
                                            className="btn-qty"
                                            disabled={item.quantity >= (item.stock || 99)}
                                        >
                                            +
                                        </button>
                                    </div>
                                </div>

                                <button
                                    className="remove"
                                    onClick={() => removeFromCart(item.id)}
                                >
                                    Xóa
                                </button>
                            </div>
                        ))}
                    </div>
                )}

                {/* Footer */}
                {cartItems.length > 0 && (
                    <div className="sidebar-footer">
                        <div className="subtotal d-flex justify-content-between align-items-center">
                            <span>Tổng cộng:</span>
                            <strong>{formatPrice(subtotal)}</strong>
                        </div>
                        <div className="actions">
                            <Link to="/cart" onClick={closeSidebar} className="view-cart">
                                Xem giỏ hàng
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </>
    );
};

export default CartSidebar;