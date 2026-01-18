import express from 'express';
import { getEmailAutomation, createEmailAutomation, updateEmailAutomation } from '../controllers/emailAutomationController.js';

const router = express.Router();

router.get('/get-emails', getEmailAutomation);
router.post('/create-email', createEmailAutomation);
router.put('/update-email/:id', updateEmailAutomation);

export default router;