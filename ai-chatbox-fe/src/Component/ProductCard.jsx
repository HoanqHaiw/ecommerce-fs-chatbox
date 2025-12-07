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

    // Hàm xử lý click vào card
    const handleCardClick = () => {
        navigate(`/products/${product._id || product.id}`);
    };

    const handleAddToCartClick = (e) => {
        e.stopPropagation();
        navigate(`/products/${product._id || product.id}`);
    };

    return (
        <div
            className="card product-card shadow-sm text-center"
            onClick={handleCardClick}
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
                    onClick={handleAddToCartClick}
                >
                    View Details
                </button>
            </div>
        </div>
    );
}

export default ProductCard;