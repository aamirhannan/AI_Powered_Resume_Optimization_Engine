// user onbording is only completed when a user has a entry in job_profile table AND user_integration table

import { getAuthenticatedClient } from '../utils/supabaseClientHelper.js';

export const userOnboarding = async (req, res) => {
    try {
        const supabase = getAuthenticatedClient(req.accessToken);
        const userId = req.user.id;

        // Check if user has at least one job profile
        const { data: jobProfiles, error: jobProfileError } = await supabase
            .from('job_profiles')
            .select('id')
            .eq('user_id', userId)
            .limit(1);

        if (jobProfileError) {
            throw jobProfileError;
        }

        // Check if user has at least one integration (e.g., Gmail)
        const { data: integrations, error: integrationError } = await supabase
            .from('user_integrations')
            .select('id')
            .eq('user_id', userId)
            .limit(1);

        if (integrationError) {
            throw integrationError;
        }

        const hasJobProfile = jobProfiles && jobProfiles.length > 0;
        const hasIntegration = integrations && integrations.length > 0;
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