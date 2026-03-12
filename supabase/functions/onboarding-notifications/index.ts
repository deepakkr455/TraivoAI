import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
const ADMIN_EMAIL = Deno.env.get("ADMIN_EMAIL") || "admin@wanderai.in";

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
        const { record } = payload;

        if (!record) {
            throw new Error("Missing record in payload");
        }

        const { user_id, email, full_name, new_status } = record;

        let subject = "";
        let htmlContent = "";
        let recipient = email;

        // 1. Logic for Admin Notifications
        if (new_status === 'basic_submitted' || new_status === 'id_submitted') {
            recipient = ADMIN_EMAIL;
            const stepName = new_status === 'basic_submitted' ? 'Basic Business Details' : 'Identity Links';
            subject = `Action Required: New Verification Submission from ${full_name}`;
            htmlContent = `
                <h2>Verification Submission Received</h2>
                <p><strong>Agent:</strong> ${full_name} (${email})</p>
                <p><strong>Step:</strong> ${stepName}</p>
                <p>Please review the details in the admin dashboard and update their status to <strong>basic_verified</strong> or <strong>id_verified</strong> to proceed.</p>
            `;
        }
        // 2. Logic for Agent Notifications (Approvals)
        else if (new_status === 'basic_verified' || new_status === 'id_verified') {
            const stepName = new_status === 'basic_verified' ? 'Basic Verification' : 'Identity Verification';
            const badgeType = new_status === 'basic_verified' ? 'Basic Trust Badge' : 'Premium Blue Badge';
            subject = `Congratulations! Your ${stepName} is Approved`;
            htmlContent = `
                <h2>Verification Approved! 🎉</h2>
                <p>Hello ${full_name},</p>
                <p>We are happy to inform you that your <strong>${stepName}</strong> has been successfully approved by our team.</p>
                <p>You have now earned the <strong>${badgeType}</strong>.</p>
                ${new_status === 'basic_verified' ? '<p>You can now proceed to the next step: <strong>Identity Verification</strong> to unlock the final Blue Badge.</p>' : '<p>Your profile is now fully verified and will be highlighted across the platform!</p>'}
                <p>Best regards,<br/>TraivoAI Team</p>
            `;
        } else {
            return new Response(JSON.stringify({ message: "Status change not requiring notification" }), { status: 200, headers: corsHeaders });
        }

        // Send email via Resend
        const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: "TraivoAI <noreply@wanderai.in>",
                to: recipient,
                subject: subject,
                html: htmlContent
            })
        });

        if (!emailResponse.ok) {
            const err = await emailResponse.json();
            throw new Error(`Resend failed: ${JSON.stringify(err)}`);
        }

        return new Response(JSON.stringify({ success: true }), { status: 200, headers: corsHeaders });

    } catch (error) {
        console.error("onboarding-notifications error:", error);
        return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }
});
