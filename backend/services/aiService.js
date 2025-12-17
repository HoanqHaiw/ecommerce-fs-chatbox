// services/aiService.js

import ProductService from "./productService.js";
import SessionManager from "./sessionService.js";

// ======================
//  CLASS: NikeShoeAdvisorBot - UPGRADED V2
// ======================
class NikeShoeAdvisorBot {

    constructor() {
        this.categories = ["shoes", "sneakers", "apparel", "accessories"];
        this.sizeGuide = {
            men: [38, 39, 40, 41, 42, 43, 44, 45],
            women: [35, 36, 37, 38, 39, 40, 41],
            unisex: [36, 37, 38, 39, 40, 41, 42, 43]
        };

        // Bảng chuyển đổi chiều dài chân (cm) → Size EU
        this.footLengthToSizeMap = {
            22: "EU 35", 22.5: "EU 35.5",
            23: "EU 36", 23.5: "EU 36.5",
            24: "EU 37", 24.5: "EU 37.5",
            25: "EU 38", 25.5: "EU 38.5",
            26: "EU 39", 26.5: "EU 39.5",
            27: "EU 40", 27.5: "EU 40.5",
            28: "EU 41", 28.5: "EU 41.5",
            29: "EU 42", 29.5: "EU 42.5",
            30: "EU 43"
        };
    }

    // --------------------------
    // 1) Extract foot length from message
    // --------------------------
    extractFootLength(message) {
        const msg = message.toLowerCase();

        // Ưu tiên dạng có đơn vị cm
        const cmMatch = msg.match(/(\d{2}(?:[,.]\d)?)\s*cm\b/);
        if (cmMatch) return parseFloat(cmMatch[1].replace(',', '.'));

        // Dạng: "chân 25", "dài 26"
        const contextualMatch = msg.match(/(chân|dài)\s*(\d{2}(?:[,.]\d)?)/);
        if (contextualMatch) {
            const num = parseFloat(contextualMatch[2].replace(',', '.'));
            if (num >= 18 && num <= 35) return num;
        }
        return null;
    }

    // --------------------------
    // 2) Detect Intent (EXPANDED - 13 Intents)
    // --------------------------
    detectIntent(message) {
        const msg = message.toLowerCase();
        const brand = this.extractBrand(msg);
        const hasBrand = Boolean(brand);

        const footLength = this.extractFootLength(msg);
        const hasSizeNumber = /\bsize\s?\d{2}\b/i.test(msg);
        const hasPriceKeyword = /giá|bao nhiêu tiền|khuyến mãi|giảm|sale|discount|price/i.test(msg);
        const hasSearchKeyword = /tìm|search|gợi ý|recommend|show me|có mẫu|có đôi/i.test(msg);
        const hasProductModel = /air force|air max|pegasus|jordan|dunk|blazer|court|reaction|infinity|metcon/i.test(msg);
        const hasBudget = Boolean(this.extractBudget(msg));

        // Customer support
        if (/hỗ trợ|nhân viên|trực tiếp|tư vấn|hotline|contact/i.test(msg)) return "ask_support";
        if (/đổi|trả|bảo hành|refund|return/i.test(msg)) return "ask_returns";
        if (/chính hãng|fake|giả|authentic/i.test(msg)) return "ask_authenticity";
        if (/giặt|vệ sinh|chăm sóc|clean/i.test(msg)) return "ask_care";
        if (/giao hàng|ship|delivery/i.test(msg)) return "ask_delivery";
        if (/đặt|mua|thanh toán|order|checkout/i.test(msg)) return "ask_ordering";

        // Size advice ONLY with foot length in cm
        if (footLength) return "ask_size";

        // Search by need (use case) - but check if hasSizeNumber first to avoid conflict
        if (!hasSizeNumber && /(chạy|running|bóng rổ|basketball|gym|casual|đi chơi|tập|training)/i.test(msg)) {
            return "search_product_by_need";
        }

        // Search product: size number alone or with brand/model
        if (hasSizeNumber) {
            return "search_product";
        }

        // Search product: brand or model or search keyword or budget
        if (hasBrand || hasProductModel || hasSearchKeyword || hasBudget) {
            return "search_product";
        }

        // Ask price: if has price keyword and NOT specific search (brand, model, search keyword)
        if (hasPriceKeyword && !hasBrand && !hasProductModel && !hasSearchKeyword && !hasBudget && !hasSizeNumber) {
            return "ask_price";
        }

        if (/phụ kiện|tất|balo|bag/i.test(msg)) return "search_accessories";

        return "general";
    }

