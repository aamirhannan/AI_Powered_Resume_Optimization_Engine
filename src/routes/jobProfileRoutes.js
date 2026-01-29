import express from 'express';
import {
    getAllJobProfiles,
    getJobProfileById,
    createJobProfile,
    updateJobProfile,
    deleteJobProfile,
    getJobProfileDropdown
} from '../controllers/jobProfileController.js';

const router = express.Router();

// GET /job-profile/get-all - Returns JobProfileCard[]
router.get('/get-all', getAllJobProfiles);

// GET /job-profile/dropdown - Returns {id, profileType}[] for dropdowns
router.get('/dropdown', getJobProfileDropdown);

// GET /job-profile/:id - Returns full JobProfile
router.get('/:id', getJobProfileById);

// POST /job-profile/create - Creates new profile
router.post('/create', createJobProfile);

// PUT /job-profile/:id - Updates profile
router.put('/:id', updateJobProfile);

// DELETE /job-profile/:id - Deletes profile
router.delete('/:id', deleteJobProfile);

export default router;
