
import { supabase } from '../config/supabase.js';

export const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({ success: false, error: 'Missing Authorization header' });
        }

        const token = authHeader.split(' ')[1];
        if (!token) {
            return res.status(401).json({ success: false, error: 'Invalid Authorization header format' });
        }

        // Validate token with Supabase
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            console.error('Auth verification failed:', error);
            return res.status(401).json({ success: false, error: 'Invalid or expired token' });
        }

        // Attach user to request
        req.user = user;

        // Pass the token along so we can recreate the client if needed
        req.accessToken = token;

        next();
    } catch (error) {
        console.error('Auth Middleware Error:', error);
        return res.status(500).json({ success: false, error: 'Internal Server Error during authentication' });
    }
};
