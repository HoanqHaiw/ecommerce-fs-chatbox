import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
    role: {
        type: String,
        enum: ["user", "assistant", "system"],
        required: true
    },
    content: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ["text", "image", "product", "order"],
        default: "text"
    },
    metadata: {
        type: mongoose.Schema.Types.Mixed
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

const chatSessionSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.Mixed,
            required: true
        },
        sessionId: {
            type: String,
            required: true,
            unique: true
        },
        title: {
            type: String,
            default: "Cuộc trò chuyện mới"
        },
        messages: [messageSchema],
        context: {
            type: mongoose.Schema.Types.Mixed
        },
        isActive: {
            type: Boolean,
            default: true
        }
    },
    {
        timestamps: true
    }
);

chatSessionSchema.pre("save", function (next) {
    if (this.isNew && this.messages.length > 0) {
        const firstMessage = this.messages[0].content;
        this.title = firstMessage.length > 30
            ? firstMessage.substring(0, 30) + "..."
            : firstMessage;
    }
    next();
});

export default mongoose.model("ChatSession", chatSessionSchema);