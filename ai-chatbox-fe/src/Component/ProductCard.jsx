import React from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import "../scss/productCard.scss";

function ProductCard({ product }) {
    const navigate = useNavigate();
    const { addToCart } = useCart();


    const formatPrice = (price) =>
        new Intl.NumberFormat("vi-VN").format(price) + " ₫";

    const imageUrl = product.images?.[0]
        ? `http://localhost:5000${product.images[0]}`
        : "https://via.placeholder.com/250x250?text=No+Image";

    const handleAddToCart = (e) => {
        e.stopPropagation();
        addToCart(product, 1, true);
    };

    return (
        <div
            className="card product-card shadow-sm text-center"
            onClick={() => navigate(`/products/${product._id || product.id}`)}
        >
            <div className="card-img-wrapper">
                <img
                    src={imageUrl}
                    className="card-img-top"
                    alt={product.name}
                    onError={(e) => {
                        e.target.src = "https://via.placeholder.com/250x250?text=Image+Not+Found";
                    }}
                />
            </div>
            <div className="card-body">
                <h6 className="card-title text-truncate">{product.name}</h6>
                <p className="text-primary fw-bold mb-2">{formatPrice(product.price)}</p>
                <button
                    className="btn btn-dark w-100 add-cart-btn"
                    onClick={handleAddToCart}
                >
                    Add to cart
                </button>
            </div>
        </div>
    );

}
export default ProductCard;
