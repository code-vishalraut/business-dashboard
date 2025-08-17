// /api/proxy.js (Final Corrected Version)
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        const { action, payload } = req.body;

        // Securely initialize Supabase client on the server
        const supabase = createClient(
            process.env.SUPABASE_URL,
            process.env.SUPABASE_SERVICE_KEY,
            // --- THIS IS THE FIX ---
            // These options tell the Supabase client how to behave in a serverless environment
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
            // --- END OF FIX ---
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
            console.error('Token validation failed:', userError);
            return res.status(401).json({ error: userError.message || 'Invalid or expired token' });
        }

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

                const errors = [transactions, expenses, debtors, creditors, transfers, banks]
                    .map(result => result.error).filter(Boolean);
                if (errors.length > 0) {
                    return res.status(500).json({ error: errors.map(e => e.message).join('; ') });
                }

                return res.status(200).json({
                    transactions: transactions.data,
                    expenses: expenses.data,
                    debtors: debtors.data,
                    creditors: creditors.data,
                    transfers: transfers.data,
                    banks: banks.data,
                });

            case 'addOrUpdate':
                ({ data, error } = await supabase
                    .from(payload.table)
                    .upsert({ ...payload.data, user_id: userId })
                    .select()
                    .single());
                break;

            case 'delete':
                ({ error } = await supabase
                    .from(payload.table)
                    .delete()
                    .eq('user_id', userId)
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