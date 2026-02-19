import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { email, otp, newPassword } = await req.json();

        if (!email || !otp || !newPassword) {
            throw new Error("Email, OTP, and New Password are required");
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // 1. Verify OTP
        const { data: otpData, error: otpError } = await supabase
            .from('password_reset_otps')
            .select('*')
            .eq('email', email)
            .eq('otp_hash', otp) // Again, ideally compare hashes
            .eq('used', false)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

        if (otpError || !otpData) {
            throw new Error("Invalid or expired OTP code.");
        }

        // 2. Identify user
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
        const user = userData.users.find(u => u.email === email);

        if (!user) {
            throw new Error("User not found.");
        }

        // 3. Update Password
        const { error: resetError } = await supabase.auth.admin.updateUserById(
            user.id,
            { password: newPassword }
        );

        if (resetError) throw resetError;

        // 4. Mark OTP as used
        await supabase
            .from('password_reset_otps')
            .update({ used: true })
            .eq('id', otpData.id);

        return new Response(JSON.stringify({ success: true, message: "Password updated successfully." }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error("Function error:", error);

        let clientMsg = "An unexpected error occurred. Please try again later.";
        let status = 400;

        // Pass through specific validation errors
        if (error.message?.includes("Invalid or expired") ||
            error.message?.includes("User not found") ||
            error.message?.includes("required")) {
            clientMsg = error.message;
        }

        return new Response(JSON.stringify({ error: clientMsg }), {
            status: status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
