import Application from '../models/Application.js';
import { executeApplicationPipeline } from '../controllers/applicationController.js';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const startWorker = async () => {
    console.log('👷 Application Worker started...');

    while (true) {
        try {
            // 1. Try to find a job
            const job = await Application.findOne({ status: 'PENDING' }).sort({ createdAt: 1 });

            if (!job) {
                // Queue is empty, sleep for 5 seconds before checking again
                await sleep(5000);
                continue;
            }

            // 2. Process the job immediately
            console.log(`👷 Worker picked up job: ${job._id}`);

            job.status = 'IN_PROGRESS';
            job.updatedAt = new Date();
            await job.save();

            try {
                const result = await executeApplicationPipeline({
                    role: job.role,
                    jobDescription: job.jobDescription,
                    email: job.email
                });

                job.status = 'SUCCESS';
                job.result = {
                    subject: result.emailSubject,
                    emailSentTo: result.targetEmail,
                    tokenUsage: result.tokenUsage
                };
                console.log(`✅ Job ${job._id} COMPLETED.`);
            } catch (err) {
                console.error(`❌ Job ${job._id} FAILED:`, err);
                job.status = 'FAILED';
                job.error = err.message;
            }

            job.updatedAt = new Date();
            await job.save();

            // Loop immediately continues to check for the next job (no sleep)

        } catch (error) {
            console.error('Worker loop error:', error);
            await sleep(5000); // Sleep on system error to avoid thrashing
        }
    }
};
