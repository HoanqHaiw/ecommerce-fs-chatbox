import express from "express";
import Product from "../models/productModel.js";
import Order from "../models/orderModel.js";
import ChatSession from "../models/ChatSession.js";
import { v4 as uuidv4 } from "uuid";

const router = express.Router();

// Product Service - Optimized for Nike products
class ProductService {
    static generateProductLink(productId) {
        return `http://localhost:3000/products/${productId}`;
    }

    static async searchProducts(query = "", category = "", collection = "") {
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

            if (category && category !== 'all') {
                searchConditions.category = { $regex: category, $options: 'i' };
            }

            if (collection && collection !== 'all') {
                searchConditions.collections = { $regex: collection, $options: 'i' };
            }

            const products = await Product.find(searchConditions).limit(8);
            return this.formatProductResponse(products);
        } catch (error) {
            console.error('Product search error:', error);
            return [];
        }
    }

    static async searchByCollection(collectionName) {
        try {
            const products = await Product.find({
                collections: { $regex: collectionName, $options: 'i' }
            }).limit(10);

            return this.formatProductResponse(products);
        } catch (error) {
            console.error('Collection search error:', error);
            return [];
        }
    }

    static async searchAccessories() {
        try {
            const products = await Product.find({
                category: { $regex: 'accessories', $options: 'i' }
            }).limit(8);

            return this.formatProductResponse(products);
        } catch (error) {
            console.error('Accessories search error:', error);
            return [];
        }
    }

    static async getAvailableSizes(productName) {
        try {
            const product = await Product.findOne({
                name: { $regex: productName, $options: 'i' }
            });

            if (!product || !product.sizes || product.sizes.length === 0) {
                return null;
            }

            const availableSizes = product.sizes
                .filter(sizeInfo => sizeInfo.quantity > 0)
                .map(sizeInfo => sizeInfo.size)
                .sort((a, b) => a - b);

            return {
                productName: product.name,
                availableSizes: availableSizes,
                price: product.price,
                collection: product.collections
            };
        } catch (error) {
            console.error('Get sizes error:', error);
            return null;
        }
    }

    static async getCollections() {
        try {
            const collections = await Product.distinct('collections');
            return collections.filter(collection => collection && collection.trim() !== '');
        } catch (error) {
            console.error('Get collections error:', error);
            return ['Classic Streetwear', 'Best Seller', 'New Arrivals', 'Summer 2025'];
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
            collections: product.collections,
            link: this.generateProductLink(product._id.toString())
        }));
    }
}

// Session Manager
class SessionManager {
    static async getOrCreateSession(userId, sessionId = null) {
        try {
            if (!userId) throw new Error("User ID is required");

            let session;

            if (sessionId) {
                session = await ChatSession.findOne({ sessionId, userId });
            } else {
                session = await ChatSession.findOne({ userId, isActive: true })
                    .sort({ updatedAt: -1 });
            }

            if (session) return session;

            const newSession = new ChatSession({
                userId: userId,
                sessionId: uuidv4(),
                messages: [{
                    role: "assistant",
                    content: "Chào bạn! Mình là trợ lý Nike, có thể tư vấn size giày và giúp bạn tìm sản phẩm phù hợp 😊",
                    type: "text",
                    timestamp: new Date()
                }],
                isActive: true
            });

            return await newSession.save();
        } catch (error) {
            console.error('Session error:', error);
            throw error;
        }
    }

