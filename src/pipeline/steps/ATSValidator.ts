import { Step } from '#pipeline/Step';

export class ATSValidator extends Step {
    constructor() {
        super('ATSValidator');
    }

    async execute(context: any): Promise<any> {
        const { signals, evidence } = context;

        const totalSignals = signals.allKeywords.length;
        const matchedCount = evidence.matched.length;

        const atsScore = totalSignals > 0 ? Math.round((matchedCount / totalSignals) * 100) : 0;

        return {
            ...context,
            meta: {
                atsScore,
                totalSignals,
                matchedCount,
                missingSignals: evidence.missing,
                signals: signals.details // Debugging: Show extraction details
            }
        };
    }
}
