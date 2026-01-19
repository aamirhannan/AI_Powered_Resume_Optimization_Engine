import express from 'express';
import { getResumeGeneration, createResumeGeneration, updateResumeGeneration, generateResumePdf } from '../controllers/resumeGenerationController.js';

const router = express.Router();

router.get('/get-resume', getResumeGeneration);
router.post('/create-resume', createResumeGeneration);
router.post('/update-resume', updateResumeGeneration);
router.post('/download-resume-pdf', generateResumePdf);

export default router;
