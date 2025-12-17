import SessionService from "../services/sessionService.js";
import NikeBotService from "../services/nikeBotService.js";

export const handleChat = async (req, res) => {
    try {
        const { userId, sessionId, message } = req.body;

        if (!userId || !message) {
            return res.status(400).json({ error: "userId và message là bắt buộc" });
        }

        const session = await SessionService.getOrCreateSession(userId, sessionId);

        const reply = await NikeBotService.processMessage(message);

        await SessionService.addMessage(session.sessionId, {
            role: "user",
            content: message,
            type: "text"
        });

        await SessionService.addMessage(session.sessionId, {
            role: "assistant",
            content: reply,
            type: "text"
        });

        return res.json({
            sessionId: session.sessionId,
            reply
        });

    } catch (error) {
        console.error("Chat error:", error);
        return res.status(500).json({ error: "Lỗi server" });
    }
};
