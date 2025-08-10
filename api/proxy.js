// /api/proxy.js

// This is a Vercel Serverless Function that acts as a secure proxy to Supabase.
// It uses the SERVICE_ROLE_KEY to bypass RLS for server-side operations,
// but it first authenticates the user's token from the browser.

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    // Disallow non-POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { action, payload } = req.body;

        // Securely initialize Supabase client on the server
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY, // Use the powerful service key here
        );

        // Get the user's token from the Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Authorization token not provided' });
        }
        const token = authHeader.split(' ')[1];

        // Verify the token and get the user
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        if (userError || !user) {
            return res.status(401).json({ error: 'Invalid or expired token' });
        }

        // This is the user's unique ID
        const userId = user.id;
        let data, error;

        // Handle different actions from the frontend
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

                // Check for errors in any of the fetches
                if (transactions.error || expenses.error || debtors.error || creditors.error || transfers.error || banks.error) {
                    // Combine error messages if any
                    const combinedError = [transactions.error, expenses.error, debtors.error, creditors.error, transfers.error, banks.error]
                        .filter(Boolean).map(e => e.message).join('; ');
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

            // Handle individual record creation/update/deletion
            case 'addOrUpdate':
                ({ data, error } = await supabase
                    .from(payload.table)
                    .upsert({ ...payload.data, user_id: userId }) // upsert handles both insert and update
                    .select()
                    .single());
                break;

            case 'delete':
                ({ error } = await supabase
                    .from(payload.table)
                    .delete()
                    .eq('user_id', userId) // Extra security check
                    .eq('id', payload.id));
                break;

            default:
                return res.status(400).json({ error: 'Invalid action' });
        }

        if (error) {
            console.error('Supabase Error:', error);
            return res.status(500).json({ error: error.message });
        }

        return res.status(200).json(data || { success: true });

    } catch (e) {
        console.error('Proxy Error:', e);
        return res.status(500).json({ error: 'An unexpected error occurred.' });
    }
}