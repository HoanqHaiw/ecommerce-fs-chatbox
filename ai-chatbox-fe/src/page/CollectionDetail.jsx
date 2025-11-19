import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../Component/Navbar";
import Footer from "../Component/Footer";
import { getProductsByCollection } from "../api/productService";
import "../scss/collectionDetail.scss";

const CollectionDetail = () => {
    const { id } = useParams();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const data = await getProductsByCollection(id);
                console.log("Products data:", data);
                console.log("First product:", data[0]);
                console.log("First product images:", data[0]?.images);
                setProducts(data);
            } catch (err) {
                console.error("Error fetching collection products:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [id]);

    // Hàm xử lý lỗi ảnh
    const handleImageError = (e) => {
        console.error("Image failed to load:", e.target.src);
        e.target.src = "/images/placeholder.jpg";
        e.target.alt = "Image not available";
    };


    const getImageUrl = (imageUrl) => {
        if (!imageUrl) return "/images/placeholder.jpg";


        if (imageUrl.startsWith('http')) return imageUrl;


        if (imageUrl.startsWith('/')) return `http://localhost:5000${imageUrl}`;


        return `http://localhost:5000/uploads/${imageUrl}`;
    };

    if (loading) return <p className="loading">Đang tải...</p>;
    if (products.length === 0) return <p>Chưa có sản phẩm trong bộ sưu tập này.</p>;

    return (
        <div className="collection-detail-page">
            <Navbar />

            <section className="collection-header">
                <h1>{id}</h1>
                <p>Các sản phẩm nổi bật trong bộ sưu tập "{id}"</p>
            </section>

            <div className="products-container">
                {products.map((product) => (
                    <div key={product._id} className="product-card fade-in">
                        <div className="image-container">
                            <img
                                src={getImageUrl(product.images?.[0])}
                                alt={product.name || "Product image"}
                                className="product-image"
                                onError={handleImageError}
                                loading="lazy"
                            />
                            {!product.images?.[0] && (
                                <div className="no-image-placeholder">
                                    No Image
                                </div>
                            )}
                        </div>
                        <div className="product-info">
                            <h3>{product.name || "Unnamed Product"}</h3>
                            <p className="price">
                                {product.price ? product.price.toLocaleString() + "₫" : "Liên hệ"}
                            </p>
                            <Link to={`/products/${product._id}`} className="view-btn">
                                Xem Chi Tiết
                            </Link>
                        </div>
                    </div>
                ))}
            </div>

            <div className="back-button">
                <Link to="/collections">← Quay lại Collections</Link>
            </div>
        </div>
    );
};

export default CollectionDetail;