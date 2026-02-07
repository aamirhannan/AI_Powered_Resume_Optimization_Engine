import express from 'express';
import { getUserSettings, updateUserSettings } from '../controllers/userSettingController.js';
import { userOnboarding } from '../controllers/userOnboardingController.js';


const router = express.Router();

router.get('/get-user-settings', getUserSettings);
router.post('/update-user-settings', updateUserSettings);
router.get("/user-onboarding", userOnboarding);

export default router;