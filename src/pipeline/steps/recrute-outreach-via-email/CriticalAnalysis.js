import { GenerateCriticalAnalysisPrompt } from "../../../prompts/userPrompt.js";
import { llmService } from "../../../services/llmService.js";
import { Step } from "../../Step.js";

export class CriticalAnalysis extends Step {
    constructor() {
        super("CriticalAnalysis");
    }

    async execute(context) {
        const { rewrittenResume, jobDescription, tokenUsage } = context;

        // critical analysis
        const criticalAnalysis = await GenerateCriticalAnalysisPrompt(rewrittenResume, jobDescription);

        // generate critical analysis response
        const criticalAnalysisResult = await llmService.generateResumeContent(criticalAnalysis, tokenUsage);

        return {
            ...context,
            criticalAnalysisResult
        }
    }
}
