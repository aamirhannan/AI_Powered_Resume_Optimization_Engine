
export const fetchUserSettings = async (client) => {
    const { data, error } = await client
        .from('user_settings')
        .select('*')
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
};

export const upsertUserSettings = async (client, settings, userId) => {
    const { data, error } = await client
        .from('user_settings')
        .upsert({ ...settings, user_id: userId })
        .select()
        .single();

    if (error) throw error;
    return data;
};
