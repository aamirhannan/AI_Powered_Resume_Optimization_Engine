
export const fetchAllJobProfiles = async (client) => {
    const { data, error } = await client
        .from('job_profiles')
        .select('id, profile_type, full_name, professional_summary, created_at, updated_at')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

export const fetchJobProfileById = async (client, id) => {
    const { data, error } = await client
        .from('job_profiles')
        .select('*')
        .eq('id', id)
        .single();

    if (error) throw error;
    return data;
};

export const insertJobProfile = async (client, profileData, userId) => {
    const { data, error } = await client
        .from('job_profiles')
        .insert({ ...profileData, user_id: userId })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const updateJobProfile = async (client, profileData, id) => {
    const { data, error } = await client
        .from('job_profiles')
        .update({ ...profileData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const deleteJobProfile = async (client, id) => {
    const { data, error } = await client
        .from('job_profiles')
        .delete()
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const fetchJobProfileDropdown = async (client) => {
    const { data, error } = await client
        .from('job_profiles')
        .select('id, profile_type')
        .order('profile_type', { ascending: true });

    if (error) throw error;
    return data;
};

export const checkDuplicateProfileType = async (client, profileType, userId, excludeId = null) => {
    let query = client
        .from('job_profiles')
        .select('id')
        .eq('profile_type', profileType)
        .eq('user_id', userId);

    if (excludeId) {
        query = query.neq('id', excludeId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data && data.length > 0;
};
