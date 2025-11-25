import express from "express";
import { GoogleGenerativeAI } from "@google/generative-ai";
import Product from "../models/productModel.js";
import Order from "../models/orderModel.js";
import ChatSession from "../models/ChatSession.js";
import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// Initialize Gemini
let genAI = null;
const initializeGemini = () => {
    if (!genAI && process.env.GEMINI_API_KEY) {
        genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        console.log('✅ Gemini AI initialized');
    }
    return genAI;
};

// Product Service với Link Generation
class ProductService {
    static generateProductLink(productId) {
        return `http://localhost:3000/products/${productId}`;
    }

    static async searchProducts(query = "", filters = {}) {
        try {
            let searchConditions = {};

            if (query) {
                searchConditions.$or = [
                    { name: { $regex: query, $options: 'i' } },
                    { category: { $regex: query, $options: 'i' } },
                    { collections: { $regex: query, $options: 'i' } },
                    { description: { $regex: query, $options: 'i' } }
                ];
            }

            if (filters.priceRange) {
                switch (filters.priceRange) {
                    case "under-500k": searchConditions.price = { $lt: 500000 }; break;
                    case "500k-1m": searchConditions.price = { $gte: 500000, $lte: 1000000 }; break;
                    case "1m-2m": searchConditions.price = { $gte: 1000000, $lte: 2000000 }; break;
                    case "over-2m": searchConditions.price = { $gt: 2000000 }; break;
                }
            }

            const products = await Product.find(searchConditions).limit(6);

            return products.map(product => ({
                id: product._id.toString(),
                name: product.name,
                price: product.price,
                category: product.category,
                description: product.description,
                images: product.images,
                stock: product.stock,
                sizes: product.sizes,
                link: this.generateProductLink(product._id.toString())
            }));
        } catch (error) {
            console.error('Product search error:', error);
            return [];
        }
    }

    static async getProductById(productId) {
        try {
            const product = await Product.findById(productId);
            if (!product) return null;

            return {
                id: product._id.toString(),
                name: product.name,
                price: product.price,
                category: product.category,
                description: product.description,
                images: product.images,
                stock: product.stock,
                sizes: product.sizes,
                link: this.generateProductLink(product._id.toString())
            };
        } catch (error) {
            console.error('Get product error:', error);
            return null;
        }
    }

    static async getFeaturedProducts() {
        try {
            const products = await Product.find().limit(4).sort({ createdAt: -1 });
            return this.formatProductResponse(products);
        } catch (error) {
            console.error('Get featured products error:', error);
            return [];
        }
    }

    static formatProductResponse(products) {
        return products.map(product => ({
            id: product._id.toString(),
            name: product.name,
            price: product.price,
            category: product.category,
            description: product.description,
            images: product.images,
            stock: product.stock,
            sizes: product.sizes,
            link: this.generateProductLink(product._id.toString())
        }));
    }
}

// Order Service - Lấy Data Thực
class OrderService {
    static async getOrderByPhone(phone) {
        try {
            const order = await Order.findOne({ phone: phone });

            if (!order) {
                console.log(`📦 No order found for phone: ${phone}`);
                return null;
            }

            console.log(`📦 Found order:`, {
                id: order._id,
                customer: order.customerName,
                status: order.status,
                total: order.total
            });

            return {
                id: order._id.toString(),
                status: order.status,
                total: order.total,
                customerName: order.customerName,
                phone: order.phone,
                items: order.items.map(item => ({
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    size: item.size,
                    color: item.color
                })),
                createdAt: order.createdAt
            };
        } catch (error) {
            console.error('❌ Get order error:', error);
            return null;
        }
    }

    static async getAllOrders() {
        try {
            return await Order.find().limit(5);
        } catch (error) {
            console.error('Get all orders error:', error);
            return [];
        }
    }
}

