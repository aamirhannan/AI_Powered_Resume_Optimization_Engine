
import { getAuthenticatedClient } from '../utils/supabaseClientHelper.js';
import * as dbController from '../DatabaseController/founderOutreachesDatabaseController.js';
import { createRequestLog, completeRequestLog } from '../services/apiRequestLogger.js';

export const getFounderOutreaches = async (req, res) => {
    try {
        const supabase = getAuthenticatedClient(req.accessToken);
        const data = await dbController.fetchFounderOutreaches(supabase);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const createFounderOutreach = async (req, res) => {
    let logId = null;
    const supabase = getAuthenticatedClient(req.accessToken);

    try {
        // 1. Start Logging
        logId = await createRequestLog(supabase, req.user.id, 'FOUNDERS_OUTREACH', '/create-outreach', req.body);

        const data = await dbController.insertFounderOutreach(supabase, req.body, req.user.id);

        // 2. Complete Logging (Success)
        if (logId) {
            await completeRequestLog(supabase, logId, 'SUCCESS', 201, { outreach_id: data.id });
        }

        res.status(201).json(data);
    } catch (error) {
        // 3. Complete Logging (Failure)
        if (logId) {
            await completeRequestLog(supabase, logId, 'FAILED', 500, null, error.message);
        }
        res.status(500).json({ error: error.message });
    }
};
