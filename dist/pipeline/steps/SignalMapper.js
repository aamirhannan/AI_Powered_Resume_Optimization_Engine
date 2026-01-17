import { Step } from '#pipeline/Step';
export class SignalMapper extends Step {
    constructor() {
        super('SignalMapper');
    }
    async execute(context) {
        const { signals, resume } = context;
        const evidenceMap = {};
        const matchedSignals = [];
        const missingSignals = [];
        // Flatten resume text for searching
        const resumeText = JSON.stringify(resume).toLowerCase();
        signals.allKeywords.forEach(signal => {
            if (resumeText.includes(signal)) {
                evidenceMap[signal] = true;
                matchedSignals.push(signal);
            }
            else {
                evidenceMap[signal] = false;
                missingSignals.push(signal);
            }
        });
        // Strict Mode: Only allow signals that exist in the resume (Truth Enforcement)
        // We will pass 'matchedSignals' to the Rewriter
        return {
            ...context,
            evidence: {
                map: evidenceMap,
                matched: matchedSignals,
                missing: missingSignals
            }
        };
    }
}
