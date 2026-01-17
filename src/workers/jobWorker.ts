import { applicationRepository } from '#repositories/applicationRepository';
import { executeApplicationPipeline } from '#controllers/applicationController';
import { receiveMessagesFromQueue, deleteMessageFromQueue } from '#services/sqsService';
import { decrypt } from '#utils/crypto';
import { emailService } from '#services/emailService';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const WORKER_ID = Math.random().toString(36).substring(7).toUpperCase();

export const startWorker = async (): Promise<void> => {
    console.log(`👷 Application Worker ${WORKER_ID} (SQS) started...`);

    while (true) {
        try {
            const messages = await receiveMessagesFromQueue();
            console.log(`Received ${messages.length} messages from SQS.`);

            if (!messages || messages.length === 0) {
                // If receiveMessagesFromQueue is configured for long polling (WaitTimeSeconds: 20),
                // this loop will naturally handle waits. If not, minimal sleep.
                continue;
            }

            for (const message of messages) {
                console.log(`👷 Worker received job: ${message}`);
                const { Body, ReceiptHandle } = message;

                if (!Body || !ReceiptHandle) continue;

                try {
                    const { applicationID, encryptedPassword, senderEmail } = JSON.parse(Body);
                    console.log(`👷 Worker received job: ${applicationID}`);

                    // SEARCH VIA REPOSITORY
                    const job = await applicationRepository.findByApplicationID(applicationID);

                    if (!job) {
                        console.error(`❌ Job ${applicationID} not found in DB. Deleting from queue.`);
                        await deleteMessageFromQueue(ReceiptHandle);
                        continue;
                    }

                    if (job.status === 'SUCCESS' || job.status === 'FAILED') {
                        console.log(`⚠️ Job ${applicationID} already processed. Deleting duplicate.`);
                        await deleteMessageFromQueue(ReceiptHandle);
                        continue;
                    }

                    // Decrypt Password
                    let appPassword: string | null = null;
                    try {
                        appPassword = decrypt(encryptedPassword);
                    } catch (e) {
                        throw new Error('Failed to decrypt App Password. Invalid key or data.');
                    }

                    // --- FAIL FAST: Verify Credentials ---
                    console.log(`Verifying SMTP credentials for ${senderEmail}...`);
                    const isCredsValid = await emailService.verifyCredentials(senderEmail, appPassword!);

                    if (!isCredsValid) {
                        const errorMsg = `Invalid App Password or SMTP Error for ${senderEmail}. Aborting pipeline.`;
                        console.error(`❌ ${errorMsg}`);

                        await applicationRepository.update(applicationID, {
                            status: 'FAILED',
                            error: errorMsg
                        });

                        await deleteMessageFromQueue(ReceiptHandle);
                        continue; // Skip the pipeline!
                    }

                    // Mark IN_PROGRESS
                    await applicationRepository.update(applicationID, {
                        status: 'IN_PROGRESS'
                    });

                    // Execute Pipeline
                    console.log('--- Debug: Preparing Pipeline ---');
                    console.log('Role:', job.role);
                    console.log('Target Email (from DB):', job.email);
                    console.log('Sender Email (from SQS):', senderEmail);

                    const result = await executeApplicationPipeline({
                        role: job.role,
                        jobDescription: job.jobDescription,
                        targetEmail: job.email, // DB 'email' is the Target/Recruiter
                        senderEmail: senderEmail, // From SQS
                        appPassword: appPassword! // Decrypted
                    });

                    // Success
                    await applicationRepository.update(applicationID, {
                        status: 'SUCCESS',
                        result: {
                            subject: result.emailSubject,
                            emailSentTo: result.targetEmail,
                            tokenUsage: result.tokenUsage
                        }
                    });

                    console.log(`✅ Job ${job._id} COMPLETED.`);

                    // Acknowledge (Delete) from SQS
                    await deleteMessageFromQueue(ReceiptHandle);

                } catch (err: any) {
                    console.error(`❌ Job Failed:`, err);

                    // If we have a job reference, update it
                    try {
                        const { applicationID } = JSON.parse(Body);
                        await applicationRepository.update(applicationID, {
                            status: 'FAILED',
                            error: err.message
                        });
                    } catch (dbErr) { /* ignore */ }

                    // Optional: Don't delete message if you want SQS to retry (VisibilityTimeout)
                    // Or delete it if it's a permanent failure (like invalid JSON)
                    // For now, let's delete to prevent infinite loops of bad jobs
                    await deleteMessageFromQueue(ReceiptHandle);
                }
            }

        } catch (error) {
            console.error('Worker loop error:', error);
            await sleep(5000);
        }
    }
};
