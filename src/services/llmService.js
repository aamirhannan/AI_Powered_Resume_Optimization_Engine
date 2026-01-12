import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root (assuming src/services/llmService.js)
// .env is at d:/resume-programe/.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const model = "deepseek-chat";

class LLMService {
    constructor() {
        this.openai = null;
        this.model = model;
        this.temperature = 0.2;

        // Pricing per 1K tokens (Approximation based on GPT-4o tiers as fallback)
        // Engineering-grade pricing model with explicit units and caching support
        this.pricing = {
            "deepseek-chat": {
                unit: "per_1k_tokens",
                input: 0.00175,
                output: 0.014,
                cached_input: 0.000175
            },
            "deepseek-reasoner": {
                "unit": "per_1k_tokens",
                "input": 0.00055,
                "output": 0.00219,
                "cached_input": 0.00014
            },
            "gpt-4o": {
                unit: "per_1k_tokens",
                input: 0.0025,
                output: 0.01
            },
            "gpt-3.5-turbo": {
                unit: "per_1k_tokens",
                input: 0.0005,
                output: 0.0015
            }
        };

        this.maxCostPerRun = 5.0; // Hard ceiling ($5.00) to prevent runaway loops

        // Lazy load OpenAI only if key is present
        if (process.env.DEEPSEEK_API_KEY) {
            this.openai = new OpenAI({
                apiKey: process.env.DEEPSEEK_API_KEY,
                baseURL: 'https://api.deepseek.com'
            });
        } else {
            console.warn('⚠️ DEEPSEEK_API_KEY not found in env. LLM features disabled.');
        }
    }

    calculateCost(model, usage) {
        const rates = this.pricing[model] || this.pricing["gpt-4o"];
        const unitDivisor = rates.unit === "per_1k_tokens" ? 1000 : 1;

        const { prompt_tokens = 0, completion_tokens = 0, prompt_tokens_details } = usage;

        let inputCost = 0;
        let cachedInputCost = 0;

        // Handle caching if supported by model and API response
        const cachedTokens = prompt_tokens_details?.cached_tokens || 0;
        const uncachedTokens = Math.max(0, prompt_tokens - cachedTokens);

        if (rates.cached_input !== undefined) {
            inputCost = (uncachedTokens / unitDivisor) * rates.input;
            cachedInputCost = (cachedTokens / unitDivisor) * rates.cached_input;
        } else {
            // Fallback if no separate cached pricing
            inputCost = (prompt_tokens / unitDivisor) * rates.input;
        }

        const outputCost = (completion_tokens / unitDivisor) * rates.output;

        return inputCost + cachedInputCost + outputCost;
    }

    checkCostCeiling(tokenUsage) {
        if (tokenUsage && tokenUsage.cost >= this.maxCostPerRun) {
            throw new Error(`Cost ceiling exceeded ($${this.maxCostPerRun}) – aborting pipeline to prevent billing spike.`);
        }
    }

    updateUsage(usageData, tokenUsageTracker) {
        if (!usageData || !tokenUsageTracker) return;

        const { prompt_tokens = 0, completion_tokens = 0, total_tokens = 0 } = usageData;

        tokenUsageTracker.input += prompt_tokens;
        tokenUsageTracker.output += completion_tokens;
        tokenUsageTracker.total += total_tokens;

        const cost = this.calculateCost(this.model, usageData);
        tokenUsageTracker.cost += cost;
    }

    async generateContent(userPrompt, systemPrompt, tokenUsage = null) {
        if (!this.openai) return userPrompt;

        this.checkCostCeiling(tokenUsage);

        try {
            const completion = await this.openai.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                model: this.model,
                temperature: this.temperature,
            });

            if (tokenUsage && completion.usage) {
                this.updateUsage(completion.usage, tokenUsage);
            }

