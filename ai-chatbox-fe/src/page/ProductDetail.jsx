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
    const [selectedSize, setSelectedSize] = useState(null);
    const [availableStock, setAvailableStock] = useState(0);
    const [totalStock, setTotalStock] = useState(0);

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/api/products/${id}`);
                const fetched = res.data.product || res.data;

                setProduct(fetched);

                // Tính tổng tồn kho
                const total = fetched.sizes?.reduce((sum, size) => sum + (size.quantity || 0), 0) || 0;
                setTotalStock(total);
                setAvailableStock(total);

                // Ảnh mặc định
                if (fetched.images?.length > 0) {
                    const firstImage = fetched.images[0].startsWith("http")
                        ? fetched.images[0]
                        : `http://localhost:5000${fetched.images[0]}`;
                    setSelectedImage(firstImage);
                } else if (fetched.image) {
                    setSelectedImage(
                        fetched.image.startsWith("http")
                            ? fetched.image
                            : `http://localhost:5000${fetched.image}`
                    );
                }

                // Lấy sản phẩm liên quan
                if (fetched.category) {
                    const relatedRes = await axios.get(
                        `http://localhost:5000/api/products?category=${fetched.category}`
                    );
                    const relatedList = relatedRes.data.products || relatedRes.data;
                    setRelated(relatedList.filter((p) => p._id !== fetched._id));
                }
            } catch (err) {
                console.error("Error get products", err);
            }
        };
        fetchProduct();
        setSelectedImage("");

    }, [id]);

    // Khi chọn size, cập nhật tồn kho theo size
    const handleSizeSelect = (size) => {
        setSelectedSize(size);
        if (product.sizes) {
            const sizeObj = product.sizes.find(s => (s.size || s) === (size.size || size));
            setAvailableStock(sizeObj?.quantity || 0);
        }
    };

    // Tăng giảm số lượng với kiểm tra tồn kho
    const increaseQuantity = () => {
        if (quantity < availableStock) {
            setQuantity(q => q + 1);
        } else {
            alert(`Chỉ còn ${availableStock} sản phẩm trong kho!`);
        }
    };

    const decreaseQuantity = () => {
        setQuantity(q => Math.max(1, q - 1));
    };

    const handleAddToCart = () => {
        // Kiểm tra đã chọn size chưa
        if (!selectedSize && product.sizes?.length > 0) {
            alert("Vui lòng chọn size!");
            return;
        }

        // Kiểm tra tồn kho (FIX TC_AC_02)
        if (availableStock <= 0) {
            alert("Sản phẩm đã hết hàng!");
            return;
        }

        // Kiểm tra số lượng không vượt quá tồn kho (FIX TC_AC_03)
        if (quantity > availableStock) {
            alert(`Chỉ còn ${availableStock} sản phẩm trong kho!`);
            return;
        }

        // Lấy ảnh
        const productImage =
            product.images && product.images.length > 0
                ? (product.images[0].startsWith("http")
                    ? product.images[0]
                    : `http://localhost:5000${product.images[0]}`)
                : product.image
                    ? (product.image.startsWith("http")
                        ? product.image
                        : `http://localhost:5000${product.image}`)
                    : "https://via.placeholder.com/100?text=No+Image";

        // Gọi addToCart với stock thông tin
        addToCart({
            ...product,
            selectedSize: selectedSize,
            size: selectedSize,
            image: productImage,
            stock: availableStock
        }, quantity);
    };

    if (!product) return <p className="text-center mt-5">Đang tải sản phẩm...</p>;

    const formatPrice = (price) =>
        new Intl.NumberFormat("vi-VN").format(price) + " ₫";

    return (
        <div className="product-detail-page">
            <Navbar />
            <div className="container py-5">
                <div className="row g-4">
                    {/* Ảnh sản phẩm */}
                    <div className="col-lg-6 d-flex">
                        <div className="thumbnail-list me-3">
                            {product.images?.map((img, i) => {
                                const src = img.startsWith("http")
                                    ? img
                                    : `http://localhost:5000${img}`;
                                return (
                                    <img
                                        key={i}
                                        src={src}
                                        alt={`Ảnh ${i + 1}`}
                                        className={`thumbnail-img ${selectedImage === src ? "active" : ""
                                            }`}
                                        onClick={() => setSelectedImage(src)}
                                        onError={(e) =>
                                        (e.target.src =
                                            "https://via.placeholder.com/100?text=No+Image")
                                        }
                                    />
                                );
                            })}
                        </div>

                        <div className="main-image flex-grow-1">
                            <img
                                src={selectedImage}
                                alt={product.name}
                                className="img-fluid rounded shadow-sm"
                                onError={(e) =>
                                (e.target.src =
                                    "https://via.placeholder.com/500?text=Image+Not+Found")
                                }
                            />
                        </div>
                    </div>

                    {/* Thông tin sản phẩm */}
                    <div className="col-lg-6">
                        <div className="product-info">
                            <h3 className="fw-bold mb-2">{product.name}</h3>
                            <p className="text-primary fs-5 mb-3">
                                {formatPrice(product.price)}
                            </p>
                            <p>{product.description}</p>

                            {/* Hiển thị tồn kho */}
                            <div className="stock-info mb-3">
                                <strong>Tồn kho: </strong>
                                <span className={`ms-2 ${availableStock <= 0 ? 'text-danger' : 'text-success'}`}>
                                    {selectedSize
                                        ? `${availableStock} sản phẩm (size ${selectedSize.size || selectedSize})`
                                        : `${totalStock} sản phẩm (tất cả size)`
                                    }
                                </span>
                                {availableStock <= 0 && (
                                    <div className="text-danger small mt-1">
                                        <i className="bi bi-exclamation-triangle"></i> Sản phẩm đã hết hàng!
                                    </div>
                                )}
                                {availableStock > 0 && availableStock <= 5 && (
                                    <div className="text-warning small mt-1">
                                        <i className="bi bi-exclamation-circle"></i> Sản phẩm sắp hết hàng!
                                    </div>
                                )}
                            </div>

                            {/* Chọn size */}
                            {product.sizes?.length > 0 && (
                                <div className="mb-3">
                                    <strong>Size:</strong>
                                    <div className="mt-2">
                                        {product.sizes.map((s, i) => {
                                            const sizeName = s.size || s;
                                            const sizeQuantity = s.quantity || 0;
                                            const isSelected = selectedSize === sizeName;
                                            const isOutOfStock = sizeQuantity <= 0;

                                            return (
                                                <button
                                                    key={i}
                                                    className={`btn btn-sm me-2 mb-2 ${isSelected ? 'btn-dark' : 'btn-outline-dark'} ${isOutOfStock ? 'disabled opacity-50' : ''}`}
                                                    onClick={() => !isOutOfStock && handleSizeSelect(sizeName)}
                                                    disabled={isOutOfStock}
                                                    title={isOutOfStock ? "Hết hàng" : `Còn ${sizeQuantity} sản phẩm`}
                                                >
                                                    {sizeName}
                                                    {!isOutOfStock && (
                                                        <span className="badge bg-secondary ms-1">
                                                            {sizeQuantity}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            {/* Chọn số lượng với kiểm tra tồn kho */}
                            <div className="d-flex align-items-center mb-3">
                                <strong className="me-2">Số lượng:</strong>
                                <button
                                    className="btn btn-outline-dark btn-sm"
                                    onClick={decreaseQuantity}
                                    disabled={quantity <= 1}
                                >
                                    -
                                </button>
                                <span className="mx-3">{quantity}</span>
                                <button
                                    className="btn btn-outline-dark btn-sm"
                                    onClick={increaseQuantity}
                                    disabled={quantity >= availableStock}
                                >
                                    +
                                </button>
                                <span className="ms-3 text-muted small">
                                    Tối đa: {availableStock}
                                </span>
                            </div>

                            {/* Nút hành động */}
                            <div className="button-group">
                                <Link to="/products" className="btn btn-outline-dark me-2">
                                    ← Quay lại
                                </Link>
                                <button
                                    className="btn btn-dark"
                                    onClick={handleAddToCart}
                                    disabled={availableStock <= 0 || (product.sizes?.length > 0 && !selectedSize)}
                                >
                                    {availableStock <= 0 ? "Hết hàng" : "Thêm vào giỏ"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="fixed-banner my-5 text-center">
                    <img
                        src="https://static.nike.com/a/images/f_auto,cs_srgb/w_1536,c_limit/8056cc98-b505-4ef7-b0fd-7737b1a40f5e/how-to-measure-your-foot-to-find-the-right-shoe-size.jpg"
                        alt="ảnh size"
                        className="img-fluid rounded shadow-sm"
                    />
                </div>

                {/* Sản phẩm tương tự */}
                {related.length > 0 && (
                    <div className="related-products mt-5">
                        <h4 className="text-center mb-4">Sản phẩm cùng loại</h4>
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