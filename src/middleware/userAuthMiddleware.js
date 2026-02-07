import { getAuthenticatedClient } from '../utils/supabaseClientHelper.js';
import { PLANS } from '../utils/utilFunctions.js';

export const userAuthMiddleware = async (req, res, next) => {
    try {
        const header = req.headers;
        if (!header) {
            return res.status(401).json({ message: 'Unauthorized' });
        }

        const userId = req.user.id;
        const supabase = getAuthenticatedClient(req.accessToken);

        // Fetch user's active subscription from user_purchases
        const { data: activePurchase, error } = await supabase
            .from('user_purchases')
            .select('plan_tier, valid_until')
            .eq('user_id', userId)
            .eq('status', 'SUCCESS')
            .gt('valid_until', new Date().toISOString())
            .order('valid_until', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (error) {
            console.error('Error fetching user plan:', error.message);
        }

        // Determine plan tier: use active purchase or default to TRIAL
        const planTierString = activePurchase?.plan_tier || PLANS.TRIAL_TIER;

        // Parse other headers
        const blockedDomains = header['x-blocked-domains'];
        const blockedEmails = header['x-blocked-emails'];
        const dailyLimit = header['x-daily-limit'];
        const userEmailString = header['x-user-email'];

        const blockedDomainsArray = blockedDomains ? JSON.parse(blockedDomains) : [];
        const blockedEmailsArray = blockedEmails ? JSON.parse(blockedEmails) : [];
        const dailyLimitNumber = dailyLimit ? parseInt(dailyLimit) : 0;

        // Attach to request object
        req.user.blockedDomainsArray = blockedDomainsArray;
        req.user.blockedEmailsArray = blockedEmailsArray;
        req.user.dailyLimitNumber = dailyLimitNumber;
        req.user.planTier = planTierString;
        req.user.userEmailString = userEmailString;

        next();
    } catch (error) {
        console.error('userAuthMiddleware Error:', error);
        return res.status(500).json({ message: 'Internal server error during user auth' });
    }
};