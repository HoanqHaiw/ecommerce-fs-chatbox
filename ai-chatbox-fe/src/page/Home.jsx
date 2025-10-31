import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "../scss/home.scss";

// banner — chỉ 1 ảnh duy nhất
import banner from "../assets/img/ads1.jpg";
import banner2 from "../assets/img/ads2.avif";

// img sản phẩm
import product1 from "../assets/img/img1.jpg";
import product2 from "../assets/img/img2.jpg";
import product3 from "../assets/img/img3.jpg";
import product4 from "../assets/img/img4.jpg";
import product5 from "../assets/img/img5.jpg";


function Home() {
    // 👉 Dữ liệu sản phẩm
    const products = [
        { id: 1, name: "Áo thun", price: "250.000đ", img: product1, hot: true },
        { id: 2, name: "Quần jeans", price: "400.000đ", img: product2 },
        { id: 3, name: "Giày sneaker", price: "800.000đ", img: product3, hot: true },
        { id: 4, name: "Nón lưỡi trai", price: "150.000đ", img: product4 },
        { id: 5, name: "Balo thời trang", price: "350.000đ", img: product5 },
    ];

    // 👉 Chuyển sản phẩm tự động sau 5s
    const [currentIndex, setCurrentIndex] = useState(0);
    const itemsPerPage = 4;

    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) =>
                prev + itemsPerPage >= products.length ? 0 : prev + itemsPerPage
            );
        }, 5000); // 5 giây
        return () => clearInterval(interval);
    }, [products.length]);

    const visibleProducts = products.slice(currentIndex, currentIndex + itemsPerPage);

    return (
        <div className="home-page">
            <div className="banner-full">
                <img src={banner} alt="banner" />
            </div>
            <div className="banner-full">
                <img src={banner2} alt="banner" />
            </div>

            <div className="container mt-5">
                <h2 className="mb-4 text-center">Sản phẩm nổi bật</h2>
                <div className="row row-cols-1 row-cols-md-4 g-4 fade-in">
                    {visibleProducts.map((p) => (
                        <div className="col" key={p.id}>
                            <div className="card h-100 text-center shadow-sm">
                                {p.hot && <div className="product-badge">HOT</div>}
                                <img src={p.img} className="card-img-top" alt={p.name} />
                                <div className="card-body">
                                    <h6 className="card-title">{p.name}</h6>
                                    <p className="text-primary fw-bold">{p.price}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default Home;
