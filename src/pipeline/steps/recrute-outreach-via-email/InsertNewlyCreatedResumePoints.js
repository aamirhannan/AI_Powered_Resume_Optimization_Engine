import { Step } from "../../Step.js";

export class InsertNewlyCreatedResumePoints extends Step {
    constructor() {
        super('InsertNewlyCreatedResumePoints');
    }

    async execute(context) {
        const { rewrittenResume, evidenceBasedRefinementResult } = context;
        if (!rewrittenResume) throw new Error('Resume is missing');

        const finalResume = evidenceBasedRefinementResult || rewrittenResume;

        return {
            ...context,
            finalResume
        };
    }
}