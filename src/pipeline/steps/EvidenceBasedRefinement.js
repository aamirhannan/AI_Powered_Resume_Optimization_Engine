import { EvidenceBasedRefinementPrompt } from "../../prompts/userPrompt.js";
import { Step } from "../Step.js";
import { llmService } from "../../services/llmService.js";
import fs from "fs";

export class EvidenceBasedRefinement extends Step {
    constructor() {
        super("EvidenceBasedRefinement");
    }

    async execute(context) {
        const { rewrittenResume, jobDescription, criticalAnalysisResult } = context;

        // evidence based refinement
        const evidenceBasedRefinement = await EvidenceBasedRefinementPrompt(rewrittenResume, jobDescription, criticalAnalysisResult);

        // generate evidence based refinement response
        const evidenceBasedRefinementResult = await llmService.generateResumeContent(evidenceBasedRefinement);

        // fs.writeFileSync('evidenceBasedRefinementResult.json', JSON.stringify(evidenceBasedRefinementResult));

        // fs.writeFileSync('rewrittenResume.txt', rewrittenResume);

        // debugger;

        return {
            ...context,
            evidenceBasedRefinementResult
        }
    }
}