    // --------------------------
    // 3) Suggest Size
    // --------------------------
    suggestSize(footLength) {
        const sizeMap = [
            { cm: 22, size: "EU 35", us: "US 4.5", uk: "UK 4" },
            { cm: 22.5, size: "EU 35.5", us: "US 5", uk: "UK 4.5" },
            { cm: 23, size: "EU 36", us: "US 5.5", uk: "UK 5" },
            { cm: 23.5, size: "EU 36.5", us: "US 6", uk: "UK 5.5" },
            { cm: 24, size: "EU 37", us: "US 6.5", uk: "UK 6" },
            { cm: 24.5, size: "EU 37.5", us: "US 7", uk: "UK 6.5" },
            { cm: 25, size: "EU 38", us: "US 7.5", uk: "UK 7" },
            { cm: 25.5, size: "EU 38.5", us: "US 8", uk: "UK 7.5" },
            { cm: 26, size: "EU 39", us: "US 8.5", uk: "UK 8" },
            { cm: 26.5, size: "EU 39.5", us: "US 9", uk: "UK 8.5" },
            { cm: 27, size: "EU 40", us: "US 9.5", uk: "UK 9" },
            { cm: 27.5, size: "EU 40.5", us: "US 10", uk: "UK 9.5" },
            { cm: 28, size: "EU 41", us: "US 10.5", uk: "UK 10" },
            { cm: 28.5, size: "EU 41.5", us: "US 11", uk: "UK 10.5" },
            { cm: 29, size: "EU 42", us: "US 11.5", uk: "UK 11" },
            { cm: 29.5, size: "EU 42.5", us: "US 12", uk: "UK 11.5" },
            { cm: 30, size: "EU 43", us: "US 13", uk: "UK 12" }
        ];
        let closest = sizeMap[0];
        let minDiff = Math.abs(footLength - sizeMap[0].cm);
        for (let item of sizeMap) {
            const diff = Math.abs(footLength - item.cm);
            if (diff < minDiff) {
                minDiff = diff;
                closest = item;
            }
        }
        return closest;
    }

    // --------------------------
    // 4) Extract Use Case
    // --------------------------
    extractUseCase(message) {
        message = message.toLowerCase();
        if (/chạy|jogging|running/i.test(message)) return ["chạy bộ", "running", "pegasus", "pegasus 40"];
        if (/bóng rổ|basketball/i.test(message)) return ["bóng rổ", "basketball", "jordan", "lebron"];
        if (/bóng đá|football|soccer/i.test(message)) return ["bóng đá", "football", "mercurial", "phantom"];
        if (/casual|đi chơi|hàng ngày|daily/i.test(message)) return ["casual", "đi chơi", "air force", "blazer"];
        if (/training|tập luyện|gym|tập gym/i.test(message)) return ["tập gym", "training", "revolution", "metcon"];
        return null;
    }

    // --------------------------
    // 5) Extract other info
    // --------------------------
    extractGender(message) {
        if (/nam|men|boy|bé trai/i.test(message)) return "men";
        if (/nữ|women|girl|bé gái/i.test(message)) return "women";
        return "unisex";
    }

