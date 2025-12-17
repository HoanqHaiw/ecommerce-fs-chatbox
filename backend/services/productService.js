import Product from "../models/productModel.js";

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
            console.log(`[ProductService] Query: "${query}" | Found: ${products.length} products`);
            if (products.length > 0) {
                console.log(`[ProductService] Sample results:`, products.map(p => p.name).slice(0, 2));
            }

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
                availableSizes,
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

export default ProductService;
