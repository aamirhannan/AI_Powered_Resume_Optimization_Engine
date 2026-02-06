export const getCompanyFromEmail = (email) => {
    const company = email.split('@')[1];
    return company;
}

export const PLAN_LIMITS = {
    TRIAL_TIER: 5,
    PRO_TIER: 10,
    PREMIUM_TIER: 25
};

export const PLANS = {
    TRIAL_TIER: 'TRIAL_TIER',
    PRO_TIER: 'PRO_TIER',
    PREMIUM_TIER: 'PREMIUM_TIER'
};

export const PLAN_PRICES = {
    TRIAL_TIER: 0,
    PRO_TIER: 499000,
    PREMIUM_TIER: 99900
};