
import { generateVerificationCode } from '../bot/index.js';

export const getTelegramStartCode = async (req, res) => {
    try {
        const userId = req.user.id;
        const code = generateVerificationCode(userId);
        res.json({ success: true, code });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
