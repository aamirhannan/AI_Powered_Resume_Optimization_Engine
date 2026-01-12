import { Step } from '../Step.js';
import { llmService } from '../../services/llmService.js';

// Mapping of JD tokens to Start Verbs
const START_PATTERNS = {
    'performance': 'Optimized',
    'optimization': 'Optimized',
    'scale': 'Scaled',
    'scalability': 'Scaled',
    'architecture': 'Architected',
    'design': 'Designed',
    'leadership': 'Led',
    'lead': 'Led',
    'ownership': 'Owned',
    'reliable': 'Engineered',
    'reliability': 'Engineered',
    'testing': 'Tested',
    'test': 'Tested'
};

export class ResumeRewriter extends Step {
    constructor() {
        super('ResumeRewriter');
    }

    async execute(context) {
        const { resume, evidence, signals } = context;
        // Deep copy
        const optimizedResume = JSON.parse(JSON.stringify(resume));

        // 1. Optimize Technical Skills (Existing Logic)
        const matchedSignals = new Set(evidence.matched);
        if (optimizedResume.technicalSkills) {
            Object.keys(optimizedResume.technicalSkills).forEach(category => {
                const skills = optimizedResume.technicalSkills[category];
                if (Array.isArray(skills)) {
                    const matched = [];
                    const others = [];

                    skills.forEach(skill => {
                        const isMatch = Array.from(matchedSignals).some(signal =>
                            skill.toLowerCase().includes(signal.toLowerCase())
                        );

                        if (isMatch) {
                            matched.push(skill);
                        } else {
                            others.push(skill);
                        }
                    });

                    // Bubble matched skills to top
                    // Also pass these as "Allowed Keywords" to the rewriter
                    optimizedResume.technicalSkills[category] = [...matched, ...others];
                }
            });
        }

        // 2. Rewrite Experience Bullets (LLM "Technical Editor")
        if (optimizedResume.experience) {
            for (const job of optimizedResume.experience) {
                if (job.responsibilitiesAndAchievements) {
                    const rewrittenBullets = [];

                    for (const bullet of job.responsibilitiesAndAchievements) {
                        try {
                            const newBullet = await this.rewriteBullet(bullet, signals, evidence, context.tokenUsage);
                            rewrittenBullets.push(newBullet);
                        } catch (err) {
                            // Fallback
                            rewrittenBullets.push(bullet);
                        }
                    }
                    job.responsibilitiesAndAchievements = rewrittenBullets;
                }
            }
        }

        return {
            ...context,
            optimizedResume
        };
    }

    /**
     * Orchestrates the rewriting of a single bullet.
     */
    async rewriteBullet(bullet, signals, evidence, tokenUsage) {
        // A. Identify Start Pattern
        let targetVerb = null;

        const signalList = evidence.matched || [];

        // Find if a matched signal maps to a start verb
        for (const signal of signalList) {
            const signalLower = signal.toLowerCase();

            for (const [key, verb] of Object.entries(START_PATTERNS)) {
                if (signalLower.includes(key) && bullet.toLowerCase().includes(signalLower)) {
                    targetVerb = verb;
                    break;
                }
                // Also check if bullet matches the abstract key directly (e.g. bullet has "performance")
                if (bullet.toLowerCase().includes(key)) {
                    targetVerb = verb;
                    break;
                }
            }
            if (targetVerb) break;
        }

        // Only rewrite if we have a target verb AND an API Key
        if (!targetVerb || !process.env.OPENAI_API_KEY) {
            return bullet;
        }

        // B. Define Allowed Keywords (from Evidence)
        // Only allow keywords that exist in THIS bullet (truth enforcement)
        const currentBulletLower = bullet.toLowerCase();
        const allowedKeywords = signalList.filter(signal =>
            currentBulletLower.includes(signal.toLowerCase())
        );

        if (allowedKeywords.length === 0) {
            return bullet; // Nothing to "align" to
        }

        // C. Call LLM
        const rewritten = await llmService.rewriteBullet(bullet, targetVerb, allowedKeywords, tokenUsage);

        // D. Safety Net (Diff Check)
        if (!this.passesSafetyCheck(bullet, rewritten)) {
            // console.warn(`Rewritten bullet failed safety check. Reverting.\nOriginal: ${bullet}\nNew: ${rewritten}`);
            return bullet;
        }

        return rewritten;
    }

    passesSafetyCheck(original, rewritten) {
        // 1. Metric Preservation: Check if all numbers in original exist in rewritten
        const extractNumbers = (str) => str.match(/\d+(\.\d+)?%?/g) || [];
        const originalNums = extractNumbers(original);

        // Every number in original must appear in rewritten (allowing some format changes? Strict for now)
        const allMetricsPreserved = originalNums.every(num => rewritten.includes(num));
        if (!allMetricsPreserved) return false;

        // 2. Length Check
        const wordCount = rewritten.split(' ').length;
        if (wordCount > 40) return false; // Too long

        return true;
    }
}
