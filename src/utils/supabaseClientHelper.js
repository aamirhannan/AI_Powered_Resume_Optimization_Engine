
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY; // This is the public/anon key usually, or service key logic (careful)

/**
 * Creates a valid Supabase client for the specific user request.
 * This ensures RLS policies are applied correctly for the user.
 * @param {string} token - The Bearer token from the request
 */
export const getAuthenticatedClient = (token) => {
    return createClient(supabaseUrl, supabaseKey, {
        global: {
            headers: {
                Authorization: `Bearer ${token}`
            }
        }
    });
};
