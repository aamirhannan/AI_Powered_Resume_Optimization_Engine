import * as dbController from '../DatabaseController/apiRequestLogDatabaseController.js';
import { snakeToCamel } from './utils.js';
import { getAuthenticatedClient } from '../utils/supabaseClientHelper.js';

export const getRequestApiLogs = async (req, res) => {
    try {
        const supabase = getAuthenticatedClient(req.accessToken);
        const data = await dbController.fetchApiRequestLogs(supabase);

        const response = data.map((item) => snakeToCamel(item));

        res.json({ success: true, data: response });
    } catch (error) {
        console.error("Error fetching API request logs:", error);
        res.status(500).json({ success: false, error: error.message });
    }
};

