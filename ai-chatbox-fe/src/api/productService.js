import axios from "axios";

const API_URL = "http://localhost:5000/api/products";

// Lấy danh sách sản phẩm
export const getProducts = async () => {
    try {
        const res = await axios.get(API_URL);
        return res.data.products || [];
    } catch (error) {
        console.error("Error get products:", error);
        return [];
    }
};

// Thêm sản phẩm (FIXED với validation phía frontend)
export const addProduct = async (formData) => {
    try {
        // VALIDATION PHÍA FRONTEND TRƯỚC
        const name = formData.get("name");
        const price = formData.get("price");
        const category = formData.get("category");

        // Kiểm tra required fields
        if (!name || !price || !category) {
            throw new Error("Missing required fields: name, price, category");
        }

        // Kiểm tra giá (TC_AP_04)
        if (parseFloat(price) <= 0) {
            throw new Error("Price must be greater than 0");
        }

        const res = await axios.post(API_URL, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
    } catch (error) {
        console.error("Error add product", error);

        // Xử lý error message
        let errorMessage = "Lỗi khi thêm sản phẩm";
        if (error.response?.data?.message) {
            errorMessage = error.response.data.message;
        } else if (error.message) {
            errorMessage = error.message;
        }

        throw new Error(errorMessage);
    }
};

// Cập nhật sản phẩm
export const updateProduct = async (id, formData) => {
    try {
        const res = await axios.put(`${API_URL}/${id}`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
    } catch (error) {
        console.error("Error update products", error);
        throw error;
    }
};

// Xóa sản phẩm
export const deleteProduct = async (id) => {
    try {
        const res = await axios.delete(`${API_URL}/${id}`);
        return res.data;
    } catch (error) {
        console.error("Error delete product", error);
        throw error;
    }
};

// Hàm kiểm tra tên sản phẩm trùng (LOCAL CHECK - không gọi API)
export const checkProductExists = async (productName, currentProducts = []) => {
    try {
        // Nếu có currentProducts, kiểm tra local
        if (currentProducts.length > 0) {
            const exists = currentProducts.some(
                p => p.name.toLowerCase().trim() === productName.toLowerCase().trim()
            );
            return exists;
        }

        // Nếu không có, lấy danh sách từ API
        const products = await getProducts();
        const exists = products.some(
            p => p.name.toLowerCase().trim() === productName.toLowerCase().trim()
        );
        return exists;
    } catch (error) {
        console.error("Error checking product name:", error);
        return false;
    }
};

// Lấy danh sách collection từ products
export const getCollections = async () => {
    try {
        const products = await getProducts();
        const allCollections = products.flatMap(p =>
            Array.isArray(p.collections) ? p.collections : [p.collections]
        );
        const collections = [...new Set(allCollections.filter(Boolean))];
        return collections;
    } catch (error) {
        console.error("Error get collections", error);
        return [];
    }
};

// Lấy sản phẩm theo collection
export const getProductsByCollection = async (collectionName) => {
    try {
        const res = await axios.get(`${API_URL}/collection/${collectionName}`);
        const products = res.data.products || [];
        const uniqueProducts = products.filter((product, index, self) =>
            index === self.findIndex(p => p._id === product._id)
        );

        return uniqueProducts;
    } catch (error) {
        console.error("Error get products by collection", error);
        return [];
    }
};