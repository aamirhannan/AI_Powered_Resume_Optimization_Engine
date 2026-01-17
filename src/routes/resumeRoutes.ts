import express, { Router } from 'express';
import { generateResume, generateResumePDF } from '#controllers/resumeController';
import { processApplication, retryFailedApplications } from '#controllers/applicationController';

const router: Router = express.Router();

// router.post('/generate', generateResume);
// router.post('/generate-pdf', generateResumePDF);
router.post('/process-application', processApplication);
router.post('/retry-failed', retryFailedApplications);

// generate resume
router.post('/generate-resume-content', generateResume);
router.post('/generate-resume-pdf', generateResumePDF);

// founders outreach
// apify integration
router.post('/founders-outreach-with-linkedin', (_req, _res) => { });
router.post('/founders-outreach-with-email', (_req, _res) => { });

export default router;
