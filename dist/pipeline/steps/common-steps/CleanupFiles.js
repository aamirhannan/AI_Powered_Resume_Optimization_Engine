import { Step } from '#pipeline/Step';
import fs from 'fs';
export class CleanupFiles extends Step {
    constructor() {
        super('CleanupFiles');
    }
    async execute(context) {
        const { pdfPath } = context;
        if (pdfPath && fs.existsSync(pdfPath)) {
            console.log(`Deleting temporary file: ${pdfPath}`);
            fs.unlinkSync(pdfPath);
        }
        return {
            ...context,
            pdfPath: null
        };
    }
}
