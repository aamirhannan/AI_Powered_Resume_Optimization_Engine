export const verifyUserAuthMiddlewawre = (req, res, next) => {

    const { dailyLimitNumber, userEmailString, appPasswordString } = req.user;

    console.log("verifyUserAuthMiddlewawre", dailyLimitNumber, userEmailString, appPasswordString);

    if (!dailyLimitNumber || !userEmailString || !appPasswordString) {
        return res.status(401).json({ message: 'You are not authorized to access this resource' });
    }

    next();
}