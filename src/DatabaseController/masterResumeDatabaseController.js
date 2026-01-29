
export const fetchMasterResumes = async (client) => {
    const { data, error } = await client
        .from('master_resumes')
        .select('*');

    if (error) throw error;
    return data;
};

export const insertMasterResume = async (client, resumeData, userId) => {
    const { data, error } = await client
        .from('master_resumes')
        .insert({ ...resumeData, user_id: userId })
        .select()
        .single();

    if (error) throw error;
    return data;
};
