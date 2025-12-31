
/**
 * Optimizes the resume by prioritizing skills that match the Job Description.
 * @param {Object} resume - The base resume object.
 * @param {string} jobDescription - The job description text.
 * @returns {Object} - The optimized resume object.
 */
export const optimizeResume = (resume, jobDescription) => {
    if (!jobDescription) return resume;

    // Deep copy to avoid mutating original
    const optimizedSession = JSON.parse(JSON.stringify(resume));
    const jdText = jobDescription.toLowerCase();

    // Helper to check if skill matches JD
    // Matches if the skill name is found within the JD text
    const isMatch = (skill) => {
        const skillLower = skill.toLowerCase();
        // Simple inclusion check. 
        // Improvement: Regex for word boundaries, but many tech terms like .js or C# are tricky with boundaries.
        // We'll stick to inclusion but check for common boundaries if needed in future.
        return jdText.includes(skillLower);
    };

    // Optimize Technical Skills
    if (optimizedSession.technicalSkills) {
        Object.keys(optimizedSession.technicalSkills).forEach(category => {
            const skills = optimizedSession.technicalSkills[category];
            if (Array.isArray(skills)) {
                const matched = [];
                const others = [];

                skills.forEach(skill => {
                    if (isMatch(skill)) {
                        matched.push(skill);
                    } else {
                        others.push(skill);
                    }
                });

                // Prioritize matched skills
                optimizedSession.technicalSkills[category] = [...matched, ...others];
            }
        });
    }

    return optimizedSession;
};
