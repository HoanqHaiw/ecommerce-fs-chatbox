import axios from "axios";

const API_URL = "http://localhost:5000/api/orders";

export const getOrders = async () => {
    try {
        const res = await axios.get(API_URL);
        console.log(" Lấy đơn hàng thành công");

        // Lấy mảng orders từ response
        let ordersArray = res.data.orders || [];

        return ordersArray.map((order) => ({
            _id: order._id,
            customerName: order.customerName || "Khách hàng",
            email: order.email || "",
            phone: order.phone || "",
            total: order.total || 0,
            subtotal: order.subtotal || order.total || 0,
            discount: order.discount || 0,
            status: order.status || "pending",
            paymentMethod: order.paymentMethod || "cod",
            address: order.address || {},
            items: order.items || [],
            createdAt: order.createdAt || new Date().toISOString(),
        }));
    } catch (error) {
        console.error(" Lỗi lấy đơn hàng:", error);
        return [];
    }
};

// UPDATE STATUS - GỌI API THẬT
export const updateOrderStatus = async (id, status) => {
    try {
        console.log(` Gọi API: PUT ${API_URL}/${id}/status`);
        const res = await axios.put(`${API_URL}/${id}/status`, { status });
        console.log(" Cập nhật database thành công:", res.data);
        return res.data;
    } catch (error) {
        console.error(" Lỗi cập nhật database:", error);
        throw error;
    }
};

// DELETE ORDER - GỌI API THẬT
export const deleteOrder = async (id) => {
    try {
        console.log(` Gọi API: DELETE ${API_URL}/${id}`);
        const res = await axios.delete(`${API_URL}/${id}`);
        console.log(" Xóa database thành công:", res.data);
        return res.data;
    } catch (error) {
        console.error(" Lỗi xóa database:", error);
        throw error;
    }
};

// Giữ nguyên các hàm khác...
export const createOrder = async (orderData) => {
    try {
        const res = await axios.post(API_URL, orderData);
        return res.data;
    } catch (error) {
        console.error(" Error creating order:", error);
        throw error;
    }
};

export const getOrderById = async (id) => {
    try {
        const res = await axios.get(`${API_URL}/${id}`);
        return res.data;
    } catch (error) {
        console.error(" Error fetching order:", error);
        throw error;
    }
};