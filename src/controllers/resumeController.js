import { getResumeByRole } from '../services/resumeLoader.js';
import { Pipeline } from '../pipeline/Pipeline.js';
import { JDAnalyzer } from '../pipeline/steps/JDAnalyzer.js';
import { SignalMapper } from '../pipeline/steps/SignalMapper.js';
import { ResumeRewriter } from '../pipeline/steps/ResumeRewriter.js';
import { CvWolfATSAnalyzer } from '../pipeline/steps/CvWolfATSAnalyzer.js';
import { createPDF } from '../services/pdfGenerator.js';

export const generateResume = async (req, res) => {
    try {
        const { role, jobDescription } = req.body;

        if (!role) {
            return res.status(400).json({ error: 'Role is required (frontend, backend, fullstack)' });
        }

        const baseResume = getResumeByRole(role);

        // Execute Pipeline
        const pipeline = new Pipeline()
            .addStep(new JDAnalyzer())
            .addStep(new SignalMapper())
            .addStep(new ResumeRewriter())
            .addStep(new CvWolfATSAnalyzer());

        const result = await pipeline.execute({
            resume: baseResume,
            jobDescription
        });

        res.json({
            success: true,
            data: result.optimizedResume,
            meta: result.meta,
            analysis: result.cvWolfAnalysis // Expose the detailed analysis
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
            .addStep(new JDAnalyzer())
            .addStep(new SignalMapper())
            .addStep(new ResumeRewriter())
            .addStep(new CvWolfATSAnalyzer());

        const result = await pipeline.execute({
            resume: baseResume,
            jobDescription
        });


        console.log("result", JSON.stringify(result));

        // Generate PDF
        const pdfBuffer = await createPDF(result.optimizedResume);

        res.set({
            'Content-Type': 'application/pdf',
            'Content-Length': pdfBuffer.length,
            'Content-Disposition': `attachment; filename="Resume_${role || 'Optimized'}.pdf"`,
        });

        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).json({ success: false, error: error.message });
    }
};
