import { Step } from '#pipeline/Step.js';
import { llmService } from '#services/llmService.js';
import { generateCoverLetterPrompt } from '#prompts/userPrompt.js';

export class GenerateCoverLetter extends Step {
    constructor() {
        super('GenerateCoverLetter');
    }

    async execute(context) {
        const { finalResume, jobDescription, tokenUsage } = context;
        const resumeToUse = finalResume;

        if (!resumeToUse || !jobDescription) {
            console.warn('Skipping GenerateCoverLetter: Missing resume or JD.');
            return context;
        }

        console.log('Generating Cover Letter...');
        const prompt = generateCoverLetterPrompt(resumeToUse, jobDescription);
        const coverLetter = await llmService.generateCoverLetter(prompt, tokenUsage);

        return {
            ...context,
            coverLetter
        };
    }
}
