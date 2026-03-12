import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "info@traivoai.com";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const payload = await req.json();
        const { user_id, plan_name, billing_cycle, amount, user_type } = payload;

        if (!user_id || !plan_name || !billing_cycle || !amount || !user_type) {
            throw new Error("Missing required fields");
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // 1. Fetch user data (optional but good for the email)
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('full_name, email')
            .eq('id', user_id)
            .single();

        if (profileError) {
            console.error("Error fetching profile:", profileError);
        }

        const userName = profile?.full_name || 'User';
        const userEmail = profile?.email || 'N/A';

        // 2. Insert into subscription_requests
        const { error: insertError } = await supabase
            .from('subscription_requests')
            .insert({
                user_id,
                plan_name,
                billing_cycle,
                amount,
                user_type,
                status: 'pending'
            });

        if (insertError) {
            throw insertError;
        }

        // 3. Send email to admin via Resend
        if (RESEND_API_KEY) {
            const emailResponse = await fetch("https://api.resend.com/emails", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${RESEND_API_KEY}`
                },
                body: JSON.stringify({
                    from: "TraivoAI <no-reply@traivoai.com>",
                    to: ADMIN_EMAIL,
                    subject: `New Subscription Request: ${plan_name} from ${userName}`,
                    html: `
                        <h2>New Subscription Request</h2>
                        <p><strong>User:</strong> ${userName} (${userEmail})</p>
                        <p><strong>Plan:</strong> ${plan_name}</p>
                        <p><strong>Billing Cycle:</strong> ${billing_cycle}</p>
                        <p><strong>Amount:</strong> ₹${amount}</p>
                        <p><strong>User Type:</strong> ${user_type}</p>
                        <p>Please review and activate the subscription in the database.</p>
                    `
                })
            });

            if (!emailResponse.ok) {
                const err = await emailResponse.json();
                console.error("Resend API error:", err);
            }
        }

        return new Response(
            JSON.stringify({ success: true, message: "Subscription request submitted successfully" }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    } catch (error) {
        console.error("subscription-request error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
    }
});
