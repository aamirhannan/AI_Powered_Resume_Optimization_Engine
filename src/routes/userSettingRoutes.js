import express from 'express';
import { getUserSettings, createUserSettings } from '../controllers/userSettingController.js';

const router = express.Router();

router.get('/user-settings', getUserSettings);
router.post('/user-settings', createUserSettings);

export default router;