// Session Manager với Persistence
class SessionManager {
    static async getOrCreateSession(userId, sessionId = null) {
        try {
            if (!userId) {
                throw new Error("User ID is required for persistent sessions");
            }

            console.log('🔑 User session for:', userId);

            let session;

            if (sessionId) {
                session = await ChatSession.findOne({ sessionId, userId: userId });
            } else {
                session = await ChatSession.findOne({ userId: userId, isActive: true })
                    .sort({ updatedAt: -1 });

                if (!session) {
                    session = await ChatSession.findOne({ userId: userId })
                        .sort({ updatedAt: -1 });
                }
            }

            if (session) {
                console.log('📁 Loaded existing session:', session.sessionId);
                return session;
            }

            const newSession = new ChatSession({
                userId: userId,
                sessionId: uuidv4(),
                messages: [{
                    role: "assistant",
                    content: "Xin chào! Tôi có thể giúp gì cho bạn?",
                    type: "text",
                    timestamp: new Date()
                }],
                context: {},
                title: "Cuộc trò chuyện mới",
                isActive: true
            });

            const savedSession = await newSession.save();
            console.log('🆕 Created new session:', savedSession.sessionId);
            return savedSession;
        } catch (error) {
            console.error('❌ Session error:', error);
            throw error;
        }
    }

    static async addMessage(sessionId, messageData) {
        try {
            const { role, content, type = "text", metadata = {} } = messageData;

            return await ChatSession.findOneAndUpdate(
                { sessionId },
                {
                    $push: {
                        messages: {
                            role,
                            content,
                            type,
                            metadata,
                            timestamp: new Date()
                        }
                    }
                },
                { new: true }
            );
        } catch (error) {
            console.error('Add message error:', error);
        }
    }

    static async getUserSessions(userId) {
        try {
            return await ChatSession.find({ userId })
                .sort({ updatedAt: -1 })
                .select('sessionId title createdAt updatedAt messages isActive');
        } catch (error) {
            console.error('Get user sessions error:', error);
            return [];
        }
    }

    static async deactivateSession(sessionId) {
        try {
            return await ChatSession.findOneAndUpdate(
                { sessionId },
                { isActive: false },
                { new: true }
            );
        } catch (error) {
            console.error('Deactivate session error:', error);
        }
    }
}

// Simple Shoe Bot với Link Support
class SimpleShoeBot {
    static responses = {
        greeting: [
            "Xin chào! 👋 Tôi là trợ lý ảo của cửa hàng giày. Tôi có thể giúp gì cho bạn?",
            "Chào bạn! 😊 Bạn cần tìm giày gì hôm nay?",
            "Hi! Tôi có thể giúp bạn tìm giày, kiểm tra đơn hàng hoặc tư vấn sản phẩm!",
            "Chào mừng bạn đến với cửa hàng giày! 🏪 Tôi có thể hỗ trợ gì cho bạn?"
        ],
        help: [
            `Tôi có thể giúp bạn:

🔍 **TÌM GIÀY & GỬI LINK** 
• "tìm giày thể thao"
• "gửi link giày sneaker"
• "kiếm giày công sở"

📦 **KIỂM TRA ĐƠN**
• "check đơn 0987654321"
• "tra cứu đơn hàng"

⭐ **SẢN PHẨM**
• "sản phẩm mới"
• "giày bán chạy" 

Hãy nói cho tôi biết bạn cần gì! 😊`
        ],
        fallback: [
            `Tôi chưa hiểu rõ lắm 🤔 Bạn có thể:

• Tìm giày: "tìm giày sneaker", "kiếm giày công sở"
• Gửi link: "gửi link giày thể thao"
• Check đơn: "tra cứu đơn 0987654321" 
• Xem sản phẩm: "giày thể thao", "sản phẩm mới"

Hoặc gõ "giúp" để xem hướng dẫn đầy đủ!`
        ]
    };

    static async processMessage(message, session) {
        const lowerMessage = message.toLowerCase().trim();

        console.log('🤖 SimpleBot processing:', lowerMessage);

        if (this.isGreeting(lowerMessage)) {
            return this.getRandomResponse(this.responses.greeting);
        }

        if (this.isHelpRequest(lowerMessage)) {
            return this.getRandomResponse(this.responses.help);
        }

        if (this.isLinkRequest(lowerMessage)) {
            return await this.handleLinkRequest(message);
        }

        if (this.isProductSearch(lowerMessage)) {
            return await this.handleProductSearch(lowerMessage);
        }

        if (this.isOrderCheck(lowerMessage)) {
            return await this.handleOrderCheck(lowerMessage);
        }

        if (this.isFeaturedRequest(lowerMessage)) {
            return await this.handleFeaturedProducts();
        }

        return this.getRandomResponse(this.responses.fallback);
    }

