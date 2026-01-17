import express from 'express';
import { getGeneratedResume, createGeneratedResume } from '../controllers/generatedResumeController.js';

const router = express.Router();

router.get('/generated-resume', getGeneratedResume);
router.post('/generated-resume', createGeneratedResume);

export default router;