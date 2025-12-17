// routes/chatRoute.js

import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import ChatService from "../services/chatService.js";

const router = express.Router();

// Configure multer for file uploads
const uploadDir = "./uploads";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    const validTypes = ["image/jpeg", "image/png", "application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    const validExt = [".jpg", ".jpeg", ".png", ".pdf", ".doc", ".docx"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (validTypes.includes(file.mimetype) && validExt.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error("Invalid file type"), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});

/**
 * POST /api/chat
 * Body: { userId, message }
 */
router.post("/", async (req, res) => {
    try {
        const { userId, message } = req.body;

        if (!message || !userId) {
            return res.status(400).json({
                error: "userId và message là bắt buộc."
            });
        }

        // Gọi service xử lý
        const result = await ChatService.handleUserMessage(userId, message);

        return res.json({
            success: true,
            reply: result.reply,
            sessionId: result.session?.id || null
        });

    } catch (error) {
        console.error("ChatRoute error:", error);
        res.status(500).json({
            error: "Đã có lỗi xảy ra khi xử lý tin nhắn."
        });
    }
});

/**
 * POST /api/chat/audio
 * Body: FormData with audio file
 */
router.post("/audio", upload.single("audio"), async (req, res) => {
    try {
        const { userId, sessionId } = req.body;
        const audioFile = req.file;

        if (!audioFile || !userId) {
            return res.status(400).json({
                error: "Audio file và userId là bắt buộc."
            });
        }

        // For now, just acknowledge the audio message
        // In a real app, you could use speech-to-text API here
        const transcribedText = "🎤 [Ghi âm nhận được - tính năng STT sẽ được thêm sau]";

        const result = await ChatService.handleUserMessage(userId, transcribedText);

        // Clean up uploaded file
        fs.unlink(audioFile.path, (err) => {
            if (err) console.error("File cleanup error:", err);
        });

        return res.json({
            success: true,
            reply: result.reply,
            sessionId: result.session?.id || null
        });

    } catch (error) {
        console.error("Audio route error:", error);
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error("File cleanup error:", err);
            });
        }
        res.status(500).json({
            error: "Đã có lỗi xảy ra khi xử lý ghi âm."
        });
    }
});

/**
 * POST /api/chat/file
 * Body: FormData with file
 */
router.post("/file", upload.single("file"), async (req, res) => {
    try {
        const { userId, sessionId } = req.body;
        const uploadedFile = req.file;

        if (!uploadedFile || !userId) {
            return res.status(400).json({
                error: "File và userId là bắt buộc."
            });
        }

        const fileMessage = `📎 File nhận được: ${uploadedFile.originalname} (${(uploadedFile.size / 1024).toFixed(2)}KB)`;

        const result = await ChatService.handleUserMessage(userId, fileMessage);

        // Clean up uploaded file
        fs.unlink(uploadedFile.path, (err) => {
            if (err) console.error("File cleanup error:", err);
        });

        return res.json({
            success: true,
            reply: result.reply,
            sessionId: result.session?.id || null
        });

    } catch (error) {
        console.error("File route error:", error);
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error("File cleanup error:", err);
            });
        }
        res.status(500).json({
            error: "Đã có lỗi xảy ra khi xử lý file."
        });
    }
});

export default router;
