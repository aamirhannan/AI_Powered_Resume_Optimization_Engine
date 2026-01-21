import express from 'express';
import { getEmailAutomation, createEmailAutomation, updateEmailAutomation } from '../controllers/emailAutomationController.js';

const router = express.Router();

router.get('/get-emails', getEmailAutomation);
router.post('/create-email', createEmailAutomation);
router.put('/update-email/:id', updateEmailAutomation);
// router.post('/retry-failed', retryFailedApplications);

export default router;