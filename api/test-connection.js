// /api/test-connection.js
import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
    console.log('[TEST] Connection test initiated.');

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !serviceKey) {
        console.error('[TEST] Environment variables are missing in Vercel.');
        return res.status(500).json({
            status: "FAILED",
            message: "Server configuration error: SUPABASE_URL or SUPABASE_SERVICE_KEY is missing from Vercel Environment Variables."
        });
    }

    console.log(`[TEST] Attempting to connect to URL: ${supabaseUrl}`);

    try {
        const supabase = createClient(supabaseUrl, serviceKey);

        // Attempt a simple query to read from the 'banks' table.
        // This will fail if the URL is wrong, the key is wrong, or the table doesn't exist.
        const { data, error } = await supabase.from('banks').select('name').limit(1);

        if (error) {
            console.error('[TEST] Supabase query failed.', error);
            return res.status(500).json({
                status: "FAILED",
                message: "Connected to Supabase, but failed to read data. The service_role key might be wrong or the 'banks' table might be missing.",
                error_details: error.message
            });
        }

        console.log('[TEST] Success!', data);
        return res.status(200).json({
            status: "SUCCESS",
            message: "Vercel successfully connected to your Supabase project and read data."
        });

    } catch (e) {
        console.error('[TEST] A fatal error occurred during connection.', e);
        return res.status(500).json({
            status: "FAILED",
            message: "A fatal error occurred. This is almost always caused by an incorrect SUPABASE_URL format in your Vercel Environment Variables.",
            error_details: e.message
        });
    }
}