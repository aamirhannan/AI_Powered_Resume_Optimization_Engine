import { Step } from '#pipeline/Step';
import { Resume } from '#models/Resume';

export class SignalMapper extends Step {
    constructor() {
        super('SignalMapper');
    }

    async execute(context: any): Promise<any> {
        const { signals, resume } = context as { signals: { allKeywords: string[] }, resume: Resume };
        const evidenceMap: Record<string, boolean> = {};
        const matchedSignals: string[] = [];
        const missingSignals: string[] = [];

        // Flatten resume text for searching
        const resumeText = JSON.stringify(resume).toLowerCase();

        signals.allKeywords.forEach(signal => {
            if (resumeText.includes(signal)) {
                evidenceMap[signal] = true;
                matchedSignals.push(signal);
            } else {
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
