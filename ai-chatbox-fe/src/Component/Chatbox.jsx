import React, { useState } from "react";
import "../scss/ringCommon.scss";

const ChatBox = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className={`phone-ring chatbox ${isOpen ? "open" : ""}`}>
            {isOpen ? (
                <div className="chatbox-window">
                    <div className="chatbox-header">
                        <h5>Customer Service</h5>
                        <button onClick={() => setIsOpen(false)} className="close-btn">
                            ×
                        </button>
                    </div>
                    <div className="chatbox-messages">
                        <div className="message bot">Hello! 👋 How can I help you?</div>
                    </div>
                    <div className="chatbox-input">
                        <input type="text" placeholder="Nhập tin nhắn..." />
                        <button>Send</button>
                    </div>
                </div>
            ) : (
                <div className="ring-content" onClick={() => setIsOpen(true)}>
                    <span className="phone-icon">💬</span>
                    <span className="phone-text">Chat Us</span>
                </div>
            )}
            {!isOpen && (
                <>
                    <div className="ring-circle"></div>
                    <div className="ring-circle-fill"></div>
                </>
            )}
        </div>
    );
};

export default ChatBox;
