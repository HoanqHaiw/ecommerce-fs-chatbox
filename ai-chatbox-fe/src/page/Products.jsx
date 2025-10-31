import React, { useEffect, useState } from "react";
import Navbar from "../Component/Navbar";
import ProductCard from "../Component/ProductCard";
import "../scss/products.scss";
import axios from "axios";

const Products = () => {
    const [products, setProducts] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOption, setSortOption] = useState("default");

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await axios.get("http://localhost:5000/api/products");
                setProducts(res.data.products || []);
            } catch (error) {
                console.error("Lỗi khi lấy danh sách sản phẩm:", error);
            }
        };
        fetchProducts();
    }, []);

    const filteredProducts = products
        .filter((p) => selectedCategory === "All" ? true : p.category === selectedCategory)
        .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            if (sortOption === "price-asc") return a.price - b.price;
            if (sortOption === "price-desc") return b.price - a.price;
            return 0;
        });

    return (
        <div className="products-page">
            <Navbar />
            <div className="container">
                <div className="sidebar">
                    <h5>Category</h5>
                    <ul>
                        {["All", "Men", "Women", "Collections", "Accessories"].map((cat) => (
                            <li
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                style={{
                                    fontWeight: selectedCategory === cat ? "600" : "400",
                                    color: selectedCategory === cat ? "#007bff" : "#111",
                                    cursor: "pointer",
                                }}
                            >
                                {cat}
                            </li>
                        ))}
                    </ul>

                    <div className="filter-section">
                        <h5>Sort by Price</h5>
                        <label>
                            <input
                                type="radio"
                                name="sort"
                                onChange={() => setSortOption("price-asc")}
                                checked={sortOption === "price-asc"}
                            />
                            Low to High
                        </label>
                        <label>
                            <input
                                type="radio"
                                name="sort"
                                onChange={() => setSortOption("price-desc")}
                                checked={sortOption === "price-desc"}
                            />
                            High to Low
                        </label>
                    </div>
                </div>

                <div className="products-content">
                    <div className="top-bar">
                        <div className="search-bar">
                            <input
                                type="text"
                                placeholder="Find Products..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                            <i className="fas fa-search"></i>
                        </div>

                        <select
                            value={sortOption}
                            onChange={(e) => setSortOption(e.target.value)}
                        >
                            <option value="default">Sort By</option>
                            <option value="price-asc">Price: Low to High</option>
                            <option value="price-desc">Price: High to Low</option>
                        </select>
                    </div>

                    <div className="product-grid">
                        {filteredProducts.length > 0 ? (
                            filteredProducts.map((p) => (
                                <ProductCard key={p._id} product={p} />
                            ))
                        ) : (
                            <p>No products found.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Products;
