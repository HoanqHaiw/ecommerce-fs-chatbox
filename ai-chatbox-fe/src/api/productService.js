import axios from "axios";

const API_URL = "http://localhost:5000/api/products";

export const getProducts = async () => {
    try {
        const res = await axios.get(API_URL);
        return res.data.products || [];
    } catch (error) {
        console.error("Error get products:", error);
        return [];
    }
};


export const addProduct = async (formData) => {
    try {
        const res = await axios.post(API_URL, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
    } catch (error) {
        console.error("Error add product", error);
        throw error;
    }
};

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

export const deleteProduct = async (id) => {
    try {
        const res = await axios.delete(`${API_URL}/${id}`);
        return res.data;
    } catch (error) {
        console.error("Error delete product", error);
        throw error;
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
