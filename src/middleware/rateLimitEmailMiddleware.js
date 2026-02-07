
import { getAuthenticatedClient } from '../utils/supabaseClientHelper.js';
import * as dbController from '../DatabaseController/emailAutomationDatabaseController.js';
import { PLAN_EMAIL_LIMITS, PLANS } from '../utils/utilFunctions.js';

export const rateLimitEmailMiddleware = async (req, res, next) => {
    try {
        const { planTier, id: userId } = req.user;
        const supabase = getAuthenticatedClient(req.accessToken);

        let limit = PLAN_EMAIL_LIMITS.TRIAL_TIER;
        let startTime = new Date();

        // 1. Determine Limits based on Plan
        if (planTier === PLANS.TRIAL_TIER) {
            limit = PLAN_EMAIL_LIMITS.TRIAL_TIER;
            // Rolling 30 Days window
            startTime.setDate(startTime.getDate() - 30);
        } else if (planTier === PLANS.PRO_TIER) {
            limit = PLAN_EMAIL_LIMITS.PRO_TIER;
            // Rigid Day Window: Resets at 00:00 UTC today
            startTime.setUTCHours(0, 0, 0, 0);
        } else if (planTier === PLANS.PREMIUM_TIER) {
            limit = PLAN_EMAIL_LIMITS.PREMIUM_TIER;
            // Rigid Day Window: Resets at 00:00 UTC today
            startTime.setUTCHours(0, 0, 0, 0);
        } else {
            // Fallback for unknown plans
            limit = PLAN_EMAIL_LIMITS.TRIAL_TIER;
            startTime.setDate(startTime.getDate() - 30);
        }

        // 2. Count Usage
        const count = await dbController.countEmailsInTimeFrame(supabase, userId, startTime);

        // 3. Enforce Limit
        if (count >= limit) {
            return res.status(429).json({
                error: `Rate limit reached. You are on the ${planTier} plan which allows ${limit} emails per period. You have already sent ${count}.`,
                currentUsage: count,
                limit: limit,
                plan: planTier,
                resetTime: planTier === PLANS.TRIAL_TIER ? 'Rolling 30 Days' : '00:00 UTC Tomorrow'
            });
        }

        next();

    } catch (error) {
        console.error('Rate Limit Middleware Error:', error);
        return res.status(500).json({ error: 'Internal Server Error during rate limiting check' });
    }
};
