import express from 'express';
import { getUserSettings, updateUserSettings } from '../controllers/userSettingController.js';

const router = express.Router();

router.get('/get-user-settings', getUserSettings);
router.post('/update-user-settings', updateUserSettings);

export default router;