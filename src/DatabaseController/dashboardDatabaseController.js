
import { startOfDay, subDays, startOfWeek, endOfWeek, subWeeks, format, parseISO, differenceInMilliseconds } from 'date-fns';

const calculateGrowth = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
};

export const fetchDashboardMetrics = async (client, { startDate, endDate } = {}) => {
    const now = new Date();

    let currentStart, currentEnd;
    let prevStart, prevEnd;

    if (startDate && endDate) {
        currentStart = new Date(startDate);
        currentEnd = new Date(endDate);
        const duration = currentEnd.getTime() - currentStart.getTime();
        prevStart = new Date(currentStart.getTime() - duration);
        prevEnd = currentStart;
    } else {
        // Default: This Week vs Last Week
        currentStart = startOfWeek(now, { weekStartsOn: 1 });
        currentEnd = endOfWeek(now, { weekStartsOn: 1 }); // End of this week (future included? or limit to now?)
        // Usually metrics for "This Week" includes days not yet passed (which are 0), so it's fine.

        prevStart = startOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
        prevEnd = endOfWeek(subWeeks(now, 1), { weekStartsOn: 1 });
    }

    // Fetch all logs within the broad range (prevStart to currentEnd)
    // to minimize DB calls.
    const { data: logs, error } = await client
        .from('api_request_logs')
        .select('type, created_at')
        .gte('created_at', prevStart.toISOString())
        .lte('created_at', currentEnd.toISOString());

    if (error) throw error;

    const metrics = {
        totalSent: { count: 0, growth: 0 },
        emailAgent: { count: 0, growth: 0 },
        founderOutreach: { count: 0, growth: 0 },
        resumeGenerated: { count: 0, growth: 0 }
    };

    let currentCounts = { total: 0, email: 0, founder: 0, resume: 0 };
    let prevCounts = { total: 0, email: 0, founder: 0, resume: 0 };

    const currentStartMs = currentStart.getTime();
    const currentEndMs = currentEnd.getTime();
    const prevStartMs = prevStart.getTime();
    const prevEndMs = prevEnd.getTime();

    logs.forEach(log => {
        const logTime = new Date(log.created_at).getTime();
        const isEmail = log.type === 'EMAIL_AUTOMATION';
        const isFounder = log.type === 'FOUNDERS_OUTREACH';
        const isResume = log.type === 'RESUME_GENERATION';
        const isTotalEmail = isEmail || isFounder;

        if (logTime >= currentStartMs && logTime <= currentEndMs) {
            if (isTotalEmail) currentCounts.total++;
            if (isEmail) currentCounts.email++;
            if (isFounder) currentCounts.founder++;
            if (isResume) currentCounts.resume++;
        } else if (logTime >= prevStartMs && logTime <= prevEndMs) {
            if (isTotalEmail) prevCounts.total++;
            if (isEmail) prevCounts.email++;
            if (isFounder) prevCounts.founder++;
            if (isResume) prevCounts.resume++;
        }
    });

    metrics.totalSent.count = currentCounts.total;
    metrics.emailAgent.count = currentCounts.email;
    metrics.founderOutreach.count = currentCounts.founder;
    metrics.resumeGenerated.count = currentCounts.resume;

    metrics.totalSent.growth = calculateGrowth(currentCounts.total, prevCounts.total);
    metrics.emailAgent.growth = calculateGrowth(currentCounts.email, prevCounts.email);
    metrics.founderOutreach.growth = calculateGrowth(currentCounts.founder, prevCounts.founder);
    metrics.resumeGenerated.growth = calculateGrowth(currentCounts.resume, prevCounts.resume);

    return metrics;
};

export const fetchDashboardRoleDistribution = async (client, { startDate, endDate } = {}) => {
    let query = client
        .from('api_request_logs')
        .select('role, type')
        .in('type', ['EMAIL_AUTOMATION', 'FOUNDERS_OUTREACH']);

    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data: logs, error } = await query;
    if (error) throw error;

    const roleCounts = {};

    logs.forEach(log => {
        const role = log.role || 'Other';
        roleCounts[role] = (roleCounts[role] || 0) + 1;
    });

    const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#0088fe'];

    return Object.entries(roleCounts).map(([role, count], index) => ({
        role,
        count,
        fill: COLORS[index % COLORS.length]
    }));
};

export const fetchDashboardDailyVelocity = async (client, { startDate, endDate } = {}) => {
    let query = client
        .from('api_request_logs')
        .select('created_at, role, type')
        .in('type', ['EMAIL_AUTOMATION', 'FOUNDERS_OUTREACH']);

    if (startDate) {
        query = query.gte('created_at', startDate);
    } else {
        // Default to last 7 days if no range provided
        const sevenDaysAgo = subDays(new Date(), 7).toISOString();
        query = query.gte('created_at', sevenDaysAgo);
    }

    if (endDate) {
        query = query.lte('created_at', endDate);
    }

    const { data: logs, error } = await query;
    if (error) throw error;

    const velocityMap = {};

    logs.forEach(log => {
        const date = log.created_at.split('T')[0];
        const role = log.role || 'Other';

        if (!velocityMap[date]) {
            velocityMap[date] = { date };
        }
        velocityMap[date][role] = (velocityMap[date][role] || 0) + 1;
    });
    
    return Object.values(velocityMap).sort((a, b) => a.date.localeCompare(b.date));
};

export const fetchDashboardHeatmap = async (client, { startDate, endDate } = {}) => {
    let query = client
        .from('api_request_logs')
        .select('created_at')
        .in('type', ['EMAIL_AUTOMATION', 'FOUNDERS_OUTREACH']);

    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data: logs, error } = await query;
    if (error) throw error;

    const dateCounts = {};
    logs.forEach(log => {
        const date = log.created_at.split('T')[0];
        dateCounts[date] = (dateCounts[date] || 0) + 1;
    });

    return Object.entries(dateCounts).map(([date, count]) => ({ date, count }));
};

export const fetchDashboardRecentActivity = async (client) => {
    // Recent activity is usually just the last N items, ignoring time filters unless explicitly requested (but usually dashboard activity feed is "Latest regardless of filter")
    // If the user wants filtering on activity, we can add it, but usually standard is "Latest".
    const { data: logs, error } = await client
        .from('api_request_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) throw error;

    return logs.map(log => ({
        id: log.id,
        company: log.request_payload?.company_name || log.request_payload?.company || 'Unknown Company',
        role: log.request_payload?.role || 'Unknown Role',
        date: log.created_at,
        status: log.status,
        type: log.type
    }));
};

export const fetchApiLogs = async (client, { type, limit = 100, startDate, endDate }) => {
    let query = client
        .from('api_request_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

    if (type) {
        query = query.eq('type', type);
    }
    if (startDate) query = query.gte('created_at', startDate);
    if (endDate) query = query.lte('created_at', endDate);

    const { data, error } = await query;
    if (error) throw error;

    return data.map(log => ({
        ...log,
        requestPayload: log.request_payload,
        responsePayload: log.response_payload,
        executionLogs: log.execution_logs,
        durationMs: log.duration_ms,
        errorMessage: log.error_message,
        createdAt: log.created_at,
        updatedAt: log.updated_at,
        role: log.request_payload?.role || 'N/A',
        company: log.request_payload?.company || log.request_payload?.company_name || 'N/A'
    }));
};
