import express from 'express';
import { getMasterResume, createMasterResume } from '../controllers/masterResumeController.js';

const router = express.Router();

router.get('/master-resume', getMasterResume);
router.post('/master-resume', createMasterResume);

export default router;