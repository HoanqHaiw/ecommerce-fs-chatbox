// src/api/orderService.js
let mockOrders = [
    {
        id: 1,
        customer: "Nguyễn Văn A",
        total: 500000,
        status: "Đang xử lý",
        date: "2025-10-25",
        items: [
            { name: "Áo thun", qty: 2, price: 150000 },
            { name: "Quần kaki", qty: 1, price: 200000 },
        ],
    },
    {
        id: 2,
        customer: "Trần Thị B",
        total: 350000,
        status: "Hoàn tất",
        date: "2025-10-24",
        items: [{ name: "Váy hoa", qty: 1, price: 350000 }],
    },
];

export const getOrders = async () => mockOrders;

export const updateOrderStatus = async (id, newStatus) => {
    mockOrders = mockOrders.map((o) =>
        o.id === id ? { ...o, status: newStatus } : o
    );
    return true;
};

export const deleteOrder = async (id) => {
    mockOrders = mockOrders.filter((o) => o.id !== id);
    return true;
};
