import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

class GeminiService {
    constructor() {
        if (!process.env.GEMINI_API_KEY) {
            console.warn('⚠️ GEMINI_API_KEY not found in env. Gemini features disabled.');
            this.genAI = null;
        } else {
            this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        }

        // Use flash for speed as requested
        this.modelName = "gemini-2.5-flash";
    }


    async parseResumeToProfile(resumeText) {
        if (!this.genAI) {
            throw new Error("GEMINI_API_KEY is not configured.");
        }

        const model = this.genAI.getGenerativeModel({
            model: this.modelName,
            generationConfig: {
                responseMimeType: "application/json"
            }
        });

        const systemPrompt = `You are an expert Resume Parser. Your job is to extract structured information from a resume text and return it in a specific JSON format suitable for a job application profile.

Rules:
1. Extract ALL relevant fields based on the schema below.
2. The output JSON must STRICTLY follow the schema. Do not add or remove ANY top-level keys.
3. For "technicalSkills", you MUST categorize skills into: "programmingLanguages", "frontend", "backend", "databases", "devOpsAndTools", "middlewareAndServices", "architecture", "aiTools". Use your best judgment to place skills in the correct category.
4. "experience": Split date ranges into "duration.start" and "duration.end". Use "Present" for current jobs.
5. "experience": "responsibilitiesAndAchievements" MUST be an array of strings. Convert paragraphs into short, punchy bullet points.
6. "experience": Infer "employmentType" (e.g., "Full-time", "Contract").
7. "projects": "description" MUST be an array of strings (bullet points).
8. If a field is missing, use null, empty string "", or empty array [] as defined by the schema type.
9. "profileType" should be set to "Imported Profile" by default.
10. Return strictly valid JSON.

Schema:
{
    "profileType": "Imported Profile",
    "header": {
        "fullName": "String",
        "contact": {
            "email": "String",
            "phone": "String",
            "location": "String",
            "links": {
                "linkedin": "String",
                "github": "String",
                "leetcode": "String"
            }
        }
    },
    "professionalSummary": "String",
    "education": {
        "degree": "String",
        "institution": "String",
        "duration": {
            "start": "String",
            "end": "String"
        }
    },
    "technicalSkills": {
        "programmingLanguages": ["String"],
        "frontend": ["String"],
        "backend": ["String"],
        "databases": ["String"],
        "devOpsAndTools": ["String"],
        "middlewareAndServices": ["String"],
        "architecture": ["String"],
        "aiTools": ["String"]
    },
    "experience": [
        {
            "role": "String",
            "company": "String",
            "employmentType": "String",
            "location": "String",
            "duration": {
                "start": "String",
                "end": "String"
            },
            "responsibilitiesAndAchievements": ["String"],
            "technologies": ["String"]
        }
    ],
    "projects": [
        {
            "title": "String",
            "links": {
                "live": "String",
                "github": "String",
                "demo": "String"
            },
            "description": ["String"],
            "technologyStack": ["String"]
        }
    ]
}
`;

        const userPrompt = `Resume Text: "${resumeText.substring(0, 8000)}" 
Return the structured JSON:
`;
        // increased substring limit as gemini handles larger context easily

        try {
            const result = await model.generateContent([
                systemPrompt,
                userPrompt
            ]);

            const response = await result.response;
            const text = response.text();

            return JSON.parse(text);
        } catch (error) {
            console.error('Gemini Parsing Error:', error);
            throw error;
        }
    }
}

export const geminiService = new GeminiService();
