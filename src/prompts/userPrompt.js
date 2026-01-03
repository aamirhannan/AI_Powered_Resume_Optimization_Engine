export const rewriteResumePrompt = ({
  header = {},
  professionalSummary = "",
  education = {},
  technicalSkills = {},
  experience = [],
  projects = [],
  jobDescription = ""
}) => {
  return `
You are a senior FAANG-level technical recruiter and a Staff Software Engineer who has reviewed thousands of resumes for Google, Meta, Amazon, Apple, Netflix, and top US/UK startups.

Your task is to REWRITE the existing resume data while PRESERVING ALL ORIGINAL FACTS, EXPERIENCE, AND TECHNOLOGIES. You will use Chain-of-Thought reasoning to analyze and rewrite each component.

CRITICAL: You must NOT add new technologies, experiences, or metrics. You must NOT remove any existing data. You are only reformatting, rewording, and emphasizing existing information with semantic alignment to the target role.

-----------------------------------
CHAIN-OF-THOUGHT REASONING PROCESS
-----------------------------------

You MUST follow these reasoning steps internally BEFORE generating output:

STEP 1: ANALYZE JOB DESCRIPTION
- Extract 5-7 key semantic themes from the job description
- Identify required vs. preferred qualifications
- Determine the seniority level and scope expectations

STEP 2: MAP EXISTING RESUME TO JOB THEMES
- For each theme from Step 1, identify matching points in the resume data
- Note implicit connections that can be surfaced
- Flag areas where job requirements aren't supported by existing data

STEP 3: SECTION-BY-SECTION REWRITE PLANNING
- Plan how to rewrite each section to highlight relevant themes
- Decide on reordering strategies for skills and technologies
- Identify which semantic keywords can be naturally integrated

STEP 4: DATA PRESERVATION VERIFICATION
- Cross-check each planned change against original data
- Ensure all original facts remain intact
- Verify no new content is being invented

-----------------------------------
EXISTING RESUME DATA (MUST PRESERVE)
-----------------------------------

HEADER SECTION (DO NOT MODIFY):
${JSON.stringify(header, null, 2)}

PROFESSIONAL SUMMARY (Rewrite with semantic alignment):
"""
${professionalSummary}
"""

EDUCATION SECTION (DO NOT MODIFY):
${JSON.stringify(education, null, 2)}

TECHNICAL SKILLS (Reorder within categories):
${JSON.stringify(technicalSkills, null, 2)}

EXPERIENCE SECTION (Rewrite responsibilities only):
${JSON.stringify(experience, null, 2)}

PROJECTS SECTION (Rewrite descriptions only):
${JSON.stringify(projects, null, 2)}

-----------------------------------
TARGET JOB DESCRIPTION
-----------------------------------

"""
${jobDescription}
"""

-----------------------------------
SECTION-BY-SECTION REWRITING INSTRUCTIONS
-----------------------------------

1. HEADER SECTION (NO CHANGES)
- Return the exact same object structure
- Example: {"fullName": "Aamir Hannan", "contact": {...}}

2. PROFESSIONAL SUMMARY
- Rewrite to be 3-4 sentences max
- Start with strongest credential relevant to job description
- Incorporate 2-3 key semantic terms from job description that match existing experience
- Use active voice and quantifiable achievements when possible
- Original example: "Backend Engineer with 2 years of experience..."
- Rewritten example: "Senior Backend Engineer specializing in high-throughput systems with 2 years of experience..."

3. EDUCATION SECTION (NO CHANGES)
- Return the exact same object structure
- Example: {"degree": "Bachelor of Technology...", "institution": "...", "duration": {...}}

4. TECHNICAL SKILLS SECTION
- PRESERVE ALL original categories and items
- Reorder items WITHIN EACH CATEGORY based on relevance to job description
- Group related technologies together for readability
- Example rewrite for "backend" category:
  Original: ["Node.js", "Express.js", "RESTful APIs", "GraphQL"]
  Job description emphasizes microservices and performance
  Rewritten: ["Node.js (performance-optimized)", "Express.js", "GraphQL (for complex data queries)", "RESTful APIs"]

5. EXPERIENCE SECTION
PRESERVE WITHOUT CHANGES:
- role, company, employmentType, location, duration (exact same values)

REWRITE responsibilitiesAndAchievements:
- Convert to impact-first format: "Achieved [metric] by [action] using [technology], resulting in [impact]"
- Use semantic keywords from job description when describing existing work
- Preserve ALL original metrics (70%, 50%, 35%, etc.)
- Preserve ALL original technologies mentioned
- Combine related bullets if they address the same job requirement
- Original example: "Developed and optimized RESTful APIs using Node.js and Express, reducing average response time by 70%..."
- Rewritten example: "Engineered high-performance RESTful APIs with Node.js and Express, achieving 70% response time reduction (1.3s to 400ms) through query optimization and caching strategies..."

REORDER technologies array:
- Reorder based on relevance to job description
- Keep all original technologies

6. PROJECTS SECTION
PRESERVE WITHOUT CHANGES:
- title, links (exact same values)

REWRITE description array:
- Structure each point as: "Built/Engineered [what] to solve [problem], achieving [result] using [technologies]"
- Highlight aspects relevant to job description
- Preserve all original technologies and achievements
- Original example: "Built a scalable e-commerce platform using React.js for the frontend..."
- Rewritten example: "Architected a production-grade e-commerce platform implementing microservices with Node.js backend and React.js frontend, achieving 35% performance improvement through GraphQL optimization and Redis caching..."

REORDER technologyStack array:
- Reorder based on relevance to job description
- Keep all original technologies

-----------------------------------
STRICT CONSTRAINTS
-----------------------------------

PRESERVATION RULES:
1. All original header data must remain unchanged
2. All original education data must remain unchanged
3. All original technologies across all sections must remain
4. All original metrics must remain (do not add or modify numbers)
5. All original roles, companies, and timelines must remain
6. No new skills, tools, or frameworks can be added

REWRITING RULES:
1. Only change text in: professionalSummary, responsibilitiesAndAchievements, project descriptions
2. Only reorder within: technicalSkills arrays, technologies arrays, technologyStack arrays
3. Use job description vocabulary only when it accurately describes existing work
4. Do not change the structure or keys of any JSON objects
5. Do not combine sections or change section order

-----------------------------------
OUTPUT FORMAT SPECIFICATION
-----------------------------------

You MUST return ONLY a JSON object with the following EXACT structure and keys:

{
  "header": {
    "fullName": "Aamir Hannan",
    "contact": {
      "phone": "+91 9555398835",
      "location": "Bangalore, India",
      "email": "aamirhannansde@gmail.com",
      "links": {
        "linkedin": "LinkedIn",
        "leetcode": "LeetCode",
        "github": "GitHub"
      }
    }
  },
  "professionalSummary": "Rewritten 3-4 sentence summary here...",
  "education": {
    "degree": "Bachelor of Technology (B-Tech)",
    "institution": "Institute of Engineering and Management",
    "duration": {
      "start": "Jul 2019",
      "end": "Jun 2023"
    }
  },
  "technicalSkills": {
    "programmingLanguages": ["JavaScript", "TypeScript"],
    "backend": ["Node.js", "Express.js", "RESTful APIs", "GraphQL"],
    "databases": ["PostgreSQL", "MySQL", "MongoDB", "Redis"],
    "devOpsAndTools": ["Docker", "AWS ECS", "Git", "Jest", "Postman"],
    "middlewareAndServices": ["Redis", "RabbitMQ", "BullMQ", "JWT Authentication", "OAuth"],
    "architecture": ["Microservices", "Event-Driven Architecture", "Asynchronous Processing", "Cloud-Native Systems"]
  },
  "experience": [
    {
      "role": "Software Developer",
      "company": "Llumo AI",
      "employmentType": "Full-time",
      "location": "Remote",
      "duration": {
        "start": "Feb 2024",
        "end": "Present"
      },
      "responsibilitiesAndAchievements": [
        "Rewritten impact-first bullet 1...",
        "Rewritten impact-first bullet 2...",
        "Rewritten impact-first bullet 3..."
      ],
      "technologies": ["Node.js", "Express.js", "Redis", "RabbitMQ", "BullMQ", "Docker", "AWS ECS", "JWT", "OAuth", "Jest", "Postman"]
    }
  ],
  "projects": [
    {
      "title": "E-Commerce Platform with Microservices Architecture",
      "links": {
        "live": "Live Link"
      },
      "description": [
        "Rewritten project point 1...",
        "Rewritten project point 2..."
      ],
      "technologyStack": ["Node.js", "React.js", "GraphQL", "Redux", "Redis", "RabbitMQ", "Tailwind CSS", "CSS-in-JS"]
    }
  ]
}

-----------------------------------
FINAL QUALITY CHECKS
-----------------------------------

Before outputting the JSON, verify EACH of these:

1. HEADER: Is identical to input
2. EDUCATION: Is identical to input
3. TECHNICAL SKILLS: Contains all original items, just reordered
4. EXPERIENCE: 
   - All role/company/duration data unchanged
   - All original metrics preserved
   - All original technologies present
   - Bullets rewritten in impact-first format
5. PROJECTS:
   - All titles and links unchanged
   - All original technologies present
   - Descriptions rewritten to highlight job-relevant aspects
6. PROFESSIONAL SUMMARY: 3-4 sentences, incorporates job-relevant keywords

Think step by step internally using the Chain-of-Thought process, then output ONLY the complete JSON object with all sections. No additional text, no markdown, no explanations.
`;
};

