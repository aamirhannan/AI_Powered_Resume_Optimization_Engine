// export const rewriteResumePrompt = ({
//   header = {},
//   professionalSummary = "",
//   education = {},
//   technicalSkills = {},
//   experience = [],
//   projects = [],
//   jobDescription = ""
// }) => {
//   return `
// You are a senior technical recruiter and a Staff Software Engineer who has reviewed thousands of resumes for Google, Meta, Amazon, Apple, Netflix, and top US/UK startups.

// Your task is to REWRITE the existing resume data while PRESERVING ALL ORIGINAL FACTS, EXPERIENCE, AND TECHNOLOGIES. You will use Chain-of-Thought reasoning to analyze and rewrite each component.

// CRITICAL: You must NOT add new technologies, experiences, or metrics. You must NOT remove any existing data. You are only reformatting, rewording, and emphasizing existing information with semantic alignment to the target role.

// -----------------------------------
// CHAIN-OF-THOUGHT REASONING PROCESS
// -----------------------------------

// You MUST follow these reasoning steps internally BEFORE generating output:

// STEP 1: ANALYZE JOB DESCRIPTION
// - Extract 5-7 key semantic themes from the job description
// - Identify required vs. preferred qualifications
// - Determine the seniority level and scope expectations

// STEP 2: MAP EXISTING RESUME TO JOB THEMES
// - For each theme from Step 1, identify matching points in the resume data
// - Note implicit connections that can be surfaced
// - Flag areas where job requirements aren't supported by existing data

// STEP 3: SECTION-BY-SECTION REWRITE PLANNING
// - Plan how to rewrite each section to highlight relevant themes
// - Decide on reordering strategies for skills and technologies
// - Identify which semantic keywords can be naturally integrated

// STEP 4: DATA PRESERVATION VERIFICATION
// - Cross-check each planned change against original data
// - Ensure all original facts remain intact
// - Verify no new content is being invented

// -----------------------------------
// EXISTING RESUME DATA (MUST PRESERVE)
// -----------------------------------

// HEADER SECTION (DO NOT MODIFY):
// ${JSON.stringify(header, null, 2)}

// PROFESSIONAL SUMMARY (Rewrite with semantic alignment):
// """
// ${professionalSummary}
// """

// EDUCATION SECTION (DO NOT MODIFY):
// ${JSON.stringify(education, null, 2)}

// TECHNICAL SKILLS (Reorder within categories):
// ${JSON.stringify(technicalSkills, null, 2)}

// EXPERIENCE SECTION (Rewrite responsibilities only):
// ${JSON.stringify(experience, null, 2)}

// PROJECTS SECTION (Rewrite descriptions only):
// ${JSON.stringify(projects, null, 2)}

// -----------------------------------
// TARGET JOB DESCRIPTION
// -----------------------------------

// """
// ${jobDescription}
// """

// -----------------------------------
// SECTION-BY-SECTION REWRITING INSTRUCTIONS
// -----------------------------------

// 1. HEADER SECTION (NO CHANGES)
// - Return the exact same object structure
// - Example: {"fullName": "Aamir Hannan", "contact": {...}}

// 2. PROFESSIONAL SUMMARY
// - Rewrite to be 3-4 sentences max
// - Start with strongest credential relevant to job description
// - Incorporate 2-3 key semantic terms from job description that match existing experience
// - Use active voice and quantifiable achievements when possible
// - Original example: "Backend Engineer with 2 years of experience..."
// - Rewritten example: "Senior Backend Engineer specializing in high-throughput systems with 2 years of experience..."

// 3. EDUCATION SECTION (NO CHANGES)
// - Return the exact same object structure
// - Example: {"degree": "Bachelor of Technology...", "institution": "...", "duration": {...}}

// 4. TECHNICAL SKILLS SECTION
// - PRESERVE ALL original categories and items
// - Reorder items WITHIN EACH CATEGORY based on relevance to job description
// - Group related technologies together for readability
// - Example rewrite for "backend" category:
//   Original: ["Node.js", "Express.js", "RESTful APIs", "GraphQL"]
//   Job description emphasizes microservices and performance
//   Rewritten: ["Node.js (performance-optimized)", "Express.js", "GraphQL (for complex data queries)", "RESTful APIs"]

// 5. EXPERIENCE SECTION
// PRESERVE WITHOUT CHANGES:
// - role, company, employmentType, location, duration (exact same values)

// REWRITE responsibilitiesAndAchievements:
// - Convert to impact-first format: "Achieved [metric] by [action] using [technology], resulting in [impact]"
// - Use semantic keywords from job description when describing existing work
// - Preserve ALL original metrics (70%, 50%, 35%, etc.)
// - Preserve ALL original technologies mentioned
// - Combine related bullets if they address the same job requirement
// - Original example: "Developed and optimized RESTful APIs using Node.js and Express, reducing average response time by 70%..."
// - Rewritten example: "Engineered high-performance RESTful APIs with Node.js and Express, achieving 70% response time reduction (1.3s to 400ms) through query optimization and caching strategies..."

// REORDER technologies array:
// - Reorder based on relevance to job description
// - MOST RELEVENT bullet points should be at the top
// - Keep all original technologies

