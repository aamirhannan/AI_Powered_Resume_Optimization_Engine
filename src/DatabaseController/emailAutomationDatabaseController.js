
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

export const countEmailsInTimeFrame = async (client, userId, startTime) => {
    const { count, error } = await client
        .from('email_automations')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', startTime.toISOString());


    if (error) throw error;
    return count;
};

export const fetchEmailAutomationById = async (client, id, userId) => {
    const { data, error } = await client
        .from('email_automations')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

    // We don't throw error here to allow controller to handle "not found" gracefully if data is null
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "The result contains 0 rows"
    return data;
};

export const resetEmailAutomationStatus = async (client, id) => {
    const { data, error } = await client
        .from('email_automations')
        .update({
            status: 'PENDING',
            error: null,
            updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
};