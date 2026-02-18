
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
import * as jobProfileDbController from '../DatabaseController/jobProfileDatabaseController.js';
import { transformToApiFormat } from './jobProfileController.js';
import * as service from '../services/resumeGenerationService.js';

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
    const supabase = getAuthenticatedClient(req.accessToken);

    try {
        const userId = req.user.id;
        const result = await service.createResumeGenerationService(supabase, userId, req.body);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Length': result.pdfBuffer.length,
            'Content-Disposition': `attachment; filename="Resumes_${result.role || 'Optimized'}.pdf"`,
            'X-Token-Usage-Cost': result.tokenUsage?.cost?.toFixed(4) || '0',
            'X-Token-Input': result.tokenUsage?.input || '0',
            'X-Token-Output': result.tokenUsage?.output || '0'
        });

        res.send(result.pdfBuffer);

    } catch (error) {
        console.error('Error generating PDF:', error);
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