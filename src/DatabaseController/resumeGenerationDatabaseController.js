
export const fetchResumeGenerations = async (client) => {
    const { data, error } = await client
        .from('resume_generations')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

export const createResumeGeneration = async (client, generationData, userId) => {
    const { data, error } = await client
        .from('resume_generations')
        .insert({ ...generationData, user_id: userId })
        .select()
        .single()

    if (error) throw error;
    return data;
};

export const updateResumeData = async (client, generationData, userId) => {
    const { id, ...updatePayload } = generationData;
    const { data, error } = await client
        .from('resume_generations')
        .update({ ...updatePayload, user_id: userId })
        .eq('id', id)
        .select()
        .single()

    if (error) throw error;
    return data;
};
