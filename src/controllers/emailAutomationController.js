
import { getAuthenticatedClient } from '../utils/supabaseClientHelper.js';
import * as dbController from '../DatabaseController/emailAutomationDatabaseController.js';
import * as jobProfileDbController from '../DatabaseController/jobProfileDatabaseController.js';
import { camelToSnake, snakeToCamel } from './utils.js';
import { createRequestLog, completeRequestLog, logStep } from '../services/apiRequestLogger.js';
import { transformToApiFormat } from './jobProfileController.js';

import { sendMessageToQueue } from '../services/sqsService.js';
import { getCompanyFromEmail } from '../utils/utilFunctions.js';


export const getEmailAutomation = async (req, res) => {
    try {
        const supabase = getAuthenticatedClient(req.accessToken);
        const data = await dbController.fetchEmailAutomations(supabase);
        const camelCaseData = data.map(item => snakeToCamel(item));
        res.status(200).json(camelCaseData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createEmailAutomation = async (req, res) => {
    let logId = null;
    const supabase = getAuthenticatedClient(req.accessToken);

    try {
        const payload = camelToSnake(req.body);

        const company = getCompanyFromEmail(payload["target_email"]);
        const baseResumeId = payload["role"];
        const baseResumeData = await jobProfileDbController.fetchJobProfileById(supabase, baseResumeId);
        const role = baseResumeData["profile_type"];

        // Transform from flat DB format to nested resume format expected by EJS template
        const baseResumeCamel = snakeToCamel(baseResumeData);
        const baseResume = transformToApiFormat(baseResumeCamel);

        // 1. Start Logging
        logId = await createRequestLog(supabase, req.user.id, 'EMAIL_AUTOMATION', '/create-email', payload, company, role);

        const senderEmail = req.user.userEmailString;

        // Check for duplicates - MOVED TO MIDDLEWARE
        // const duplicates = await dbController.checkDuplicateEmailWithInTimeFrame(supabase, payload);
        // if (duplicates && duplicates.length > 0) { ... }

        const data = await dbController.insertEmailAutomation(supabase, payload, req.user.id);

        // Push the task into SQS queue
        const task = {
            id: data.id,
            user_id: req.user.id,
            senderEmail,
            logId,
            company,
            role,
            baseResume
        };

        await sendMessageToQueue(task);

        const response = snakeToCamel(data);

        res.status(201).json(response);
    } catch (error) {
        // 3. Complete Logging (Failure)
        if (logId) {
            await completeRequestLog(supabase, logId, 'FAILED', 500, null, error.message);
        }
        res.status(500).json({ error: error.message });
    }
};

export const updateEmailAutomation = async (req, res) => {
    try {
        const supabase = getAuthenticatedClient(req.accessToken);
        const payload = camelToSnake(req.body);
        const id = req.params.id;
        const data = await dbController.updateEmailAutomation(supabase, payload, req.user.id, id);
        const response = snakeToCamel(data);
        res.status(201).json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const retryFailedApplications = async (req, res) => {
    let logId = null;
    const { id } = req.body; // Expecting { id: "automation_uuid" }

    if (!id) return res.status(400).json({ error: "Missing automation ID" });

    try {
        const supabase = getAuthenticatedClient(req.accessToken);

        // 1. Fetch the failed record using Abstracted DB Controller
        const record = await dbController.fetchEmailAutomationById(supabase, id, req.user.id);

        if (!record) {
            return res.status(404).json({ error: "Application not found or access denied." });
        }

        // 2. Validate status (must be FAILED to retry)
        // Optionally allow retrying PENDING if stuck? For now, stick to FAILED.
        if (record.status !== 'FAILED') {
            // We can allow retrying if it's been 'IN_PROGRESS' for too long, but simple check first
            return res.status(400).json({ error: `Cannot retry application with status: ${record.status}` });
        }

        // 3. Reset status to PENDING using Abstracted DB Controller
        const updatedRecord = await dbController.resetEmailAutomationStatus(supabase, id);

        // 4. Re-construct the task for SQS
        // We need 'baseResume' data which isn't stored in email_automations directly, 
        // but we have 'role' (profile_type) or generated_resume_id.
        // The original create flow used 'role' to fetch 'baseResume' from 'job_profiles'.

        let baseResume = null;
        if (record.role) {
            // Re-fetch base resume based on role/profile_type
            const baseResumeData = await jobProfileDbController.fetchJobProfileById(supabase, record.role);
            if (baseResumeData) {
                const baseResumeCamel = snakeToCamel(baseResumeData);
                baseResume = transformToApiFormat(baseResumeCamel);
            }
        }

        // Create Log entry for the retry
        logId = await createRequestLog(
            supabase,
            req.user.id,
            'EMAIL_AUTOMATION',
            '/retry-failed',
            { original_automation_id: id },
            updatedRecord.company,
            updatedRecord.role
        );

        const task = {
            id: updatedRecord.id,
            user_id: req.user.id,
            senderEmail: updatedRecord.sender_email,
            logId: logId, // Pass the NEW log ID
            company: updatedRecord.company,
            role: updatedRecord.role,
            baseResume,
            // Add retry flag if needed by worker
            isRetry: true
        };

        // 5. Push to Queue
        await sendMessageToQueue(task);

        const response = snakeToCamel(updatedRecord);
        res.status(200).json({ message: "Retry initiated", data: response });

    } catch (error) {
        console.error("Retry failed:", error);
        if (logId) {
            await completeRequestLog(supabase, logId, 'FAILED', 500, null, error.message);
        }
        res.status(500).json({ error: "Failed to retry application: " + error.message });
    }
};
