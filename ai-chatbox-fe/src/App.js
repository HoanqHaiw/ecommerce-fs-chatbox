import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./Component/Navbar";
import Home from "./page/Home";
import Products from "./page/Products";
import ProductDetail from "./page/ProductDetail";
import Cart from "./page/cart";
import Contact from "./page/Contact";
import About from "./page/About";
import Footer from "./Component/Footer";
import { CartProvider } from "./context/CartContext";
import CartSidebar from "./Component/CartSidebar";
import PhoneRing from "./Component/PhoneRing";
import ChatBox from "./Component/Chatbox";
import Collections from "./page/Collections";
import CollectionDetail from "./page/CollectionDetail";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CheckOrder from "./page/checkorder.jsx";
import "./scss/app.scss";
import "./scss/cartSidebar.scss";
import "./scss/ringCommon.scss";
import "./scss/floatingButtons.scss";

function App() {
  return (
    <CartProvider>
      <BrowserRouter>
        <div className="app-wrapper">
          <Navbar />
          <CartSidebar />
          <main className="content">
            <div className="container py-5">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/products/:id" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/check-order" element={<CheckOrder />} />
                <Route path="/collections" element={<Collections />} />
                <Route path="/collections/:id" element={<CollectionDetail />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/about" element={<About />} />
              </Routes>
            </div>
          </main>

          <Footer />
          <div className="floating-buttons">
            <PhoneRing />
            <ChatBox />
          </div>
        </div>
      </BrowserRouter>
    </CartProvider>
  );
}

export default App;
