export const userAuthMiddleware = (req, res, next) => {


    const header = req.headers;
    if (!header) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const blockedDomains = header['x-blocked-domains'];
    const blockedEmails = header['x-blocked-emails'];
    const dailyLimit = header['x-daily-limit'];
    const userEmail = header['x-user-email'];
    const appPassword = header['x-app-password'];


    const blockedDomainsArray = blockedDomains ? JSON.parse(blockedDomains) : [];
    const blockedEmailsArray = blockedEmails ? JSON.parse(blockedEmails) : [];
    const dailyLimitNumber = dailyLimit ? parseInt(dailyLimit) : 0;
    const userEmailString = userEmail ? userEmail : '';
    const appPasswordString = appPassword ? appPassword : '';

    req.user.blockedDomainsArray = blockedDomainsArray;
    req.user.blockedEmailsArray = blockedEmailsArray;
    req.user.dailyLimitNumber = dailyLimitNumber;
    req.user.userEmailString = userEmailString;
    req.user.appPasswordString = appPasswordString;

    next();
}