
import { getAuthenticatedClient } from '../utils/supabaseClientHelper.js';
import { getCompanyFromEmail } from '../utils/utilFunctions.js';

/**
 * Creates a new API request log entry.
 * @param {Object} supabase - The Supabase client instance.
 * @param {string} userId - The user's ID.
 * @param {string} type - The logs type (RESUME_GENERATION, EMAIL_AUTOMATION, FOUNDERS_OUTREACH).
 * @param {string} endpoint - The API endpoint being called.
 * @param {Object} requestPayload - The request body/params.
 * @returns {Promise<string>} - The ID of the created log entry.
 */
export const createRequestLog = async (supabase, userId, type, endpoint, requestPayload, company = "", role = "") => {
    try {
        const { data, error } = await supabase
            .from('api_request_logs')
            .insert({
                user_id: userId,
                type,
                endpoint,
                request_payload: requestPayload,
                status: 'PENDING',
                execution_logs: [],
                company,
                role,
            })
            .select('id')
            .single();

        if (error) {
            console.error('Error creating request log:', error);
            return null;
        }
        return data.id;
    } catch (err) {
        console.error('Exception in createRequestLog:', err);
        return null;
    }
};

/**
 * Appends a step to the execution logs of a request.
 * @param {Object} supabase - The Supabase client instance.
 * @param {string} logId - The ID of the log entry.
 * @param {string} stepName - Name of the step (e.g., 'LLM_REWRITE').
 * @param {string} status - Status of the step (SUCCESS, FAILED, IN_PROGRESS).
 * @param {Object} details - Additional metadata for the step.
 */
export const logStep = async (supabase, logId, stepName, status, details = {}) => {
    if (!logId) return;

    const newEntry = {
        step: stepName,
        status,
        timestamp: new Date().toISOString(),
        ...details
    };

    try {
        // Optimistic append using existing execution_logs
        const { data: currentData, error: fetchError } = await supabase
            .from('api_request_logs')
            .select('execution_logs')
            .eq('id', logId)
            .single();

        if (fetchError) {
            console.error('Error fetching logs for append:', fetchError);
            return;
        }

        const updatedLogs = [...(currentData.execution_logs || []), newEntry];

        const { error: updateError } = await supabase
            .from('api_request_logs')
            .update({ execution_logs: updatedLogs })
            .eq('id', logId);

        if (updateError) console.error('Error appending log step:', updateError);

    } catch (err) {
        console.error('Exception in logStep:', err);
    }
};

/**
 * Marks the request log as completed (SUCCESS or FAILED).
 * @param {Object} supabase - The Supabase client instance.
 * @param {string} logId - The ID of the log entry.
 * @param {string} status - Final status (SUCCESS, FAILED).
 * @param {number} statusCode - HTTP status code.
 * @param {Object} responsePayload - The response data sent to the user.
 * @param {string} errorMessage - Error message if failed.
 * @param {number} duration_ms - Duration in milliseconds.
 */
export const completeRequestLog = async (
    supabase,
    logId,
    status,
    statusCode,
    responsePayload,
    duration_ms = 0,
    errorMessage = null,
) => {
    if (!logId) return;

    try {
        const updateData = {
            status,
            status_code: statusCode,
            response_payload: responsePayload,
            duration_ms,
            updated_at: new Date().toISOString()
        };

        if (errorMessage) {
            updateData.error_message = errorMessage;
        }

        const { error } = await supabase
            .from('api_request_logs')
            .update(updateData)
            .eq('id', logId);

        if (error) console.error('Error completing request log:', error);
    } catch (err) {
        console.error('Exception in completeRequestLog:', err);
    }
};
