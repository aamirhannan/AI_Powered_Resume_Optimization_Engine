import { getAuthenticatedClient } from '../utils/supabaseClientHelper.js';
import * as dbController from '../DatabaseController/jobProfileDatabaseController.js';
import { camelToSnake, snakeToCamel } from './utils.js';

/**
 * GET /job-profile/get-all
 * Returns JobProfileCard[] - lightweight list for display
 */
export const getAllJobProfiles = async (req, res) => {
    try {
        const supabase = getAuthenticatedClient(req.accessToken);
        const data = await dbController.fetchAllJobProfiles(supabase);
        const response = data.map(item => snakeToCamel(item));
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * GET /job-profile/:id
 * Returns full JobProfile with all nested data
 */
export const getJobProfileById = async (req, res) => {
    try {
        const supabase = getAuthenticatedClient(req.accessToken);
        const { id } = req.params;
        const data = await dbController.fetchJobProfileById(supabase, id);
        const response = snakeToCamel(data);
        res.status(200).json(response);
    } catch (error) {
        if (error.code === 'PGRST116') {
            return res.status(404).json({ error: 'Job profile not found' });
        }
        res.status(500).json({ error: error.message });
    }
};

/**
 * POST /job-profile/create
 * Creates a new job profile
 * Expected body structure matches fullStack.js format
 */
export const createJobProfile = async (req, res) => {
    try {
        const supabase = getAuthenticatedClient(req.accessToken);
        const body = req.body;

        // Transform from fullStack.js format to database format
        const dbPayload = transformToDbFormat(body);
        const snakeCasePayload = camelToSnake(dbPayload);

        // Check for duplicate profile type
        const isDuplicate = await dbController.checkDuplicateProfileType(
            supabase,
            snakeCasePayload.profile_type,
            req.user.id
        );

        if (isDuplicate) {
            return res.status(409).json({
                error: `A profile with type '${body.profileName || body.profileType}' already exists. Please use a different profile type or update the existing one.`
            });
        }

        const data = await dbController.insertJobProfile(supabase, snakeCasePayload, req.user.id);
        const response = snakeToCamel(data);
        res.status(201).json(response);
    } catch (error) {
        console.error('Error creating job profile:', error);
        res.status(500).json({ error: error.message });
    }
};

/**
 * PUT /job-profile/:id
 * Updates an existing job profile
 */
export const updateJobProfile = async (req, res) => {
    try {
        const supabase = getAuthenticatedClient(req.accessToken);
        const { id } = req.params;
        const body = req.body;

        // Transform from fullStack.js format to database format
        const dbPayload = transformToDbFormat(body);
        const snakeCasePayload = camelToSnake(dbPayload);

        // Check for duplicate profile type (excluding current profile)
        if (snakeCasePayload.profile_type) {
            const isDuplicate = await dbController.checkDuplicateProfileType(
                supabase,
                snakeCasePayload.profile_type,
                req.user.id,
                id
            );

            if (isDuplicate) {
                return res.status(409).json({
                    error: `A profile with type '${body.profileName || body.profileType}' already exists.`
                });
            }
        }

        const data = await dbController.updateJobProfile(supabase, snakeCasePayload, id);
        const response = snakeToCamel(data);
        res.status(200).json(response);
    } catch (error) {
        if (error.code === 'PGRST116') {
            return res.status(404).json({ error: 'Job profile not found' });
        }
        res.status(500).json({ error: error.message });
    }
};

/**
 * DELETE /job-profile/:id
 * Deletes a job profile
 */
export const deleteJobProfile = async (req, res) => {
    try {
        const supabase = getAuthenticatedClient(req.accessToken);
        const { id } = req.params;
        const data = await dbController.deleteJobProfile(supabase, id);
        const response = snakeToCamel(data);
        res.status(200).json({ message: 'Profile deleted successfully', data: response });
    } catch (error) {
        if (error.code === 'PGRST116') {
            return res.status(404).json({ error: 'Job profile not found' });
        }
        res.status(500).json({ error: error.message });
    }
};

/**
 * GET /job-profile/dropdown
 * Returns lightweight list for dropdowns: [{id, profileType}]
 */
export const getJobProfileDropdown = async (req, res) => {
    try {
        const supabase = getAuthenticatedClient(req.accessToken);
        const data = await dbController.fetchJobProfileDropdown(supabase);
        const response = data.map(item => ({
            id: item.id,
            profileType: item.profile_type
        }));
        res.status(200).json(response);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Transform from fullStack.js JSON format to flat database format
 * @param {Object} body - The request body in fullStack.js structure
 * @returns {Object} - Database-ready format
 */
const transformToDbFormat = (body) => {
    const {
        profileName,
        header,
        professionalSummary,
        education,
        technicalSkills,
        experience,
        projects
    } = body;

    return {
        profileType: profileName,
        fullName: header?.fullName || null,
        email: header?.contact?.email || null,
        phone: header?.contact?.phone || null,
        location: header?.contact?.location || null,
        professionalSummary: professionalSummary || null,
        links: header?.contact?.links || {},
        education: education || {},
        technicalSkills: technicalSkills || {},
        experience: experience || [],
        projects: projects || []
    };
};

/**
 * Transform from database format back to fullStack.js JSON format
 * Used when fetching a profile for editing
 * @param {Object} dbData - Data from database
 * @returns {Object} - fullStack.js structure
 */
export const transformToApiFormat = (dbData) => {
    return {
        profileType: dbData.profileType,
        header: {
            fullName: dbData.fullName,
            contact: {
                phone: dbData.phone,
                location: dbData.location,
                email: dbData.email,
                links: dbData.links || {}
            }
        },
        professionalSummary: dbData.professionalSummary,
        education: dbData.education || {},
        technicalSkills: dbData.technicalSkills || {},
        experience: dbData.experience || [],
        projects: dbData.projects || []
    };
};

export const checkProfileName = async (req, res) => {
    try {
        const supabase = getAuthenticatedClient(req.accessToken);
        const { profileName, excludeId } = req.body;
        const isDuplicate = await dbController.checkDuplicateProfileType(
            supabase,
            profileName,
            req.user.id,
            excludeId
        );
        res.status(200).json({ isDuplicate });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};