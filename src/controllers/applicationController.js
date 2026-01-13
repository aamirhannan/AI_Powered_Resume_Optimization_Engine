import { getResumeByRole } from '../services/resumeLoader.js';
import { Pipeline } from '../pipeline/Pipeline.js';
import { RewriteResumeViaLLM } from '../pipeline/steps/RewriteResumeViaLLM.js';
import { CriticalAnalysis } from '../pipeline/steps/CriticalAnalysis.js';
import { EvidenceBasedRefinement } from '../pipeline/steps/EvidenceBasedRefinement.js';
import { InsertNewlyCreatedResumePoints } from '../pipeline/steps/InsertNewlyCreatedResumePoints.js';
import { GeneratePDFStep } from '../pipeline/steps/GeneratePDFStep.js';
import { GenerateCoverLetter } from '../pipeline/steps/GenerateCoverLetter.js';
import { GenerateSubjectLine } from '../pipeline/steps/GenerateSubjectLine.js';
import { SendApplicationEmail } from '../pipeline/steps/SendApplicationEmail.js';
import { CleanupFiles } from '../pipeline/steps/CleanupFiles.js';
import Application from '../models/Application.js';

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
            senderEmail,
            appPassword
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
