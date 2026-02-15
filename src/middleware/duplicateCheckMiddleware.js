
import { getAuthenticatedClient } from '../utils/supabaseClientHelper.js';
import * as dbController from '../DatabaseController/emailAutomationDatabaseController.js';
import { camelToSnake } from '../controllers/utils.js';

export const duplicateCheckMiddleware = async (req, res, next) => {
    try {
        const supabase = getAuthenticatedClient(req.accessToken);
        const payload = camelToSnake(req.body);

        // Check for duplicates
        const duplicates = await dbController.checkDuplicateEmailWithInTimeFrame(supabase, payload);

        if (duplicates && duplicates.length > 0) {
            console.log(`Duplicate application blocked for user ${req.user.id} to ${payload.target_email}`);
            const errorMsg = 'Duplicate application: You have already applied to this email for this role in the last 7 days.';
            return res.status(409).json({ error: errorMsg });
        }

        next();
    } catch (error) {
        console.error('Duplicate check middleware error:', error);
        res.status(500).json({ error: 'Failed to perform duplicate check.' });
    }
};
