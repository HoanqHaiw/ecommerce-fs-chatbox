import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import "../scss/collectionDetail.scss";

const CollectionDetail = () => {
    const { id } = useParams();

    // ✅ Dữ liệu mẫu tạm thời (sau này thay bằng dữ liệu thật từ DB)
    const collectionsData = [
        {
            id: 1,
            name: "Streetwear Collection",
            description: "Phong cách năng động, cá tính dành cho giới trẻ hiện đại.",
            image: require("../assets/img/ads1.jpg"),
        },
        {
            id: 2,
            name: "Summer Vibes",
            description: "Bộ sưu tập mùa hè với tone màu tươi sáng, mát mẻ.",
            image: require("../assets/img/img1.jpg"),
        },
        {
            id: 3,
            name: "Classic Minimal",
            description: "Tinh tế, tối giản nhưng vẫn đậm phong cách riêng.",
            image: require("../assets/img/ads.jpg"),
        },
    ];

    const productsData = [
        { id: 101, name: "Áo thun trắng Basic", price: 250000, image: require("../assets/img/img1.jpg"), collectionId: 1 },
        { id: 102, name: "Quần short camo", price: 350000, image: require("../assets/img/img2.jpg"), collectionId: 1 },
        { id: 103, name: "Sneaker trắng", price: 800000, image: require("../assets/img/img3.jpg"), collectionId: 2 },
        { id: 104, name: "Áo sơ mi linen", price: 450000, image: require("../assets/img/img4.jpg"), collectionId: 2 },
        { id: 105, name: "Áo khoác minimalist", price: 700000, image: require("../assets/img/img5.jpg"), collectionId: 3 },
    ];

    const [collection, setCollection] = useState(null);
    const [products, setProducts] = useState([]);

    useEffect(() => {
        const foundCollection = collectionsData.find(c => c.id === Number(id));
        const filteredProducts = productsData.filter(p => p.collectionId === Number(id));

        setCollection(foundCollection);
        setProducts(filteredProducts);
    }, [id]);

    if (!collection) return <h3 style={{ textAlign: "center" }}>Không tìm thấy bộ sưu tập.</h3>;

    return (
        <div className="collection-detail-page">
            {/* ---------- BANNER ---------- */}
            <div className="banner">
                <img src={collection.image} alt={collection.name} />
                <div className="overlay">
                    <h1>{collection.name}</h1>
                    <p>{collection.description}</p>
                </div>
            </div>

            {/* ---------- DANH SÁCH SẢN PHẨM ---------- */}
            <div className="product-section container">
                <h2>Sản phẩm trong bộ sưu tập</h2>
                <div className="product-grid">
                    {products.map((product) => (
                        <div key={product.id} className="card">
                            <img src={product.image} alt={product.name} />
                            <div className="card-body">
                                <h6>{product.name}</h6>
                                <p>{product.price.toLocaleString()}₫</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CollectionDetail;
