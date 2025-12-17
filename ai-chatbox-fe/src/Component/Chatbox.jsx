import { useState, useEffect, useRef, useCallback } from "react";
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
    const [isRecording, setIsRecording] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const messagesEndRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const audioChunksRef = useRef([]);
    const fileInputRef = useRef(null);

    // Format message with markdown links & URLs
    const formatMessage = (text) => {
        // First handle markdown links [text](url)
        const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        let result = text;
        const markdownMatches = [];
        
        let match;
        while ((match = markdownLinkRegex.exec(text)) !== null) {
            markdownMatches.push({
                full: match[0],
                text: match[1],
                url: match[2]
            });
        }

        // Split by markdown links
        let parts = [text];
        markdownMatches.forEach(md => {
            parts = parts.flatMap(part => {
                if (typeof part === 'string') {
                    return part.split(md.full);
                }
                return part;
            });
        });

        // Process parts and insert markdown links
        let partIndex = 0;
        const processedParts = [];
        let currentIndex = 0;

        for (let i = 0; i < markdownMatches.length; i++) {
            const md = markdownMatches[i];
            const textBeforeLink = text.substring(currentIndex, text.indexOf(md.full, currentIndex));
            if (textBeforeLink) {
                processedParts.push(textBeforeLink);
            }
            
            processedParts.push(
                <a
                    key={`md-link-${i}`}
                    href={md.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="message-link"
                >
                    {md.text}
                </a>
            );
            
            currentIndex = text.indexOf(md.full, currentIndex) + md.full.length;
        }

        if (currentIndex < text.length) {
            processedParts.push(text.substring(currentIndex));
        }

        // Also handle plain URLs (fallback)
        if (markdownMatches.length === 0) {
            const urlRegex = /(https?:\/\/[^\s\n]+)/g;
            parts = text.split(urlRegex);

            return parts.map((part, index) => {
                if (part && part.match(urlRegex)) {
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
        }

        return processedParts;
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Voice Recording Functions
    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorderRef.current = new MediaRecorder(stream);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (e) => {
                audioChunksRef.current.push(e.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
                await sendAudio(audioBlob);
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
        } catch (error) {
            console.error("Microphone access error:", error);
            alert("Không thể truy cập microphone");
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    const sendAudio = async (audioBlob) => {
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.webm");
        formData.append("userId", userId);
        formData.append("sessionId", sessionId || "");

        const userMessage = {
            sender: "user",
            text: "🎤 Tin nhắn ghi âm",
            type: "audio"
        };
        setMessages(prev => [...prev, userMessage]);
        setIsLoading(true);

        try {
            const response = await fetch("http://localhost:5000/api/chat/audio", {
                method: "POST",
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                if (data.sessionId && data.sessionId !== sessionId) {
                    setSessionId(data.sessionId);
                    localStorage.setItem("chatSessionId", data.sessionId);
                }
                // Simulate typing delay
                await new Promise(resolve => setTimeout(resolve, 2000));
                const botMessage = {
                    sender: "bot",
                    text: data.reply,
                    type: "text"
                };
                setMessages(prev => [...prev, botMessage]);
            }
        } catch (error) {
            console.error("Audio send error:", error);
            const errorMessage = {
                sender: "bot",
                text: "Xin lỗi, có lỗi xảy ra khi xử lý ghi âm!",
                type: "text"
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    // File Upload Functions
    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validate file type
        const validTypes = ["image/jpeg", "image/png", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
        if (!validTypes.includes(file.type)) {
            alert("Chỉ hỗ trợ: JPG, PNG, PDF, DOC, DOCX");
            return;
        }

        // Validate file size (5MB max)
        if (file.size > 5 * 1024 * 1024) {
            alert("File không quá 5MB");
            return;
        }

        setSelectedFile(file);
    };

    const sendFile = async () => {
        if (!selectedFile) return;

        const formData = new FormData();
        formData.append("file", selectedFile);
        formData.append("userId", userId);
        formData.append("sessionId", sessionId || "");

        const userMessage = {
            sender: "user",
            text: `📎 ${selectedFile.name}`,
            type: "file",
            fileName: selectedFile.name
        };
        setMessages(prev => [...prev, userMessage]);
        setSelectedFile(null);
        setIsLoading(true);

        try {
            const response = await fetch("http://localhost:5000/api/chat/file", {
                method: "POST",
                body: formData
            });

            const data = await response.json();
            if (data.success) {
                if (data.sessionId && data.sessionId !== sessionId) {
                    setSessionId(data.sessionId);
                    localStorage.setItem("chatSessionId", data.sessionId);
                }
                // Simulate typing delay
                await new Promise(resolve => setTimeout(resolve, 2000));
                const botMessage = {
                    sender: "bot",
                    text: data.reply,
                    type: "text"
                };
                setMessages(prev => [...prev, botMessage]);
            }
        } catch (error) {
            console.error("File send error:", error);
            const errorMessage = {
                sender: "bot",
                text: "Xin lỗi, có lỗi xảy ra khi xử lý file!",
                type: "text"
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    // Define loadChatHistory with useCallback to avoid dependency issues
    const loadChatHistory = useCallback(async (sessionId) => {
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
    }, [userId]);

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
    }, [loadChatHistory]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const sendMessage = async () => {
        if (!input.trim()) return;

        setIsLoading(true);

        const userMessage = {
            sender: "user",
            text: input,
            type: "text"
        };
        setMessages(prev => [...prev, userMessage]);
        setInput("");

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

                // Typing indicator delay (2 seconds)
                await new Promise(resolve => setTimeout(resolve, 2000));

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

    return (
        <div className={`phone-ring chatbox ${isOpen ? "open" : ""}`}>
            {isOpen ? (
                <div className="chatbox-window">
                    <div className="chatbox-header">
                        <div className="header-left">
                            <h5>Customer Service</h5>
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
                        <input type="file" ref={fileInputRef} onChange={handleFileSelect} style={{ display: "none" }} accept=".jpg,.jpeg,.png,.pdf,.doc,.docx" />

                        {selectedFile && (
                            <div className="file-preview">
                                <span>📎 {selectedFile.name}</span>
                                <button onClick={() => setSelectedFile(null)}>✕</button>
                                <button onClick={sendFile} className="send-file-btn">Send</button>
                            </div>
                        )}

                        <div className="input-controls">
                            <input
                                type="text"
                                placeholder={isRecording ? "🎤 Đang ghi âm..." : "Nhập tin nhắn..."}
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && !isRecording && sendMessage()}
                                disabled={isLoading || isRecording}
                            />

                            <button
                                className={`mic-btn ${isRecording ? "recording" : ""}`}
                                onMouseDown={startRecording}
                                onMouseUp={stopRecording}
                                onTouchStart={startRecording}
                                onTouchEnd={stopRecording}
                                disabled={isLoading}
                                title="Nhấn giữ để ghi âm"
                            >
                                {isRecording ? "🎙️" : "🎤"}
                            </button>

                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isLoading || isRecording}
                                className="file-btn"
                                title="Đính kèm file"
                            >
                                📎
                            </button>

                            <button
                                onClick={sendMessage}
                                disabled={!input.trim() || isLoading || isRecording}
                                className={isLoading ? "loading" : ""}
                            >
                                {isLoading ? "⏳" : "Send"}
                            </button>
                        </div>
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