
export const linkTelegramUser = async (client, userId, chatId) => {
    const { data, error } = await client
        .from('telegram_users')
        .upsert({ user_id: userId, telegram_chat_id: chatId, is_active: true }, { onConflict: 'user_id' })
        .select()
        .single();

    if (error) throw error;
    return data;
};

export const getUserIdByChatId = async (client, chatId) => {
    const { data, error } = await client
        .from('telegram_users')
        .select('user_id')
        .eq('telegram_chat_id', chatId)
        .eq('is_active', true)
        .single();

    if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
    }
    return data?.user_id;
};

export const deleteTelegramUser = async (client, chatId) => {
    const { error } = await client
        .from('telegram_users')
        .delete()
        .eq('telegram_chat_id', chatId);

    if (error) throw error;
};
