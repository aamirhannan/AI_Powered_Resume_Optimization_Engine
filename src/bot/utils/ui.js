import { supabaseAdmin } from '../../config/supabase.js';

export const showMainMenu = (bot, chatId) => {
    bot.sendMessage(chatId, "What would you like to do?", {
        reply_markup: {
            inline_keyboard: [
                [{ text: "📄 Generate Resume", callback_data: "menu_gen_resume" }],
                [{ text: "📧 Send Email", callback_data: "menu_send_email" }]
            ]
        }
    });
};

export const showProfileSelection = async (bot, chatId, userId) => {
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
