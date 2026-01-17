import { Step } from '#pipeline/Step';
import { llmService } from '#services/llmService';
import { generateSubjectLinePrompt } from '#prompts/userPrompt';
export class GenerateSubjectLine extends Step {
    constructor() {
        super('GenerateSubjectLine');
    }
    async execute(context) {
        const { finalResume, jobDescription, tokenUsage } = context;
        const resumeToUse = finalResume;
        if (!resumeToUse || !jobDescription) {
            console.warn('Skipping GenerateSubjectLine: Missing resume or JD.');
            return context;
        }
        console.log('Generating Subject Line...');
        const prompt = generateSubjectLinePrompt(resumeToUse, jobDescription);
        const subjectLine = await llmService.generateSubjectLine(prompt, tokenUsage);
        return {
            ...context,
            emailSubject: subjectLine?.replace(/^Subject:\s*/i, '').replace(/^"|"$/g, '') // Clean up
        };
    }
}
