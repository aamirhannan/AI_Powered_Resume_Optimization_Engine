import { Step } from '../../Step.js';
import { createPDF } from '../../../services/pdfGenerator.js';
import fs from 'fs';
import path from 'path';

export class GeneratePDFStep extends Step {
    constructor() {
        super('GeneratePDFStep');
    }

    async execute(context) {
        const { finalResume, role } = context;

        // Prefer evidence-based result, fallback to finalResume (rewritten), then original if somehow missing (though Rewritten should exist)
        const resumeToPrint = finalResume;

        if (!resumeToPrint) {
            throw new Error('Missing resume data (finalResume) for PDF generation.');
        }

        console.log('Generating PDF...');
        const pdfBuffer = await createPDF(resumeToPrint);

        // Save to a temporary path
        const date = new Date();
        const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const day = String(date.getDate()).padStart(2, '0');
        const month = months[date.getMonth()];
        const year = date.getFullYear();
        const formattedDate = `${day}${month}_${year}`;

        // Format role: snake_case
        const formattedRole = (role || 'Developer').replace(/\s+/g, '_').toLowerCase();

        const fileName = `aamir_${formattedRole}_${formattedDate}.pdf`;
        const filePath = path.resolve(process.cwd(), fileName);

        fs.writeFileSync(filePath, pdfBuffer);
        console.log(`PDF saved to ${filePath}`);

        return {
            ...context,
            pdfPath: filePath
        };
    }
}
