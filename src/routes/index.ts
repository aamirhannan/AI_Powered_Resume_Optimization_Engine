import express, { Router } from 'express';
import resumeRoutes from './resumeRoutes.js';
import dashboardRoutes from './dashboardRoutes.js';
import emailAgentRoutes from './emailAgent.js';

const router: Router = express.Router();

router.use('/', resumeRoutes);
router.use('/resume', resumeRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/email-agent', emailAgentRoutes);

export default router;