            return completion.choices[0].message.content.trim();
        } catch (error) {
            console.error('LLM Generation Error:', error);
            return null;
        }
    }

    /**
     * Rewrites a resume bullet point with strict constraints.
     * @param {string} bullet - Original bullet point.
     * @param {string} startVerb - The verb to start the sentence with (e.g., "Optimized").
     * @param {string[]} allowedKeywords - List of keywords that MUST be used/preserved.
     * @param {object} tokenUsage - Optional tracker for token usage.
     * @returns {Promise<string>} - The rewritten bullet.
     */
    async rewriteBullet(bullet, startVerb, allowedKeywords, tokenUsage = null) {
        if (!this.openai) return bullet;

        this.checkCostCeiling(tokenUsage);

        const systemPrompt = `You are a strict Technical Editor. Your job is to rewrite resume bullet points to match a specific tone and keyword set.
Rules:
1. Start the sentence with the exact verb: "${startVerb}".
2. Do NOT add any new skills, tools, or technologies that are not in the input.
3. Preserve all numbers, metrics, and technical constraints exactly as they are.
4. Use ONLY the provided allowed keywords if they appear in the original text or context.
5. Keep the output concise (under 35 words).
6. Do not change the meaning of the work done.
`;

        const userPrompt = `
Original Bullet: "${bullet}"
Allowed Keywords: ${allowedKeywords.join(', ')}

Rewrite with start verb: "${startVerb}"
`;

        try {
            const completion = await this.openai.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                model: "gpt-5.2",
                temperature: 0.2,
            });

            if (tokenUsage && completion.usage) {
                this.updateUsage(completion.usage, tokenUsage);
            }

            return completion.choices[0].message.content.trim();
        } catch (error) {
            console.error('LLM Rewrite Error:', error);
            return bullet;
        }
    }

    /**
     * Extracts IMPLIED technical skills from a Job Description.
     * @param {string} jdText - The job description text.
     * @param {string[]} validSkillsList - List of known ontology skills to map to.
     * @param {object} tokenUsage - Optional tracker.
     * @returns {Promise<string[]>} - List of implied skills found.
     */
    async extractImpliedSkills(jdText, validSkillsList, tokenUsage = null) {
        if (!this.openai) return [];

        this.checkCostCeiling(tokenUsage);

        const systemPrompt = `You are a Semantic Skill Classifier. 
Your job is to identify IMPLIED technical skills in a Job Description that might not be explicitly named but are required by context.
Rules:
1. Return ONLY concepts that map to the provided "Valid Skills List".
2. If a skill is explicitly mentioned in the text, IGNORE it (we have regex for that).
3. Look for phrases like "low-latency systems" (implies C++/Rust/Go) or "containerization" (implies Docker).
4. Output strict JSON array of strings. e.g. ["docker", "redis"]
`;

        const userPrompt = `
Valid Skills List: ${JSON.stringify(validSkillsList)}
Job Description:
"${jdText.substring(0, 1500)}" 

Return JSON Array of implied skills:
`;

        try {
            const completion = await this.openai.chat.completions.create({
                messages: [
                    { role: "system", content: systemPrompt },
                    { role: "user", content: userPrompt }
                ],
                model: this.model,
                temperature: this.temperature,
                response_format: { type: "json_object" }
            });

            if (tokenUsage && completion.usage) {
                this.updateUsage(completion.usage, tokenUsage);
            }

            const result = JSON.parse(completion.choices[0].message.content);
            return result.skills || result.impliedSkills || [];
        } catch (error) {
            console.error('LLM Extraction Error:', error);
            return [];
        }
    }

    /**
     * get the hard and soft skill from job description
     */

    async generateResumeContent(prompt, tokenUsage = null) {
        try {
            this.checkCostCeiling(tokenUsage);
            const completion = await this.openai.chat.completions.create({
                messages: [
                    { role: "system", content: prompt },
                ],
                model: this.model,
                temperature: this.temperature,
                response_format: { type: "json_object" }
            });

            if (tokenUsage && completion.usage) {
                this.updateUsage(completion.usage, tokenUsage);
            }

            const result = JSON.parse(completion.choices[0].message.content);
            return result
        } catch (error) {
            console.error('LLM Extraction Error:', error);
            return [];
        }
    }

    async generateCoverLetter(prompt, tokenUsage = null) {
        return this.generateContent(prompt, "You are a helpful expert career coach.", tokenUsage);
    }

    async generateSubjectLine(prompt, tokenUsage = null) {
        return this.generateContent(prompt, "You are a helpful expert career coach.", tokenUsage);
    }
}

export const llmService = new LLMService();
