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

// API Handler: Enqueues the job
export const processApplication = async (req, res) => {
    try {
        const { role, jobDescription, email } = req.body;

        if (!role || !jobDescription || !email) {
            return res.status(400).json({ error: 'Role, Job Description, and Target Email are required.' });
        }

        // Check for duplicate application (Same Email + Same Role) within 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const existingApp = await Application.findOne({
            email,
            role,
            createdAt: { $gte: sevenDaysAgo }
        });

        if (existingApp) {
            return res.status(429).json({ // 429 Too Many Requests
                success: false,
                error: 'Cooldown active',
                message: `You already applied for the '${role}' role to '${email}' within the last 7 days. Please wait before reapplying.`
            });
        }

        // Save to DB with PENDING status
        const application = new Application({
            role,
            jobDescription,
            email,
            status: 'PENDING'
        });

        const savedApp = await application.save();

        res.status(202).json({
            success: true,
            message: 'Application queued successfully.',
            jobId: savedApp._id,
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
export const executeApplicationPipeline = async (applicationData) => {
    const { role, jobDescription, email } = applicationData;

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
        targetEmail: email,
        role, // Passed for filename generation
        tokenUsage: { input: 0, output: 0, total: 0, cost: 0 } // Initialize token tracking
    });

    console.log('--- Pipeline Completed Successfully ---');
    return result;
};