    static isGreeting(message) {
        const greetings = ['chào', 'hello', 'hi', 'xin chào', 'có ai không', 'helo', 'hêllo'];
        return greetings.some(greet => message.includes(greet));
    }

    static isHelpRequest(message) {
        return message.includes('giúp') || message.includes('help') ||
            message.includes('làm gì') || message.includes('chức năng');
    }

    static isLinkRequest(message) {
        const linkKeywords = ['gửi link', 'cho link', 'gửi tôi link', 'link sản phẩm', 'liên kết', 'gửi tôi link giày'];
        return linkKeywords.some(keyword => message.includes(keyword));
    }

    static isProductSearch(message) {
        return message.includes('tìm') || message.includes('kiếm') ||
            message.includes('giày') || message.includes('sneaker') ||
            message.includes('sản phẩm') || message.includes('mua');
    }

    static isOrderCheck(message) {
        return message.includes('đơn') || message.includes('order') ||
            message.includes('check') || message.includes('tra cứu') ||
            /\d{10,11}/.test(message);
    }

    static isFeaturedRequest(message) {
        return message.includes('mới') || message.includes('nổi bật') ||
            message.includes('bán chạy') || message.includes('featured');
    }

    static getRandomResponse(responses) {
        return responses[Math.floor(Math.random() * responses.length)];
    }

    static async handleLinkRequest(message) {
        try {
            const productName = message.replace(/(gửi|cho|xem|link|liên kết|sản phẩm|giày)\s*/gi, '').trim();

            if (!productName || productName.length < 2) {
                return "🔍 Vui lòng cho tôi biết tên sản phẩm bạn muốn xem link. Ví dụ: 'gửi link giày sneaker'";
            }

            const products = await ProductService.searchProducts(productName);

            if (products.length === 0) {
                return `❌ Không tìm thấy sản phẩm "${productName}". Thử tìm sản phẩm khác nhé!`;
            }

            const product = products[0];

            let response = `🔗 **LINK SẢN PHẨM**\n\n`;
            response += `**${product.name}**\n`;
            response += `💵 ${product.price?.toLocaleString('vi-VN')} VND\n`;
            response += `📦 ${product.stock > 0 ? '✅ Còn hàng' : '❌ Hết hàng'}\n`;
            response += `🏷️ ${product.category}\n\n`;
            response += `👉 [BẤM VÀO ĐÂY ĐỂ XEM CHI TIẾT](${product.link})`;
            response += `\n\n💡 *Copy link này để chia sẻ: ${product.link}*`;

            return response;
        } catch (error) {
            console.error('❌ Link request error:', error);
            return "❌ Lỗi tìm kiếm sản phẩm. Vui lòng thử lại!";
        }
    }

    static async handleProductSearch(message) {
        try {
            let query = 'giày';
            const searchTerms = ['sneaker', 'thể thao', 'chạy bộ', 'công sở', 'casual'];

            const foundTerm = searchTerms.find(term => message.includes(term));
            if (foundTerm) {
                query = foundTerm;
            } else {
                const afterSearch = message.replace(/(tìm|kiếm|mua|xem)\s*/g, '').trim();
                if (afterSearch && afterSearch.length > 2) {
                    query = afterSearch;
                }
            }

            const products = await ProductService.searchProducts(query);

            if (products.length === 0) {
                return `❌ Không tìm thấy sản phẩm "${query}". Thử tìm:\n• "tìm giày thể thao"\n• "kiếm sneaker"\n• "giày công sở"`;
            }

            let response = `👟 **TÌM THẤY ${products.length} SẢN PHẨM**\n\n`;
            products.forEach((product, index) => {
                response += `${index + 1}. **${product.name}**\n`;
                response += `   💵 ${product.price?.toLocaleString('vi-VN')} VND\n`;
                response += `   📦 ${product.stock > 0 ? '✅ Còn hàng' : '❌ Hết hàng'}\n`;
                response += `   🏷️ ${product.category}\n`;
                response += `   🔗 [Xem chi tiết](${product.link})\n\n`;
            });

            response += "💡 *Gõ 'tìm [tên giày]' để tìm thêm sản phẩm khác!*";

            return response;
        } catch (error) {
            console.error('❌ Search error:', error);
            return "❌ Lỗi tìm kiếm sản phẩm. Vui lòng thử lại sau!";
        }
    }

