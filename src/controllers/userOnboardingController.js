// user onbording is only completed when a user has a entry in job_profile table AND user_integration table

import { getAuthenticatedClient } from '../utils/supabaseClientHelper.js';
import { checkJobProfile, checkUserIntegration, deleteIntegrationByUserId } from '../DatabaseController/userOnboardingDatabaseController.js';

export const userOnboarding = async (req, res) => {
    try {
        const supabase = getAuthenticatedClient(req.accessToken);
        const userId = req.user.id;

        const hasJobProfile = await checkJobProfile(supabase, userId);
        const hasIntegration = await checkUserIntegration(supabase, userId);
        const isOnboardingComplete = hasJobProfile && hasIntegration;

        res.status(200).json({
            isOnboardingComplete,
            hasJobProfile,
            hasIntegration
        });
    } catch (error) {
        console.log("userOnboarding", error);
        res.status(500).json({ error: error.message });
    }
};

export const deleteUserIntegration = async (req, res) => {
    try {
        const supabase = getAuthenticatedClient(req.accessToken);
        const userId = req.user.id;

        await deleteIntegrationByUserId(supabase, userId);

        res.status(200).json({ message: 'Integration deleted successfully' });
    } catch (error) {
        console.log("deleteUserIntegration", error);
        res.status(500).json({ error: error.message });
    }
};