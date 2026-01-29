import express from 'express';
import { getEmailAutomation, createEmailAutomation, updateEmailAutomation } from '../controllers/emailAutomationController.js';
import { verifyUserAuthMiddlewawre } from '../middleware/verifyUserAuthMiddlewawre.js';

const router = express.Router();

router.get('/get-emails', getEmailAutomation);
router.post('/create-email', verifyUserAuthMiddlewawre, createEmailAutomation);
router.put('/update-email/:id', updateEmailAutomation);
// router.post('/retry-failed', retryFailedApplications);

export default router;