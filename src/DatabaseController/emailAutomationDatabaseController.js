
export const fetchEmailAutomations = async (client) => {
    const { data, error } = await client
        .from('email_automations')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};

export const insertEmailAutomation = async (client, automationData, userId) => {
    const { data, error } = await client
        .from('email_automations')
        .insert({ ...automationData, user_id: userId })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const checkDuplicateEmailWithInTimeFrame = async (client, automationData) => {
    const { data, error } = await client
        .from('email_automations')
        .select('*')
        .eq('target_email', automationData.target_email)
        .eq('role', automationData.role)
        .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (error) throw error;
    return data;
};

export const updateEmailAutomation = async (client, automationData, userId, id) => {
    const { data, error } = await client
        .from('email_automations')
        .update({ ...automationData, user_id: userId })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};