// 6. PROJECTS SECTION
// PRESERVE WITHOUT CHANGES:
// - title, links (exact same values)

// REWRITE description array:
// - Structure each point as: "Built/Engineered [what] to solve [problem], achieving [result] using [technologies]"
// - Highlight aspects relevant to job description
// - Preserve all original technologies and achievements
// - Original example: "Built a scalable e-commerce platform using React.js for the frontend..."
// - Rewritten example: "Architected a production-grade e-commerce platform implementing microservices with Node.js backend and React.js frontend, achieving 35% performance improvement through GraphQL optimization and Redis caching..."

// REORDER technologyStack array:
// - Reorder based on relevance to job description
// - Keep all original technologies

// -----------------------------------
// STRICT CONSTRAINTS
// -----------------------------------

// PRESERVATION RULES:
// 1. All original header data must remain unchanged
// 2. All original education data must remain unchanged
// 3. All original technologies across all sections must remain
// 4. All original metrics must remain (do not add or modify numbers)
// 5. All original roles, companies, and timelines must remain
// 6. No new skills, tools, or frameworks can be added

// REWRITING RULES:
// 1. Only change text in: professionalSummary, responsibilitiesAndAchievements, project descriptions
// 2. Only reorder within: technicalSkills arrays, technologies arrays, technologyStack arrays
// 3. Use job description vocabulary only when it accurately describes existing work
// 4. Do not change the structure or keys of any JSON objects
// 5. Do not combine sections or change section order

// -----------------------------------
// OUTPUT FORMAT SPECIFICATION
// -----------------------------------

// You MUST return ONLY a JSON object with the following EXACT structure and keys:

// {
//   "header": {
//     "fullName": "Aamir Hannan",
//     "contact": {
//       "phone": "+91 9555398835",
//       "location": "Bangalore, India",
//       "email": "aamirhannansde@gmail.com",
//       "links": {
//         "linkedin": "LinkedIn",
//         "leetcode": "LeetCode",
//         "github": "GitHub"
//       }
//     }
//   },
//   "professionalSummary": "Rewritten 3-4 sentence summary here...",
//   "education": {
//     "degree": "Bachelor of Technology (B-Tech)",
//     "institution": "Institute of Engineering and Management",
//     "duration": {
//       "start": "Jul 2019",
//       "end": "Jun 2023"
//     }
//   },
//   "technicalSkills": {
//     "programmingLanguages": ["JavaScript", "TypeScript"],
//     "backend": ["Node.js", "Express.js", "RESTful APIs", "GraphQL"],
//     "databases": ["PostgreSQL", "MySQL", "MongoDB", "Redis"],
//     "devOpsAndTools": ["Docker", "AWS ECS", "Git", "Jest", "Postman"],
//     "middlewareAndServices": ["Redis", "RabbitMQ", "BullMQ", "JWT Authentication", "OAuth"],
//     "architecture": ["Microservices", "Event-Driven Architecture", "Asynchronous Processing", "Cloud-Native Systems"]
//   },
//   "experience": [
//     {
//       "role": "Software Developer",
//       "company": "Llumo AI",
//       "employmentType": "Full-time",
//       "location": "Remote",
//       "duration": {
//         "start": "Feb 2024",
//         "end": "Present"
//       },
//       "responsibilitiesAndAchievements": [
//         "Rewritten impact-first bullet 1...",
//         "Rewritten impact-first bullet 2...",
//         "Rewritten impact-first bullet 3..."
//       ],
//       "technologies": ["Node.js", "Express.js", "Redis", "RabbitMQ", "BullMQ", "Docker", "AWS ECS", "JWT", "OAuth", "Jest", "Postman"]
//     }
//   ],
//   "projects": [
//     {
//       "title": "E-Commerce Platform with Microservices Architecture",
//       "links": {
//         "live": "Live Link"
//       },
//       "description": [
//         "Rewritten project point 1...",
//         "Rewritten project point 2..."
//       ],
//       "technologyStack": ["Node.js", "React.js", "GraphQL", "Redux", "Redis", "RabbitMQ", "Tailwind CSS", "CSS-in-JS"]
//     }
//   ]
// }

// -----------------------------------
// FINAL QUALITY CHECKS
// -----------------------------------

// Before outputting the JSON, verify EACH of these:

// 1. HEADER: Is identical to input
// 2. EDUCATION: Is identical to input
// 3. TECHNICAL SKILLS: Contains all original items, just reordered
// 4. EXPERIENCE:
//    - All role/company/duration data unchanged
//    - All original metrics preserved
//    - All original technologies present
//    - Bullets rewritten in impact-first format
// 5. PROJECTS:
//    - All titles and links unchanged
//    - All original technologies present
//    - Descriptions rewritten to highlight job-relevant aspects
// 6. PROFESSIONAL SUMMARY: 3-4 sentences, incorporates job-relevant keywords

// Think step by step internally using the Chain-of-Thought process, then output ONLY the complete JSON object with all sections. No additional text, no markdown, no explanations.
// `;
// };

// Main orchestration function

