import { getResumeByRole } from '#services/resumeLoader';
import { Pipeline } from '#pipeline/Pipeline';
import { RewriteResumeViaLLM } from '#pipeline/steps/recrute-outreach-via-email/RewriteResumeViaLLM';
import { CriticalAnalysis } from '#pipeline/steps/recrute-outreach-via-email/CriticalAnalysis';
import { EvidenceBasedRefinement } from '#pipeline/steps/recrute-outreach-via-email/EvidenceBasedRefinement';
import { InsertNewlyCreatedResumePoints } from '#pipeline/steps/recrute-outreach-via-email/InsertNewlyCreatedResumePoints';
import { GeneratePDFStep } from '#pipeline/steps/common-steps/GeneratePDFStep';
import { GenerateCoverLetter } from '#pipeline/steps/common-steps/GenerateCoverLetter';
import { GenerateSubjectLine } from '#pipeline/steps/common-steps/GenerateSubjectLine';
import { SendApplicationEmail } from '#pipeline/steps/common-steps/SendApplicationEmail';
import { CleanupFiles } from '#pipeline/steps/common-steps/CleanupFiles';
import { applicationRepository } from '#repositories/applicationRepository';
import dotenv from 'dotenv';
import { sendMessageToQueue } from '#services/sqsService';
import { encrypt } from '#utils/crypto';
dotenv.config();
// API Handler: Enqueues the job to SQS
export const processApplication = async (req, res) => {
    try {
        const { role, jobDescription, targetEmail, senderEmail = process.env.PROD_SMTP_EMAIL, appPassword = process.env.PROD_SMTP_PASSWORD } = req.body;
        if (!role || !jobDescription || !targetEmail || !senderEmail || !appPassword) {
            return res.status(400).json({ error: 'Required fields: role, jobDescription, targetEmail (Recruiter), senderEmail (You), appPassword.' });
        }
        // Check for duplicate application (Same Recruiter Email + Same Role) within 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const existingApp = await applicationRepository.findDuplicate(targetEmail, role, sevenDaysAgo);
        if (existingApp) {
            return res.status(429).json({
                success: false,
                error: 'Cooldown active',
                message: `You already applied for the '${role}' role to '${targetEmail}' within the last 7 days. Please wait before reapplying.`
            });
        }
        // Save to DB via Repository
        const savedApp = await applicationRepository.create({
            role,
            jobDescription,
            email: targetEmail,
            status: 'PENDING',
        });
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
    }
    catch (error) {
        console.error('Error queueing application:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
};
// Worker Function: Executes the actual logic
export const executeApplicationPipeline = async (applicationData) => {
    const { role, jobDescription, targetEmail, senderEmail, appPassword } = applicationData;
    console.log(`--- Starting Pipeline for Job (Role: ${role}) ---`);
    const baseResume = getResumeByRole(role);
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
        // 1. Fetch failed tasks via Repository
        const failedApps = await applicationRepository.findFailedApplications();
        if (failedApps.length === 0) {
            return res.status(200).json({ success: true, message: 'No failed applications found to retry.' });
        }
        console.log(`Found ${failedApps.length} failed applications. Retrying...`);
        // Encrypt password once (same password for all retries in this batch)
        const encryptedPassword = encrypt(appPassword);
        let retriedCount = 0;
        // 2 & 3. Push to Queue & Update Status via Repository
        for (const app of failedApps) {
            await sendMessageToQueue({
                applicationID: app.applicationID,
                encryptedPassword: encryptedPassword,
                senderEmail: senderEmail
            });
            await applicationRepository.update(app.applicationID, {
                status: 'PENDING',
                error: null
            });
            retriedCount++;
        }
        res.status(200).json({
            success: true,
            message: `Successfully queued ${retriedCount} failed applications for retry.`
        });
    }
    catch (error) {
        console.error('Error retrying applications:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