    extractBudget(message) {
        const msg = message.toLowerCase();

        // khoảng giá: 2-3 triệu
        let rangeMatch = msg.match(/(\d+(?:[.,]\d+)?)\s*[-–]\s*(\d+(?:[.,]\d+)?)\s*(triệu|tr|m)/);
        if (rangeMatch) {
            return {
                type: "range",
                min: parseFloat(rangeMatch[1].replace(',', '.')) * 1_000_000,
                max: parseFloat(rangeMatch[2].replace(',', '.')) * 1_000_000
            };
        }

        // dưới / nhỏ hơn
        let maxMatch = msg.match(/(dưới|<|nhỏ hơn|không quá)\s*(\d+(?:[.,]\d+)?)\s*(triệu|tr|m)/);
        if (maxMatch) {
            return {
                type: "max",
                max: parseFloat(maxMatch[2].replace(',', '.')) * 1_000_000
            };
        }

        // trên / lớn hơn
        let minMatch = msg.match(/(trên|>|lớn hơn|từ)\s*(\d+(?:[.,]\d+)?)\s*(triệu|tr|m)/);
        if (minMatch) {
            return {
                type: "min",
                min: parseFloat(minMatch[2].replace(',', '.')) * 1_000_000
            };
        }

        // tầm / khoảng x triệu
        let approxMatch = msg.match(/(tầm|khoảng)\s*(\d+(?:[.,]\d+)?)\s*(triệu|tr|m)/);
        if (approxMatch) {
            const value = parseFloat(approxMatch[2].replace(',', '.')) * 1_000_000;
            return {
                type: "range",
                min: value - 500_000,
                max: value + 500_000
            };
        }

        // chính xác x triệu
        let exactMatch = msg.match(/(\d+(?:[.,]\d+)?)\s*(triệu|tr|m)/);
        if (exactMatch) {
            const value = parseFloat(exactMatch[1].replace(',', '.')) * 1_000_000;
            return {
                type: "max",
                max: value
            };
        }

        return null;
    }


    extractBrand(message) {
        const brands = ["nike", "adidas", "jordan", "puma", "converse", "vans"];
        for (let brand of brands) {
            if (message.toLowerCase().includes(brand)) return brand;
        }
        return null;
    }
    // --------------------------
    // 6) Get Recommendation By Need (ASYNC)
    // --------------------------
    async getRecommendationByNeed(useCase) {
        try {
            const products = await ProductService.searchProducts(useCase || "running");
            if (products && products.length > 0) {
                const product = products[0];
                return {
                    name: product.name,
                    price: product.price,
                    link: product.link || `/products/${product._id}`,
                    description: `${product.name} - ${product.price}đ`
                };
            }
        } catch (error) {
            console.log("Search error:", error.message);
        }
        return null;
    }

    // --------------------------
    // 7) INTENT HANDLERS
    // --------------------------

    handleSizeAdvice(message) {
        const footLength = this.extractFootLength(message);

        if (footLength) {
            const sizeInfo = this.suggestSize(footLength);
            return `✅ **Tư vấn Size Giày**\n\n` +
                `Với chiều dài chân **${footLength}cm**, bạn nên chọn:\n\n` +
                `🟢 **Size chính:**\n` +
                `${sizeInfo.size} (US ${sizeInfo.us}, UK ${sizeInfo.uk})\n\n` +
                `💡 **Lời khuyên:**\n` +
                `• Nếu chân hẹp: chọn size này\n` +
                `• Nếu chân rộng: chọn size lớn hơn 0.5\n` +
                `• Mua online: tham khảo bảng size từng dòng giày\n\n` +
                `📏 **Bảng size Nike (CM → EU):**\n` +
                `22cm→35 | 23→36 | 24→37 | 25→38 | 26→39 | 27→40 | 28→41 | 29→42 | 30→43`;
        }

        return `📏 **Tư vấn Size Giày Nike**\n\n` +
            `Mình cần biết chiều dài chân bạn để tư vấn size chính xác.\n\n` +
            `Bạn có thể:\n` +
            `• Nói trực tiếp: "Chân tôi dài 25cm"\n` +
            `• Hoặc nói size hiện tại: "Mình thường mang size 40"\n\n` +
            `📏 **Bảng size tham khảo:**\n` +
            `22cm→EU35 | 25cm→EU38 | 27cm→EU40 | 30cm→EU43\n\n` +
            `Chú ý: Mỗi dòng giày có fit khác nhau, nên xem chi tiết từng sản phẩm!`;
    }

