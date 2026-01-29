
export const fetchFounderOutreaches = async (client) => {
    const { data, error } = await client
        .from('founder_outreaches')
        .select('*');

    if (error) throw error;
    return data;
};

export const insertFounderOutreach = async (client, outreachData, userId) => {
    const { data, error } = await client
        .from('founder_outreaches')
        .insert({ ...outreachData, user_id: userId })
        .select()
        .single();

    if (error) throw error;
    return data;
};
