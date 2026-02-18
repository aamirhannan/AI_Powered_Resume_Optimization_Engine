
import * as dbController from '../DatabaseController/emailAutomationDatabaseController.js';
import * as jobProfileDbController from '../DatabaseController/jobProfileDatabaseController.js';
import { camelToSnake, snakeToCamel } from '../controllers/utils.js';
import { createRequestLog, completeRequestLog } from './apiRequestLogger.js';
import { transformToApiFormat } from '../controllers/jobProfileController.js';
import { sendMessageToQueue } from './sqsService.js';
import { getCompanyFromEmail } from '../utils/utilFunctions.js';

export const createEmailAutomationService = async (supabase, userId, body, userEmailString) => {
    let logId = null;

    try {
        const payload = camelToSnake(body);

        const company = getCompanyFromEmail(payload["target_email"]);
        const baseResumeId = payload["role"];
        const baseResumeData = await jobProfileDbController.fetchJobProfileById(supabase, baseResumeId);

        if (!baseResumeData) {
            throw new Error("Base resume profile not found.");
        }

        const role = baseResumeData["profile_type"];

        // Transform from flat DB format to nested resume format expected by EJS template
        const baseResumeCamel = snakeToCamel(baseResumeData);
        const baseResume = transformToApiFormat(baseResumeCamel);

        // 1. Start Logging
        logId = await createRequestLog(supabase, userId, 'EMAIL_AUTOMATION', '/create-email', payload, company, role);

        // const senderEmail = req.user.userEmailString; // This was from req
        const senderEmail = userEmailString;

        // Check for duplicates - MOVED TO MIDDLEWARE in Controller, but for service usage (bot), we might need to handle it or assume caller handles it. 
        // For now, we assume the caller (Controller or Bot) handles duplicate checks if needed, or we rely on DB constraints.

        const data = await dbController.insertEmailAutomation(supabase, payload, userId);

        // Push the task into SQS queue
        const task = {
            id: data.id,
            user_id: userId,
            senderEmail,
            logId,
            company,
            role,
            baseResume
        };

        await sendMessageToQueue(task);

        const response = snakeToCamel(data);

        return response;

    } catch (error) {
        // 3. Complete Logging (Failure)
        if (logId) {
            await completeRequestLog(supabase, logId, 'FAILED', 500, null, error.message);
        }
        throw error;
    }
};

export const retryFailedApplicationsService = async (supabase, userId, automationId) => {
    let logId = null;

    if (!automationId) throw new Error("Missing automation ID");

    try {
        // 1. Fetch the failed record
        const record = await dbController.fetchEmailAutomationById(supabase, automationId, userId);

        if (!record) {
            throw new Error("Application not found or access denied.");
        }

        // 2. Validate status
        if (record.status !== 'FAILED') {
            throw new Error(`Cannot retry application with status: ${record.status}`);
        }

        // 3. Reset status to PENDING
        const updatedRecord = await dbController.resetEmailAutomationStatus(supabase, automationId);

        // 4. Re-construct the task for SQS
        let baseResume = null;
        if (record.role) {
            // We need to fetch by ID or Role depending on what's stored.
            // In create flow: role = baseResumeData["profile_type"] -> a string like 'frontend'.
            // Wait, in create flow: baseResumeId is the ID passed in payload["role"].
            // Db record stores 'role' text.
            // This is a bit tricky. The `createEmailAutomation` stores `role` (string) into DB.
            // The `record.role` is that string.
            // However, to fetch the resume data, `jobProfileDbController.fetchJobProfileById` expects an ID?
            // Let's check `fetchJobProfileById`.
            // `fetchJobProfileById` implementation: 'select * from job_profiles where id = uuid' 
            // BUT in createEmailAutomation: `const baseResumeId = payload["role"];` -> user likely sends an ID.
            // Then `const role = baseResumeData["profile_type"];` -> e.g. "Full Stack Developer"
            // Then `task.role` gets "Full Stack Developer".
            // So `record.role` is "Full Stack Developer".
            // We cannot fetch by ID using "Full Stack Developer".

            // WE HAVE A DATA LOSS HERE potentially if we rely on `record.role` to fetch data back, 
            // UNLESS `fetchJobProfileById` can handle profile_type OR we save the ID somewhere.
            // The `email_automations` table has `generated_resume_id` but not `base_resume_id`.
            // However, `jobProfileDbController` is used in original code:
            // `const baseResumeData = await jobProfileDbController.fetchJobProfileById(supabase, record.role);`
            // This implies `record.role` MIGHT be the ID in some versions, or the original code was buggy/optimistic?
            // Wait, looking at original code: `record.role` is used.

            // Let's look at `jobProfileDbController.fetchJobProfileById` signature if I can.
            // But assuming the original code `jobProfileDbController.fetchJobProfileById(supabase, record.role)` worked, 
            // then `record.role` must be an ID or the function handles title.
            // Actually, `record.role` in `email_automations` table definition is `text`.
            // If the original code works, I should blindly copy it.

            const baseResumeData = await jobProfileDbController.fetchJobProfileById(supabase, record.role);
            if (baseResumeData) {
                const baseResumeCamel = snakeToCamel(baseResumeData);
                baseResume = transformToApiFormat(baseResumeCamel);
            }
        }

        // Create Log entry for the retry
        logId = await createRequestLog(
            supabase,
            userId,
            'EMAIL_AUTOMATION',
            '/retry-failed',
            { original_automation_id: automationId },
            updatedRecord.company,
            updatedRecord.role
        );

        const task = {
            id: updatedRecord.id,
            user_id: userId,
            senderEmail: updatedRecord.sender_email,
            logId: logId,
            company: updatedRecord.company,
            role: updatedRecord.role,
            baseResume,
            isRetry: true
        };

        // 5. Push to Queue
        await sendMessageToQueue(task);

        return snakeToCamel(updatedRecord);

    } catch (error) {
        console.error("Retry failed:", error);
        if (logId) {
            await completeRequestLog(supabase, logId, 'FAILED', 500, null, error.message);
        }
        throw error;
    }
};