    async handleProductSearch(message) {
        const brand = this.extractBrand(message);
        const budget = this.extractBudget(message);
        const sizeMatch = message.match(/\bsize\s?(\d{2})\b/i);
        const size = sizeMatch ? parseInt(sizeMatch[1]) : null;
        let products = [];

        // 1. Search ưu tiên theo brand / model
        if (brand) {
            products = await ProductService.searchProducts(brand);
        }

        // 2. Fallback search theo message
        if (!products || products.length === 0) {
            products = await ProductService.searchProducts(message);
        }

        if (!products || products.length === 0) {
            return `❌ Không tìm thấy sản phẩm phù hợp.\n\n` +
                `Bạn có thể thử:\n` +
                `• "Nike Air Force 1"\n` +
                `• "Giày chạy bộ tầm 2 triệu"\n` +
                `• "Giày Nike size 40"`;
        }

        // 3. FILTER THEO GIÁ
        if (budget) {
            products = products.filter(p => {
                if (!p.price) return false;

                if (budget.type === "max") {
                    return p.price <= budget.max;
                }

                if (budget.type === "min") {
                    return p.price >= budget.min;
                }

                if (budget.type === "range") {
                    return p.price >= budget.min && p.price <= budget.max;
                }

                return true;
            });
        }

        // 4. FILTER THEO SIZE (nếu có field sizes[])
        if (size) {
            products = products.filter(p => {
                if (!p.sizes) return true;
                if (Array.isArray(p.sizes)) return p.sizes.includes(size);
                if (typeof p.sizes === "string") return p.sizes.includes(size.toString());
                return true;
            });
        }

        if (products.length === 0) {
            return `⚠️ Có sản phẩm nhưng không khớp **giá/size** bạn cần.\n\n` +
                `💡 Gợi ý: thử size khác hoặc tăng ngân sách.`;
        }

        // 5. Render kết quả
        let response = `👟 **Tìm thấy ${products.length} sản phẩm phù hợp:**\n\n`;
        products.slice(0, 5).forEach((p, i) => {
            const id = p._id || p.id;
            response += `${i + 1}. [🔗 ${p.name}](http://localhost:3000/products/${id})\n` +
                `   💰 **${p.price.toLocaleString('vi-VN')}đ**\n` +
                (size ? `   📏 Size có sẵn: ${p.sizes?.join(', ') || 'Liên hệ'}\n\n` : `\n`);
        });

        return response;
    }

    async handleProductSearchByNeed(message) {
        const useCase = this.extractUseCase(message);

        if (useCase) {
            const terms = Array.isArray(useCase) ? useCase : [useCase];
            let products = [];

            // Try each term until we find results
            for (let term of terms) {
                products = await ProductService.searchProducts(term);
                if (products && products.length > 0) break;
            }

            if (products && products.length > 0) {
                let response = `👟 **Gợi ý giày theo nhu cầu:**\n\n`;
                products.slice(0, 3).forEach((p, i) => {
                    const id = p._id || p.id;
                    response += `${i + 1}. [🔗 ${p.name}](http://localhost:3000/products/${id})\n` +
                        `   💰 **${p.price.toLocaleString('vi-VN')}đ**\n\n`;
                });
                return response;
            }
        }

        return `🔍 **Gợi ý theo mục đích sử dụng:**\n\n` +
            `Bạn muốn tìm giày cho mục đích nào? (chạy, bóng rổ, bóng đá, casual, tập gym)\n\n` +
            `🏃 Chạy bộ → Nike Pegasus, Vomero, Revolution\n` +
            `🏀 Bóng rổ → Air Jordan, LeBron, Kyrie\n` +
            `⚽ Bóng đá → Mercurial, Phantom\n` +
            `👟 Casual → Air Force 1, Blazer, Court Legacy\n` +
            `💪 Tập gym → Revolution, Flex, Metcon`;
    }

