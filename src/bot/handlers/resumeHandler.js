import { setUserState, clearUserState } from '../stateManager.js';
import { showMainMenu, showProfileSelection } from '../utils/ui.js';
import * as resumeService from '../../services/resumeGenerationService.js';
import { supabaseAdmin } from '../../config/supabase.js';

export const handleResumeStart = async (bot, chatId) => {
    await setUserState(chatId, 'RESUME_WAITING_JD', {});
    bot.sendMessage(chatId, "Please paste the Job Description for the resume:");
};

export const handleResumeJDInput = async (bot, chatId, userId, text, state) => {
    await setUserState(chatId, 'RESUME_WAITING_PROFILE', state.data);

    await bot.sendMessage(chatId, "Job Description received.");
    await showProfileSelection(bot, chatId, userId);
};

export const handleResumeProfileSelection = async (bot, chatId, userId, profileId, state) => {
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

        await clearUserState(chatId);
        showMainMenu(bot, chatId);
    } catch (e) {
        console.error("Generation Error:", e);
        bot.sendMessage(chatId, "Error generating resume: " + e.message);
        await clearUserState(chatId);
        showMainMenu(bot, chatId);
    }
};
