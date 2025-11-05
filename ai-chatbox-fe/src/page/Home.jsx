import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../scss/home.scss";
import axios from "axios";

// banner
import banner from "../assets/img/ads1.jpg";
import banner2 from "../assets/img/ads2.avif";

const Home = () => {
    const [products, setProducts] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const itemsPerPage = 4;
    const BASE_URL = "http://localhost:5000"; // backend server

    // 👉 Lấy dữ liệu sản phẩm từ backend
    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await axios.get(`${BASE_URL}/api/products`);
                setProducts(res.data.products || []);
            } catch (error) {
                console.error("Lỗi khi tải sản phẩm:", error);
            }
        };
        fetchProducts();
    }, []);

    // 👉 Tự động chuyển nhóm sản phẩm sau 5s
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) =>
                prev + itemsPerPage >= products.length ? 0 : prev + itemsPerPage
            );
        }, 5000);
        return () => clearInterval(interval);
    }, [products.length]);

    const visibleProducts = products.slice(currentIndex, currentIndex + itemsPerPage);

    return (
        <div className="home-page">
            {/* Banner */}
            <div className="banner-full">
                <img src={banner} alt="banner" />
            </div>
            <div className="banner-full">
                <img src={banner2} alt="banner" />
            </div>

            {/* Sản phẩm nổi bật */}
            <div className="container mt-5">
                <h2 className="mb-4 text-center">Sản phẩm nổi bật</h2>
                <div className="row row-cols-1 row-cols-md-4 g-4 fade-in">
                    {visibleProducts.map((p) => (
                        <div className="col" key={p._id}>
                            <Link
                                to={`/products/${p._id}`}
                                className="text-decoration-none text-dark"
                            >
                                <div className="card h-100 text-center shadow-sm">
                                    {/* Ảnh sản phẩm */}
                                    <img
                                        src={
                                            p.images && p.images.length > 0
                                                ? `${BASE_URL}${p.images[0]}`
                                                : `${BASE_URL}/uploads/no-image.jpg`
                                        }
                                        className="card-img-top"
                                        alt={p.name}
                                        style={{
                                            width: "100%",
                                            height: "250px",
                                            objectFit: "cover",
                                        }}
                                    />

                                    <div className="card-body">
                                        <h6 className="card-title">{p.name}</h6>
                                        <p className="text-primary fw-bold">
                                            {p.price.toLocaleString("vi-VN")}đ
                                        </p>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Home;
