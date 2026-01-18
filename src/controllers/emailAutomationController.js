
import { getAuthenticatedClient } from '../utils/supabaseClientHelper.js';
import * as dbController from '../DatabaseController/emailAutomationDatabaseController.js';
import { camelToSnake, snakeToCamel } from './utils.js';
import { encrypt } from '../utils/crypto.js';

import { sendMessageToQueue } from '../services/sqsService.js';

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
    try {
        const supabase = getAuthenticatedClient(req.accessToken);
        const senderEmail = req.headers['x-smtp-email'];
        const appPassword = req.headers['x-smtp-password'];
        const encryptedPassword = encrypt(appPassword);
        const payload = camelToSnake(req.body);
        const data = await dbController.insertEmailAutomation(supabase, payload, req.user.id);

        // Push the task into SQS queue
        const task = {
            id: data.id,
            senderEmail,
            encryptedPassword,
        };

        await sendMessageToQueue(task);

        const response = snakeToCamel(data);
        res.status(201).json(response);
    } catch (error) {
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
