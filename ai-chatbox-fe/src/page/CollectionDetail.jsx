import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../Component/Navbar";
import Footer from "../Component/Footer";
import { getProductsByCollection } from "../api/productService";
import "../scss/collectionDetail.scss";

const CollectionDetail = () => {
    const { id } = useParams(); // collectionName
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                setLoading(true);
                const data = await getProductsByCollection(id);
                setProducts(data);
            } catch (err) {
                console.error("Error fetching collection products:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, [id]);

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
                        <img src={product.images[0]} alt={product.name} className="product-image" />
                        <div className="product-info">
                            <h3>{product.name}</h3>
                            <p className="price">{product.price.toLocaleString()}₫</p>
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
