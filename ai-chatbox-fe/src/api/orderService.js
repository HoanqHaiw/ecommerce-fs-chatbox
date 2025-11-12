import axios from "axios";

const API_URL = "http://localhost:5000/api/orders";

// get list order
export const getOrders = async () => {
    try {
        const res = await axios.get(API_URL);
        return res.data.map((order) => ({
            id: order._id,
            name: order.name || "Unknown",
            total: order.total || 0,
            status: order.status || "pending",
            orderDate: order.orderDate ? order.orderDate.substring(0, 10) : "",
        }));
    } catch (error) {
        console.error("❌ Error fetching orders:", error);
        return [];
    }
};

// update active order
export const updateOrderStatus = async (id, status) => {
    try {
        const res = await axios.put(`${API_URL}/${id}`, { status });
        return res.data;
    } catch (error) {
        console.error("❌ Error updating order:", error);
    }
};

// delete order
export const deleteOrder = async (id) => {
    try {
        const res = await axios.delete(`${API_URL}/${id}`);
        return res.data;
    } catch (error) {
        console.error("❌ Error deleting order:", error);
    }
};

// add order (neu can)
export const createOrder = async (orderData) => {
    try {
        const res = await axios.post(API_URL, orderData);
        return res.data;
    } catch (error) {
        console.error("❌ Error creating order:", error);
    }
};
