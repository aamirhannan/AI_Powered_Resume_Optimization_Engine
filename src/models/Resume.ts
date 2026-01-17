export interface Resume {
    header: {
        fullName: string;
        contact: {
            phone: string;
            location: string;
            email: string;
            links: {
                [key: string]: string;
            };
        };
    };
    professionalSummary: string;
    education: {
        degree: string;
        institution: string;
        duration: {
            start: string;
            end: string;
        };
    };
    technicalSkills: {
        [category: string]: string[];
    };
    experience: {
        role: string;
        company: string;
        employmentType: string;
        location: string;
        duration: {
            start: string;
            end: string;
        };
        responsibilitiesAndAchievements: string[];
        technologies: string[];
    }[];
    projects: {
        title: string;
        links: {
            [key: string]: string;
        };
        description: string[];
        technologyStack: string[];
    }[];
}
