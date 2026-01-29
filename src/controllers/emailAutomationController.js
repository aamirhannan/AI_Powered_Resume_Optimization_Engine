
import { getAuthenticatedClient } from '../utils/supabaseClientHelper.js';
import * as dbController from '../DatabaseController/emailAutomationDatabaseController.js';
import * as jobProfileDbController from '../DatabaseController/jobProfileDatabaseController.js';
import { camelToSnake, snakeToCamel } from './utils.js';
import { encrypt } from '../utils/crypto.js';
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
        const appPassword = req.user.appPasswordString;
        const encryptedPassword = encrypt(appPassword);

        // Check for duplicates
        const duplicates = await dbController.checkDuplicateEmailWithInTimeFrame(supabase, payload);
        if (duplicates && duplicates.length > 0) {
            const errorMsg = 'Duplicate application: You have already applied to this email for this role in the last 7 days.';
            if (logId) {
                await completeRequestLog(supabase, logId, 'FAILED', 409, { error: errorMsg }, errorMsg);
            }
            return res.status(409).json({ error: errorMsg });
        }

        const data = await dbController.insertEmailAutomation(supabase, payload, req.user.id);



        // Push the task into SQS queue
        const task = {
            id: data.id,
            senderEmail,
            encryptedPassword,
            logId,
            company,
            role,
            baseResume
        };

        await sendMessageToQueue(task);

        const response = snakeToCamel(data);

        // 2. Complete Logging (Success)
        // if (logId) {
        //     await completeRequestLog(supabase, logId, 'SUCCESS', 201, { email_automation_id: data.id });
        // }

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
