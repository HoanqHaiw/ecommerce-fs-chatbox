import React from "react";
import { useCart } from "../context/CartContext";

const Cart = () => {
    const { cartItems, decreaseQuantity, addToCart, removeFromCart, subtotal } = useCart();

    return (
        <div className="cart-page container py-5">
            <div className="row">
                {/* Danh sách sản phẩm */}
                <div className="col-md-7">
                    <h4>Giỏ hàng của bạn</h4>
                    {cartItems.length === 0 ? (
                        <p>Giỏ hàng trống</p>
                    ) : (
                        cartItems.map((item) => (
                            <div key={item.id} className="cart-item d-flex align-items-center border-bottom py-3">
                                <img src={item.image} alt={item.name} width="80" />
                                <div className="ms-3 flex-grow-1">
                                    <h6>{item.name}</h6>
                                    <p>{item.price}</p>
                                    <div className="quantity d-flex align-items-center">
                                        <button onClick={() => decreaseQuantity(item.id)}>-</button>
                                        <span className="mx-2">{item.quantity}</span>
                                        <button onClick={() => addToCart(item)}>+</button>
                                    </div>
                                </div>
                                <button className="btn btn-danger btn-sm" onClick={() => removeFromCart(item.id)}>
                                    Xóa
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Form thanh toán */}
                <div className="col-md-5">
                    <h4>Thông tin thanh toán</h4>
                    <form>
                        <div className="mb-3">
                            <label>Họ tên</label>
                            <input type="text" className="form-control" required />
                        </div>
                        <div className="mb-3">
                            <label>Địa chỉ</label>
                            <input type="text" className="form-control" required />
                        </div>
                        <div className="mb-3">
                            <label>Số điện thoại</label>
                            <input type="text" className="form-control" required />
                        </div>
                        <div className="mb-3">
                            <label>Mã Giảm Giá</label>
                            <input type="text" className="form-control" />
                        </div>
                        <div className="mb-3">
                            <label>Email</label>
                            <input type="text" className="form-control" required />
                        </div>
                        <div className="mt-4">
                            <p>Tổng tiền: <strong>{subtotal.toLocaleString()}₫</strong></p>
                            <button className="btn btn-success w-100">Đặt hàng</button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Cart;