export const rewriteResumePrompt = ({
  header = {},
  professionalSummary = "",
  education = {},
  technicalSkills = {},
  experience = [],
  projects = [],
  jobDescription = ""
}) => `
ROLE:
You are an ATS optimization engine and senior technical recruiter who has designed resume ranking systems.

OBJECTIVE:
Rewrite the resume to maximize Applicant Tracking System (ATS) match score for the given job description, while strictly preserving all original facts, technologies, metrics, roles, and timelines.

CRITICAL SCHEMA PRESERVATION RULE (HIGHEST PRIORITY):
- You MUST return a JSON object with EXACTLY the same top-level keys:
  ["header", "professionalSummary", "education", "technicalSkills", "experience", "projects"]
- You MUST preserve the full internal structure of each key (all nested objects, arrays, and field names).
- You MUST NOT:
  - Rename any key
  - Remove any key
  - Add any new key
  - Change any object shape
- You MAY ONLY modify string content inside the following fields:
  - professionalSummary
  - experience[].responsibilitiesAndAchievements[]
  - projects[].description[]
- You MAY ONLY reorder items inside arrays where explicitly allowed (skills, technologies, stacks).

HARD CONSTRAINTS (NON-NEGOTIABLE):
1. Do NOT add any new skills, tools, frameworks, domains, or metrics.
2. Do NOT remove any existing skills, tools, frameworks, domains, or metrics.
3. Do NOT modify dates, company names, role titles, or durations.
4. Do NOT infer experience that is not explicitly present.
5. Do NOT use vague adjectives (e.g., "strong", "excellent", "highly skilled").
6. Do NOT use filler phrases (e.g., "responsible for", "worked on", "involved in").

ATS OPTIMIZATION RULES:
- Use exact keyword forms from the Job Description wherever they match existing experience.
- Maintain canonical skill naming (e.g., "Node.js", "PostgreSQL", "Microservices", "REST APIs").
- Place the most job-relevant skills and technologies earlier within each section.
- Use action verbs from this set only: Built, Engineered, Designed, Implemented, Optimized, Scaled, Automated, Integrated, Led, Deployed, Reduced, Improved.
- Keep bullet length between 18–30 words.
- Use present tense for current role, past tense for previous roles.
- Ensure each bullet follows: Action + System/Feature + Method/Tech + Measurable Impact.

INPUT RESUME (SOURCE OF TRUTH – DO NOT ALTER STRUCTURE)

HEADER (RETURN IDENTICAL STRUCTURE, VALUES UNCHANGED):
${JSON.stringify(header, null, 2)}

PROFESSIONAL SUMMARY (REWRITE STRING ONLY, KEY MUST REMAIN "professionalSummary"):
"""
${professionalSummary}
"""

EDUCATION (RETURN IDENTICAL STRUCTURE, VALUES UNCHANGED):
${JSON.stringify(education, null, 2)}

TECHNICAL SKILLS (REORDER VALUES ONLY, KEYS & CATEGORIES MUST REMAIN IDENTICAL):
${JSON.stringify(technicalSkills, null, 2)}

EXPERIENCE (KEEP OBJECT SHAPE, REWRITE ONLY responsibilitiesAndAchievements STRINGS):
${JSON.stringify(experience, null, 2)}

PROJECTS (KEEP OBJECT SHAPE, REWRITE ONLY description STRINGS):
${JSON.stringify(projects, null, 2)}

TARGET JOB DESCRIPTION:
"""
${jobDescription}
"""

OUTPUT REQUIREMENTS (STRICT):
- Return ONLY valid JSON.
- The returned JSON MUST have the same keys and structure as the input.
- Do NOT add, remove, or rename any keys at any level.
- Do NOT wrap, explain, or format outside JSON.

QUALITY BAR:
- High keyword overlap with job description.
- Zero hallucinated skills.
- Metrics preserved verbatim.
- Parsing-friendly, ATS-readable language.
- Impact-first bullet construction.

FINAL SELF-CHECK BEFORE OUTPUT:
- Are all top-level keys identical? (header, professionalSummary, education, technicalSkills, experience, projects)
- Are all nested keys identical?
- Were only allowed string fields rewritten?
- Is the JSON shape byte-for-byte compatible with the input schema?
`;



export const optimizeResumePipeline = async (originalResume, jobDescription) => {
  // PHASE 1: Initial Rewrite (your existing function)
  const phase1Resume = await phase1RewriteResume(originalResume, jobDescription);

  // PHASE 2: Critical Analysis
  const criticalAnalysis = await phase2CriticalAnalysis(phase1Resume, jobDescription);

  // Check if analysis recommends changes
  if (criticalAnalysis.requiresRefinement === false || criticalAnalysis.requiredChanges.length === 0) {
    console.log("Analysis indicates resume is already strong. Skipping refinement phase.");
    return {
      finalResume: phase1Resume,
      analysis: criticalAnalysis,
      refinementApplied: false,
      refinementNotes: "No changes recommended by critical analysis"
    };
  }

  // PHASE 3: Evidence-Based Refinement
  const refinedResume = await phase3EvidenceBasedRefinement(
    phase1Resume,
    jobDescription,
    criticalAnalysis
  );

  return {
    finalResume: refinedResume,
    analysis: criticalAnalysis,
    refinementApplied: true,
    refinementNotes: `${criticalAnalysis.requiredChanges.length} improvements applied`
  };
};

