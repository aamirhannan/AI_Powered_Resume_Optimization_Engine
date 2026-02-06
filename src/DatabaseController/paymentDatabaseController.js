
export const createPaymentRecord = async (client, paymentData) => {
    // Mapping internal payment record to 'user_purchases' schema
    const purchaseData = {
        user_id: paymentData.user_id,
        plan_tier: 'PRO_TIER',
        amount: paymentData.amount / 100, // Convert paise to major unit
        currency: paymentData.currency,
        payment_provider: 'razorpay',
        order_id: paymentData.razorpay_order_id,
        status: paymentData.status.toUpperCase(), // 'created' -> 'PENDING'
        created_at: paymentData.created_at
    };

    if (purchaseData.status === 'CREATED') purchaseData.status = 'PENDING';

    const { data, error } = await client
        .from('user_purchases')
        .insert(purchaseData)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const getPaymentByOrderId = async (client, orderId) => {
    const { data, error } = await client
        .from('user_purchases')
        .select('*')
        .eq('order_id', orderId)
        .single();
    if (error) throw error;
    return data;
};

// Gets the absolute latest expiry date for a user across all their purchases
export const getLatestUserExpiry = async (client, userId) => {
    const { data, error } = await client
        .from('user_purchases')
        .select('valid_until')
        .eq('user_id', userId)
        .eq('status', 'SUCCESS')
        .order('valid_until', { ascending: false })
        .limit(1)
        .maybeSingle(); // maybeSingle returns null if no rows found, instead of throwing error

    if (error) throw error;
    return data?.valid_until; // Returns a Date string or undefined
};

export const updatePaymentStatus = async (client, orderId, updateData, newValidUntil) => {
    const purchaseUpdate = {
        status: updateData.status.toUpperCase(),
        updated_at: updateData.updated_at
    };

    if (purchaseUpdate.status === 'SUCCESS') {
        purchaseUpdate.transaction_id = updateData.razorpay_payment_id;
        // The signature is logged in controller if needed, but not in table
        if (newValidUntil) {
            purchaseUpdate.valid_until = newValidUntil;
        }
    }

    const { data, error } = await client
        .from('user_purchases')
        .update(purchaseUpdate)
        .eq('order_id', orderId)
        .select()
        .single();
    if (error) throw error;
    return data;
};

export const getUserPurchases = async (client, userId) => {
    const { data, error } = await client
        .from('user_purchases')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
};
