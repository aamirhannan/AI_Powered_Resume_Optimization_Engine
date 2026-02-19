
import { generateVerificationCode, getBotUsername } from '../bot/index.js';

export const getTelegramStartCode = async (req, res) => {
    try {
        const userId = req.user.id;
        const code = generateVerificationCode(userId);
        const botUsername = getBotUsername();
        res.json({ success: true, code, botUsername });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
