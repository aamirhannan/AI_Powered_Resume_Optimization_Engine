
import { getAuthenticatedClient } from '../utils/supabaseClientHelper.js';
import * as dbController from '../DatabaseController/resumeGenerationDatabaseController.js';
import { getResumeByRole } from '../services/resumeLoader.js';
import { Pipeline } from '../pipeline/Pipeline.js';
import { createPDF } from '../services/pdfGenerator.js';
import { RewriteResumeViaLLM } from '../pipeline/steps/recrute-outreach-via-email/RewriteResumeViaLLM.js';
import { CriticalAnalysis } from '../pipeline/steps/recrute-outreach-via-email/CriticalAnalysis.js';
import { EvidenceBasedRefinement } from '../pipeline/steps/recrute-outreach-via-email/EvidenceBasedRefinement.js';
import { InsertNewlyCreatedResumePoints } from '../pipeline/steps/recrute-outreach-via-email/InsertNewlyCreatedResumePoints.js';
import { uploadResumePDF } from '../services/storageService.js';
import fs from 'fs';
import { camelToSnake, snakeToCamel } from './utils.js';
import { createRequestLog, completeRequestLog } from '../services/apiRequestLogger.js';

export const getResumeGeneration = async (req, res) => {
    try {
        const supabase = getAuthenticatedClient(req.accessToken);
        const data = await dbController.fetchResumeGenerations(supabase);
        const response = data.map((item) => snakeToCamel(item))
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};



export const createResumeGeneration = async (req, res) => {
    let logId = null;
    const supabase = getAuthenticatedClient(req.accessToken);

    try {
        const { role, jobDescription } = req.body;

        // 1. Start Logging
        logId = await createRequestLog(supabase, req.user.id, 'RESUME_GENERATION', '/create-resume', { role, job_description: jobDescription });

        if (!role) {
            throw new Error('Role is required');
        }

        const baseResume = getResumeByRole(role);

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

        await dbController.createResumeGeneration(supabase, generationData, req.user.id);

        // 3. Complete Logging (Success)
        await completeRequestLog(supabase, logId, 'SUCCESS', 200, {
            resume_content: result.finalResume,
        });

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Length': evidenceBasedResume.length,
            'Content-Disposition': `attachment; filename="Resumes_${role || 'Optimized'}.pdf"`,
            'X-Token-Usage-Cost': result.tokenUsage?.cost?.toFixed(4) || '0',
            'X-Token-Input': result.tokenUsage?.input || '0',
            'X-Token-Output': result.tokenUsage?.output || '0'
        });

        res.send(evidenceBasedResume);

    } catch (error) {
        console.error('Error generating PDF:', error);

        // 4. Complete Logging (Failure)
        if (logId) {
            await completeRequestLog(supabase, logId, 'FAILED', 500, null, error.message);
        }

        res.status(500).json({ success: false, error: error.message });
    }
};


export const updateResumeGeneration = async (req, res) => {
    try {
        const supabase = getAuthenticatedClient(req.accessToken);
        const payload = camelToSnake(req.body);
        const updateDataToDB = await dbController.updateResumeData(supabase, payload, req.user.id)
        const response = snakeToCamel(updateDataToDB)
        return res.json({ success: true, data: response });
    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};


export const generateResumePdf = async (req, res) => {
    const { newResumeContent, role } = req.body;
    const resumeData = newResumeContent || req.body;
    const evidenceBasedResume = await createPDF(resumeData);

    res.set({
        'Content-Type': 'application/pdf',
        'Content-Length': evidenceBasedResume.length,
        'Content-Disposition': `attachment; filename="Resumes_${role || 'Optimized'}.pdf"`,
    });

    res.send(evidenceBasedResume);
} 