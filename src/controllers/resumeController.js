import { getResumeByRole } from '../services/resumeLoader.js';
import { Pipeline } from '../pipeline/Pipeline.js';
import { JDAnalyzer } from '../pipeline/steps/JDAnalyzer.js';
import { SignalMapper } from '../pipeline/steps/SignalMapper.js';
import { ResumeRewriter } from '../pipeline/steps/ResumeRewriter.js';
import { CvWolfATSAnalyzer } from '../pipeline/steps/CvWolfATSAnalyzer.js';
import { createPDF } from '../services/pdfGenerator.js';
import { RewriteResumeViaLLM } from '../pipeline/steps/recrute-outreach-via-email/RewriteResumeViaLLM.js';
import { InsertNewlyCreatedResumePoints } from '../pipeline/steps/recrute-outreach-via-email/InsertNewlyCreatedResumePoints.js';
import fs from 'fs';
import { CriticalAnalysis } from '../pipeline/steps/recrute-outreach-via-email/CriticalAnalysis.js';
import { EvidenceBasedRefinement } from '../pipeline/steps/recrute-outreach-via-email/EvidenceBasedRefinement.js';
import AdmZip from 'adm-zip';

export const generateResume = async (req, res) => {
    try {
        const { role, jobDescription } = req.body;

        if (!role) {
            return res.status(400).json({ error: 'Role is required (frontend, backend, fullstack)' });
        }

        const baseResume = getResumeByRole(role);

        // Execute Pipeline
        const pipeline = new Pipeline()
            .addStep(new RewriteResumeViaLLM())
        // .addStep(new JDAnalyzer())
        // .addStep(new SignalMapper())
        // .addStep(new ResumeRewriter())
        // .addStep(new CvWolfATSAnalyzer());

        const result = await pipeline.execute({
            resume: baseResume,
            jobDescription,
            tokenUsage: { input: 0, output: 0, total: 0, cost: 0 }
        });

        res.json({
            success: true,
            data: result.rewrittenResume,
            meta: result.meta,
            analysis: result.cvWolfAnalysis, // Expose the detailed analysis
            tokenUsage: result.tokenUsage
        });
    } catch (error) {
        console.error('Error serving resume request:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
};

export const generateResumePDF = async (req, res) => {
    try {
        const { role, jobDescription } = req.body;

        // Pipeline mode
        if (!role) {
            return res.status(400).json({ error: 'Role is required' });
        }

        const baseResume = getResumeByRole(role);

        // Execute Pipeline to get optimized data
        const pipeline = new Pipeline()
            .addStep(new RewriteResumeViaLLM())
            .addStep(new CriticalAnalysis())
            .addStep(new EvidenceBasedRefinement())
            .addStep(new InsertNewlyCreatedResumePoints())
        // .addStep(new JDAnalyzer())
        // .addStep(new SignalMapper())
        // .addStep(new ResumeRewriter())
        // .addStep(new CvWolfATSAnalyzer());

        const result = await pipeline.execute({
            resume: baseResume,
            jobDescription,
            tokenUsage: { input: 0, output: 0, total: 0, cost: 0 }
        });

        // Generate PDF
        const pdfBuffer = await createPDF(result.finalResume);
        const evidenceBasedResume = await createPDF(result.evidenceBasedRefinementResult);

        // Save locally for debugging/verification
        fs.writeFileSync(`Resume_${role || 'Optimized'}.pdf`, pdfBuffer);
        fs.writeFileSync(`Resume_${role || 'Optimized'}_EvidenceBased.pdf`, evidenceBasedResume);

        // Create Zip
        const zip = new AdmZip();
        zip.addFile(`Resume_${role || 'Optimized'}.pdf`, pdfBuffer);
        zip.addFile(`Resume_${role || 'Optimized'}_EvidenceBased.pdf`, evidenceBasedResume);

        const zipBuffer = zip.toBuffer();

        res.set({
            'Content-Type': 'application/zip',
            'Content-Length': zipBuffer.length,
            'Content-Disposition': `attachment; filename="Resumes_${role || 'Optimized'}.zip"`,
            'X-Token-Usage-Cost': result.tokenUsage?.cost?.toFixed(4) || '0',
            'X-Token-Input': result.tokenUsage?.input || '0',
            'X-Token-Output': result.tokenUsage?.output || '0'
        });

        res.send(zipBuffer);

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
