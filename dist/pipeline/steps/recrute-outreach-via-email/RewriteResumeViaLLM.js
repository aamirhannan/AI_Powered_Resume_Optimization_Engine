import { Step } from '#pipeline/Step';
import { llmService } from '#services/llmService';
import { rewriteResumePrompt } from '#prompts/userPrompt';
export class RewriteResumeViaLLM extends Step {
    constructor() {
        super('RewriteResumeViaLLM');
    }
    async execute(context) {
        const { jobDescription, resume, tokenUsage } = context;
        if (!resume)
            throw new Error('Resume is missing');
        const { header, professionalSummary, education, technicalSkills, experience, projects, } = resume;
        const finalPrompt = rewriteResumePrompt({
            header,
            professionalSummary,
            education,
            technicalSkills,
            experience,
            projects,
            jobDescription,
        });
        const rewrittenResume = await llmService.generateResumeContent(finalPrompt, tokenUsage);
        return {
            ...context,
            rewrittenResume,
        };
    }
}