// Main orchestration function
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

export const GenerateCriticalAnalysisPrompt = async (rewrittenResume, jobDescription) => {
  const prompt = `
You are a senior hiring manager with 15+ years of experience. Your task is to provide a brutally honest, critical analysis of a rewritten resume against a specific job description.

CRITICAL GUIDANCE: Be honest. If the resume is already excellent and needs no changes, say so. Your job is to identify REAL gaps, not invent them.

-----------------------------------
INPUT DATA
-----------------------------------

JOB DESCRIPTION:
"""
${jobDescription}
"""

REWRITTEN RESUME (Phase 1 Output):
${JSON.stringify(rewrittenResume, null, 2)}

-----------------------------------
ANALYSIS FRAMEWORK
-----------------------------------

Analyze these specific areas:

1. FIT ASSESSMENT (0-10 scale)
   - How well does the resume match the job requirements?
   - Are there major gaps in required skills?

2. STRENGTHS (What's already working well)
   - List 3-5 specific strengths that should NOT be changed
   - Be specific about which sections/bullets are strong

3. WEAKNESSES & GAPS (Be specific, not general)
   - Identify actual missing skills from the job description
   - Point out weak phrasing or missed opportunities
   - Highlight areas where the resume could better align

4. REQUIRED CHANGES vs. OPTIONAL ENHANCEMENTS
   - Distinguish between "must fix" and "nice to have"
   - Some gaps might be OK if the overall fit is good

5. OVERALL RECOMMENDATION
   - Should this resume undergo refinement?
   - If no major issues exist, recommend skipping refinement

-----------------------------------
OUTPUT FORMAT (CRITICAL - MUST FOLLOW)
-----------------------------------

Return a JSON object with EXACTLY this structure:

{
  "overallFitScore": 0-10,
  "requiresRefinement": true/false,
  "strengths": [
    {
      "section": "professionalSummary/experience/etc",
      "element": "Specific phrase or bullet",
      "reason": "Why this is strong and should be preserved"
    }
  ],
  "requiredChanges": [
    {
      "section": "professionalSummary/technicalSkills/experience/projects",
      "element": "Specific text that needs change",
      "issue": "What's wrong with it",
      "suggestion": "How to improve it WITHOUT inventing new facts",
      "priority": "critical/high/medium/low"
    }
  ],
  "optionalEnhancements": [
    {
      "section": "...",
      "suggestion": "Nice-to-have improvement",
      "reason": "Why this would help but isn't essential"
    }
  ],
  "summary": "Brief 2-3 sentence summary of your assessment"
}

-----------------------------------
SPECIFIC SCORING GUIDELINES
-----------------------------------

requiresRefinement = true IF ANY OF THESE ARE TRUE:
1. OverallFitScore < 7
2. There are "critical" or "high" priority required changes
3. Major required skills from job description are missing
4. Professional summary doesn't target the right role

requiresRefinement = false IF:
1. OverallFitScore >= 8
2. Only minor phrasing improvements needed
3. Resume already demonstrates strong alignment
4. Any gaps are acceptable given the candidate's profile

-----------------------------------
EXAMPLES OF DIFFERENT SCENARIOS
-----------------------------------

SCENARIO 1: Strong Resume (no refinement needed)
{
  "overallFitScore": 9,
  "requiresRefinement": false,
  "strengths": [...],
  "requiredChanges": [],
  "optionalEnhancements": [...],
  "summary": "Excellent alignment with job requirements. The resume already demonstrates all key skills with strong metrics. Only minor optional enhancements available."
}

SCENARIO 2: Moderate Issues (refinement needed)
{
  "overallFitScore": 6,
  "requiresRefinement": true,
  "strengths": [...],
  "requiredChanges": [
    {
      "section": "professionalSummary",
      "element": "Current summary doesn't mention cloud experience",
      "issue": "Job requires AWS but summary doesn't highlight it",
      "suggestion": "Rephrase to emphasize AWS experience already mentioned in experience section",
      "priority": "high"
    }
  ],
  "summary": "Good foundation but needs better alignment in key areas."
}

-----------------------------------
CONSTRAINTS FOR ANALYSIS
-----------------------------------

1. Be honest - if the resume is already great, say so
2. Never invent gaps just to have something to say
3. Only suggest changes that use existing facts
4. Consider the candidate's actual experience level
5. Respect that 2 years experience ≠ 10 years experience

Analyze carefully. If it's good, it's good. Don't force refinement.
`;
  return prompt;
};

