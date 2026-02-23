import TelegramBot from 'node-telegram-bot-api';
import { supabaseAdmin } from '../config/supabase.js';
import * as dbController from '../DatabaseController/telegramDatabaseController.js';
import { userStates, verificationCodes, generateVerificationCode, clearUserState } from './stateManager.js';
import { showMainMenu } from './utils/ui.js';

// Handlers
import { handleEmailStart, handleEmailInput, handleEmailVerification, handleEmailProfileSelection } from './handlers/emailHandler.js';
import { handleResumeStart, handleResumeJDInput, handleResumeProfileSelection } from './handlers/resumeHandler.js';

process.env.NTBA_FIX_350 = 1;

let bot;
let botUsername = null;

export { generateVerificationCode };

export const startTelegramBot = async () => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        console.warn("TELEGRAM_BOT_TOKEN not provided. Bot not started.");
        return;
    }

    bot = new TelegramBot(token, { polling: true });

    try {
        const me = await bot.getMe();
        botUsername = me.username;
        console.log(`Telegram Bot started as @${botUsername}`);

        // Setup bot menu commands for auto-completion
        await bot.setMyCommands([
            { command: '/start', description: 'Start or restart the bot' },
            { command: '/menu', description: 'Show the main menu options' }
        ]);
    } catch (error) {
        console.error("Failed to fetch bot info:", error);
    }

    bot.onText(/\/start(?: (.+))?/, async (msg, match) => {
        const chatId = msg.chat.id.toString();
        const code = match[1];

        if (code) {
            const record = verificationCodes.get(code);

            if (!record) {
                return bot.sendMessage(chatId, "Invalid or expired code.");
            }

            if (Date.now() > record.expiresAt) {
                verificationCodes.delete(code);
                return bot.sendMessage(chatId, "Code expired.");
            }

            try {
                await dbController.linkTelegramUser(supabaseAdmin, record.userId, chatId);
                verificationCodes.delete(code);
                bot.sendMessage(chatId, "Account linked successfully!");
                showMainMenu(bot, chatId);
            } catch (error) {
                console.error("Link Error:", error);
                bot.sendMessage(chatId, "Failed to link account.");
            }
        } else {
            const userId = await dbController.getUserIdByChatId(supabaseAdmin, chatId);
            if (userId) {
                showMainMenu(bot, chatId);
            } else {
                bot.sendMessage(chatId, "👋 Welcome to the Auto Apply Bot!\n\nIt looks like your account isn't linked yet. Please visit the web app (https://www.mycareerpilot.in/) and click the Telegram integration button to get your unique start link.");
            }
        }
    });

    bot.onText(/\/menu/, async (msg) => {
        const chatId = msg.chat.id.toString();
        const userId = await dbController.getUserIdByChatId(supabaseAdmin, chatId);
        if (userId) {
            showMainMenu(bot, chatId);
        } else {
            bot.sendMessage(chatId, "👋 Welcome! Please link your account first via the web app (https://www.mycareerpilot.in/) to use the menu.");
        }
    });

    bot.on('callback_query', async (query) => {
        const chatId = query.message.chat.id.toString();
        const data = query.data;
        bot.answerCallbackQuery(query.id);

        const userId = await dbController.getUserIdByChatId(supabaseAdmin, chatId);
        if (!userId) {
            return bot.sendMessage(chatId, "Please login first.");
        }

        if (data === 'menu_gen_resume') {
            await handleResumeStart(bot, chatId);
        } else if (data === 'menu_send_email') {
            await handleEmailStart(bot, chatId);
        } else if (data.startsWith('select_profile_')) {
            const profileId = data.replace('select_profile_', '');
            const state = userStates.get(chatId);

            if (state && state.step === 'RESUME_WAITING_PROFILE') {
                await handleResumeProfileSelection(bot, chatId, userId, profileId, state);
            } else if (state && state.step === 'EMAIL_WAITING_PROFILE') {
                await handleEmailProfileSelection(bot, chatId, userId, profileId, state);
            } else {
                bot.sendMessage(chatId, "Session expired or invalid state. Please start over.");
                clearUserState(chatId);
                showMainMenu(bot, chatId);
            }
        }
    });

    bot.on('message', async (msg) => {
        const chatId = msg.chat.id.toString();
        const text = msg.text;

        if (!text || text.startsWith('/')) return;

        const userId = await dbController.getUserIdByChatId(supabaseAdmin, chatId);
        if (!userId) {
            return bot.sendMessage(chatId, "👋 Welcome to the Bot!\n\nPlease type /start or click the Start button to begin. If you haven't linked your account, visit the web app (https://www.mycareerpilot.in/) to get your unique connection link.");
        }

        const state = userStates.get(chatId);
        if (!state) return;

        if (state.step === 'RESUME_WAITING_JD') {
            await handleResumeJDInput(bot, chatId, userId, text, state);
        } else if (state.step === 'EMAIL_WAITING_INPUT') {
            await handleEmailInput(bot, chatId, userId, text);
        } else if (state.step === 'EMAIL_WAITING_VERIFICATION') {
            await handleEmailVerification(bot, chatId, userId, text);
        }
    });

    console.log("Telegram Bot interactive mode started...");
};

export const getBotUsername = () => botUsername;
