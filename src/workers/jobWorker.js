import { executeApplicationPipeline } from '../controllers/applicationController.js';
import { receiveMessagesFromQueue, deleteMessageFromQueue } from '../services/sqsService.js';
import { decrypt } from '../utils/crypto.js';
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

                try {
                    const { id, encryptedPassword, senderEmail, logId, company, role, baseResume } = JSON.parse(Body);

                    let duration_ms = Date.now();

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

                    // 2. Decrypt Password
                    let appPassword = null;
                    try {
                        appPassword = decrypt(encryptedPassword);
                    } catch (e) {
                        const failError = 'Failed to decrypt App Password. Invalid key or data.';
                        console.error(failError);
                        await supabaseAdmin.from('email_automations')
                            .update({ status: 'FAILED', error: failError, updated_at: new Date() })
                            .eq('id', id);
                        await deleteMessageFromQueue(ReceiptHandle);
                        if (logId) {
                            await logStep(supabaseAdmin, logId, 'DECRYPT_PASSWORD', 'FAILED', { error: failError });
                        }
                        continue;
                    }

                    // 3. Verify SMTP Credentials
                    console.log(`Verifying SMTP credentials for ${senderEmail}...`);
                    const isCredsValid = await emailService.verifyCredentials(senderEmail, appPassword);

                    if (!isCredsValid) {
                        const errorMsg = `Invalid App Password or SMTP Error for ${senderEmail}. Aborting pipeline.`;
                        console.error(`❌ ${errorMsg}`);

                        await supabaseAdmin.from('email_automations')
                            .update({ status: 'FAILED', error: errorMsg, updated_at: new Date() })
                            .eq('id', id);

                        await deleteMessageFromQueue(ReceiptHandle);
                        if (logId) {
                            await logStep(supabaseAdmin, logId, 'SMTP_VERIFY', 'FAILED', { error: errorMsg });
                        }
                        continue;
                    }

                    if (logId) {
                        await logStep(supabaseAdmin, logId, 'SMTP_VERIFY', 'SUCCESS');
                    }

                    // 4. Mark IN_PROGRESS
                    await supabaseAdmin.from('email_automations')
                        .update({ status: 'IN_PROGRESS', updated_at: new Date() })
                        .eq('id', id);

                    // 5. Execute Pipeline
                    // Map snake_case DB fields to camelCase for pipeline if necessary, 
                    // or just pass them as is. The pipeline expects: role, jobDescription, targetEmail
                    const jobDetails = snakeToCamel(job);

                    console.log('--- Debug: Preparing Pipeline ---');
                    console.log('Role:', jobDetails.role);
                    console.log('Target Email:', jobDetails.targetEmail);

                    const result = await executeApplicationPipeline({
                        role: jobDetails.role,
                        jobDescription: jobDetails.jobDescription,
                        targetEmail: jobDetails.targetEmail,
                        senderEmail: senderEmail,
                        appPassword: appPassword,
                        logId: logId,
                        supabase: supabaseAdmin,
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
                    await supabaseAdmin.from('email_automations')
                        .update({
                            status: 'SUCCESS',
                            resume_content: result.finalResume || '',
                            email_subject: result.emailSubject || '',
                            cover_letter: result.coverLetter || '',
                            company,
                            role,
                            updated_at: new Date()
                        })
                        .eq('id', id);

                    console.log(`✅ Job ${id} COMPLETED.`);

                    if (logId) {
                        duration_ms = Date.now() - duration_ms;
                        await completeRequestLog(
                            supabaseAdmin,
                            logId,
                            'SUCCESS',
                            200,
                            {
                                resume_content: result.finalResume,
                                email_subject: result.emailSubject,
                                cover_letter: result.coverLetter
                            },
                            duration_ms
                        );
                    }

                    await deleteMessageFromQueue(ReceiptHandle);

                } catch (err) {
                    console.error(`❌ Job Failed:`, err);
                    const statusCode = err.statusCode || 500;

                    try {
                        const { id, logId } = JSON.parse(Body);
                        if (logId) {
                            await completeRequestLog(
                                supabaseAdmin,
                                logId,
                                'FAILED',
                                statusCode,
                                'FAILED',
                                { error: err.message });
                        }
                        if (id) {
                            await supabaseAdmin.from('email_automations')
                                .update({ status: 'FAILED', error: err.message, updated_at: new Date() })
                                .eq('id', id);
                        }
                    } catch (dbErr) { /* ignore */ }

                    await deleteMessageFromQueue(ReceiptHandle);
                }
            }

        } catch (error) {
            console.error('Worker loop error:', error);
            await sleep(5000);
        }
    }
};
