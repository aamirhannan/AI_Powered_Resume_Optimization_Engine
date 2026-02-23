import { TelegramUserState } from '../models/TelegramUserState.js';
import { TelegramVerification } from '../models/TelegramVerification.js';

export const generateVerificationCode = async (userId) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    await TelegramVerification.create({ code, userId });
    return code;
};

export const getVerificationCode = async (code) => {
    return await TelegramVerification.findOne({ code });
};

export const deleteVerificationCode = async (code) => {
    await TelegramVerification.deleteOne({ code });
};

export const getUserState = async (chatId) => {
    return await TelegramUserState.findOne({ chatId });
};

export const setUserState = async (chatId, step, data = {}) => {
    return await TelegramUserState.findOneAndUpdate(
        { chatId },
        { step, data, createdAt: new Date() },
        { upsert: true, new: true }
    );
};

export const clearUserState = async (chatId) => {
    await TelegramUserState.deleteOne({ chatId });
};
