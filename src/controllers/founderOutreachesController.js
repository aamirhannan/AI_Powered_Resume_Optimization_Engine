
import { getAuthenticatedClient } from '../utils/supabaseClientHelper.js';
import * as dbController from '../DatabaseController/founderOutreachesDatabaseController.js';
import { createRequestLog, completeRequestLog } from '../services/apiRequestLogger.js';
import { TombaClient, Finder } from 'tomba';
import founderOutreach from '../../founderOutreach.json' assert { type: 'json' };

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


export const getFounderDetails = async (req, res) => {
    try {
        const supabase = getAuthenticatedClient(req.accessToken);
        const data = await dbController.fetchFounderDetails(supabase, req.params.id);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const fetchFounderDetailsFromTomba = async (req, res) => {
    try {
        const { url } = req.body;

        if (1 == 1) {
            return res.status(200).json({
                status: "success",
                data: founderOutreach
            });
        }

        console.log('Processing Tomba request for URL:', url);

        // Initialize Tomba Client
        const client = new TombaClient();

        // Use environment variables for keys
        const TOMBA_KEY = process.env.TOMBA_KEY;
        const TOMBA_SECRET = process.env.TOMBA_SECRET;

        // Warn if keys are missing (or handle error)
        if (!TOMBA_KEY || !TOMBA_SECRET) {
            console.warn('Tomba keys are missing in .env file.');
            throw new Error('Tomba keys are missing in .env file.');
        }

        client
            .setKey(TOMBA_KEY)
            .setSecret(TOMBA_SECRET);

        const finder = new Finder(client);

        // Call the LinkedIn Finder API
        const result = await finder.linkedinFinder(url);

        res.status(200).json({ data: result });
    } catch (error) {
        console.error('Tomba API Error:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch details from Tomba' });
    }
};