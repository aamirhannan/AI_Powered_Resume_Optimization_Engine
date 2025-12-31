import { getResumeByRole } from '../services/resumeLoader.js';
import { optimizeResume } from '../services/optimizer.js';

export const generateResume = async (req, res) => {
    try {
        const { role, jobDescription } = req.body;

        if (!role) {
            return res.status(400).json({ error: 'Role is required (frontend, backend, fullstack)' });
        }

        const baseResume = getResumeByRole(role);
        const optimizedResume = optimizeResume(baseResume, jobDescription);

        res.json({
            success: true,
            data: optimizedResume
        });
    } catch (error) {
        console.error('Error serving resume request:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal Server Error'
        });
    }
};