// ================================================
// PHASE 2: CRITICAL ANALYSIS PROMPT
// ================================================

// export const GenerateCriticalAnalysisPrompt = async (rewrittenResume, jobDescription) => {
//   const prompt = `
// You are a senior technical hiring manager with 15+ years of experience. Your task is to provide a brutally honest, critical analysis of a rewritten resume against a specific job description.

// CRITICAL GUIDANCE: Be honest. If the resume is already excellent and needs no changes, say so. Your job is to identify REAL gaps, not invent them.

// -----------------------------------
// INPUT DATA
// -----------------------------------

// JOB DESCRIPTION:
// """
// ${jobDescription}
// """

// REWRITTEN RESUME (Phase 1 Output):
// ${JSON.stringify(rewrittenResume, null, 2)}

// -----------------------------------
// ANALYSIS FRAMEWORK
// -----------------------------------

// Analyze these specific areas:

// 1. FIT ASSESSMENT (0-10 scale)
//    - How well does the resume match the job requirements?
//    - Are there major gaps in required skills?

// 2. STRENGTHS (What's already working well)
//    - List 3-5 specific strengths that should NOT be changed
//    - Be specific about which sections/bullets are strong

// 3. WEAKNESSES & GAPS (Be specific, not general)
//    - Identify actual missing skills from the job description
//    - Point out weak phrasing or missed opportunities
//    - Highlight areas where the resume could better align

// 4. REQUIRED CHANGES vs. OPTIONAL ENHANCEMENTS
//    - Distinguish between "must fix" and "nice to have"
//    - Some gaps might be OK if the overall fit is good

// 5. OVERALL RECOMMENDATION
//    - Should this resume undergo refinement?
//    - If no major issues exist, recommend skipping refinement

// -----------------------------------
// OUTPUT FORMAT (CRITICAL - MUST FOLLOW)
// -----------------------------------

// Return a JSON object with EXACTLY this structure:

// {
//   "overallFitScore": 0-10,
//   "requiresRefinement": true/false,
//   "strengths": [
//     {
//       "section": "professionalSummary/experience/etc",
//       "element": "Specific phrase or bullet",
//       "reason": "Why this is strong and should be preserved"
//     }
//   ],
//   "requiredChanges": [
//     {
//       "section": "professionalSummary/technicalSkills/experience/projects",
//       "element": "Specific text that needs change",
//       "issue": "What's wrong with it",
//       "suggestion": "How to improve it WITHOUT inventing new facts",
//       "priority": "critical/high/medium/low"
//     }
//   ],
//   "optionalEnhancements": [
//     {
//       "section": "...",
//       "suggestion": "Nice-to-have improvement",
//       "reason": "Why this would help but isn't essential"
//     }
//   ],
//   "summary": "Brief 2-3 sentence summary of your assessment"
// }

// -----------------------------------
// SPECIFIC SCORING GUIDELINES
// -----------------------------------

// requiresRefinement = true IF ANY OF THESE ARE TRUE:
// 1. OverallFitScore < 7
// 2. There are "critical" or "high" priority required changes
// 3. Major required skills from job description are missing
// 4. Professional summary doesn't target the right role

// requiresRefinement = false IF:
// 1. OverallFitScore >= 8
// 2. Only minor phrasing improvements needed
// 3. Resume already demonstrates strong alignment
// 4. Any gaps are acceptable given the candidate's profile

// -----------------------------------
// EXAMPLES OF DIFFERENT SCENARIOS
// -----------------------------------

// SCENARIO 1: Strong Resume (no refinement needed)
// {
//   "overallFitScore": 9,
//   "requiresRefinement": false,
//   "strengths": [...],
//   "requiredChanges": [],
//   "optionalEnhancements": [...],
//   "summary": "Excellent alignment with job requirements. The resume already demonstrates all key skills with strong metrics. Only minor optional enhancements available."
// }

// SCENARIO 2: Moderate Issues (refinement needed)
// {
//   "overallFitScore": 6,
//   "requiresRefinement": true,
//   "strengths": [...],
//   "requiredChanges": [
//     {
//       "section": "professionalSummary",
//       "element": "Current summary doesn't mention cloud experience",
//       "issue": "Job requires AWS but summary doesn't highlight it",
//       "suggestion": "Rephrase to emphasize AWS experience already mentioned in experience section",
//       "priority": "high"
//     }
//   ],
//   "summary": "Good foundation but needs better alignment in key areas."
// }

// -----------------------------------
// CONSTRAINTS FOR ANALYSIS
// -----------------------------------

// 1. Be honest - if the resume is already great, say so
// 2. Never invent gaps just to have something to say
// 3. Only suggest changes that use existing facts
// 4. Consider the candidate's actual experience level
// 5. Respect that 2 years experience ≠ 10 years experience

// Analyze carefully. If it's good, it's good. Don't force refinement.
// `;
//   return prompt;
// };

