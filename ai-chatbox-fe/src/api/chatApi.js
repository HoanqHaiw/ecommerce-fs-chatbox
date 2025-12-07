import axios from "axios";

const API_URL = "http://localhost:5000/api/chat";

export const sendMessageToBot = async (message) => {
    try {
        const res = await axios.post(API_URL, { message });
        return res.data.reply; // nội dung AI trả về
    } catch (error) {
        console.error("Chat API Error:", error);
        return "Xin lỗi, tôi không thể trả lời lúc này.";
    }
};
