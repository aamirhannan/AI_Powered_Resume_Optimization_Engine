import express from 'express';
import { generateResume, generateResumePDF } from '#controllers/resumeController.js';
import { processApplication, retryFailedApplications } from '#controllers/applicationController.js';

const router = express.Router();

// router.post('/generate', generateResume);
// router.post('/generate-pdf', generateResumePDF);
router.post('/process-application', processApplication);
router.post('/retry-failed', retryFailedApplications);

// generate resume
router.post('/generate-resume-content', generateResume);
router.post('/generate-resume-pdf', generateResumePDF);

// founders outreach
// apify integration
router.post('/founders-outreach-with-linkedin', () => { });
router.post('/founders-outreach-with-email', () => { });

export default router;
