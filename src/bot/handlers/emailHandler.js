import { setUserState, getUserState, clearUserState } from '../stateManager.js';
import { scrapeLinkedInJob } from '../utils/scraper.js';
import { showMainMenu, showProfileSelection } from '../utils/ui.js';
import * as emailService from '../../services/emailAutomationService.js';
import { supabaseAdmin } from '../../config/supabase.js';

export const handleEmailStart = async (bot, chatId) => {
    await setUserState(chatId, 'EMAIL_WAITING_INPUT', {});
    bot.sendMessage(chatId, "Please send either:\n1. A LinkedIn Post/Job URL\nOR\n2. The Recruiter's Email and Job Description directly.");
};

export const handleEmailInput = async (bot, chatId, userId, text) => {
    bot.sendMessage(chatId, "Analyzing your input... Please wait ⏳");

    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const urls = text.match(urlRegex);
    let rawText = text;

    if (urls && urls.length > 0 && urls[0].includes('linkedin.com')) {
        try {
            bot.sendMessage(chatId, "Fetching content from the LinkedIn URL...");
            rawText = await scrapeLinkedInJob(urls[0]);
        } catch (e) {
            return bot.sendMessage(chatId, e.message);
        }
    }

    try {
        // Simple regex extraction instead of costly LLM call
        const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
        const emailMatch = rawText.match(emailRegex);
        const targetEmail = emailMatch ? emailMatch[1] : null;

        // Clean JD: remove the email from the string to present a cleaner preview
        const jobDescription = targetEmail ? rawText.replace(targetEmail, '').trim() : rawText.trim();

        let state = await getUserState(chatId);
        if (!state) state = { data: {} };

        state.data = {
            jd: jobDescription,
            targetEmail: targetEmail
        };
        state.step = 'EMAIL_WAITING_VERIFICATION';
        await setUserState(chatId, state.step, state.data);

        const escapeHTML = (text) => {
            if (!text) return text;
            return text.toString().replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
        };

        const safeEmail = escapeHTML(targetEmail) || 'Not found';
        const safeJD = escapeHTML(jobDescription);

        const chunks = [];
        for (let i = 0; i < safeJD.length; i += 3800) {
            chunks.push(safeJD.substring(i, i + 3800));
        }

        if (chunks.length === 0) chunks.push("No JD content");

        let firstMsg = `Here is what I found:\n\n✉️ <b>Email</b>: ${safeEmail}\n\n📄 <b>JD</b>:\n${chunks[0]}`;
        await bot.sendMessage(chatId, firstMsg, { parse_mode: "HTML" });

        for (let i = 1; i < chunks.length; i++) {
            await bot.sendMessage(chatId, chunks[i], { parse_mode: "HTML" });
        }

        let actionMsg = "";
        if (!targetEmail) {
            actionMsg = `⚠️ I couldn't find an email in the post. Please reply with the correct email address to proceed.`;
        } else {
            actionMsg = `If the email is incorrect, please reply with the correct one. Otherwise, simply reply with "Yes" or "Y" to proceed.`;
        }

        bot.sendMessage(chatId, actionMsg, { parse_mode: "HTML" });
    } catch (error) {
        bot.sendMessage(chatId, "Failed to analyze the input. Please try again with pure text or a different URL.");
    }
};

export const handleEmailVerification = async (bot, chatId, userId, text) => {
    const state = await getUserState(chatId);
    if (!state || !state.data) return;

    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/;
    const emailMatch = text.match(emailRegex);

    if (emailMatch) {
        state.data.targetEmail = emailMatch[1];
        bot.sendMessage(chatId, `✅ Updated target email to: ${state.data.targetEmail}`);

        state.step = 'EMAIL_WAITING_PROFILE';
        await setUserState(chatId, state.step, state.data);

        await bot.sendMessage(chatId, "Looks good! Now let's pick your profile.");
        await showProfileSelection(bot, chatId, userId);
    } else {
        const lowerText = text.toLowerCase().trim();
        if (lowerText === 'yes' || lowerText === 'y' || lowerText === 'ok') {
            if (!state.data.targetEmail) {
                return bot.sendMessage(chatId, "⚠️ I still don't have an email address. Please reply with a valid email.");
            }

            state.step = 'EMAIL_WAITING_PROFILE';
            await setUserState(chatId, state.step, state.data);

            await bot.sendMessage(chatId, "Looks good! Now let's pick your profile.");
            await showProfileSelection(bot, chatId, userId);
        } else {
            bot.sendMessage(chatId, "I didn't recognize an email or a 'Yes'. Please reply with a valid email or 'Yes' to proceed.");
        }
    }
};

export const handleEmailProfileSelection = async (bot, chatId, userId, profileId, state) => {
    bot.sendMessage(chatId, "Scheduling your email... this usually takes a few moments.");

    try {
        const { data: userAuth, error } = await supabaseAdmin.auth.admin.getUserById(userId);
        const userEmailString = userAuth?.user?.email;

        if (error || !userEmailString) {
            throw new Error("Could not retrieve your email from your account.");
        }

        await emailService.createEmailAutomationService(supabaseAdmin, userId, {
            targetEmail: state.data.targetEmail,
            role: profileId,
            jobDescription: state.data.jd
        }, userEmailString);

        bot.sendMessage(chatId, `✅ Your email to ${state.data.targetEmail} has been scheduled successfully!`);

        await clearUserState(chatId);
        showMainMenu(bot, chatId);
    } catch (e) {
        console.error("Email Automation Error:", e);
        bot.sendMessage(chatId, "Error scheduling email: " + e.message);
        await clearUserState(chatId);
        showMainMenu(bot, chatId);
    }
};
