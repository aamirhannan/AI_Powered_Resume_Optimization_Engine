
import TelegramBot from 'node-telegram-bot-api';

process.env.NTBA_FIX_350 = 1;

import { supabase, supabaseAdmin } from '../config/supabase.js';
import * as dbController from '../DatabaseController/telegramDatabaseController.js';
import * as emailService from '../services/emailAutomationService.js';
import * as resumeService from '../services/resumeGenerationService.js';
import { getAuthenticatedClient } from '../utils/supabaseClientHelper.js';
const verificationCodes = new Map();

export const generateVerificationCode = (userId) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes.set(code, { userId, expiresAt: Date.now() + 5 * 60 * 1000 });
    return code;
};

let bot;
let botUsername = null;

const userStates = new Map();

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
    } catch (error) {
        console.error("Failed to fetch bot info:", error);
    }

    const showMainMenu = (chatId) => {
        bot.sendMessage(chatId, "What would you like to do?", {
            reply_markup: {
                inline_keyboard: [
                    [{ text: "📄 Generate Resume", callback_data: "menu_gen_resume" }],
                    [{ text: "📧 Send Email", callback_data: "menu_send_email" }]
                ]
            }
        });
    };

    const showProfileSelection = async (chatId, userId) => {
        try {
            const { data: profiles, error } = await supabaseAdmin
                .from('job_profiles')
                .select('id, profile_type')
                .eq('user_id', userId);

            if (error) throw error;

            if (!profiles || profiles.length === 0) {
                return bot.sendMessage(chatId, "No job profiles found. Please create one on the web app.");
            }

            const buttons = profiles.map(p => ([{
                text: p.profile_type,
                callback_data: `select_profile_${p.id}`
            }]));

            bot.sendMessage(chatId, "Select a profile to use:", {
                reply_markup: { inline_keyboard: buttons }
            });
        } catch (e) {
            console.error("Profile Fetch Error:", e);
            bot.sendMessage(chatId, "Error fetching profiles.");
        }
    };

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
                showMainMenu(chatId);
            } catch (error) {
                console.error("Link Error:", error);
                bot.sendMessage(chatId, "Failed to link account.");
            }
        } else {
            const userId = await dbController.getUserIdByChatId(supabaseAdmin, chatId);
            if (userId) {
                showMainMenu(chatId);
            } else {
                bot.sendMessage(chatId, "Please link your account first via the web app.");
            }
        }
    });

    bot.on('callback_query', async (query) => {
        const chatId = query.message.chat.id.toString();
        const data = query.data;
        bot.answerCallbackQuery(query.id);

        const userId = await dbController.getUserIdByChatId(supabaseAdmin, chatId);
        if (!userId) return bot.sendMessage(chatId, "Please login first.");

        if (data === 'menu_gen_resume') {
            userStates.set(chatId, { step: 'RESUME_WAITING_JD', data: {} });
            bot.sendMessage(chatId, "Please paste the Job Description for the resume:");
        }
        else if (data === 'menu_send_email') {
            // Placeholder for email interactive flow
            bot.sendMessage(chatId, "Email interactive mode coming soon. Use /email command.");
        }
        else if (data.startsWith('select_profile_')) {
            const profileId = data.replace('select_profile_', '');
            const state = userStates.get(chatId);

            if (state && state.step === 'RESUME_WAITING_PROFILE') {
                bot.sendMessage(chatId, "Generating resume... this usually takes 30-60 seconds.");

                try {
                    const serviceResult = await resumeService.createResumeGenerationService(supabaseAdmin, userId, {
                        role: profileId,
                        jobDescription: state.data.jd
                    });

                    if (!serviceResult || !serviceResult.pdfBuffer) {
                        throw new Error("Failed to generate PDF buffer.");
                    }

                    if (!Buffer.isBuffer(serviceResult.pdfBuffer)) {
                        serviceResult.pdfBuffer = Buffer.from(serviceResult.pdfBuffer);
                    }

                    await bot.sendDocument(chatId, serviceResult.pdfBuffer, {}, {
                        filename: `Resume_${Date.now()}.pdf`,
                        contentType: 'application/pdf'
                    });

                    userStates.delete(chatId);
                    showMainMenu(chatId);
                } catch (e) {
                    console.error("Generation Error:", e);
                    bot.sendMessage(chatId, "Error generating resume: " + e.message);
                }
            } else {
                bot.sendMessage(chatId, "Session expired or invalid state. Please start over.");
                showMainMenu(chatId);
            }
        }
    });

    bot.on('message', async (msg) => {
        const chatId = msg.chat.id.toString();
        const text = msg.text;

        if (!text || text.startsWith('/')) return;

        const userId = await dbController.getUserIdByChatId(supabaseAdmin, chatId);
        if (!userId) return;

        const state = userStates.get(chatId);
        if (!state) return;

        if (state.step === 'RESUME_WAITING_JD') {
            state.data.jd = text;
            state.step = 'RESUME_WAITING_PROFILE';
            userStates.set(chatId, state);

            await bot.sendMessage(chatId, "Job Description received.");
            await showProfileSelection(chatId, userId);
        }
    });

    console.log("Telegram Bot interactive mode started...");
};

export const getBotUsername = () => botUsername;
