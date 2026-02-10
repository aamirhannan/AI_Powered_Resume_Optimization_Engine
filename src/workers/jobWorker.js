import { executeApplicationPipeline } from '../controllers/applicationController.js';
import { receiveMessagesFromQueue, deleteMessageFromQueue } from '../services/sqsService.js';
import { emailService } from '../services/emailService.js';
import { supabaseAdmin } from '../config/supabaseAdmin.js';
import { snakeToCamel } from '../controllers/utils.js';
import { getCompanyFromEmail } from '../utils/utilFunctions.js';
import { completeRequestLog, logStep } from '../services/apiRequestLogger.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const WORKER_ID = Math.random().toString(36).substring(7).toUpperCase();

export const startWorker = async () => {
    console.log(`👷 Application Worker ${WORKER_ID} (SQS) started...`);

    while (true) {
        try {
            const messages = await receiveMessagesFromQueue();

            if (!messages || messages.length === 0) {
                continue;
            }

            console.log(`Received ${messages.length} messages from SQS.`);

            for (const message of messages) {
                const { Body, ReceiptHandle } = message;

                const startedAt = Date.now();

                try {
                    const { id, senderEmail, logId, company, role, baseResume, user_id } = JSON.parse(Body);

                    const finalizeJob = async (status, payload = {}, errorMessage = null) => {
                        if (logId) {
                            await completeRequestLog(
                                supabaseAdmin,
                                logId,
                                status,
                                status === 'SUCCESS' ? 200 : (payload.statusCode || 500),
                                payload.responsePayload || {},
                                Date.now() - (startedAt || Date.now()),
                                errorMessage
                            );
                        }

                        if (id) {
                            const updateData = {
                                status,
                                updated_at: new Date()
                            };
                            if (status === 'FAILED') {
                                updateData.error = errorMessage || 'FAILED';
                            }
                            if (status === 'SUCCESS') {
                                updateData.resume_content = payload.resume_content || '';
                                updateData.email_subject = payload.email_subject || '';
                                updateData.cover_letter = payload.cover_letter || '';
                                updateData.company = payload.company;
                                updateData.role = payload.role;
                            }

                            const { error: updateError } = await supabaseAdmin
                                .from('email_automations')
                                .update(updateData)
                                .eq('id', id);

                            if (updateError) {
                                throw updateError;
                            }
                        }
                    };

                    if (logId) {
                        await logStep(supabaseAdmin, logId, 'WORKER_RECEIVED', 'SUCCESS', { workerId: WORKER_ID });
                    }

                    console.log(`👷 Worker received job: ${id}`);

                    // 1. Fetch Job from Supabase (email_automations table)
                    // We use supabaseAdmin to bypass RLS since we are a background worker
                    const { data: job, error: fetchError } = await supabaseAdmin
                        .from('email_automations')
                        .select('*')
                        .eq('id', id)
                        .single();

                    if (fetchError || !job) {
                        console.log("fetchError", fetchError)
                        console.error(`❌ Job ${id} not found in DB or error: ${fetchError?.message}. Deleting from queue.`);
                        await deleteMessageFromQueue(ReceiptHandle);
                        continue;
                    }

                    if (job.status === 'SUCCESS' || job.status === 'FAILED') {
                        console.log(`⚠️ Job ${id} already processed (${job.status}). Deleting duplicate.`);
                        await deleteMessageFromQueue(ReceiptHandle);
                        continue;
                    }

                    // 2. Mark IN_PROGRESS
                    await supabaseAdmin.from('email_automations')
                        .update({ status: 'IN_PROGRESS', updated_at: new Date() })
                        .eq('id', id);

                    // Removed completeRequestLog with IN_PROGRESS as it violates api_request_logs status constraint
                    if (logId) {
                        await logStep(supabaseAdmin, logId, 'WORKER_STARTED', 'IN_PROGRESS', { workerId: WORKER_ID });
                    }

                    // 3. Execute Pipeline
                    const jobDetails = snakeToCamel(job);

                    console.log('--- Debug: Preparing Pipeline ---');
                    console.log('Role:', jobDetails.role);
                    // console.log('Target Email:', jobDetails.targetEmail);

                    const result = await executeApplicationPipeline({
                        role: jobDetails.role,
                        jobDescription: jobDetails.jobDescription,
                        targetEmail: jobDetails.targetEmail,
                        senderEmail: senderEmail,
                        logId: logId,
                        supabase: supabaseAdmin,
                        user_id: user_id || job.user_id,
                        baseResume: baseResume
                    });

                    if (logId) {
                        await logStep(supabaseAdmin, logId, 'PIPELINE_EXECUTION', 'SUCCESS', { company: result.company });
                    }

                    console.log('--- Debug: Pipeline Result ---');
                    // console.log('Result:', JSON.stringify(result));

                    // 6. Success Update
                    // Note: 'result' column doesn't exist in your schema provided, 
                    // assuming we just update status or add text logs if needed.
                    await finalizeJob('SUCCESS', {
                        resume_content: result.finalResume || '',
                        email_subject: result.emailSubject || '',
                        cover_letter: result.coverLetter || '',
                        company,
                        role,
                        responsePayload: {
                            resume_content: result.finalResume,
                            email_subject: result.emailSubject,
                            cover_letter: result.coverLetter
                        }
                    });

                    console.log(`✅ Job ${id} COMPLETED.`);

                    await deleteMessageFromQueue(ReceiptHandle);

                } catch (err) {
                    console.error(`❌ Job Failed:`, err);
                    const statusCode = err.statusCode || 500;

                    try {
                        const { id, logId } = JSON.parse(Body);
                        const errorMessage = err.message || 'FAILED';
                        await completeRequestLog(
                            supabaseAdmin,
                            logId,
                            'FAILED',
                            statusCode,
                            { error: errorMessage },
                            Date.now() - (startedAt || Date.now()),
                            errorMessage
                        );
                        if (id) {
                            const { error: updateError } = await supabaseAdmin
                                .from('email_automations')
                                .update({ status: 'FAILED', error: errorMessage, updated_at: new Date() })
                                .eq('id', id);
                            if (updateError) {
                                throw updateError;
                            }
                        }
                        await deleteMessageFromQueue(ReceiptHandle);
                    } catch (dbErr) {
                        console.error('Failed to persist failure state:', dbErr);
                    }
                }
            }

        } catch (error) {
            console.error('Worker loop error:', error);
            await sleep(5000);
        }
    }
};
