import { Step } from "../Step.js";

export class InsertNewlyCreatedResumePoints extends Step {
    constructor() {
        super('InsertNewlyCreatedResumePoints');
    }

    async execute(context) {
        const { rewrittenResume, resume } = context;
        if (!rewrittenResume) throw new Error('Resume is missing');

        // const { professionalSummary, projects, responsibilitiesAndAchievements, technicalSkills, technologies } = rewrittenResume;

        const finalResume = rewrittenResume;
        // finalResume.professionalSummary = professionalSummary;
        // finalResume.technicalSkills = technicalSkills;
        // finalResume.experience[0].responsibilitiesAndAchievements = responsibilitiesAndAchievements;
        // finalResume.experience[0].technologies = technologies;
        // finalResume.projects = projects;

        return {
            ...context,
            finalResume
        };
    }
}