import { frontend } from '#src/data/resumes/frontend';
import { backend } from '#src/data/resumes/backend';
import { fullStack } from '#src/data/resumes/fullStack';
import { softwareEngineer } from '#src/data/resumes/softwareEngineer';
import { Resume } from '#models/Resume';

export const getResumeByRole = (role: string): Resume => {
    const normalizedRole = role.toLowerCase().replace('-', '').replace(' ', '');
    switch (normalizedRole) {
        case 'frontend':
            return frontend;
        case 'backend':
            return backend;
        case 'fullstack':
            return fullStack;
        case 'softwareengineer':
            return softwareEngineer;
        default:
            return softwareEngineer;
    }
};
