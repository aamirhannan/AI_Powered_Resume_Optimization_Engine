
import { getAuthenticatedClient } from '../utils/supabaseClientHelper.js';
import * as dbController from '../DatabaseController/dashboardDatabaseController.js';

export const getDashboardMetrics = async (req, res) => {
    try {
        const supabase = getAuthenticatedClient(req.accessToken);
        const { startDate, endDate } = req.query;
        const metrics = await dbController.fetchDashboardMetrics(supabase, { startDate, endDate });
        res.status(200).json(metrics);
    } catch (error) {
        console.error('getDashboardMetrics error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const getDashboardRoleDistribution = async (req, res) => {
    try {
        const supabase = getAuthenticatedClient(req.accessToken);
        const { startDate, endDate } = req.query;
        const distribution = await dbController.fetchDashboardRoleDistribution(supabase, { startDate, endDate });
        res.status(200).json(distribution);
    } catch (error) {
        console.error('getDashboardRoleDistribution error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const getDashboardDailyVelocity = async (req, res) => {
    try {
        const supabase = getAuthenticatedClient(req.accessToken);
        const { startDate, endDate } = req.query;
        const velocity = await dbController.fetchDashboardDailyVelocity(supabase, { startDate, endDate });
        // console.log("velocity", velocity);
        res.status(200).json(velocity);
    } catch (error) {
        console.error('getDashboardDailyVelocity error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const getDashboardHeatmap = async (req, res) => {
    try {
        const supabase = getAuthenticatedClient(req.accessToken);
        const { startDate, endDate } = req.query;
        const heatmap = await dbController.fetchDashboardHeatmap(supabase, { startDate, endDate });
        res.status(200).json(heatmap);
    } catch (error) {
        console.error('getDashboardHeatmap error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const getDashboardRecentActivity = async (req, res) => {
    try {
        const supabase = getAuthenticatedClient(req.accessToken);
        const activity = await dbController.fetchDashboardRecentActivity(supabase);
        res.status(200).json(activity);
    } catch (error) {
        console.error('getDashboardRecentActivity error:', error);
        res.status(500).json({ error: error.message });
    }
};

export const getApiLogs = async (req, res) => {
    try {
        const supabase = getAuthenticatedClient(req.accessToken);
        const { type, limit, startDate, endDate } = req.query;
        const logs = await dbController.fetchApiLogs(supabase, { type, limit, startDate, endDate });
        res.status(200).json(logs);
    } catch (error) {
        console.error('getApiLogs error:', error);
        res.status(500).json({ error: error.message });
    }
};