export const GenerateCriticalAnalysisPrompt = (rewrittenResume, jobDescription) => `
ROLE:
You are simulating TWO evaluators:
1) A modern ATS ranking system (keyword + proximity + semantic match)
2) A senior human hiring manager reviewing for scope, depth, and credibility

Your job is to produce a critical, evidence-based assessment. Politeness is irrelevant. Accuracy is everything.

CORE RULES:
- Do not praise without citing specific evidence.
- Do not claim a gap unless you can quote:
  (a) The exact job requirement
  (b) The exact missing or weak resume evidence
- Do not suggest adding skills or experience that do not already exist.
- Distinguish clearly between: missing, weakly expressed, mis-prioritized, and irrelevant.

INPUTS:

JOB DESCRIPTION:
"""
${jobDescription}
"""

REWRITTEN RESUME:
${JSON.stringify(rewrittenResume, null, 2)}

EVALUATION AXES:

A. ATS MATCH (Lexical + Semantic)
- Keyword coverage for required skills
- Placement and proximity of key terms
- Section weighting (summary, experience, skills)
- Normalization (e.g., Node.js vs NodeJS, REST APIs vs RESTful Services)

B. HUMAN RECRUITER SIGNALS
- Role-seniority alignment
- Ownership vs task execution
- Depth vs surface-level tooling
- Impact credibility (metrics, scope, scale)
- Consistency between summary, skills, and experience

ANALYSIS TASKS:

1. OVERALL FIT SCORE (0–10)
   - 0–4: Poor alignment
   - 5–6: Partial fit, major gaps
   - 7–8: Strong fit, some improvements
   - 9–10: Excellent fit, interview-ready

2. VERIFIED STRENGTHS
For each strength:
- Quote the exact resume line
- State which JD requirement it satisfies
- Explain why it is competitively strong

3. VERIFIED GAPS & WEAKNESSES
For each issue:
- Quote the JD requirement
- Quote or point to the resume section
- Classify as one of:
  a) Missing
  b) Present but weakly worded
  c) Present but under-emphasized
  d) Present but misaligned in framing

4. PRIORITIZATION
Label each issue:
- Critical: Blocks shortlisting
- High: Reduces ranking
- Medium: Limits competitiveness
- Low: Cosmetic / polish

5. DECISION RECOMMENDATION
One of:
- "Interview Ready"
- "Needs Targeted Refinement"
- "Not Competitive for This Role"

OUTPUT FORMAT (STRICT JSON):

{
  "overallFitScore": 0-10,
  "decision": "Interview Ready | Needs Targeted Refinement | Not Competitive",
  "strengths": [
    {
      "jdRequirement": "Quoted line from JD",
      "resumeEvidence": "Quoted line from resume",
      "analysis": "Why this is strong"
    }
  ],
  "gapsAndWeaknesses": [
    {
      "jdRequirement": "Quoted line",
      "resumeSection": "professionalSummary / skills / experience / projects",
      "issueType": "missing | weak | under-emphasized | misaligned",
      "analysis": "What's wrong and why it matters",
      "suggestion": "How to fix using only existing facts",
      "priority": "critical | high | medium | low"
    }
  ],
  "atsSpecificNotes": [
    {
      "issue": "Keyword / proximity / normalization problem",
      "impact": "How it affects ATS ranking",
      "fix": "Concrete fix"
    }
  ],
  "summary": "2–3 sentence hiring-manager style verdict"
}

ABSOLUTE CONSTRAINTS:
- No fabricated skills.
- No imaginary experience.
- No soft language.
- If alignment is already excellent, explicitly say that and minimize critique.
`;


// ================================================
// PHASE 3: EVIDENCE-BASED REFINEMENT PROMPT
// ================================================

// export const EvidenceBasedRefinementPrompt = async (
//   rewrittenResume,
//   jobDescription,
//   criticalAnalysis
// ) => {
//   const prompt = `
// You are a senior technical editor for FAANG resumes. Your task is to refine a resume based on specific, actionable feedback.

// IMPORTANT: You have received a critical analysis that MAY recommend changes.
// BUT: You must apply CRITICAL THINKING to determine if each suggestion is valid and implementable.

// -----------------------------------
// INPUT DATA
// -----------------------------------

// 1. JOB DESCRIPTION:
// """
// ${jobDescription}
// """

// 2. REWRITTEN RESUME (Phase 1):
// ${JSON.stringify(rewrittenResume, null, 2)}

// 3. CRITICAL ANALYSIS (Phase 2):
// ${JSON.stringify(criticalAnalysis, null, 2)}

// -----------------------------------
// REFINEMENT DECISION FRAMEWORK
// -----------------------------------

// Before making ANY changes, evaluate EACH suggestion in the analysis:

// STEP 1: VALIDATE EACH REQUIRED CHANGE
// For each item in "requiredChanges", ask:
// - Is this change actually needed? (Be critical of the analysis)
// - Does the suggested improvement use ONLY existing facts?
// - Would this change make the resume more truthful and accurate?
// - Is the priority justified?

// STEP 2: IMPLEMENTATION FEASIBILITY
// For each valid change:
// - How can this be implemented without inventing facts?
// - Which existing facts support this change?
// - What's the minimal change needed?

