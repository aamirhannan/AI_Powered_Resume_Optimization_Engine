import express from "express";
import founderOutreachesRoutes from "./founderOutreachesRoutes.js";
import emailAutomationRoutes from "./emailAutomationRoutes.js";
import generatedResumeRoutes from "./generatedResumeRoutes.js";
import masterResumeRoutes from "./masterResumeRoutes.js";
import resumeGenerationRoutes from "./resumeGenerationRoute.js";
import userSettingRoutes from "./userSettingRoutes.js";
import dashboardRoutes from "./dashboardRoutes.js";
import apiRequestLogRoutes from "./apiRequestLogRoutes.js";
import jobProfileRoutes from "./jobProfileRoutes.js";

const router = express.Router();

router.use("/email-automation", emailAutomationRoutes);
router.use("/founder-outreaches", founderOutreachesRoutes);
router.use("/generated-resume", generatedResumeRoutes);
router.use("/master-resume", masterResumeRoutes);
router.use("/resume-generation", resumeGenerationRoutes);
router.use("/user-setting", userSettingRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/api-request-logs", apiRequestLogRoutes);
router.use("/job-profile", jobProfileRoutes);

export default router;