    static async handleOrderCheck(message) {
        try {
            const phoneMatch = message.match(/(\d{10,11})/);
            if (!phoneMatch) {
                return "📞 **VUI LÒNG CUNG CẤP SỐ ĐIỆN THOẠI**\nGõ: 'check đơn 0987654321' để tra cứu đơn hàng.";
            }

            const phone = phoneMatch[1];
            const order = await OrderService.getOrderByPhone(phone);

            if (!order) {
                return `❌ **KHÔNG TÌM THẤY ĐƠN HÀNG**\nSố điện thoại: ${phone}\n\n💡 Kiểm tra lại số điện thoại hoặc liên hệ hotline!`;
            }

            let response = `📦 **THÔNG TIN ĐƠN HÀNG**\n\n`;
            response += `🔢 **Mã đơn:** #${order.id.slice(-6).toUpperCase()}\n`;
            response += `👤 **Khách hàng:** ${order.customerName}\n`;
            response += `📞 **SĐT:** ${order.phone}\n`;
            response += `📊 **Trạng thái:** ${this.getStatusText(order.status)}\n`;
            response += `💰 **Tổng tiền:** ${order.total.toLocaleString('vi-VN')} VND\n`;
            response += `🛍️ **Sản phẩm (${order.items.length}):**\n`;

            order.items.forEach((item, index) => {
                response += `   ${index + 1}. ${item.name}`;
                if (item.size) response += ` - Size: ${item.size}`;
                if (item.color) response += ` - Màu: ${item.color}`;
                response += ` - SL: ${item.quantity}\n`;
            });

            response += `\n📅 **Ngày đặt:** ${order.createdAt.toLocaleDateString('vi-VN')}`;

            return response;
        } catch (error) {
            console.error('❌ Order check error:', error);
            return "❌ Lỗi tra cứu đơn hàng. Vui lòng thử lại sau!";
        }
    }

    static async handleFeaturedProducts() {
        try {
            const products = await ProductService.getFeaturedProducts();

            if (products.length === 0) {
                return "❌ Hiện chưa có sản phẩm nổi bật. Vui lòng quay lại sau!";
            }

            let response = "⭐ **SẢN PHẨM NỔI BẬT**\n\n";
            products.forEach((product, index) => {
                response += `${index + 1}. **${product.name}**\n`;
                response += `   💵 ${product.price?.toLocaleString('vi-VN')} VND\n`;
                response += `   📦 ${product.stock > 0 ? '✅ Còn hàng' : '❌ Hết hàng'}\n`;
                response += `   🏷️ ${product.category}\n`;
                response += `   🔗 [Xem chi tiết](${product.link})\n\n`;
            });

            return response;
        } catch (error) {
            console.error('Featured products error:', error);
            return "❌ Lỗi tải sản phẩm nổi bật. Vui lòng thử lại!";
        }
    }

    static getStatusText(status) {
        const statusMap = {
            'pending': '🟡 Đang xử lý',
            'confirmed': '🔵 Đã xác nhận',
            'shipping': '🚚 Đang giao hàng',
            'completed': '✅ Hoàn thành',
            'cancelled': '❌ Đã hủy'
        };
        return statusMap[status] || status;
    }
}