    static async addMessage(sessionId, messageData) {
        try {
            return await ChatSession.findOneAndUpdate(
                { sessionId },
                {
                    $push: {
                        messages: {
                            ...messageData,
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
}

// Nike Shoe Advisor Bot - Final Version
class NikeShoeAdvisorBot {
    static responses = {
        greeting: [
            "Chào bạn! 👟 Mình là trợ lý tư vấn giày Nike. Mình có thể giúp bạn chọn size và tìm sản phẩm phù hợp!",
            "Xin chào! 😊 Bạn cần tư vấn về giày Nike hay tìm phụ kiện gì ạ?",
            "Chào mừng bạn đến với Nike Store! 🛍️ Mình có thể giúp gì cho bạn hôm nay?"
        ],

        help: `Mình có thể giúp bạn:

📏 **TƯ VẤN SIZE GIÀY NIKE**
• "Chân tôi dài 25cm nên đi size gì?"
• "Chân bè nên chọn giày Nike nào?"
• "Size 39 tương ứng bao nhiêu cm?"
• "Air Force 1 có size 40 không?"

🛍️ **TÌM SẢN PHẨM NIKE**
• "Tìm giày thể thao nam"
• "Giày Nike nữ mới nhất" 
• "Balo túi xách Nike"
• "Phụ kiện Nike"

🎯 **BỘ SƯU TẬP NIKE**
• "Classic Streetwear"
• "Best Seller"
• "New Arrivals" 
• "Summer 2025"

👟 **DÒNG SẢN PHẨM**
• "Air Force 1"
• "Air Max"
• "Dunk Low"
• "Jordan 1"
• "Blazer"

💬 **Gõ "giúp mình" để xem hướng dẫn đầy đủ!**`,

        fallback: [
            "Bạn muốn tư vấn về giày Nike hay tìm sản phẩm gì ạ? 🤔 Mình có thể hướng dẫn chi tiết!",
            "Ý bạn là cần tư vấn size hay tìm kiếm sản phẩm Nike? Gõ 'giúp mình' để xem hướng dẫn nhé!",
            "Mình chưa hiểu rõ lắm 😅 Bạn có thể hỏi về size giày Nike hoặc tìm sản phẩm cụ thể!"
        ]
    };

    static async processMessage(message) {
        const lowerMessage = message.toLowerCase().trim();

        console.log('🤖 Processing:', lowerMessage);

        if (this.isGreeting(lowerMessage)) {
            return this.getRandomResponse(this.responses.greeting);
        }

        if (this.isHelpRequest(lowerMessage)) {
            return this.responses.help;
        }

        if (this.isSizeAdviceRequest(lowerMessage)) {
            return await this.handleSizeAdvice(lowerMessage);
        }

        if (this.isStockCheck(lowerMessage)) {
            return await this.handleStockCheck(lowerMessage);
        }

        if (this.isCollectionSearch(lowerMessage)) {
            return await this.handleCollectionSearch(lowerMessage);
        }

        if (this.isProductLineSearch(lowerMessage)) {
            return await this.handleProductLineSearch(lowerMessage);
        }

        if (this.isAccessoriesSearch(lowerMessage)) {
            return await this.handleAccessoriesSearch();
        }

        if (this.isProductSearch(lowerMessage)) {
            return await this.handleProductSearch(lowerMessage);
        }

        return this.getRandomResponse(this.responses.fallback);
    }

    static isGreeting(message) {
        const greetings = ['chào', 'hello', 'hi', 'xin chào', 'có ai không', 'alo'];
        return greetings.some(greet => message.includes(greet));
    }

    static isHelpRequest(message) {
        return message.includes('giúp') || message.includes('help') ||
            message.includes('hướng dẫn') || message.includes('làm gì');
    }

    static isSizeAdviceRequest(message) {
        return message.includes('size') || message.includes('chân') ||
            message.includes('cm') || message.includes('đo') ||
            /\d+\s*cm/.test(message) || message.includes('bàn chân');
    }

    static isStockCheck(message) {
        return (message.includes('còn') && message.includes('size')) ||
            message.includes('có size') || message.includes('size nào') ||
            message.includes('hết size') || this.isProductLineSearch(message);
    }

    static isCollectionSearch(message) {
        return message.includes('bộ sưu tập') || message.includes('collection') ||
            message.includes('sưu tập') || message.includes('bst') ||
            message.includes('classic') || message.includes('best seller') ||
            message.includes('new arrival') || message.includes('summer');
    }

    static isProductLineSearch(message) {
        const nikeLines = ['air force', 'air max', 'dunk', 'jordan', 'blazer', 'pegasus', 'react', 'infinity'];
        return nikeLines.some(line => message.includes(line));
    }

    static isAccessoriesSearch(message) {
        return message.includes('túi') || message.includes('balo') ||
            message.includes('tote') || message.includes('bag') ||
            message.includes('cặp') || message.includes('ví') ||
            message.includes('mũ') || message.includes('nón') ||
            message.includes('phụ kiện');
    }

    static isProductSearch(message) {
        const searchWords = ['tìm', 'kiếm', 'mua', 'có', 'bán'];
        return searchWords.some(word => message.includes(word));
    }

    static getRandomResponse(responses) {
        return responses[Math.floor(Math.random() * responses.length)];
    }

    static async handleSizeAdvice(message) {
        try {
            const footLengthMatch = message.match(/(\d+[,.]?\d*)\s*cm/);

            if (footLengthMatch) {
                const footLength = parseFloat(footLengthMatch[1]);
                return this.calculateNikeSize(footLength);
            }

            if (this.isProductLineSearch(message)) {
                return await this.handleProductSizeCheck(message);
            }

            return this.getNikeSizeGuide();

        } catch (error) {
            console.error('Size advice error:', error);
            return this.getNikeSizeGuide();
        }
    }

    static calculateNikeSize(footLength) {
        const nikeSizeChart = {
            22: { eu: 35, us: 4, uk: 2 },
            22.5: { eu: 35.5, us: 4.5, uk: 2.5 },
            23: { eu: 36, us: 5, uk: 3 },
            23.5: { eu: 36.5, us: 5.5, uk: 3.5 },
            24: { eu: 37, us: 6, uk: 4 },
            24.5: { eu: 37.5, us: 6.5, uk: 4.5 },
            25: { eu: 38, us: 7, uk: 5 },
            25.5: { eu: 38.5, us: 7.5, uk: 5.5 },
            26: { eu: 39, us: 8, uk: 6 },
            26.5: { eu: 39.5, us: 8.5, uk: 6.5 },
            27: { eu: 40, us: 9, uk: 7 },
            27.5: { eu: 40.5, us: 9.5, uk: 7.5 },
            28: { eu: 41, us: 10, uk: 8 },
            28.5: { eu: 41.5, us: 10.5, uk: 8.5 },
            29: { eu: 42, us: 11, uk: 9 },
            29.5: { eu: 42.5, us: 11.5, uk: 9.5 },
            30: { eu: 43, us: 12, uk: 10 }
        };

        let recommendedSize = null;
        for (const [length, sizes] of Object.entries(nikeSizeChart)) {
            if (footLength <= parseFloat(length)) {
                recommendedSize = sizes;
                break;
            }
        }

        if (!recommendedSize) {
            recommendedSize = { eu: 43, us: 12, uk: 10 };
        }

        return `📏 **TƯ VẤN SIZE GIÀY NIKE**\n\n` +
            `👣 **Chiều dài chân:** ${footLength}cm\n\n` +
            `👟 **Size Nike khuyến nghị:**\n` +
            `• EU: ${recommendedSize.eu}\n` +
            `• US: ${recommendedSize.us}\n` +
            `• UK: ${recommendedSize.uk}\n\n` +
            `💡 **Lưu ý cho giày Nike:**\n` +
            `• Air Force 1: Form rộng rãi, chọn đúng size\n` +
            `• Air Max: Êm ái, vừa với size thường\n` +
            `• Dunk/Jordan: Form chuẩn, chọn đúng size\n` +
            `• Chân bè: Thử size lớn hơn 0.5\n\n` +
            `🔍 **Kiểm tra size có sẵn:**\n` +
            `"Air Force 1 có size ${recommendedSize.eu} không?"`;
    }

    static getNikeSizeGuide() {
        return `📋 **HƯỚNG DẪN SIZE GIÀY NIKE**\n\n` +
            `📏 **Cách đo chân chuẩn:**\n` +
            `1. Đứng thẳng trên tờ giấy\n` +
            `2. Đánh dấu điểm xa nhất của gót và mũi chân\n` +
            `3. Đo khoảng cách giữa 2 điểm (cm)\n\n` +
            `👣 **Bảng size Nike tham khảo:**\n` +
            `• 24cm → Size 37 EU\n` +
            `• 25cm → Size 38 EU  \n` +
            `• 26cm → Size 39 EU\n` +
            `• 27cm → Size 40 EU\n` +
            `• 28cm → Size 41 EU\n` +
            `• 29cm → Size 42 EU\n\n` +
            `🔍 **Để được tư vấn chính xác:**\n` +
            `"Chân tôi dài 25cm nên đi size gì?"\n` +
            `Hoặc: "Air Force 1 có size 40 không?"`;
    }

    static async handleStockCheck(message) {
        try {
            const nikeLines = [
                { key: 'air force', name: 'Air Force 1' },
                { key: 'air max', name: 'Air Max' },
                { key: 'dunk', name: 'Dunk' },
                { key: 'jordan', name: 'Jordan' },
                { key: 'blazer', name: 'Blazer' },
                { key: 'pegasus', name: 'Pegasus' },
                { key: 'react', name: 'React' }
            ];

            const foundLine = nikeLines.find(line => message.includes(line.key));

            if (foundLine) {
                const sizeInfo = await ProductService.getAvailableSizes(foundLine.name);

                if (!sizeInfo) {
                    return `❌ **${foundLine.name.toUpperCase()}**\n\n` +
                        `Hiện không có size nào có sẵn.\n` +
                        `💡 Thử tìm dòng sản phẩm khác!`;
                }

                return `📦 **${sizeInfo.productName.toUpperCase()}**\n\n` +
                    `💰 **Giá:** ${sizeInfo.price?.toLocaleString('vi-VN')} VND\n` +
                    `🎯 **Bộ sưu tập:** ${sizeInfo.collection}\n` +
                    `📏 **Size có sẵn:** ${sizeInfo.availableSizes.join(', ')}\n\n` +
                    `💡 **Form giày:** ${this.getFitAdvice(foundLine.key)}\n\n` +
                    `🛒 Kiểm tra sản phẩm ngay!`;
            }

            return "🔍 **KIỂM TRA SIZE NIKE**\n\n" +
                "Gõ tên dòng sản phẩm để kiểm tra size:\n" +
                "• \"Air Force 1 có size 40 không?\"\n" +
                "• \"Dunk Low còn size nào?\"\n" +
                "• \"Jordan 1 size có sẵn?\"";

        } catch (error) {
            console.error('Stock check error:', error);
            return "❌ Lỗi kiểm tra size. Vui lòng thử lại sau!";
        }
    }

    static async handleProductSizeCheck(message) {
        try {
            const nikeLines = [
                { key: 'air force', name: 'Air Force 1' },
                { key: 'air max', name: 'Air Max' },
                { key: 'dunk', name: 'Dunk' },
                { key: 'jordan', name: 'Jordan' },
                { key: 'blazer', name: 'Blazer' }
            ];

            const foundLine = nikeLines.find(line => message.includes(line.key));
            if (foundLine) {
                const sizeInfo = await ProductService.getAvailableSizes(foundLine.name);

                if (sizeInfo) {
                    return `👟 **${sizeInfo.productName.toUpperCase()}**\n\n` +
                        `📏 **Size có sẵn:** ${sizeInfo.availableSizes.join(', ')}\n` +
                        `💰 **Giá:** ${sizeInfo.price?.toLocaleString('vi-VN')} VND\n` +
                        `🎯 **Collection:** ${sizeInfo.collection}\n\n` +
                        `💡 **Form giày:** ${this.getFitAdvice(foundLine.key)}\n\n` +
                        `🛒 Kiểm tra sản phẩm ngay!`;
                }
            }

            return await this.handleStockCheck(message);

        } catch (error) {
            console.error('Product size check error:', error);
            return await this.handleStockCheck(message);
        }
    }

    static getFitAdvice(productLine) {
        const fitAdvice = {
            'air force': 'Form rộng rãi, thoải mái - Nên chọn đúng size',
            'air max': 'Form chuẩn, êm ái - Chọn đúng size chân',
            'dunk': 'Form ôm chân vừa phải - Chọn đúng size',
            'jordan': 'Form chuẩn basketball - Chọn đúng size',
            'blazer': 'Form cổ điển - Có thể chọn size thường'
        };
        return fitAdvice[productLine] || 'Form chuẩn Nike - Chọn đúng size chân';
    }

    static async handleCollectionSearch(message) {
        try {
            const collections = await ProductService.getCollections();

            let collectionName = '';
            const collectionMap = {
                'classic': 'Classic Streetwear',
                'streetwear': 'Classic Streetwear',
                'best seller': 'Best Seller',
                'bestseller': 'Best Seller',
                'new arrival': 'New Arrivals',
                'newarrival': 'New Arrivals',
                'summer': 'Summer 2025'
            };

            for (const [key, value] of Object.entries(collectionMap)) {
                if (message.includes(key)) {
                    collectionName = value;
                    break;
                }
            }

            if (!collectionName) {
                return `🎨 **BỘ SƯU TẬP NIKE**\n\n` +
                    `Các bộ sưu tập đang có:\n` +
                    `${collections.map(col => `• **${col}**`).join('\n')}\n\n` +
                    `🔍 **Tìm sản phẩm trong collection:**\n` +
                    `"Tìm giày Classic Streetwear"\n` +
                    `"Sản phẩm Best Seller"\n` +
                    `"New Arrivals có gì mới?"`;
            }

            const products = await ProductService.searchByCollection(collectionName);

            if (products.length === 0) {
                return `❌ **KHÔNG CÓ SẢN PHẨM TRONG ${collectionName.toUpperCase()}**\n\n` +
                    `💡 Thử xem các bộ sưu tập khác:\n` +
                    `${collections.map(col => `• ${col}`).join('\n')}`;
            }

            let response = `🎨 **${collectionName.toUpperCase()}**\n\n`;

            products.forEach((product, index) => {
                response += `**${index + 1}. ${product.name}**\n`;
                response += `   💵 ${product.price?.toLocaleString('vi-VN')} VND\n`;
                response += `   🔗 ${product.link}\n\n`;
            });

            response += `✨ *Còn ${products.length} sản phẩm trong bộ sưu tập*`;

            return response;
        } catch (error) {
            console.error('Collection search error:', error);
            return "❌ Lỗi tìm kiếm bộ sưu tập. Vui lòng thử lại!";
        }
    }

    static async handleProductLineSearch(message) {
        try {
            const nikeLines = [
                { key: 'air force', name: 'Air Force 1', search: 'Air Force' },
                { key: 'air max', name: 'Air Max', search: 'Air Max' },
                { key: 'dunk', name: 'Dunk', search: 'Dunk' },
                { key: 'jordan', name: 'Jordan', search: 'Jordan' },
                { key: 'blazer', name: 'Blazer', search: 'Blazer' },
                { key: 'pegasus', name: 'Pegasus', search: 'Pegasus' },
                { key: 'react', name: 'React', search: 'React' }
            ];

            const foundLine = nikeLines.find(line => message.includes(line.key));

            if (!foundLine) {
                return "🔍 **TÌM DÒNG SẢN PHẨM NIKE**\n\n" +
                    "Gõ tên dòng sản phẩm:\n" +
                    "• \"Air Force 1\"\n" +
                    "• \"Air Max\"\n" +
                    "• \"Dunk Low\"\n" +
                    "• \"Jordan 1\"\n" +
                    "• \"Blazer\"\n" +
                    "• \"Pegasus\"\n" +
                    "• \"React\"";
            }

            const products = await ProductService.searchProducts(foundLine.search);

            if (products.length === 0) {
                return `❌ **KHÔNG TÌM THẤY ${foundLine.name.toUpperCase()}**\n\n` +
                    `💡 Thử tìm dòng sản phẩm khác:\n` +
                    `• Air Force 1\n` +
                    `• Air Max 270\n` +
                    `• Dunk Low\n` +
                    `• Jordan 1 Mid`;
            }

            let response = `👟 **DÒNG ${foundLine.name.toUpperCase()}**\n\n`;

            products.forEach((product, index) => {
                response += `**${index + 1}. ${product.name}**\n`;
                response += `   💵 ${product.price?.toLocaleString('vi-VN')} VND\n`;
                response += `   🔗 ${product.link}\n\n`;
            });

            return response;
        } catch (error) {
            console.error('Product line search error:', error);
            return "❌ Lỗi tìm kiếm dòng sản phẩm. Vui lòng thử lại!";
        }
    }

    static async handleAccessoriesSearch() {
        try {
            const products = await ProductService.searchAccessories();

            if (products.length === 0) {
                return "❌ Hiện chưa có phụ kiện Nike nào. Vui lòng quay lại sau!";
            }

            let response = `👜 **PHỤ KIỆN NIKE**\n\n`;

            products.forEach((product, index) => {
                response += `**${index + 1}. ${product.name}**\n`;
                response += `   💵 ${product.price?.toLocaleString('vi-VN')} VND\n`;
                response += `   📦 ${product.stock > 0 ? '✅ Còn hàng' : '❌ Hết hàng'}\n`;
                response += `   🔗 ${product.link}\n\n`;
            });

            response += "💼 *Gõ 'túi tote' hoặc 'balo' để xem thêm!*";

            return response;
        } catch (error) {
            console.error('Accessories search error:', error);
            return "❌ Lỗi tìm kiếm phụ kiện. Vui lòng thử lại!";
        }
    }

    static async handleProductSearch(message) {
        try {
            const query = message.replace(/(tìm|kiếm|mua|có|bán)\s*/g, '').trim();
            const products = await ProductService.searchProducts(query);

            if (products.length === 0) {
                return `❌ Không tìm thấy sản phẩm "${query}".\n\n` +
                    `💡 Thử tìm:\n` +
                    `• "Tìm Air Force 1"\n` +
                    `• "Giày thể thao nam"\n` +
                    `• "Balo Nike"\n` +
                    `• "Phụ kiện Nike"\n` +
                    `• "Bộ sưu tập Best Seller"`;
            }

            let response = `🔍 **KẾT QUẢ TÌM KIẾM**\n\n`;

            products.forEach((product, index) => {
                response += `**${index + 1}. ${product.name}**\n`;
                response += `   💵 ${product.price?.toLocaleString('vi-VN')} VND\n`;
                response += `   🔗 ${product.link}\n\n`;
            });

            return response;
        } catch (error) {
            console.error('Product search error:', error);
            return "❌ Lỗi tìm kiếm sản phẩm. Vui lòng thử lại!";
        }
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
                reply: "Bạn vui lòng nhập tin nhắn nhé!"
            });
        }

        let finalResponse;
        let responseSessionId = sessionId;

        finalResponse = await NikeShoeAdvisorBot.processMessage(userMessage);

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
            } catch (sessionError) {
                console.log('Session error:', sessionError.message);
            }
        }

        res.json({
            success: true,
            reply: finalResponse,
            sessionId: responseSessionId,
            userId: userId
        });

    } catch (error) {
        console.error("Chatbot error:", error);
        res.json({
            success: false,
            reply: "Xin lỗi, có lỗi xảy ra! Bạn vui lòng thử lại sau nhé! 😊"
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
                message: "Không tìm thấy lịch sử chat"
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

// Deactivate session
router.post("/session/:sessionId/deactivate", async (req, res) => {
    try {
        const { sessionId } = req.params;

        await ChatSession.findOneAndUpdate(
            { sessionId },
            { isActive: false },
            { new: true }
        );

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

export default router;