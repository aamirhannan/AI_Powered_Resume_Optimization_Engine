import { GenerateCriticalAnalysisPrompt } from "#prompts/userPrompt";
import { llmService } from "#services/llmService";
import { Step } from "#pipeline/Step";

export class CriticalAnalysis extends Step {
    constructor() {
        super("CriticalAnalysis");
    }

    async execute(context: any): Promise<any> {
        const { rewrittenResume, jobDescription, tokenUsage } = context;

        // critical analysis
        const criticalAnalysis = GenerateCriticalAnalysisPrompt(rewrittenResume, jobDescription);

        // generate critical analysis response
        const criticalAnalysisResult = await llmService.generateResumeContent(criticalAnalysis, tokenUsage);

        return {
            ...context,
            criticalAnalysisResult
        }
    }
}
