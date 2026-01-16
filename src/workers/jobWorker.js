import Application from '../models/Application.js';
import { executeApplicationPipeline } from '../controllers/applicationController.js';
import { receiveMessagesFromQueue, deleteMessageFromQueue } from '../services/sqsService.js';
import { decrypt } from '../utils/crypto.js';
import { emailService } from '../services/emailService.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const WORKER_ID = Math.random().toString(36).substring(7).toUpperCase();

export const startWorker = async () => {
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

                try {
                    const { applicationID, encryptedPassword, senderEmail } = JSON.parse(Body);
                    console.log(`👷 Worker received job: ${applicationID}`);

                    // SEARCH BY CUSTOM UUID, NOT _id
                    const job = await Application.findOne({ applicationID });

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
                    let appPassword = null;
                    try {
                        appPassword = decrypt(encryptedPassword);
                    } catch (e) {
                        throw new Error('Failed to decrypt App Password. Invalid key or data.');
                    }

                    // --- FAIL FAST: Verify Credentials ---
                    console.log(`Verifying SMTP credentials for ${senderEmail}...`);
                    const isCredsValid = await emailService.verifyCredentials(senderEmail, appPassword);

                    if (!isCredsValid) {
                        const errorMsg = `Invalid App Password or SMTP Error for ${senderEmail}. Aborting pipeline.`;
                        console.error(`❌ ${errorMsg}`);

                        job.status = 'FAILED';
                        job.error = errorMsg;
                        job.updatedAt = new Date();
                        await job.save();

                        await deleteMessageFromQueue(ReceiptHandle);
                        continue; // Skip the pipeline!
                    }

                    // Mark IN_PROGRESS
                    job.status = 'IN_PROGRESS';
                    job.updatedAt = new Date();
                    await job.save();

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
                        appPassword: appPassword // Decrypted
                    });

                    // Success
                    job.status = 'SUCCESS';
                    job.result = {
                        subject: result.emailSubject,
                        emailSentTo: result.targetEmail,
                        tokenUsage: result.tokenUsage
                    };
                    job.updatedAt = new Date();
                    await job.save();

                    console.log(`✅ Job ${job._id} COMPLETED.`);

                    // Acknowledge (Delete) from SQS
                    await deleteMessageFromQueue(ReceiptHandle);

                } catch (err) {
                    console.error(`❌ Job Failed:`, err);

                    // If we have a job reference, update it
                    try {
                        const { applicationID } = JSON.parse(Body);
                        const job = await Application.findOne({ applicationID });
                        if (job) {
                            job.status = 'FAILED';
                            job.error = err.message;
                            job.updatedAt = new Date();
                            await job.save();
                        }
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
