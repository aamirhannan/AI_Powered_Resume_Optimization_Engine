export const verificationCodes = new Map();
export const userStates = new Map();

export const generateVerificationCode = (userId) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes.set(code, { userId, expiresAt: Date.now() + 5 * 60 * 1000 });
    return code;
};

export const clearUserState = (chatId) => {
    userStates.delete(chatId);
};
