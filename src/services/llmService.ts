import OpenAI from 'openai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const model = "deepseek-chat";

interface PricingRate {
    unit: string;
    input: number;
    output: number;
    cached_input?: number;
}

interface PricingModel {
    [key: string]: PricingRate;
}

interface TokenUsageTracker {
    input: number;
    output: number;
    total: number;
    cost: number;
}

class LLMService {
    openai: OpenAI | null;
    model: string;
    temperature: number;
    pricing: PricingModel;
    maxCostPerRun: number;

    constructor() {
        this.openai = null;
        this.model = model;
        this.temperature = 0.2;

        // Pricing per 1K tokens
        this.pricing = {
            "deepseek-chat": {
                "unit": "per_1k_tokens",
                "input": 0.00028,
                "output": 0.00042,
                "cached_input": 0.000028
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

        this.maxCostPerRun = 5.0; // Hard ceiling ($5.00)

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

    calculateCost(model: string, usage: any): number {
        const rates = this.pricing[model] || this.pricing["gpt-4o"];
        const unitDivisor = rates.unit === "per_1k_tokens" ? 1000 : 1;

        const { prompt_tokens = 0, completion_tokens = 0, prompt_tokens_details } = usage;

        let inputCost = 0;
        let cachedInputCost = 0;

        // Handle caching if supported by model and API response
        const cachedTokens = prompt_tokens_details?.cached_tokens || 0;
        const uncachedTokens = Math.max(0, prompt_tokens - cachedTokens);

        if (rates.cached_input !== undefined) {
             // @ts-ignore
            inputCost = (uncachedTokens / unitDivisor) * rates.input;
             // @ts-ignore
            cachedInputCost = (cachedTokens / unitDivisor) * rates.cached_input;
        } else {
            // Fallback if no separate cached pricing
            inputCost = (prompt_tokens / unitDivisor) * rates.input;
        }

        const outputCost = (completion_tokens / unitDivisor) * rates.output;

        return inputCost + cachedInputCost + outputCost;
    }

    checkCostCeiling(tokenUsage: TokenUsageTracker | null): void {
        if (tokenUsage && tokenUsage.cost >= this.maxCostPerRun) {
            throw new Error(`Cost ceiling exceeded ($${this.maxCostPerRun}) – aborting pipeline to prevent billing spike.`);
        }
    }

    updateUsage(usageData: any, tokenUsageTracker: TokenUsageTracker | null): void {
        if (!usageData || !tokenUsageTracker) return;

        const { prompt_tokens = 0, completion_tokens = 0, total_tokens = 0 } = usageData;

        tokenUsageTracker.input += prompt_tokens;
        tokenUsageTracker.output += completion_tokens;
        tokenUsageTracker.total += total_tokens;

        const cost = this.calculateCost(this.model, usageData);
        tokenUsageTracker.cost += cost;
    }

    async generateContent(userPrompt: string, systemPrompt: string, tokenUsage: TokenUsageTracker | null = null): Promise<string | null> {
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

            return completion.choices[0].message.content?.trim() || null;
        } catch (error) {
            console.error('LLM Generation Error:', error);
            return null;
        }
    }

    /**
     * Rewrites a resume bullet point with strict constraints.
     */
    async rewriteBullet(bullet: string, startVerb: string, allowedKeywords: string[], tokenUsage: TokenUsageTracker | null = null): Promise<string> {
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
                model: "gpt-5.2", // Keeping original model name, assume mapped or valid in future/custom
                temperature: 0.2,
            });

            if (tokenUsage && completion.usage) {
                this.updateUsage(completion.usage, tokenUsage);
            }

            return completion.choices[0].message.content?.trim() || bullet;
        } catch (error) {
            console.error('LLM Rewrite Error:', error);
            return bullet;
        }
    }

    /**
     * Extracts IMPLIED technical skills from a Job Description.
     */
    async extractImpliedSkills(jdText: string, validSkillsList: string[], tokenUsage: TokenUsageTracker | null = null): Promise<string[]> {
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

            const result = JSON.parse(completion.choices[0].message.content || "{}");
            return result.skills || result.impliedSkills || [];
        } catch (error) {
            console.error('LLM Extraction Error:', error);
            return [];
        }
    }

    async generateResumeContent(prompt: string, tokenUsage: TokenUsageTracker | null = null): Promise<any> {
        try {
            this.checkCostCeiling(tokenUsage);
            const completion = await this.openai?.chat.completions.create({
                messages: [
                    { role: "system", content: prompt },
                ],
                model: this.model,
                temperature: this.temperature,
                response_format: { type: "json_object" }
            });

            if (!completion) return {};

            if (tokenUsage && completion.usage) {
                this.updateUsage(completion.usage, tokenUsage);
            }

            const result = JSON.parse(completion.choices[0].message.content || "{}");
            return result
        } catch (error) {
            console.error('LLM Extraction Error:', error);
            return [];
        }
    }

    async generateCoverLetter(prompt: string, tokenUsage: TokenUsageTracker | null = null): Promise<string | null> {
        return this.generateContent(prompt, "You are a helpful expert career coach.", tokenUsage);
    }

    async generateSubjectLine(prompt: string, tokenUsage: TokenUsageTracker | null = null): Promise<string | null> {
        return this.generateContent(prompt, "You are a helpful expert career coach.", tokenUsage);
    }
}

export const llmService = new LLMService();
