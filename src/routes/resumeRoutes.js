import express from 'express';
import { generateResume, generateResumePDF } from '../controllers/resumeController.js';
import { processApplication } from '../controllers/applicationController.js';

const router = express.Router();

// router.post('/generate', generateResume);
// router.post('/generate-pdf', generateResumePDF);
router.post('/process-application', processApplication);

export default router;