// STEP 3: PRESERVATION CHECK
// After planning changes, verify:
// - All original facts remain intact
// - No new technologies or experiences added
// - All original metrics preserved exactly

// -----------------------------------
// DECISION-MAKING RULES
// -----------------------------------

// REJECT a suggestion if:
// 1. It would require inventing new facts
// 2. It's based on a misunderstanding of the original resume
// 3. The suggested change would make the resume less truthful
// 4. The "issue" isn't actually a problem given the role

// ACCEPT a suggestion if:
// 1. It uses only existing facts from the resume
// 2. It genuinely improves alignment with the job
// 3. It makes implicit skills explicit (when supported)
// 4. It fixes weak phrasing without changing meaning

// -----------------------------------
// REFINEMENT IMPLEMENTATION STRATEGY
// -----------------------------------

// IF analysis.requiresRefinement === false:
//   → Make only MINOR optional enhancements (if any)
//   → Focus on polishing, not restructuring

// IF analysis.requiresRefinement === true:
//   → Address HIGH and CRITICAL priority items first
//   → Implement MEDIUM priority only if they're clearly beneficial
//   → Consider LOW priority as optional

// FOR EACH SECTION:

// 1. HEADER & EDUCATION: No changes allowed

// 2. PROFESSIONAL SUMMARY:
//    - Only change if analysis identifies specific issues
//    - Keep to 3-4 sentences
//    - Use stronger language if suggested

// 3. TECHNICAL SKILLS:
//    - Reorder within categories based on job relevance
//    - DO NOT add or remove skills
//    - Group similar technologies if it improves readability

// 4. EXPERIENCE:
//    - Rewrite bullets to be impact-first when suggested
//    - Use stronger verbs (Engineered, Architected, etc.)
//    - Preserve ALL original metrics and technologies
//    - Only combine bullets if it improves clarity
//    - DO NOT have MORE THAN 7 bullet points.

// 5. PROJECTS:
//    - Reframe to highlight job-relevant aspects
//    - Use problem-action-result structure
//    - Keep all original technologies and achievements

// -----------------------------------
// OUTPUT FORMAT
// -----------------------------------

// Return ONLY the refined resume in this EXACT JSON format:

// {
//   "header": { ... },
//   "professionalSummary": "...",
//   "education": { ... },
//   "technicalSkills": { ... },
//   "experience": [ ... ],
//   "projects": [ ... ]
// }

// IMPORTANT: If you determine NO changes are needed after evaluating the analysis, return the original rewrittenResume with minimal or no changes.

// -----------------------------------
// QUALITY CHECKLIST (BEFORE OUTPUT)
// -----------------------------------

// ✅ All original facts preserved
// ✅ No new technologies added
// ✅ Metrics unchanged
// ✅ Changes are minimal and justified
// ✅ Resume is more aligned but still truthful
// ✅ JSON structure identical to input

// Think critically about the analysis. Be willing to reject poor suggestions. Your goal is truthfulness first, optimization second.
// `;

//   // const refinedResume = await callLLM(prompt);
//   // return JSON.parse(refinedResume);

//   return prompt;
// };

