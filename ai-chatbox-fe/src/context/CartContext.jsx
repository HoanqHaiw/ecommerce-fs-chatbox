import React, { createContext, useContext, useState } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const [cartItems, setCartItems] = useState([]);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);


    const getProductKey = (product) => {

        const id = product.id || product._id;
        const size = product.selectedSize || product.size || '';
        return `${id}_${size}`;
    };


    const addToCart = (product, quantity = 1) => {

        if (product.stock <= 0) {
            alert("Sản phẩm đã hết hàng!");
            return;
        }

        setCartItems((prev) => {
            const productKey = getProductKey(product);


            const existing = prev.find(item => {
                const itemKey = getProductKey(item);
                return itemKey === productKey;
            });

            if (existing) {

                const newQuantity = existing.quantity + quantity;


                if (newQuantity > product.stock) {
                    alert(`Chỉ còn ${product.stock} sản phẩm trong kho! Bạn đã có ${existing.quantity} trong giỏ.`);
                    return prev;
                }

                return prev.map((item) => {
                    const itemKey = getProductKey(item);
                    if (itemKey === productKey) {
                        return {
                            ...item,
                            quantity: newQuantity
                        };
                    }
                    return item;
                });
            } else {

                if (quantity > product.stock) {
                    alert(`Chỉ còn ${product.stock} sản phẩm trong kho!`);
                    return prev;
                }

                const newItem = {
                    id: product.id || product._id,
                    _id: product._id,
                    name: product.name,
                    price: Number(product.price),
                    image: product.image || product.images?.[0] || "",
                    quantity,
                    stock: product.stock,
                    selectedSize: product.selectedSize || product.size || null,
                    size: product.selectedSize || product.size || null,
                    productKey: productKey
                };

                console.log("Thêm sản phẩm mới vào giỏ:", newItem);
                return [...prev, newItem];
            }
        });
        setIsSidebarOpen(true);
    };

    // Hàm decreaseQuantity với kiểm tra
    const decreaseQuantity = (id) => {
        setCartItems((prev) =>
            prev
                .map((item) =>
                    item.id === id ? { ...item, quantity: item.quantity - 1 } : item
                )
                .filter((item) => item.quantity > 0)
        );
    };

    const removeFromCart = (id) => {
        setCartItems((prev) => prev.filter((item) => item.id !== id));
    };

    const clearCart = () => {
        setCartItems([]);
        localStorage.removeItem("cartItems");
    };

    const subtotal = cartItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    const openSidebar = () => setIsSidebarOpen(true);
    const closeSidebar = () => setIsSidebarOpen(false);

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                decreaseQuantity,
                removeFromCart,
                clearCart,
                subtotal,
                isSidebarOpen,
                openSidebar,
                closeSidebar,
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);