import { getResumeByRole } from '../services/resumeLoader.js';
import { Pipeline } from '../pipeline/Pipeline.js';
import { RewriteResumeViaLLM } from '../pipeline/steps/recrute-outreach-via-email/RewriteResumeViaLLM.js';
import { CriticalAnalysis } from '../pipeline/steps/recrute-outreach-via-email/CriticalAnalysis.js';
import { EvidenceBasedRefinement } from '../pipeline/steps/recrute-outreach-via-email/EvidenceBasedRefinement.js';
import { InsertNewlyCreatedResumePoints } from '../pipeline/steps/recrute-outreach-via-email/InsertNewlyCreatedResumePoints.js';
import { GeneratePDFStep } from '../pipeline/steps/common-steps/GeneratePDFStep.js';
import { GenerateCoverLetter } from '../pipeline/steps/common-steps/GenerateCoverLetter.js';
import { GenerateSubjectLine } from '../pipeline/steps/common-steps/GenerateSubjectLine.js';
import { SendApplicationEmail } from '../pipeline/steps/common-steps/SendApplicationEmail.js';
import { CleanupFiles } from '../pipeline/steps/common-steps/CleanupFiles.js';
import Application from '../models/Application.js';
import dotenv from 'dotenv';
dotenv.config();

import { sendMessageToQueue } from '../services/sqsService.js';
import { encrypt } from '../utils/crypto.js';

// API Handler: Enqueues the job to SQS
// API Handler: Enqueues the job to SQS
export const processApplication = async (req, res) => {
    try {
        const {
            role,
            jobDescription,
            targetEmail,
            senderEmail = process.env.PROD_SMTP_EMAIL,
            appPassword = process.env.PROD_SMTP_PASSWORD
        } = req.body;

        if (!role || !jobDescription || !targetEmail || !senderEmail || !appPassword) {
            return res.status(400).json({ error: 'Required fields: role, jobDescription, targetEmail (Recruiter), senderEmail (You), appPassword.' });
        }

        // Check for duplicate application (Same Recruiter Email + Same Role) within 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const existingApp = await Application.findOne({
            email: targetEmail, // We look for duplicates sent TO this email
            role,
            createdAt: { $gte: sevenDaysAgo }
        });

        if (existingApp) {
            return res.status(429).json({
                success: false,
                error: 'Cooldown active',
                message: `You already applied for the '${role}' role to '${targetEmail}' within the last 7 days. Please wait before reapplying.`
            });
        }

        // Save to DB with PENDING status (WITHOUT PASSWORD)
        const application = new Application({
            role,
            jobDescription,
            email: targetEmail,
            status: 'PENDING',
        });

        const savedApp = await application.save();

        // Encrypt Password
        const encryptedPassword = encrypt(appPassword);

        // Send to SQS
        await sendMessageToQueue({
            applicationID: savedApp.applicationID,
            encryptedPassword: encryptedPassword,
            senderEmail: senderEmail
        });

        res.status(202).json({
            success: true,
            message: 'Application queued securely via SQS.',
            jobId: savedApp.applicationID,
            status: 'PENDING'
        });

    } catch (error) {
        console.error('Error queueing application:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
};

// Worker Function: Executes the actual logic
// Worker Function: Executes the actual logic
export const executeApplicationPipeline = async (applicationData) => {
    const { role, jobDescription, targetEmail, senderEmail, appPassword, logId, supabase, baseResume } = applicationData;

    console.log(`--- Starting Pipeline for Job (Role: ${role}) ---`);

    // const baseResume = getResumeByRole(role);

    // Define Pipeline
    const pipeline = new Pipeline()
        // 1. Create/Optimize Resume
        .addStep(new RewriteResumeViaLLM())
        .addStep(new CriticalAnalysis())
        .addStep(new EvidenceBasedRefinement())
        .addStep(new InsertNewlyCreatedResumePoints())

        // 2. Auxiliary Content
        .addStep(new GenerateCoverLetter())
        .addStep(new GenerateSubjectLine())

        // 3. Generate PDF
        .addStep(new GeneratePDFStep())

        // 4. Send Email
        .addStep(new SendApplicationEmail())

        // 5. Cleanup
        .addStep(new CleanupFiles());

    const result = await pipeline.execute({
        resume: baseResume,
        jobDescription,
        targetEmail: targetEmail,
        appPassword: appPassword,
        email: senderEmail, // 'email' key in context refers to Sender (User) for Nodemailer
        role,
        tokenUsage: { input: 0, output: 0, total: 0, cost: 0 }
    }, {
        supabase: supabase,
        logId: logId
    });

    console.log('--- Pipeline Completed Successfully ---');
    return result;
};

export const retryFailedApplications = async (req, res) => {
    try {
        const { senderEmail, appPassword } = req.body;

        if (!senderEmail || !appPassword) {
            return res.status(400).json({ error: 'senderEmail and appPassword are required to retry jobs.' });
        }

        // 1. Fetch failed tasks
        const failedApps = await Application.find({ status: 'IN_PROGRESS' });

        if (failedApps.length === 0) {
            return res.status(200).json({ success: true, message: 'No failed applications found to retry.' });
        }

        console.log(`Found ${failedApps.length} failed applications. Retrying...`);

        // Encrypt password once (same password for all retries in this batch)
        const encryptedPassword = encrypt(appPassword);
        let retriedCount = 0;

        // 2 & 3. Push to Queue
        for (const app of failedApps) {
            await sendMessageToQueue({
                applicationID: app.applicationID,
                encryptedPassword: encryptedPassword,
                senderEmail: senderEmail
            });

            // Update status back to PENDING so worker picks it up as a "new" attempt (logic-wise)
            // primarily to reflect in UI/DB that it's queued again.
            app.status = 'PENDING';
            app.error = null; // Clear previous error
            app.updatedAt = new Date();
            await app.save();
            retriedCount++;
        }

        res.status(200).json({
            success: true,
            message: `Successfully queued ${retriedCount} failed applications for retry.`
        });

    } catch (error) {
        console.error('Error retrying applications:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
