import React from "react";
import "../scss/phoneRing.scss";

const PhoneRing = () => {
    return (
        <div className="phone-ring">
            <div className="ring-circle"></div>
            <div className="ring-circle-fill"></div>

            <div className="ring-content">
                <a href="tel:0123456789" className="phone-link" title="Contact Us">
                    <span className="phone-icon">📞</span>
                    <span className="phone-text">Contact Us</span>
                </a>
            </div>
        </div>
    );
};

export default PhoneRing;
