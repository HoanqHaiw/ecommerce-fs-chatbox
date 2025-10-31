import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../Component/Navbar";
import ProductCard from "../Component/ProductCard";
import { useCart } from "../context/CartContext";
import axios from "axios";
import "../scss/productDetail.scss";

const ProductDetail = () => {
    const { id } = useParams();
    const { addToCart } = useCart();
    const [product, setProduct] = useState(null);
    const [related, setRelated] = useState([]);
    const [selectedImage, setSelectedImage] = useState("");
    const [quantity, setQuantity] = useState(1);

    // ✅ Lấy sản phẩm theo ID từ backend
    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/products/${id}`);
                setProduct(res.data);
                setSelectedImage(res.data.image || "");
                // Lấy danh sách sản phẩm cùng category
                const relatedRes = await axios.get(
                    `http://localhost:5000/api/products?category=${res.data.category}`
                );
                // Loại bỏ chính sản phẩm hiện tại
                setRelated(relatedRes.data.filter((p) => p._id !== res.data._id));
            } catch (error) {
                console.error("❌ Lỗi khi lấy sản phẩm:", error);
            }
        };
        fetchProduct();
    }, [id]);

    if (!product) return <p>Đang tải sản phẩm...</p>;

    const formatPrice = (price) =>
        new Intl.NumberFormat("vi-VN").format(price) + " ₫";

    const handleAddToCart = () => {
        addToCart(product, quantity, true);
    };

    return (
        <div className="product-detail-page">
            <Navbar />

            <div className="container py-5">
                <div className="row">
                    {/* Hình ảnh sản phẩm */}
                    <div className="col-lg-7">
                        <div className="image-section">
                            {product.images?.length > 0 && (
                                <div className="thumbnail-list">
                                    {product.images.map((img, index) => (
                                        <img
                                            key={index}
                                            src={img}
                                            alt={`Ảnh ${index + 1}`}
                                            className={`thumbnail-img ${selectedImage === img ? "active" : ""
                                                }`}
                                            onClick={() => setSelectedImage(img)}
                                        />
                                    ))}
                                </div>
                            )}
                            <div className="main-image">
                                <img
                                    src={selectedImage || product.image}
                                    alt={product.name}
                                    className="img-fluid"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Thông tin sản phẩm */}
                    <div className="col-lg-5">
                        <div className="product-info sticky-top">
                            <h3 className="fw-bold">{product.name}</h3>
                            <p className="text-primary fs-5">{formatPrice(product.price)}</p>
                            <p>{product.description}</p>

                            {product.sizes?.length > 0 && (
                                <div className="mb-3">
                                    <strong>Size:</strong>
                                    <div className="mt-2">
                                        {product.sizes.map((s) => (
                                            <button
                                                key={s}
                                                className="btn btn-outline-dark btn-sm me-2"
                                            >
                                                {s}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="d-flex align-items-center mb-3">
                                <strong className="me-2">Số lượng:</strong>
                                <button
                                    className="btn btn-outline-dark btn-sm"
                                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                                >
                                    -
                                </button>
                                <span className="mx-3">{quantity}</span>
                                <button
                                    className="btn btn-outline-dark btn-sm"
                                    onClick={() => setQuantity((q) => q + 1)}
                                >
                                    +
                                </button>
                            </div>

                            <div className="button-group mb-3">
                                <Link to="/products" className="btn btn-outline-dark me-2">
                                    ← Quay lại sản phẩm
                                </Link>
                                <button className="btn btn-dark" onClick={handleAddToCart}>
                                    Thêm vào giỏ hàng
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sản phẩm liên quan */}
                {related.length > 0 && (
                    <div className="related-products mt-5">
                        <h4 className="text-center mb-4">Sản phẩm tương tự</h4>
                        <div className="product-grid">
                            {related.slice(0, 4).map((p) => (
                                <ProductCard key={p._id} product={p} />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ProductDetail;
