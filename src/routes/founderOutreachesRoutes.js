import express from 'express';
import { getFounderOutreaches, createFounderOutreach, getFounderDetails, fetchFounderDetailsFromTomba } from '../controllers/founderOutreachesController.js';

const router = express.Router();

router.get('/get-details', getFounderOutreaches);
router.post('/create-outreach', createFounderOutreach);
router.get('/get-details/:id', getFounderDetails);
router.post('/fetch-details', fetchFounderDetailsFromTomba);

export default router;