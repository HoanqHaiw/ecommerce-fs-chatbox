import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../Component/Navbar";
import ProductCard from "../Component/ProductCard";
import "../scss/products.scss";
import axios from "axios";

const Products = () => {
    const [products, setProducts] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchTerm, setSearchTerm] = useState("");
    const [sortOption, setSortOption] = useState("default");
    const [currentPage, setCurrentPage] = useState(1);
    const [productsPerPage] = useState(8); // Thêm phân trang

    const navigate = useNavigate();

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const res = await axios.get("http://localhost:5000/api/products");
                setProducts(res.data.products || []);
            } catch (error) {
                console.error("error get products", error);
            }
        };
        fetchProducts();
    }, []);

    const handleCategoryClick = (cat) => {
        if (cat === "Collections") {
            navigate("/collections");
        } else {
            setSelectedCategory(cat);
            setCurrentPage(1); // Reset về trang 1
        }
    };

    const filteredProducts = products
        .filter((p) =>
            selectedCategory === "All" ? true : p.category === selectedCategory
        )
        .filter((p) => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
        .sort((a, b) => {
            if (sortOption === "price-asc") return a.price - b.price;
            if (sortOption === "price-desc") return b.price - a.price;
            return 0;
        });

    // Phân trang
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

    const paginate = (pageNumber) => setCurrentPage(pageNumber);
    const nextPage = () => currentPage < totalPages && setCurrentPage(currentPage + 1);
    const prevPage = () => currentPage > 1 && setCurrentPage(currentPage - 1);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, sortOption, selectedCategory]);

    return (
        <div className="products-page">
            <Navbar />
            <div className="container">
                <div className="sidebar">
                    <h5>Category</h5>
                    <ul>
                        {["All", "Men", "Women", "Collections", "Accessories"].map(
                            (cat) => (
                                <li
                                    key={cat}
                                    onClick={() => handleCategoryClick(cat)}
                                    className={selectedCategory === cat ? "active-category" : ""}
                                >
                                    {cat}
                                </li>
                            )
                        )}
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

                    {/* Thông tin phân trang */}
                    <div className="pagination-info">
                        <p>
                            Showing {indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, filteredProducts.length)} of {filteredProducts.length} products
                        </p>
                    </div>

                    <div className="product-grid">
                        {currentProducts.length > 0 ? (
                            currentProducts.map((p) => (
                                <ProductCard key={p._id} product={p} />
                            ))
                        ) : (
                            <p>No products found.</p>
                        )}
                    </div>

                    {/* Phân trang */}
                    {totalPages > 1 && (
                        <div className="pagination">
                            <button
                                onClick={prevPage}
                                disabled={currentPage === 1}
                                className="pagination-btn"
                            >
                                ← Previous
                            </button>

                            {Array.from({ length: totalPages }, (_, i) => i + 1).map(number => (
                                <button
                                    key={number}
                                    onClick={() => paginate(number)}
                                    className={`pagination-btn ${currentPage === number ? 'active' : ''}`}
                                >
                                    {number}
                                </button>
                            ))}

                            <button
                                onClick={nextPage}
                                disabled={currentPage === totalPages}
                                className="pagination-btn"
                            >
                                Next →
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Products;