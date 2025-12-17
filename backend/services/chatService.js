// services/chatService.js

import SessionManager from "./sessionService.js";
import { askAI } from "./aiService.js";

class ChatService {

    /**
     * Xử lý tin nhắn từ người dùng
     * @param {string} userId - ID của user (client tự gửi hoặc server sinh)
     * @param {string} message - Nội dung tin nhắn
     */
    async handleUserMessage(userId, message) {

        // 1. Lấy hoặc tạo session cho user
        const session = SessionManager.getSession(userId);

        // 2. Lưu lịch sử message
        SessionManager.addMessageToHistory(userId, {
            role: "user",
            content: message
        });

        // 3. Gọi AI xử lý tin nhắn
        const botReply = await askAI(message, session);

        // 4. Lưu lịch sử bot trả lời
        SessionManager.addMessageToHistory(userId, {
            role: "assistant",
            content: botReply
        });

        // 5. Trả về response
        return {
            reply: botReply,
            session
        };
    }
}

export default new ChatService();
