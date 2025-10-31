import axios from "axios";

const API_URL = "http://localhost:5000/api/products";

// Lấy tất cả sản phẩm
export const getProducts = async () => {
    try {
        const res = await axios.get(API_URL);
        return res.data.products || [];
    } catch (error) {
        console.error("Lỗi khi lấy sản phẩm:", error);
        return [];
    }
};

// Thêm sản phẩm
export const addProduct = async (formData) => {
    try {
        const res = await axios.post(API_URL, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
    } catch (error) {
        console.error("Lỗi khi thêm sản phẩm:", error);
        throw error;
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
        console.error("Lỗi khi cập nhật sản phẩm:", error);
        throw error;
    }
};

// Xóa sản phẩm
export const deleteProduct = async (id) => {
    try {
        const res = await axios.delete(`${API_URL}/${id}`);
        return res.data;
    } catch (error) {
        console.error("Lỗi khi xóa sản phẩm:", error);
        throw error;
    }
};
