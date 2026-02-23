import mongoose from 'mongoose';

const telegramVerificationSchema = new mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true
    },
    userId: {
        type: String, // Maps to Supabase Auth User ID
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 300 // Auto-deletes document after 5 minutes (300 seconds)
    }
});

export const TelegramVerification = mongoose.model('TelegramVerification', telegramVerificationSchema);
