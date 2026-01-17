import express from 'express';
import { getEmailAutomation, createEmailAutomation } from '../controllers/emailAutomationController.js';

const router = express.Router();

router.get('/email-automation', getEmailAutomation);
router.post('/email-automation', createEmailAutomation);

export default router;