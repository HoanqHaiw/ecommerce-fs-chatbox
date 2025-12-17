// services/sessionService.js

class SessionManager {
    constructor() {
        this.sessions = {}; // Lưu session theo userId
    }

    // Tạo session mới nếu chưa có
    getSession(userId) {
        if (!this.sessions[userId]) {
            this.sessions[userId] = {
                lastCategory: null,
                lastProductName: null,
                lastCollectionName: null,
                lastSearchQuery: null,
                searchHistory: [],
                preferredSize: null,
                preferredPriceRange: null,
                preferredStyle: null,
                messageHistory: [],
                cart: []
            };
        }
        return this.sessions[userId];
    }

    // Cập nhật session
    updateSession(userId, data) {
        if (this.sessions[userId]) {
            this.sessions[userId] = {
                ...this.sessions[userId],
                ...data
            };
        }
    }

    // Lưu lịch sử tin nhắn
    addMessageToHistory(userId, message) {
        if (!this.sessions[userId]) this.getSession(userId);

        this.sessions[userId].messageHistory.push({
            role: message.role,
            content: message.content,
            timestamp: Date.now()
        });

        // Giới hạn lịch sử còn 50 tin nhắn gần nhất
        if (this.sessions[userId].messageHistory.length > 50) {
            this.sessions[userId].messageHistory.shift();
        }
    }

    // Xóa session theo userId
    clearSession(userId) {
        delete this.sessions[userId];
    }

    // Reset giỏ hàng
    clearCart(userId) {
        if (!this.sessions[userId]) this.getSession(userId);
        this.sessions[userId].cart = [];
    }

    // Thêm sản phẩm vào giỏ
    addToCart(userId, product) {
        if (!this.sessions[userId]) this.getSession(userId);
        this.sessions[userId].cart.push(product);
    }

    // Lấy giỏ hàng
    getCart(userId) {
        if (!this.sessions[userId]) this.getSession(userId);
        return this.sessions[userId].cart;
    }
}

export default new SessionManager();
