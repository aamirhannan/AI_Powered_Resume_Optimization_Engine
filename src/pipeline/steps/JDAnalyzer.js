import { Step } from '../Step.js';
import { SKILL_ONTOLOGY, SENIORITY_LEVELS } from '../../data/skillOntology.js';
import { llmService } from '../../services/llmService.js';

export class JDAnalyzer extends Step {
    constructor() {
        super('JDAnalyzer');
    }

    async execute(context) {
        const { jobDescription } = context;
        if (!jobDescription) throw new Error('Job Description is missing');

        const jdLower = jobDescription.toLowerCase();

        // 1. Ontology-Based Extraction (Deterministic)
        const detectedSkills = this.extractSkillsWithOntology(jdLower);

        // 2. Semantic Expansion (LLM)
        // Get list of canonical skills to validate against
        const validSkills = Object.keys(SKILL_ONTOLOGY);
        const impliedSkills = await llmService.extractImpliedSkills(jobDescription, validSkills, context.tokenUsage);

        // Merge Implied Skills (Confidence 0.6)
        impliedSkills.forEach(skill => {
            const canonical = skill.toLowerCase();
            // Only add if not already detected
            if (!detectedSkills[canonical] && SKILL_ONTOLOGY[canonical]) {
                detectedSkills[canonical] = {
                    source: 'implied',
                    confidence: 0.6,
                    category: SKILL_ONTOLOGY[canonical].category,
                    strength: 'nice_to_have' // Default for implied
                };
            }
        });

        // 3. Extract Seniority
        const seniority = this.extractSeniority(jdLower);

        // Transform to flat lists for downstream compatibility
        const hardSkills = Object.keys(detectedSkills).filter(k =>
            detectedSkills[k].category !== 'soft' // Assuming ontology is mostly hard skills
        );

        // Soft skills - keeping regex for now or can expand ontology
        const softSkills = this.extractSoftSkills(jdLower);

        return {
            ...context,
            signals: {
                hardSkills,
                softSkills,
                seniority,
                allKeywords: [...hardSkills, ...softSkills, ...seniority],
                details: detectedSkills // Richer data for future use
            }
        };
    }

    extractSkillsWithOntology(text) {
        const detected = {};

        Object.entries(SKILL_ONTOLOGY).forEach(([canonical, data]) => {
            // Check Canonical
            if (this.checkMatch(text, canonical)) {
                detected[canonical] = this.createSignal(text, canonical, data.category, 'explicit');
                return;
            }

            // Check Aliases
            if (data.aliases) {
                for (const alias of data.aliases) {
                    if (this.checkMatch(text, alias)) {
                        detected[canonical] = this.createSignal(text, alias, data.category, 'explicit');
                        return;
                    }
                }
            }
        });

        return detected;
    }

    checkMatch(text, keyword) {
        // Use word boundary regex to avoid partial matches (e.g. "java" in "javascript")
        // Escape special chars in keyword
        const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(`\\b${escaped}\\b`, 'i');
        return regex.test(text);
    }

    createSignal(text, keyword, category, source) {
        const strength = this.classifyStrength(text, keyword);
        return {
            source, // 'explicit'
            confidence: 1.0,
            category,
            strength,
            matchedTerm: keyword
        };
    }

    classifyStrength(text, keyword) {
        const windowSize = 50;
        const index = text.indexOf(keyword);
        if (index === -1) return 'neutral';

        const start = Math.max(0, index - windowSize);
        const end = Math.min(text.length, index + keyword.length + windowSize);
        const window = text.substring(start, end);

        if (/must|required|essential|core|strong|expert/i.test(window)) return 'must_have';
        if (/plus|nice|preferred|bonus/i.test(window)) return 'nice_to_have';

        return 'neutral';
    }

    extractSoftSkills(text) {
        const softKeywords = [
            'leadership', 'communication', 'collaboration', 'agile', 'scrum', 'problem solving',
            'mentorship', 'ownership', 'team player', 'adaptability'
        ];
        return softKeywords.filter(keyword => text.includes(keyword));
    }

    extractSeniority(text) {
        return SENIORITY_LEVELS.filter(keyword => text.includes(keyword));
    }
}