// ================================================
// PHASE 3: EVIDENCE-BASED REFINEMENT PROMPT
// ================================================

export const EvidenceBasedRefinementPrompt = async (
  rewrittenResume,
  jobDescription,
  criticalAnalysis
) => {
  const prompt = `
You are a senior technical editor for FAANG resumes. Your task is to refine a resume based on specific, actionable feedback.

IMPORTANT: You have received a critical analysis that MAY recommend changes. 
BUT: You must apply CRITICAL THINKING to determine if each suggestion is valid and implementable.

-----------------------------------
INPUT DATA
-----------------------------------

1. JOB DESCRIPTION:
"""
${jobDescription}
"""

2. REWRITTEN RESUME (Phase 1):
${JSON.stringify(rewrittenResume, null, 2)}

3. CRITICAL ANALYSIS (Phase 2):
${JSON.stringify(criticalAnalysis, null, 2)}

-----------------------------------
REFINEMENT DECISION FRAMEWORK
-----------------------------------

Before making ANY changes, evaluate EACH suggestion in the analysis:

STEP 1: VALIDATE EACH REQUIRED CHANGE
For each item in "requiredChanges", ask:
- Is this change actually needed? (Be critical of the analysis)
- Does the suggested improvement use ONLY existing facts?
- Would this change make the resume more truthful and accurate?
- Is the priority justified?

STEP 2: IMPLEMENTATION FEASIBILITY
For each valid change:
- How can this be implemented without inventing facts?
- Which existing facts support this change?
- What's the minimal change needed?

STEP 3: PRESERVATION CHECK
After planning changes, verify:
- All original facts remain intact
- No new technologies or experiences added
- All original metrics preserved exactly

-----------------------------------
DECISION-MAKING RULES
-----------------------------------

REJECT a suggestion if:
1. It would require inventing new facts
2. It's based on a misunderstanding of the original resume
3. The suggested change would make the resume less truthful
4. The "issue" isn't actually a problem given the role

ACCEPT a suggestion if:
1. It uses only existing facts from the resume
2. It genuinely improves alignment with the job
3. It makes implicit skills explicit (when supported)
4. It fixes weak phrasing without changing meaning

-----------------------------------
REFINEMENT IMPLEMENTATION STRATEGY
-----------------------------------

IF analysis.requiresRefinement === false:
  → Make only MINOR optional enhancements (if any)
  → Focus on polishing, not restructuring

IF analysis.requiresRefinement === true:
  → Address HIGH and CRITICAL priority items first
  → Implement MEDIUM priority only if they're clearly beneficial
  → Consider LOW priority as optional

FOR EACH SECTION:

1. HEADER & EDUCATION: No changes allowed

2. PROFESSIONAL SUMMARY:
   - Only change if analysis identifies specific issues
   - Keep to 3-4 sentences
   - Use stronger language if suggested

3. TECHNICAL SKILLS:
   - Reorder within categories based on job relevance
   - DO NOT add or remove skills
   - Group similar technologies if it improves readability

4. EXPERIENCE:
   - Rewrite bullets to be impact-first when suggested
   - Use stronger verbs (Engineered, Architected, etc.)
   - Preserve ALL original metrics and technologies
   - Only combine bullets if it improves clarity

5. PROJECTS:
   - Reframe to highlight job-relevant aspects
   - Use problem-action-result structure
   - Keep all original technologies and achievements

-----------------------------------
OUTPUT FORMAT
-----------------------------------

Return ONLY the refined resume in this EXACT JSON format:

{
  "header": { ... },
  "professionalSummary": "...",
  "education": { ... },
  "technicalSkills": { ... },
  "experience": [ ... ],
  "projects": [ ... ]
}

IMPORTANT: If you determine NO changes are needed after evaluating the analysis, return the original rewrittenResume with minimal or no changes.

-----------------------------------
QUALITY CHECKLIST (BEFORE OUTPUT)
-----------------------------------

✅ All original facts preserved
✅ No new technologies added
✅ Metrics unchanged
✅ Changes are minimal and justified
✅ Resume is more aligned but still truthful
✅ JSON structure identical to input

Think critically about the analysis. Be willing to reject poor suggestions. Your goal is truthfulness first, optimization second.
`;

  // const refinedResume = await callLLM(prompt);
  // return JSON.parse(refinedResume);

  return prompt;
};

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
      console.log(`Fit score: ${result.analysis.overallFitScore}/10`);
      console.log(`Required changes: ${result.analysis.requiredChanges?.length || 0}`);
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