    async handleAccessoriesSearch(message) {
        const products = await ProductService.searchAccessories();

        if (products && products.length > 0) {
            let response = `🎒 **Phụ kiện Nike có sẵn:**\n\n`;
            products.slice(0, 3).forEach((p, i) => {
                response += `${i + 1}. [🔗 ${p.name}](http://localhost:3000/products/${p.id})\n` +
                    `   💰 ${p.price}đ\n\n`;
            });
            return response;
        }

        return `🎒 Phụ kiện Nike: Tất, balo, túi xách, mũ, vớ...\n\n` +
            `Bạn muốn xem loại nào?`;
    }

    handleComparison(message) {
        return `⚖️ **So sánh Sản Phẩm**\n\n` +
            `Mình so sánh 2 dòng giày phổ biến nhất cho bạn:\n\n` +
            `**Air Force 1 vs Air Max 90:**\n\n` +
            `| Tiêu chí | Air Force 1 | Air Max 90 |\n` +
            `|---------|-----------|----------|\n` +
            `| 💰 Giá | 1.5-2 triệu | 1.8-2.5 triệu |\n` +
            `| 🎫 Style | Cổ điển, casual | Sneaker cao cấp |\n` +
            `| 👟 Form | Rộng, thoải mái | Vừa vặn, êm ái |\n` +
            `| 🏃 Sử dụng | Đi chơi hàng ngày | Chạy & thể thao |\n` +
            `| ⏰ Tuổi thọ | Bền 2-3 năm | Bền 3-4 năm |\n\n` +
            `**Lời khuyên:** Air Force 1 nếu bạn thích style cổ điển, Air Max 90 nếu cần êm chân & thể thao.\n\n` +
            `Bạn muốn so sánh cặp giày nào khác không?`;
    }

    handlePriceQuery(message) {
        return `💰 **Giá Cả & Khuyến Mãi**\n\n` +
            `Giá sản phẩm Nike thường từ 1.5 - 5 triệu đồng tùy dòng.\n\n` +
            `🎁 **Khuyến mãi hiện tại:**\n` +
            `📌 NEWBIE10 → Giảm 10% cho khách mới\n` +
            `📌 BUY2 → Mua 2 đôi giảm 15%\n` +
            `📌 SUMMER20 → Giảm 20% cuối mùa hè\n\n` +
            `💬 Cho mình biết bạn quan tâm dòng nào để mình báo giá chính xác!`;
    }

    handleOrdering(message) {
        return `🛒 **Hướng dẫn Đặt Hàng**\n\n` +
            `**Bước 1:** Chọn sản phẩm và size\n` +
            `**Bước 2:** Thêm vào giỏ hàng\n` +
            `**Bước 3:** Điền thông tin giao hàng\n` +
            `**Bước 4:** Chọn hình thức thanh toán\n\n` +
            `💳 **Hình thức thanh toán:**\n` +
            `✓ Tiền mặt khi nhận (COD)\n` +
            `✓ Chuyển khoản ngân hàng\n` +
            `✓ Ví điện tử (Momo, ZaloPay)\n\n` +
            `❓ Bạn có vấn đề gì với đơn hàng không?`;
    }

