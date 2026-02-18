
import { getAuthenticatedClient } from '../utils/supabaseClientHelper.js';
import * as dbController from '../DatabaseController/emailAutomationDatabaseController.js';
import * as jobProfileDbController from '../DatabaseController/jobProfileDatabaseController.js';
import { camelToSnake, snakeToCamel } from './utils.js';
import { createRequestLog, completeRequestLog, logStep } from '../services/apiRequestLogger.js';
import { transformToApiFormat } from './jobProfileController.js';

import { sendMessageToQueue } from '../services/sqsService.js';
import { getCompanyFromEmail } from '../utils/utilFunctions.js';
import * as service from '../services/emailAutomationService.js';


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
    const supabase = getAuthenticatedClient(req.accessToken);

    try {
        const userId = req.user.id;
        const userEmailString = req.user.userEmailString;

        // Check for duplicates - (This was commented out in original code, leaving it out or handled elsewhere)

        const response = await service.createEmailAutomationService(supabase, userId, req.body, userEmailString);

        res.status(201).json(response);
    } catch (error) {
        // Logging is handled in service for failures
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
    const { id } = req.body; // Expecting { id: "automation_uuid" }

    try {
        const supabase = getAuthenticatedClient(req.accessToken);
        const userId = req.user.id;

        const response = await service.retryFailedApplicationsService(supabase, userId, id);

        res.status(200).json({ message: "Retry initiated", data: response });

    } catch (error) {
        // Logging is handled in service
        res.status(500).json({ error: "Failed to retry application: " + error.message });
    }
};
