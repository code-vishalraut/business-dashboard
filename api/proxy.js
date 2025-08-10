// /api/proxy.js (with enhanced logging)
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { action } = req.body;
        console.log(`[PROXY LOG] Received action: ${action}`);

        // Log the environment variables to check if they are loaded correctly
        const supabaseUrl = process.env.SUPABASE_URL;
        const serviceKey = process.env.SUPABASE_SERVICE_KEY;

        if (!supabaseUrl || !serviceKey) {
            console.error('[PROXY LOG] CRITICAL ERROR: Supabase URL or Service Key is MISSING from Vercel environment variables.');
            return res.status(500).json({ error: 'Server configuration error: Keys not found.' });
        }

        console.log(`[PROXY LOG] Supabase URL loaded: ${supabaseUrl}`);
        console.log(`[PROXY LOG] Service Key loaded. Length: ${serviceKey.length}. Starts with: ${serviceKey.substring(0, 3)}...`);

        // Initialize Supabase client
        const supabase = createClient(supabaseUrl, serviceKey);

        // Check for Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            console.log('[PROXY LOG] Auth token missing from request headers.');
            return res.status(401).json({ error: 'Authorization token not provided' });
        }

        const token = authHeader.split(' ')[1];
        console.log('[PROXY LOG] Token received. Attempting to validate with Supabase...');

        // Validate the token
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);

        // If validation fails, log the SPECIFIC error from Supabase
        if (userError || !user) {
            console.error('[PROXY LOG] TOKEN VALIDATION FAILED. The specific error from Supabase is:', userError);
            return res.status(401).json({ error: `Token Validation Failed. Supabase says: ${userError.message}` });
        }

        console.log(`[PROXY LOG] Token validated successfully for user: ${user.email}`);
        const userId = user.id;

        // --- The rest of your function logic ---
        let data, error;
        const { payload } = req.body;

        switch (action) {
            case 'fetchAll':
                const [transactions, expenses, debtors, creditors, transfers, banks] = await Promise.all([
                    supabase.from('transactions').select('*').eq('user_id', userId),
                    supabase.from('expenses').select('*').eq('user_id', userId),
                    supabase.from('debtors').select('*').eq('user_id', userId),
                    supabase.from('creditors').select('*').eq('user_id', userId),
                    supabase.from('transfers').select('*').eq('user_id', userId),
                    supabase.from('banks').select('*').eq('user_id', userId),
                ]);

                const errors = [transactions.error, expenses.error, debtors.error, creditors.error, transfers.error, banks.error].filter(Boolean);
                if (errors.length > 0) {
                    const combinedError = errors.map(e => e.message).join('; ');
                    console.error('[PROXY LOG] Error fetching data:', combinedError);
                    return res.status(500).json({ error: `Fetch error: ${combinedError}` });
                }

                return res.status(200).json({
                    transactions: transactions.data,
                    expenses: expenses.data,
                    debtors: debtors.data,
                    creditors: creditors.data,
                    transfers: transfers.data,
                    banks: banks.data,
                });

            // Other cases...
            default:
                return res.status(400).json({ error: 'Invalid action' });
        }

    } catch (e) {
        console.error('[PROXY LOG] UNEXPECTED FATAL ERROR in catch block:', e);
        return res.status(500).json({ error: 'A fatal server error occurred.' });
    }
}