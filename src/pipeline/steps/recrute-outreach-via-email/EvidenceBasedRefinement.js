import { EvidenceBasedRefinementPrompt } from "#prompts/userPrompt.js";
import { Step } from "#pipeline/Step.js";
import { llmService } from "#services/llmService.js";
import fs from "fs";

export class EvidenceBasedRefinement extends Step {
    constructor() {
        super("EvidenceBasedRefinement");
    }

    async execute(context) {
        const { rewrittenResume, jobDescription, criticalAnalysisResult, tokenUsage } = context;


        const evidenceBasedRefinement = await EvidenceBasedRefinementPrompt(rewrittenResume, jobDescription, criticalAnalysisResult);

        const evidenceBasedRefinementResult = await llmService.generateResumeContent(evidenceBasedRefinement, tokenUsage);

        return {
            ...context,
            evidenceBasedRefinementResult
        }
    }
}