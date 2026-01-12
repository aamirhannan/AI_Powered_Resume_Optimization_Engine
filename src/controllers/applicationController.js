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

export const processApplication = async (req, res) => {
    try {
        const { role, jobDescription, email } = req.body;

        if (!role || !jobDescription || !email) {
            return res.status(400).json({ error: 'Role, Job Description, and Target Email are required.' });
        }

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

        res.json({
            success: true,
            message: 'Application processed and sent successfully.',
            details: {
                subject: result.emailSubject,
                coverLetterSnippet: result.coverLetter?.substring(0, 50) + '...',
                emailSentTo: result.targetEmail,
                tokenUsage: result.tokenUsage // Return usage stats
            }
        });

    } catch (error) {
        console.error('Error processing application:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
};
