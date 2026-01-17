import express, { Router } from 'express';

import { 
    processApplication,
    retryFailedApplications
} from '#src/controllers/applicationController';


const router: Router = express.Router();

router.post('/process-application', processApplication);
router.post('/retry-failed-applications', retryFailedApplications);

export default router;