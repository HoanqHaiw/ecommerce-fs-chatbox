import React from "react";
import Navbar from "../Component/Navbar";
import "../scss/collections.scss";

import heroImg from "../assets/collections/hero.jpg";
import summerImg from "../assets/collections/summer.jpg";
import classicImg from "../assets/collections/classic.jpg";
import bestSellerImg from "../assets/collections/bestseller.jpg";
import newArrivalsImg from "../assets/collections/newarrivals.jpg";
import { Link } from "react-router-dom";

const Collections = () => {
    const collections = [
        {
            id: 1,
            name: "Summer 2025",
            description: "Gam màu tươi sáng, năng động — hoàn hảo cho những ngày nắng.",
            image: summerImg,
        },
        {
            id: 2,
            name: "Classic Streetwear",
            description: "Kết hợp giữa đường phố và phong cách cổ điển mang dấu ấn riêng.",
            image: classicImg,
        },
        {
            id: 3,
            name: "Best Seller",
            description: "Những sản phẩm được yêu thích nhất tại DOANTONG OUTLET.",
            image: bestSellerImg,
        },
        {
            id: 4,
            name: "New Arrivals",
            description: "Những sản phẩm mới nhất tại DOANTONG OUTLET.",
            image: newArrivalsImg,
        },
    ];

    return (
        <div className="collections-page">
            <Navbar />

            {/* ---------- HERO BANNER ---------- */}
            <section
                className="hero-banner"
                style={{ backgroundImage: `url(${heroImg})` }}
            >
                <div className="overlay"></div>
                <div className="banner-content">
                    <h1>COLLECTIONS</h1>
                    <p>Khám phá phong cách độc quyền từ DOANTONG OUTLET</p>
                </div>
            </section>

            {/* ---------- GIỚI THIỆU ---------- */}
            <section className="intro-section">
                <h2>Bộ sưu tập của chúng tôi</h2>
                <p>
                    Mỗi bộ sưu tập là sự hòa quyện giữa cá tính, thời trang và phong cách sống hiện đại.
                    Chúng tôi mang đến cho bạn những thiết kế không chỉ đẹp mắt mà còn phản ánh tinh thần tự do,
                    sáng tạo và chất riêng của từng mùa.
                </p>
            </section>

            {/* ---------- DANH SÁCH COLLECTION ---------- */}
            <div className="collections-container">
                {collections.map((col) => (
                    <div key={col.id} className="collection-card">
                        <img src={col.image} alt={col.name} />
                        <div className="collection-info">
                            <h3>{col.name}</h3>
                            <p>{col.description}</p>
                            <button>
                                <Link to={`/collection/${col.id}`} className="view-btn">
                                    Xem Bộ Sưu Tập
                                </Link>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Collections;