    handleDelivery(message) {
        return `📦 **Thông Tin Giao Hàng**\n\n` +
            `✅ Giao toàn quốc (từ 24h đến 3 ngày)\n` +
            `✅ Phí ship: 30-50k (miễn phí trên 3 triệu)\n` +
            `✅ Đối tác: Giao hàng nhanh, Viettel Post, SPX\n\n` +
            `📍 **Thời gian giao:**\n` +
            `• Hà Nội, TP HCM: 24-48h\n` +
            `• Các tỉnh khác: 2-3 ngày\n\n` +
            `🔍 Bạn có mã đơn hàng để theo dõi không?`;
    }

    handleReturns(message) {
        return `♻️ **Chính Sách Đổi Trả**\n\n` +
            `✅ Thời gian: 30 ngày kể từ khi nhận hàng\n` +
            `✅ Điều kiện: Giày chưa đi, còn nguyên hộp\n` +
            `✅ Phí: Miễn phí (chúng tôi chịu ship về)\n\n` +
            `🔄 **Quy trình:**\n` +
            `1. Liên hệ shop (Zalo, mail, hotline)\n` +
            `2. Chụp ảnh sản phẩm + hoá đơn\n` +
            `3. Ship về (địa chỉ shop sẽ cung cấp)\n` +
            `4. Kiểm tra & hoàn tiền (3-5 ngày)\n\n` +
            `❓ Giày của bạn có vấn đề gì?`;
    }

    handleAuthenticity(message) {
        return `✅ **Xác Minh Chính Hãng**\n\n` +
            `Tất cả sản phẩm trên shop đều 100% chính hãng!\n\n` +
            `🔐 **Cách kiểm tra:**\n` +
            `1️⃣ Quét mã QR trên tag\n` +
            `2️⃣ Kiểm tra số serial trên hộp\n` +
            `3️⃣ Xem logo Nike (chữ phải sắc nét)\n` +
            `4️⃣ Kiểm tra chất lượng đường may\n\n` +
            `💯 **Cam kết:**\n` +
            `Nếu phát hiện hàng giả → Hoàn tiền 150%\n\n` +
            `📸 Chụp ảnh chi tiết gửi cho mình nếu có nghi ngờ!`;
    }

    handleCare(message) {
        return `🧹 **Hướng Dẫn Chăm Sóc Giày Nike**\n\n` +
            `🚿 **Giặt giày đúng cách:**\n` +
            `1. Tháo dây & lót giày\n` +
            `2. Dùng bàn chải mềm + nước ấm\n` +
            `3. Lau ngoài + trong bằng khăn ẩm\n` +
            `4. Phơi ở chỗ thoáng mát (KHÔNG phơi nắng)\n\n` +
            `🟨 **Khắc phục ố vàng:**\n` +
            `• Dùng dung dịch nước oxy già (H2O2)\n` +
            `• Chà nhẹ, để khô tự nhiên\n\n` +
            `👃 **Khử mùi:**\n` +
            `• Baking soda bên trong qua đêm\n` +
            `• Tấm hút mùi Nike\n` +
            `• Phơi ngoài trời 30 phút/ngày\n\n` +
            `💡 Bảo quản ở nơi mát, thoáng, tránh ẩm!`;
    }

    handleSupport(message) {
        return `📞 **Hỗ Trợ Khách Hàng Nike**\n\n` +
            `Bạn cần hỗ trợ gì? Mình hỗ trợ bằng các cách sau:\n\n` +
            `📱 **Chat trực tiếp:**\n` +
            `💬 Zalo: [Nhắn tin qua Zalo](https://zalo.me/nikeshoesvn)\n` +
            `💬 Messenger: [Nhắn tin qua Messenger](https://m.me/nikeshoesvn)\n\n` +
            `☎️ **Gọi điện:**\n` +
            `📞 Hotline: 1900.xxxx (8:00 - 22:00, T2-T7)\n\n` +
            `✉️ **Email:**\n` +
            `📧 support@nikeshoes.vn\n\n` +
            `⏰ **Thời gian hỗ trợ:**\n` +
            `Thứ 2 - Thứ 7: 8:00 AM - 10:00 PM\n` +
            `Chủ nhật: 9:00 AM - 8:00 PM\n\n` +
            `💡 **Lời khuyên:** Nếu có vấn đề đơn hàng, chuẩn bị mã đơn (#NK123456) để hỗ trợ nhanh hơn!`;
    }

