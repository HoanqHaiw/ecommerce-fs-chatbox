// src/api/userService.js
export const getUserStats = async () => {
    return {
        today: [
            { name: "Nguyễn Văn A", orders: 2 },
            { name: "Lê Thị C", orders: 1 },
        ],
        month: [
            { name: "Trần Văn D", orders: 8 },
            { name: "Nguyễn Văn A", orders: 5 },
        ],
        year: [
            { name: "Phạm Thị E", orders: 30 },
            { name: "Trần Văn D", orders: 22 },
        ],
    };
};
