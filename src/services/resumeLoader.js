import { frontend } from '../data/resumes/frontend.js';
import { backend } from '../data/resumes/backend.js';
import { fullStack } from '../data/resumes/fullStack.js';
import { softwareEngineer } from '../data/resumes/softwareEngineer.js';

export const getResumeByRole = (role) => {
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
            throw new Error(`Role '${role}' not found. Available roles: frontend, backend, fullstack`);
    }
};
