
import * as dbController from '../DatabaseController/resumeGenerationDatabaseController.js';
import * as jobProfileDbController from '../DatabaseController/jobProfileDatabaseController.js';
import { Pipeline } from '../pipeline/Pipeline.js';
import { createPDF } from './pdfGenerator.js';
import { RewriteResumeViaLLM } from '../pipeline/steps/recrute-outreach-via-email/RewriteResumeViaLLM.js';
import { CriticalAnalysis } from '../pipeline/steps/recrute-outreach-via-email/CriticalAnalysis.js';
import { EvidenceBasedRefinement } from '../pipeline/steps/recrute-outreach-via-email/EvidenceBasedRefinement.js';
import { InsertNewlyCreatedResumePoints } from '../pipeline/steps/recrute-outreach-via-email/InsertNewlyCreatedResumePoints.js';
import { camelToSnake, snakeToCamel } from '../controllers/utils.js';
import { createRequestLog, completeRequestLog } from './apiRequestLogger.js';
import { transformToApiFormat } from '../controllers/jobProfileController.js';

export const createResumeGenerationService = async (supabase, userId, body) => {
    let logId = null;

    try {
        const { role: baseResumeId, jobDescription } = body;

        const baseResumeData = await jobProfileDbController.fetchJobProfileById(supabase, baseResumeId);

        if (!baseResumeData) throw new Error('Base resume profile not found');

        const role = baseResumeData.profile_type;

        // Transform from flat DB format to nested resume format expected by EJS template
        const baseResumeCamel = snakeToCamel(baseResumeData);
        const baseResume = transformToApiFormat(baseResumeCamel);

        // 1. Start Logging
        logId = await createRequestLog(supabase, userId, 'RESUME_GENERATION', '/create-resume', { role, job_description: jobDescription });

        if (!role) {
            throw new Error('Role is required');
        }

        // Execute Pipeline to get optimized data
        const pipeline = new Pipeline()
            .addStep(new RewriteResumeViaLLM())
            .addStep(new CriticalAnalysis())
            .addStep(new EvidenceBasedRefinement())
            .addStep(new InsertNewlyCreatedResumePoints());

        // 2. Pass Logger Context to Pipeline
        const result = await pipeline.execute({
            resume: baseResume,
            jobDescription,
            tokenUsage: { input: 0, output: 0, total: 0, cost: 0 }
        }, { supabase, logId });

        // Generate PDF
        const evidenceBasedResume = await createPDF(result.finalResume);

        const generationData = {
            role,
            prev_resume_content: baseResume,
            new_resume_content: result.finalResume,
            status: "SUCCESS",
        };

        await dbController.createResumeGeneration(supabase, generationData, userId);

        // 3. Complete Logging (Success)
        await completeRequestLog(supabase, logId, 'SUCCESS', 200, {
            resume_content: result.finalResume,
        });

        return {
            pdfBuffer: evidenceBasedResume,
            role,
            tokenUsage: result.tokenUsage
        };

    } catch (error) {
        // 4. Complete Logging (Failure)
        if (logId) {
            await completeRequestLog(supabase, logId, 'FAILED', 500, null, error.message);
        }
        throw error;
    }
};
