import React, { useState, useEffect, useRef } from "react";
import "../scss/ringCommon.scss";

const ChatBox = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([
        {
            sender: "bot",
            text: "Hello! 👋 How can I help you?",
            type: "text"
        }
    ]);
    const [input, setInput] = useState("");
    const [sessionId, setSessionId] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef(null);

    // User management
    useEffect(() => {
        const loadUser = () => {
            try {
                // Giả sử bạn có user system
                const userData = localStorage.getItem('user');
                if (userData) {
                    const user = JSON.parse(userData);
                    setUserId(user.id || user._id);
                    console.log('🔑 User logged in:', user.id);
                } else {
                    // Tạo temporary user
                    const tempUserId = 'user_' + Date.now();
                    setUserId(tempUserId);
                    localStorage.setItem('tempUser', tempUserId);
                    console.log('👤 Temporary user:', tempUserId);
                }

                // Load session
                const savedSessionId = localStorage.getItem('chatSessionId');
                if (savedSessionId) {
                    setSessionId(savedSessionId);
                    loadChatHistory(savedSessionId);
                }
            } catch (error) {
                console.error('Load user error:', error);
                setUserId('user_' + Date.now());
            }
        };

        loadUser();
    }, []);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const loadChatHistory = async (sessionId) => {
        if (!userId) return;

        try {
            const response = await fetch(`http://localhost:5000/api/chat/history/${sessionId}?userId=${userId}`);
            const data = await response.json();

            if (data.success && data.session) {
                const formattedMessages = data.session.messages.map(msg => ({
                    sender: msg.role === "user" ? "user" : "bot",
                    text: msg.content,
                    type: msg.type || "text"
                }));
                setMessages(formattedMessages);
                console.log('📁 Loaded chat history:', formattedMessages.length, 'messages');
            }
        } catch (error) {
            console.error("Error loading chat history:", error);
        }
    };

    const sendMessage = async () => {
        if (!input.trim()) return;

        setIsLoading(true);

        const userMessage = {
            sender: "user",
            text: input,
            type: "text"
        };
        setMessages(prev => [...prev, userMessage]);

        try {
            const response = await fetch("http://localhost:5000/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: input,
                    userId: userId,
                    sessionId: sessionId
                })
            });

            const data = await response.json();

            if (data.success) {
                if (data.sessionId && data.sessionId !== sessionId) {
                    setSessionId(data.sessionId);
                    localStorage.setItem("chatSessionId", data.sessionId);
                    console.log('💾 New session created:', data.sessionId);
                }

                const botMessage = {
                    sender: "bot",
                    text: data.reply,
                    type: "text"
                };
                setMessages(prev => [...prev, botMessage]);

                // Log success
                console.log('✅ Chat response received');
            } else {
                throw new Error(data.reply || "Failed to send message");
            }

        } catch (error) {
            console.error("Chat error:", error);
            const errorMessage = {
                sender: "bot",
                text: "Xin lỗi, có lỗi xảy ra. Vui lòng thử lại!",
                type: "text"
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
            setInput("");
        }
    };

    const clearChat = () => {
        setMessages([
            {
                sender: "bot",
                text: "Hello! 👋 How can I help you?",
                type: "text"
            }
        ]);
        localStorage.removeItem("chatSessionId");
        setSessionId(null);
        console.log('🗑️ Chat cleared');
    };

    const handleLogin = (userData) => {
        setUserId(userData.id);
        localStorage.setItem('user', JSON.stringify(userData));
        console.log('🔑 User logged in:', userData.id);
    };

    const handleLogout = () => {
        if (sessionId) {
            fetch(`http://localhost:5000/api/chat/session/${sessionId}/deactivate`, {
                method: 'POST'
            });
        }

        setUserId(null);
        setSessionId(null);
        localStorage.removeItem('user');
        localStorage.removeItem('chatSessionId');
        console.log('👋 User logged out');
    };

    // Format message with links
    const formatMessage = (text) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = text.split(urlRegex);

        return parts.map((part, index) => {
            if (part.match(urlRegex)) {
                return (
                    <a
                        key={index}
                        href={part}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="message-link"
                    >
                        {part}
                    </a>
                );
            }
            return part;
        });
    };

    return (
        <div className={`phone-ring chatbox ${isOpen ? "open" : ""}`}>
            {isOpen ? (
                <div className="chatbox-window">
                    <div className="chatbox-header">
                        <div className="header-left">
                            <h5>Customer Service</h5>
                            {sessionId && (
                                <span className="session-badge">💾 Đang lưu</span>
                            )}
                            {userId && (
                                <span className="user-badge">👤 {userId.substring(0, 8)}</span>
                            )}
                        </div>
                        <div className="header-right">
                            <button onClick={clearChat} className="clear-btn" title="Xóa lịch sử">
                                🗑️
                            </button>
                            <button onClick={() => setIsOpen(false)} className="close-btn">×</button>
                        </div>
                    </div>

                    <div className="chatbox-messages">
                        {messages.map((msg, index) => (
                            <div key={index} className={`message ${msg.sender}`}>
                                <div className="message-content">
                                    <p>{formatMessage(msg.text)}</p>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="message bot loading">
                                <div className="message-content">
                                    <div className="typing-indicator">
                                        <span></span>
                                        <span></span>
                                        <span></span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chatbox-input">
                        <input
                            type="text"
                            placeholder="Nhập tin nhắn..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                            disabled={isLoading}
                        />

                        <button
                            onClick={sendMessage}
                            disabled={!input.trim() || isLoading}
                            className={isLoading ? "loading" : ""}
                        >
                            {isLoading ? "⏳" : "Send"}
                        </button>
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