import { getAuthenticatedClient } from '../utils/supabaseClientHelper.js';
import * as dbController from '../DatabaseController/userSettingsDatabaseController.js';
import { camelToSnake, snakeToCamel } from './utils.js';

export const getUserSettings = async (req, res) => {
    try {
        const supabase = getAuthenticatedClient(req.accessToken);
        const data = await dbController.fetchUserSettings(supabase);
        const response = snakeToCamel(data);
        res.status(200).json(response || {});
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateUserSettings = async (req, res) => {
    try {
        const supabase = getAuthenticatedClient(req.accessToken);
        const payload = camelToSnake(req.body);
        const data = await dbController.upsertUserSettings(supabase, payload, req.user.id);
        const response = snakeToCamel(data);
        res.status(201).json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};