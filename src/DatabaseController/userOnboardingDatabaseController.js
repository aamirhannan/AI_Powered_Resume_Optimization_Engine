
export const checkJobProfile = async (supabase, userId) => {
    const { data: jobProfiles, error } = await supabase
        .from('job_profiles')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

    if (error) throw error;
    return jobProfiles && jobProfiles.length > 0;
};

export const checkUserIntegration = async (supabase, userId) => {
    const { data: integrations, error } = await supabase
        .from('user_integrations')
        .select('id')
        .eq('user_id', userId)
        .limit(1);

    if (error) throw error;
    return integrations && integrations.length > 0;
};

export const deleteIntegrationByUserId = async (supabase, userId) => {
    const { error } = await supabase
        .from('user_integrations')
        .delete()
        .eq('user_id', userId);

    if (error) throw error;
};