
import TelegramBot from 'node-telegram-bot-api';
import { supabase, supabaseAdmin } from '../config/supabase.js';
import * as dbController from '../DatabaseController/telegramDatabaseController.js';
import * as emailService from '../services/emailAutomationService.js';
import * as resumeService from '../services/resumeGenerationService.js';
import { getAuthenticatedClient } from '../utils/supabaseClientHelper.js'; // Might generally use service key for bot ops if user is trusted via link 

// Store verification codes in memory for simplicity (Production should use Redis)
const verificationCodes = new Map();

export const generateVerificationCode = (userId) => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    verificationCodes.set(code, { userId, expiresAt: Date.now() + 5 * 60 * 1000 }); // 5 mins
    return code;
};

export const startTelegramBot = () => {
    const token = process.env.TELEGRAM_BOT_TOKEN;
    if (!token) {
        console.warn("TELEGRAM_BOT_TOKEN not provided. Bot not started.");
        return;
    }

    const bot = new TelegramBot(token, { polling: true });

    // /start [code]
    bot.onText(/\/start (.+)/, async (msg, match) => {
        const chatId = msg.chat.id.toString();
        const code = match[1];

        const record = verificationCodes.get(code);

        if (!record) {
            bot.sendMessage(chatId, "Invalid or expired code.");
            return;
        }

        if (Date.now() > record.expiresAt) {
            verificationCodes.delete(code);
            bot.sendMessage(chatId, "Code expired.");
            return;
        }

        try {
            await dbController.linkTelegramUser(supabaseAdmin, record.userId, chatId);
            verificationCodes.delete(code);
            bot.sendMessage(chatId, "Account linked successfully! You can now use /email and /resume commands.");
        } catch (error) {
            console.error("Link Error:", error);
            bot.sendMessage(chatId, "Failed to link account.");
        }
    });

    // /email <Company> <Role>
    // Simplified parsing: expects args
    bot.onText(/\/email (.+)/, async (msg, match) => {
        const chatId = msg.chat.id.toString();

        try {
            const userId = await dbController.getUserIdByChatId(supabaseAdmin, chatId);
            if (!userId) {
                return bot.sendMessage(chatId, "Account not linked. Go to web app to get a code.");
            }

            // Simple parsing logic: assume "Company Name" "Role Name"
            // Or just prompt user. For now, let's try to split by assuming quotes or comma? 
            // Or just take the whole string and try to guess? 
            // Better: use a simple convention "Company, Role, Email" or interactive.
            // Let's implement robust interactive later. For now, simple split by comma.

            const args = match[1].split(',').map(s => s.trim());
            if (args.length < 3) {
                return bot.sendMessage(chatId, "Usage: /email <TargetEmail>, <RoleID/Name>, <Company> \nExample: /email hr@google.com, backend, Google");
            }

            const [targetEmail, role, company] = args;

            // Mock body for service
            const body = {
                targetEmail,
                role, // This usually needs to be an ID in the service, but let's see if we can lookup by name. Wrapper might be needed.
                company,
                jobDescription: "Applied via Telegram",
                senderEmail: "telegram-bot" // This might fail validation
            };

            // To properly function, we need the user's email string for 'senderEmail'.
            // The service expects `userEmailString` passed. 
            // We need to fetch user details from Supabase Auth to get their email?
            // Or store it in telegram_users?
            // Let's fetch from auth.users.

            const { data: { user } } = await supabaseAdmin.auth.admin.getUserById(userId);
            if (!user) throw new Error("User not found");

            const userEmailString = user.email;

            bot.sendMessage(chatId, "Processing email automation...");

            // NOTE: The service expects 'role' to be a UUID (baseResumeId) usually.
            // If user passes "backend", we might fail. 
            // Ideally, we search job_profiles for profile_type = 'backend' and get ID.
            // Let's add that lookup here or in service? 
            // Service expects ID. We should lookup ID here.

            const { data: profile } = await supabaseAdmin
                .from('job_profiles')
                .select('id')
                .eq('user_id', userId)
                .ilike('profile_type', role) // flexible match
                .single();

            if (!profile) {
                return bot.sendMessage(chatId, `Role '${role}' not found in your profiles.`);
            }

            body.role = profile.id; // Switch name to ID

            // We use service key client (supabase) here because we are trusted backend context
            await emailService.createEmailAutomationService(supabaseAdmin, userId, body, userEmailString);

            bot.sendMessage(chatId, `Success! Email task for ${company} created.`);

        } catch (error) {
            console.error("Bot Email Error:", error);
            bot.sendMessage(chatId, "Error: " + error.message);
        }
    });

    // /resume <Role> <JobDescription>
    // This is hard to pass as args. Maybe just /resume <Role> and generate generic?
    // Service requires Role ID and Job Description.
    bot.onText(/\/resume (.+)/, async (msg, match) => {
        const chatId = msg.chat.id.toString();

        try {
            const userId = await dbController.getUserIdByChatId(supabaseAdmin, chatId);
            if (!userId) return bot.sendMessage(chatId, "Not linked.");

            const args = match[1].split(',');
            const roleName = args[0].trim();
            const jd = args.slice(1).join(',').trim() || "General Application";

            // Lookup ID
            const { data: profile } = await supabaseAdmin
                .from('job_profiles')
                .select('id')
                .eq('user_id', userId)
                .ilike('profile_type', roleName)
                .single();

            if (!profile) return bot.sendMessage(chatId, `Role '${roleName}' not found.`);

            bot.sendMessage(chatId, "Generating resume... this may take a minute.");

            const result = await resumeService.createResumeGenerationService(supabaseAdmin, userId, {
                role: profile.id,
                jobDescription: jd
            });

            bot.sendDocument(chatId, result.pdfBuffer, {}, {
                filename: `Resume_${roleName}.pdf`,
                contentType: 'application/pdf'
            });

        } catch (error) {
            console.error(error);
            bot.sendMessage(chatId, "Error: " + error.message);
        }
    });

    console.log("Telegram Bot started...");
};
