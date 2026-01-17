import { EvidenceBasedRefinementPrompt } from "#prompts/userPrompt";
import { Step } from "#pipeline/Step";
import { llmService } from "#services/llmService";

export class EvidenceBasedRefinement extends Step {
    constructor() {
        super("EvidenceBasedRefinement");
    }

    async execute(context: any): Promise<any> {
        const { rewrittenResume, jobDescription, criticalAnalysisResult, tokenUsage } = context;


        const evidenceBasedRefinement = EvidenceBasedRefinementPrompt(rewrittenResume, jobDescription, criticalAnalysisResult);

        const evidenceBasedRefinementResult = await llmService.generateResumeContent(evidenceBasedRefinement, tokenUsage);

        return {
            ...context,
            evidenceBasedRefinementResult
        }
    }
}
