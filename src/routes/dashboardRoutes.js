import express from 'express';
import { getDashboardMetrics, getDashboardRoleDistribution, getDashboardDailyVelocity, getDashboardHeatmap, getDashboardRecentActivity, getApiLogs } from '../controllers/dashboardController.js';

const router = express.Router();

router.get('/metrics', getDashboardMetrics);
router.get('/charts/role-distribution', getDashboardRoleDistribution);
router.get('/charts/daily-velocity', getDashboardDailyVelocity);
router.get('/charts/heatmap', getDashboardHeatmap);
router.get('/recent-activity', getDashboardRecentActivity);
router.get('/logs', getApiLogs);
export default router;