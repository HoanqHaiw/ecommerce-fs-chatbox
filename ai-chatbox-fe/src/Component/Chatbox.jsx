import React, { useState } from "react";
import "../scss/chatBox.scss";

const ChatBox = () => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <div className={`chatbox-container ${isOpen ? "open" : ""}`}>
                {isOpen ? (
                    <div className="chatbox-window">
                        <div className="chatbox-header">
                            <h5>Hỗ trợ khách hàng</h5>
                            <button onClick={() => setIsOpen(false)} className="close-btn">
                                ×
                            </button>
                        </div>
                        <div className="chatbox-messages">
                            <div className="message bot">
                                Xin chào! 👋 Tôi có thể giúp gì cho bạn?
                            </div>
                        </div>
                        <div className="chatbox-input">
                            <input type="text" placeholder="Nhập tin nhắn..." />
                            <button>Gửi</button>
                        </div>
                    </div>
                ) : (
                    <button className="chatbox-toggle" onClick={() => setIsOpen(true)}>
                        💬
                    </button>
                )}
            </div>
        </>
    );
};

export default ChatBox;
