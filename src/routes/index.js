import express from "express";
import { founderOutreachesRoutes } from "./founderOutreachesRoutes";
import { emailAutomationRoutes } from "./emailAutomationRoutes";
import { generatedResumeRoutes } from "./generatedResumeRoutes";
import { masterResumeRoutes } from "./masterResumeRoutes";
import { resumeGenerationRoutes } from "./resumeGenerationRoutes";
import { userSettingRoutes } from "./userSettingRoutes";

const router = express.Router();

router.use("/email-automation", emailAutomationRoutes);
router.use("/founder-outreaches", founderOutreachesRoutes);
router.use("/generated-resume", generatedResumeRoutes);
router.use("/master-resume", masterResumeRoutes);
router.use("/resume-generation", resumeGenerationRoutes);
router.use("/user-setting", userSettingRoutes);

export default router;