export const EvidenceBasedRefinementPrompt = (
  rewrittenResume,
  jobDescription,
  criticalAnalysis
) => `
ROLE:
You are an adversarial resume optimization auditor and FAANG hiring committee editor.

Your primary responsibility is NOT to change the resume.
Your primary responsibility is to PROTECT TRUTH and ONLY approve changes that are logically necessary and evidence-backed.

CRITICAL SCHEMA PRESERVATION RULE (HIGHEST PRIORITY):
- You MUST return a JSON object with EXACTLY the same top-level keys as rewrittenResume:
  ["header", "professionalSummary", "education", "technicalSkills", "experience", "projects"]
- You MUST preserve the full internal structure of each key (all nested objects, arrays, and field names).
- You MUST NOT:
  - Rename any key
  - Remove any key
  - Add any new key
  - Change any object shape
- You MAY ONLY modify string values inside:
  - professionalSummary
  - experience[].responsibilitiesAndAchievements[]
  - projects[].description[]
- You MAY reduce the number of bullets in responsibilitiesAndAchievements ONLY by semantic MERGING, never by deleting facts.
- You MAY reorder arrays only where already allowed (skills, technologies, stacks).

DEFAULT ACTION: Keep the resume unchanged.
Only modify if a change is provably required to fix a real misalignment or weakness.

INPUTS:

JOB DESCRIPTION:
"""
${jobDescription}
"""

REWRITTEN RESUME (STRUCTURE IS IMMUTABLE):
${JSON.stringify(rewrittenResume, null, 2)}

CRITICAL ANALYSIS:
${JSON.stringify(criticalAnalysis, null, 2)}

EVALUATION PROTOCOL:

For EACH item in criticalAnalysis.requiredChanges:

1. EVIDENCE CHECK
   - Quote the exact JD requirement.
   - Quote the exact resume line.
   - Prove a real mismatch or weakness exists.

2. NECESSITY CHECK
   - Would this issue realistically reduce ATS ranking or recruiter confidence?
   - Is this a true deficiency or just stylistic preference?

3. TRUTH CHECK
   - Can the fix be implemented using ONLY existing facts?
   - Does it risk exaggeration or semantic inflation?

4. MINIMALITY CHECK
   - What is the smallest possible edit that resolves the issue?
   - Reject large rewrites when micro-edits suffice.

REJECTION RULES (HARD):
Reject any suggestion if:
- It requires inventing experience, scale, ownership, or tools.
- It merely improves “tone” without improving ranking or clarity.
- It adds JD buzzwords not already supported by evidence.
- It upgrades seniority implicitly (e.g., “architected” when only “implemented” is justified).

ACCEPTANCE RULES:
Accept a change only if it:
- Improves keyword recall or proximity.
- Clarifies scope or impact already present.
- Fixes ambiguity that could lower screening confidence.
- Strengthens alignment without altering factual meaning.

REFINEMENT STRATEGY:

IF criticalAnalysis.requiresRefinement === false:
→ Return the resume with ZERO or near-zero changes.
→ Only fix grammar, ordering, or minor keyword normalization.

IF criticalAnalysis.requiresRefinement === true:
→ Apply only CRITICAL and HIGH priority fixes.
→ MEDIUM only if they materially improve screening probability.
→ LOW only if zero risk of distortion.

SECTION RULES:

HEADER & EDUCATION:
- Immutable. Keys and values unchanged.

SUMMARY:
- Modify only the string, never the key.

SKILLS:
- Reorder values only, keys and categories immutable.

EXPERIENCE & PROJECTS:
- Preserve all object fields.
- Only rewrite string bullets.
- Never remove experience entries or project entries.
- Never change role, company, duration, technologies, or stacks.

BULLET CONSOLIDATION & SELECTION (MANDATORY):

- responsibilitiesAndAchievements must contain at most 7 bullets.
- Perform semantic MERGING, not deletion.
- Every original metric, technology, and guarantee must survive in the merged bullets.
- No factual loss, only compression.

OUTPUT (STRICT):

Return ONLY valid JSON.
The returned JSON must be schema-identical to rewrittenResume.
No added keys. No removed keys. No renamed keys. No structural drift.

FINAL SELF-CHECK BEFORE OUTPUT:
- Are all keys identical to input?
- Are all nested structures identical?
- Were only allowed string fields modified?
- Are bullets ≤ 7 and semantically merged, not dropped?
- Is every claim strictly supported by original facts?

If any check fails, revert and correct before returning.
`;



// Main execution with error handling
export const executeResumeOptimization = async (resume, jobDescription) => {
  try {
    // Validate inputs
    if (!resume || !jobDescription || jobDescription.trim().length < 50) {
      throw new Error("Invalid input: Resume or job description is missing or too short");
    }

    // Run the full pipeline
    const result = await optimizeResumePipeline(resume, jobDescription);

    // Log the outcome
    console.log(`Optimization complete. Refinement applied: ${result.refinementApplied}`);
    if (result.analysis) {
      // console.log(`Fit score: ${result.analysis.overallFitScore}/10`);
      // console.log(`Required changes: ${result.analysis.requiredChanges?.length || 0}`);
    }

    return result;

  } catch (error) {
    console.error("Resume optimization failed:", error);

    // Attempt fallback: Just do Phase 1
    try {
      const phase1Only = await phase1RewriteResume(resume, jobDescription);
      return {
        finalResume: phase1Only,
        analysis: null,
        refinementApplied: false,
        error: error.message,
        fallbackUsed: true
      };
    } catch (fallbackError) {
      // Last resort: Return original
      console.error("Fallback also failed. Returning original resume.");
      return {
        finalResume: resume,
        analysis: null,
        refinementApplied: false,
        error: `${error.message}, ${fallbackError.message}`,
        fallbackUsed: true,
        originalReturned: true
      };
    }
  }
};

// ================================================
// USAGE EXAMPLE
// ================================================

/*
Example usage:

const originalResume = { ... }; // Your resume JSON
const jobDescription = "Looking for a backend engineer with AWS, Node.js, and microservices experience...";

const result = await executeResumeOptimization(originalResume, jobDescription);

console.log("Final resume:", result.finalResume);
console.log("Analysis:", result.analysis);
console.log("Refinement applied:", result.refinementApplied);

// Different scenarios handled:
// 1. Strong resume → analysis says no refinement needed → returns phase1 with refinementApplied: false
// 2. Weak resume → analysis suggests changes → refinement applied → returns improved version
// 3. Error in phase2 → fallback to phase1 only
// 4. Complete failure → returns original resume
*/


// COVER_LETTER_PROMPT

// export const generateCoverLetterPrompt = (resume, jobDescription) => {
//   return `
// You are a professional career coach and expert copywriter. Write a compelling cover letter for the following candidate applying for the detailed job.

// CANDIDATE RESUME:
// ${JSON.stringify(resume, null, 2)}

// JOB DESCRIPTION:
// ${jobDescription}

