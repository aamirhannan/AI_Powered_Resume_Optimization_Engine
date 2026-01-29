import express from 'express';
import { getFounderOutreaches, createFounderOutreach } from '../controllers/founderOutreachesController.js';

const router = express.Router();

router.get('/founders-outreach-with-linkedin', getFounderOutreaches);
router.post('/founders-outreach-with-linkedin', createFounderOutreach);

export default router;