
/**
 * Optimizes the resume by prioritizing skills that match the Job Description.
 */
import { Resume } from '#models/Resume';

export const optimizeResume = (resume: Resume, jobDescription: string): Resume => {
    if (!jobDescription) return resume;

    // Deep copy to avoid mutating original
    const optimizedSession: Resume = JSON.parse(JSON.stringify(resume));
    const jdText = jobDescription.toLowerCase();

    // Helper to check if skill matches JD
    const isMatch = (skill: string): boolean => {
        const skillLower = skill.toLowerCase();
        return jdText.includes(skillLower);
    };

    // Optimize Technical Skills
    if (optimizedSession.technicalSkills) {
        Object.keys(optimizedSession.technicalSkills).forEach(category => {
            const skills = optimizedSession.technicalSkills[category];
            if (Array.isArray(skills)) {
                const matched: string[] = [];
                const others: string[] = [];

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
