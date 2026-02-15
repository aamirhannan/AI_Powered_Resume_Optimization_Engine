import express from 'express';
import { getEmailAutomation, createEmailAutomation, updateEmailAutomation, retryFailedApplications } from '../controllers/emailAutomationController.js';
import { verifyUserAuthMiddlewawre } from '../middleware/verifyUserAuthMiddlewawre.js';
import { rateLimitEmailMiddleware } from '../middleware/rateLimitEmailMiddleware.js';
import { duplicateCheckMiddleware } from '../middleware/duplicateCheckMiddleware.js';

const router = express.Router();

router.get('/get-emails', getEmailAutomation);
// Order: Auth -> Rate Limit -> Duplicate Check -> Controller
router.post('/create-email', verifyUserAuthMiddlewawre, rateLimitEmailMiddleware, duplicateCheckMiddleware, createEmailAutomation);
// router.post('/create-email', verifyUserAuthMiddlewawre, createEmailAutomation);
router.put('/update-email/:id', updateEmailAutomation);
router.post('/retry-failed', retryFailedApplications);

export default router;