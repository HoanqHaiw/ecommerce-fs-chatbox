import React, { useEffect, useState } from "react";
import Navbar from "../Component/Navbar";
import "../scss/collections.scss";
import heroImg from "../assets/collections/hero.jpg";
import { Link } from "react-router-dom";
import { getCollections } from "../api/productService";

const Collections = () => {
    const [collections, setCollections] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCollections = async () => {
            try {
                const data = await getCollections();
                // data là array string, map thành object để giữ bố cục ảnh giả định
                const collectionsData = data.map((name, index) => ({
                    id: index + 1,
                    name,
                    description: getCollectionDescription(name),
                    image: getCollectionImage(name),
                }));
                setCollections(collectionsData);
            } catch (err) {
                console.error("Error fetching collections:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchCollections();
    }, []);

    const getCollectionDescription = (name) => {
        const desc = {
            "Summer 2025": "Gam màu tươi sáng, năng động — hoàn hảo cho những ngày nắng.",
            "Classic Streetwear": "Kết hợp giữa đường phố và phong cách cổ điển mang dấu ấn riêng.",
            "Best Seller": "Những sản phẩm được yêu thích nhất tại DOANTONG OUTLET.",
            "New Arrivals": "Những sản phẩm mới nhất tại DOANTONG OUTLET.",
        };
        return desc[name] || "Khám phá bộ sưu tập độc quyền.";
    };

    const getCollectionImage = (name) => {
        const img = {
            "Summer 2025": require("../assets/collections/summer.jpg"),
            "Classic Streetwear": require("../assets/collections/classic.jpg"),
            "Best Seller": require("../assets/collections/bestseller.jpg"),
            "New Arrivals": require("../assets/collections/newarrivals.jpg"),
        };
        return img[name] || heroImg;
    };

    if (loading) return <p className="loading">Đang tải bộ sưu tập...</p>;

    return (
        <div className="collections-page">
            <Navbar />

            {/* ---------- HERO BANNER ---------- */}
            <section className="hero-banner" style={{ backgroundImage: `url(${heroImg})` }}>
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
                                <Link to={`/collections/${col.name}`} className="view-btn">
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
