import mongoose from 'mongoose';

const telegramUserStateSchema = new mongoose.Schema({
    chatId: {
        type: String,
        required: true,
        unique: true
    },
    step: {
        type: String,
        required: true
    },
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 3600 // Auto-deletes document after 1 hour (3600 seconds)
    }
});

export const TelegramUserState = mongoose.model('TelegramUserState', telegramUserStateSchema);