// Main Chat Endpoint
router.post("/", async (req, res) => {
    try {
        const { message, userId, sessionId } = req.body;
        const userMessage = message?.trim();

        if (!userMessage) {
            return res.status(400).json({
                success: false,
                reply: "Vui lòng nhập tin nhắn."
            });
        }

        console.log('💬 User message:', userMessage, 'UserId:', userId);

        let finalResponse;
        let responseSessionId = sessionId;
        let responseMetadata = {};

        // LUÔN DÙNG SIMPLE BOT
        finalResponse = await SimpleShoeBot.processMessage(userMessage);

        // Try to save to session if userId provided
        if (userId && userId !== 'anonymous') {
            try {
                const chatSession = await SessionManager.getOrCreateSession(userId, sessionId);
                await SessionManager.addMessage(chatSession.sessionId, {
                    role: "user",
                    content: userMessage
                });
                await SessionManager.addMessage(chatSession.sessionId, {
                    role: "assistant",
                    content: finalResponse
                });
                responseSessionId = chatSession.sessionId;

                console.log('💾 Saved to session:', responseSessionId);
            } catch (sessionError) {
                console.log('Session error:', sessionError.message);
            }
        }

        res.json({
            success: true,
            reply: finalResponse,
            sessionId: responseSessionId,
            userId: userId,
            metadata: responseMetadata
        });

    } catch (error) {
        console.error("💥 Chatbot error:", error);

        res.json({
            success: false,
            reply: "Xin chào! Tôi là trợ lý ảo ShoeBot. Hiện tôi có thể giúp bạn tìm giày và kiểm tra đơn hàng. Hãy cho tôi biết bạn cần gì! 😊"
        });
    }
});

// Get chat history
router.get("/history/:sessionId", async (req, res) => {
    try {
        const { sessionId } = req.params;
        const { userId } = req.query;

        const chatSession = await ChatSession.findOne({ sessionId, userId });

        if (!chatSession) {
            return res.status(404).json({
                success: false,
                message: "Không tìm thấy session chat"
            });
        }

        res.json({
            success: true,
            session: {
                sessionId: chatSession.sessionId,
                userId: chatSession.userId,
                messages: chatSession.messages,
                createdAt: chatSession.createdAt,
                updatedAt: chatSession.updatedAt
            }
        });
    } catch (error) {
        console.error("Error fetching chat history:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy lịch sử chat"
        });
    }
});

// Get user sessions
router.get("/sessions/:userId", async (req, res) => {
    try {
        const { userId } = req.params;

        const sessions = await SessionManager.getUserSessions(userId);

        res.json({
            success: true,
            sessions: sessions.map(session => ({
                sessionId: session.sessionId,
                title: session.title,
                createdAt: session.createdAt,
                updatedAt: session.updatedAt,
                messageCount: session.messages.length,
                isActive: session.isActive,
                preview: session.messages.slice(-2).map(msg => ({
                    role: msg.role,
                    content: msg.content.substring(0, 50) + '...'
                }))
            }))
        });
    } catch (error) {
        console.error("Get sessions error:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách cuộc hội thoại"
        });
    }
});

// Deactivate session
router.post("/session/:sessionId/deactivate", async (req, res) => {
    try {
        const { sessionId } = req.params;

        await SessionManager.deactivateSession(sessionId);

        res.json({
            success: true,
            message: "Đã đóng phiên chat"
        });
    } catch (error) {
        console.error("Deactivate session error:", error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi đóng phiên chat"
        });
    }
});

// Debug endpoint to see all orders
router.get("/debug/orders", async (req, res) => {
    try {
        const orders = await OrderService.getAllOrders();

        res.json({
            success: true,
            orders: orders.map(order => ({
                id: order._id.toString(),
                customerName: order.customerName,
                phone: order.phone,
                status: order.status,
                total: order.total,
                items: order.items
            }))
        });
    } catch (error) {
        console.error('Debug orders error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách đơn hàng"
        });
    }
});

// Debug endpoint to see all products
router.get("/debug/products", async (req, res) => {
    try {
        const products = await Product.find().limit(10);

        res.json({
            success: true,
            products: products.map(product => ({
                id: product._id.toString(),
                name: product.name,
                price: product.price,
                category: product.category,
                stock: product.stock
            }))
        });
    } catch (error) {
        console.error('Debug products error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi khi lấy danh sách sản phẩm"
        });
    }
});

export default router;