// INSTRUCTIONS:
// - Tone: Professional, confident, yet humble and enthusiastic.
// - Structure:
//     1. Hook: Mention the specific role and why you are interested (connect to company mission if visible, otherwise focus on the tech/domain).
//     2. Body Paragraph 1 (Experience): Highlight the most relevant experience from the resume that matches the JD's key requirements. Use metrics.
//     3. Body Paragraph 2 (Skills/Soft Skills): Mention key technical skills and soft skills (like leadership, collaboration) that fit the culture.
//     4. Conclusion: Reiterate interest and call to action (looking forward to interview).
// - formatting: Standard business letter format.
// - constraint: Keep it under 250 words. Do NOT include placeholders like "[Your Name]" -> use the name from the resume.

// Output ONLY the body of the email/cover letter text. Do not include specific headers like "From: ..." unless standard for a cover letter document (Date, Dear Hiring Manager, etc. are fine).
// `;
// };



export const generateCoverLetterPrompt = (resume, jobDescription) => `
ROLE:
You are a senior technical recruiter and startup founder who has reviewed thousands of applications.

OBJECTIVE:
Generate a concise, high-signal cover letter that immediately communicates technical fit, impact, and role alignment.
This is NOT a generic motivational letter. It should read like a strong engineer speaking to another engineer or founder.

INPUTS:

CANDIDATE RESUME (SOURCE OF TRUTH):
${JSON.stringify(resume, null, 2)}

JOB DESCRIPTION:
"""
${jobDescription}
"""

STYLE CONSTRAINTS:
- Length: 150–220 words (hard limit)
- Tone: Confident, precise, technically grounded, not salesy
- No fluff, no generic passion statements, no vague soft-skill claims
- No repetition of resume bullet points in paragraph form
- No exaggerated claims beyond resume evidence

STRUCTURE:

1. OPENING (1–2 sentences)
   - State the exact role.
   - Show understanding of the core technical problem or domain from the JD.
   - Briefly position the candidate as relevant to that problem.

2. TECHNICAL IMPACT (2–3 sentences)
   - Highlight ONE or TWO most relevant systems the candidate has built.
   - Include concrete technologies and at least one metric or scale signal.
   - Emphasize ownership, performance, reliability, or architecture.

3. ROLE ALIGNMENT (2–3 sentences)
   - Map key JD requirements to existing experience.
   - Use exact JD keywords only if supported by resume.
   - Show how the candidate’s current scope naturally fits this role.

4. CLOSE (1–2 sentences)
   - Express interest in discussing how the candidate can contribute.
   - Professional, direct, no desperation.

FORMATTING:
- Standard business letter.
- Must start with: "Dear Hiring Manager," or "Dear [Company] Team," if company name is inferable.
- Must use the candidate's real name from resume.
- No placeholders.

HARD CONSTRAINTS:
- Do not invent experience, scale, or domain knowledge.
- Do not mention tools or skills not in the resume.
- Do not use buzzwords without technical context.
- Do not exceed 220 words.

OUTPUT:
Return ONLY the final cover letter text. No explanations. No markdown.
`;


// export const generateSubjectLinePrompt = (resume, jobDescription) => {
//   return `
// You are an expert at cold emailing and job applications. Create 3 catchy, professional email subject lines for the following application.

// CANDIDATE: ${resume.header?.fullName || 'Candidate'}
// ROLE: (Extract from JD)

// JOB DESCRIPTION:
// ${jobDescription.substring(0, 500)}...

// INSTRUCTIONS:
// - The subject line should be professional but stand out.
// - Format ideas:
//     1. "Application for [Role] - [Name] - [Key Achievement/Skill]"
//     2. "[Role] Application: [Name], [2+ years] Exp [Tech Stack]"
//     3. "[Name] for [Role] | [Unique Value Prop]"
// - Return ONLY the single BEST subject line. Just one string. No quotes.
// `;
// };


export const generateSubjectLinePrompt = (resume, jobDescription) => {
  return `
ROLE:
You are a technical recruiter screening incoming applications.

OBJECTIVE:
Generate ONE high-signal, professional email subject line for this application.

SOURCE OF TRUTH:
- Candidate name and experience must come ONLY from the resume.
- Do NOT infer or upgrade seniority based on the job description.
- If experience is mentioned, it MUST be exactly "2+ years" (as per resume), never higher.

INPUTS:

CANDIDATE NAME:
${resume.header?.fullName || 'Candidate'}

CANDIDATE EXPERIENCE:
2+ years (fixed, do not alter)

JOB DESCRIPTION (for role title and tech relevance only):
${JSON.stringify(jobDescription.substring(0, 500))}

SUBJECT LINE RULES:
- Must include:
  - Exact role title (from JD)
  - Candidate name
- May include:
  - Key technology or domain from resume that matches JD
- Must NOT:
  - Invent or modify years of experience
  - Inflate seniority
  - Add metrics not present in resume
  - Use hype words (Rockstar, Ninja, Expert, etc.)

PREFERRED FORMATS:
1. Application for [Exact Role] – [Name] – [Key Tech]
2. [Exact Role] Application | [Name] | [Primary Stack]
3. [Name] for [Exact Role] (Years of Experience, [Key Skill])

OUTPUT:
Return ONLY the single BEST subject line.
No quotes. No extra text.
`;
};
