import { Step } from '#pipeline/Step';
import { SKILL_ONTOLOGY } from '#src/data/skillOntology';
export class CvWolfATSAnalyzer extends Step {
    WEIGHTS;
    SEMANTIC_MAP;
    constructor() {
        super('CvWolfATSAnalyzer');
        // Weights from case study
        this.WEIGHTS = {
            technical: 0.60,
            abilities: 0.25,
            other: 0.15
        };
        // Semantic Map: Resume Skill -> Implied Concepts (JD Keywords)
        this.SEMANTIC_MAP = {
            "microservices": ["distributed systems", "scalability", "architecture", "system design"],
            "redis": ["caching", "large-scale computing", "database", "distributed systems", "performance"],
            "rabbitmq": ["asynchronous", "message queue", "distributed systems", "event-driven"],
            "kafka": ["stream processing", "distributed systems", "large-scale computing", "real-time"],
            "docker": ["containerization", "devops", "cloud", "reliability", "infrastructure"],
            "kubernetes": ["orchestration", "devops", "cloud", "scalability"],
            "aws": ["cloud", "infrastructure", "devops", "web services"],
            "react": ["frontend", "ui", "web applications", "user interface"],
            "next.js": ["react framework", "ssr", "web applications", "performance"],
            "node.js": ["backend", "server-side", "web applications", "api"],
            "latency": ["performance", "optimization", "speed", "efficiency"],
            "throughput": ["performance", "scalability"],
            "ci/cd": ["automation", "devops", "reliability", "deployment"],
            "graphql": ["api", "data fetching", "web services"],
            "rest": ["api", "web services", "backend"],
            "typescript": ["type safety", "javascript", "maintainability", "code quality"],
            "jest": ["testing", "quality assurance", "reliability", "unit testing"],
            "algorithms": ["problem solving", "logic", "data structures"],
            "data structures": ["algorithms", "performance", "optimization"],
            "security": ["authentication", "authorization", "protection", "safe"],
            "optimization": ["performance", "efficiency", "tuning"]
        };
    }
    async execute(context) {
        const { jobDescription, resume, optimizedResume } = context;
        const targetResume = optimizedResume || resume;
        if (!jobDescription || !targetResume) {
            throw new Error('JD or Resume missing for ATS analysis');
        }
        // 1. Text Extraction & Normalization
        const resumeText = this.extractTextFromResume(targetResume);
        const resumeTokens = this.tokenize(resumeText);
        const jdText = jobDescription;
        const jdTokens = this.tokenize(jdText);
        // 2. Keyword Extraction & Scoring with Semantic Layer
        const keywordStats = this.extractAndCountKeywords(jdText, resumeText);
        // 3. Scoring
        const scores = this.calculateScores(keywordStats);
        // 4. Heuristics
        const heuristics = this.calculateHeuristics(resumeText, targetResume.header?.title || '');
        // 5. Semantic Gap Analysis (for Explainability)
        const semanticGaps = this.analyzeSemanticGaps(keywordStats, jdText);
        return {
            ...context,
            cvWolfAnalysis: {
                scores,
                keywordStats, // Detailed breakdown
                heuristics,
                semanticAnalysis: {
                    inferredSkills: keywordStats.inferred,
                    gaps: semanticGaps
                },
                totalScore: scores.finalScore,
                tokens: {
                    resumeCount: resumeTokens.length,
                    jdCount: jdTokens.length
                }
            },
            // Maintain backward compatibility
            meta: {
                ...context.meta,
                atsScore: Math.round(scores.finalScore),
                cvWolfDetails: scores
            }
        };
    }
    extractTextFromResume(resume) {
        let text = '';
        const traverse = (obj) => {
            if (typeof obj === 'string') {
                text += obj + ' ';
            }
            else if (Array.isArray(obj)) {
                obj.forEach(item => traverse(item));
            }
            else if (typeof obj === 'object' && obj !== null) {
                Object.values(obj).forEach(value => traverse(value));
            }
        };
        traverse(resume);
        return text;
    }
    tokenize(text) {
        return text.toLowerCase()
            .replace(/[^\w\s]/g, '')
            .split(/\s+/)
            .filter(t => t.length > 0);
    }
    extractAndCountKeywords(jdText, resumeText) {
        const stats = {
            technical: [],
            abilities: [],
            other: [],
            inferred: [] // Track semantics
        };
        const jdLower = jdText.toLowerCase();
        const cvLower = resumeText.toLowerCase();
        const countOccurrences = (text, term) => {
            const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b${escaped}\\b`, 'g');
            const matches = text.match(regex);
            return matches ? matches.length : 0;
        };
        // 1. Scan Ontology (Technical Skills)
        Object.entries(SKILL_ONTOLOGY).forEach(([canonical, data]) => {
            // Check if this skill is in the JD
            const termsToCheck = [canonical, ...(data.aliases || [])];
            let bestTermInJD = null;
            let maxJDCount = 0;
            for (const term of termsToCheck) {
                const count = countOccurrences(jdLower, term);
                if (count > 0 && count > maxJDCount) {
                    maxJDCount = count;
                    bestTermInJD = term;
                }
            }
            if (bestTermInJD) {
                // JD requires this skill (or its alias)
                // Check CV for EXPLICIT match
                let cvCount = countOccurrences(cvLower, bestTermInJD);
                let matchType = 'explicit';
                let inferredFrom = null;
                // Check Semantics (IMPLICIT match) if not explicitly found
                if (cvCount === 0) {
                    // Does the CV contain something that IMPLIES this JD term?
                    // We need to look at the SEMANTIC_MAP in reverse or iterating
                    for (const [resumeSkill, concepts] of Object.entries(this.SEMANTIC_MAP)) {
                        if (concepts.includes(bestTermInJD) || concepts.includes(canonical)) {
                            // CV has 'microservices'?
                            if (countOccurrences(cvLower, resumeSkill) > 0) {
                                cvCount = 1; // Grant credit
                                matchType = 'semantic';
                                inferredFrom = resumeSkill;
                                break;
                            }
                        }
                    }
                }
                const bucket = data.category === 'soft' ? 'abilities' : 'technical';
                // @ts-ignore
                stats[bucket].push({
                    term: bestTermInJD,
                    canonical: canonical,
                    jdCount: maxJDCount,
                    cvCount: cvCount,
                    matched: cvCount > 0,
                    matchType,
                    inferredFrom
                });
                if (matchType === 'semantic') {
                    stats.inferred.push({
                        term: bestTermInJD,
                        inferredFrom
                    });
                }
            }
        });
        // 2. Scan General Keywords (Abilities + Other)
        // This includes "distributed systems", "scalability" which might not be in SKILL_ONTOLOGY
        // We scan the SEMANTIC_MAP values to see if JD mentions any of those concepts
        const allSemanticConcepts = new Set();
        Object.values(this.SEMANTIC_MAP).forEach(list => list.forEach(c => allSemanticConcepts.add(c)));
        allSemanticConcepts.forEach(concept => {
            // If already processed in Ontology, skip (approximate check)
            if (stats.technical.find(i => i.term === concept) || stats.abilities.find(i => i.term === concept)) {
                return;
            }
            const jdCount = countOccurrences(jdLower, concept);
            if (jdCount > 0) {
                // JD wants this concept (e.g. "scalability")
                let cvCount = countOccurrences(cvLower, concept);
                let matchType = 'explicit';
                let inferredFrom = null;
                if (cvCount === 0) {
                    // Check if CV implies it
                    for (const [resumeSkill, implies] of Object.entries(this.SEMANTIC_MAP)) {
                        if (implies.includes(concept)) {
                            if (countOccurrences(cvLower, resumeSkill) > 0) {
                                cvCount = 1;
                                matchType = 'semantic';
                                inferredFrom = resumeSkill;
                                break;
                            }
                        }
                    }
                }
                // Determine bucket - heuristics
                const bucket = ['leadership', 'communication'].some(k => concept.includes(k))
                    ? 'abilities'
                    : 'technical'; // Default to technical for these system concepts
                // @ts-ignore
                stats[bucket].push({
                    term: concept,
                    jdCount,
                    cvCount,
                    matched: cvCount > 0,
                    matchType,
                    inferredFrom
                });
                if (matchType === 'semantic') {
                    stats.inferred.push({
                        term: concept,
                        inferredFrom
                    });
                }
            }
        });
        return stats;
    }
    calculateScores(stats) {
        const scoreBucket = (items) => {
            if (items.length === 0)
                return 0;
            let totalMatched = 0;
            let totalJD = 0;
            items.forEach(k => {
                totalMatched += Math.min(k.cvCount, k.jdCount);
                totalJD += k.jdCount;
            });
            return totalJD === 0 ? 0 : (totalMatched / totalJD) * 100;
        };
        const technicalScore = scoreBucket(stats.technical);
        const abilitiesScore = scoreBucket(stats.abilities);
        const otherScore = scoreBucket(stats.other);
        // Weighted Final Score
        const weightedScore = ((this.WEIGHTS.technical * technicalScore) +
            (this.WEIGHTS.abilities * abilitiesScore) +
            (this.WEIGHTS.other * otherScore));
        return {
            technicalScore,
            abilitiesScore,
            otherScore,
            finalScore: Math.min(100, Math.round(weightedScore))
        };
    }
    calculateHeuristics(resumeText, jobTitle) {
        const measurableRegex = /(\d+%|\d+\s+(months|years|x)|reduced|improved|increased)/gi;
        const matches = resumeText.match(measurableRegex) || [];
        const measurablePass = matches.length >= 5;
        return {
            measurableResults: {
                count: matches.length,
                passed: measurablePass,
                matches: matches.slice(0, 5)
            }
        };
    }
    analyzeSemanticGaps(stats, jdText) {
        const gaps = [];
        // Flatten all missing technical skills
        stats.technical.forEach(item => {
            if (!item.matched) {
                gaps.push({
                    term: item.term,
                    category: 'technical',
                    recommendation: `Add experience with '${item.term}' or related concepts.`
                });
            }
        });
        stats.abilities.forEach(item => {
            if (!item.matched) {
                gaps.push({
                    term: item.term,
                    category: 'abilities',
                    recommendation: `Demonstrate '${item.term}' in your summary or bullets.`
                });
            }
        });
        return gaps;
    }
}
