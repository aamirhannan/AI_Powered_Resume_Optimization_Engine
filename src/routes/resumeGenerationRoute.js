import express from 'express';
import { getResumeGeneration, createResumeGeneration } from '../controllers/resumeGenerationController.js';

const router = express.Router();

router.get('/resume-generation', getResumeGeneration);
router.post('/resume-generation', createResumeGeneration);

export default router;
