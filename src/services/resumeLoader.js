import { frontend } from '../data/resumes/frontend.js';
import { backend } from '../data/resumes/backend.js';
import { fullStack } from '../data/resumes/fullStack.js';

export const getResumeByRole = (role) => {
    const normalizedRole = role.toLowerCase().replace('-', '').replace(' ', '');
    switch (normalizedRole) {
        case 'frontend':
            return frontend;
        case 'backend':
            return backend;
        case 'fullstack':
            return fullStack;
        default:
            throw new Error(`Role '${role}' not found. Available roles: frontend, backend, fullstack`);
    }
};
