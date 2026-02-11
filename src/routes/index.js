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
import resumeParserRoutes from "./resumeParserRoutes.js";
import paymentRoutes from "./paymentRoutes.js";

const router = express.Router();

// Features routes
router.use("/email-automation", emailAutomationRoutes);
router.use("/resume-generation", resumeGenerationRoutes);
router.use("/founder-outreaches", founderOutreachesRoutes);

// User facing routes
router.use("/dashboard", dashboardRoutes);
router.use("/user-setting", userSettingRoutes);
router.use("/api-request-logs", apiRequestLogRoutes);
router.use("/job-profile", jobProfileRoutes);
router.use("/resume-parser", resumeParserRoutes);
router.use("/payment", paymentRoutes);

router.use("/generated-resume", generatedResumeRoutes);
router.use("/master-resume", masterResumeRoutes);



export default router;