    handleFrustratedUser() {
        return `😟 **Xin lỗi bạn!**\n\n` +
            `Chúng tôi hiểu sự khó chịu của bạn. Hãy để chúng tôi giải quyết ngay!\n\n` +
            `📞 **Liên hệ ngay:**\n` +
            `☎️ Hotline: 1900.xxxx\n` +
            `💬 Zalo/Messenger: @nikeshoesvn\n\n` +
            `👤 **Nhân viên hỗ trợ sẽ liên lạc trong 5 phút**\n\n` +
            `Cảm ơn sự kiên nhẫn của bạn! ❤️`;
    }

    handleGeneralFallback() {
        return `👟 **Nike Bot hỗ trợ bạn với:**\n\n` +
            `✓ 📏 Tư vấn size giày\n` +
            `✓ 👟 Gợi ý sản phẩm theo nhu cầu\n` +
            `✓ ⚖️ So sánh mẫu giày\n` +
            `✓ 💰 Giá cả & khuyến mãi\n` +
            `✓ 🛒 Đặt hàng & giao hàng\n` +
            `✓ ✅ Chính hãng & uy tín\n` +
            `✓ 🧹 Chăm sóc giày\n` +
            `✓ 📞 Hỗ trợ trực tiếp\n\n` +
            `💬 **Bạn có thể hỏi:**\n` +
            `• "Mình chân dài 25cm nên mang size bao nhiêu?"\n` +
            `• "Giày chạy bộ nào tốt nhất?"\n` +
            `• "Hỗ trợ trực tiếp được không?"\n` +
            `• "Giày này giá bao nhiêu?"\n\n` +
            `Hãy cho mình biết bạn cần gì nhé! 😊`;
    }

    // --------------------------
    // 8) Main: Generate Bot Response
    // --------------------------
    async generateBotResponse(userMessage, session) {
        const intent = this.detectIntent(userMessage);
        console.log('[AI] detectIntent ->', intent, '| message:', userMessage);

        // Check for frustrated user
        const isFrustrated = /tệ|chán|bực mình|sai|lỗi|không tốt|kém|lừa|tồi/i.test(userMessage);
        if (isFrustrated) {
            return this.handleFrustratedUser();
        }

        // Route by intent
        switch (intent) {
            case "ask_support":
                return this.handleSupport(userMessage);
            case "ask_returns":
                return this.handleReturns(userMessage);
            case "ask_authenticity":
                return this.handleAuthenticity(userMessage);
            case "ask_care":
                return this.handleCare(userMessage);
            case "ask_delivery":
                return this.handleDelivery(userMessage);
            case "ask_ordering":
                return this.handleOrdering(userMessage);
            case "ask_comparison":
                return this.handleComparison(userMessage);
            case "ask_price":
                return this.handlePriceQuery(userMessage);
            case "ask_size":
                return this.handleSizeAdvice(userMessage);
            case "search_product_by_need":
                return await this.handleProductSearchByNeed(userMessage);
            case "search_product":
                return await this.handleProductSearch(userMessage);
            case "search_accessories":
                return await this.handleAccessoriesSearch(userMessage);
            default:
                return this.handleGeneralFallback();
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

    static getRandomResponse(responses) {
        return responses[Math.floor(Math.random() * responses.length)];
    }
}

// ======================
// Main AI Function
// ======================

export async function askAI(userMessage, session) {
    const bot = new NikeShoeAdvisorBot();
    const botReply = await bot.generateBotResponse(userMessage, session);
    return botReply;
}

export default NikeShoeAdvisorBot;
