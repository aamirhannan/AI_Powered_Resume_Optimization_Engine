import express from 'express';
import { getUserSettings, updateUserSettings } from '../controllers/userSettingController.js';
import { userOnboarding, deleteUserIntegration } from '../controllers/userOnboardingController.js';


const router = express.Router();

router.get('/get-user-settings', getUserSettings);
router.post('/update-user-settings', updateUserSettings);
router.get("/user-onboarding", userOnboarding);
router.delete("/delete-integration", deleteUserIntegration);

export default router;