import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "../scss/navbar.scss";

function Navbar() {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => {
            if (window.scrollY > 50) setScrolled(true);
            else setScrolled(false);
        };
        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    return (
        <nav className={`navbar navbar-expand-lg navbar-dark bg-dark fixed-top ${scrolled ? "navbar-shrink" : ""}`}>
            <div className="container-fluid px-4">
                <Link className="navbar-brand fw-bold" to="/">
                    DOANTONG OUTLET
                </Link>
                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarNav"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse justify-content-end" id="navbarNav">
                    <ul className="navbar-nav">
                        <li className="nav-item"><Link className="nav-link" to="/">Home</Link></li>
                        <li className="nav-item"><Link className="nav-link" to="/products">All</Link></li>
                        <li className="nav-item"><Link className="nav-link" to="/collections">Collections</Link></li>
                        <li className="nav-item"><Link className="nav-link" to="/cart">Cart</Link></li>
                        <li className="nav-item"><Link className="nav-link" to="/contact">Contact</Link></li>
                        <li className="nav-item"><Link className="nav-link" to="/about">About</Link></li>
                    </ul>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;