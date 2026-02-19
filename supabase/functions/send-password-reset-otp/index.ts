import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") || "";
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
        const { email } = await req.json();

        if (!email) {
            throw new Error("Email is required");
        }

        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // 1. Check if user exists
        console.log(`Checking if user exists: ${email}`);
        const { data: userData, error: userError } = await supabase.auth.admin.listUsers();

        if (userError) {
            console.error("Error listing users:", userError);
            throw userError;
        }

        // Case-insensitive check
        const user = userData.users.find(u => u.email?.toLowerCase() === (email as string).toLowerCase().trim());

        if (!user) {
            console.log(`User not found for email: ${email}. Available emails:`, userData.users.map(u => u.email));
            return new Response(JSON.stringify({ error: "Account not found. Please ensure you have signed up first." }), {
                status: 404,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        // 2. Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 minutes

        // 3. Store OTP in DB
        console.log(`Storing OTP for ${email}...`);
        const { error: dbError } = await supabase
            .from('password_reset_otps')
            .insert({
                email: email.toLowerCase().trim(),
                otp_hash: otp,
                expires_at: expiresAt
            });

        if (dbError) {
            console.error("Database error:", dbError);
            throw dbError;
        }

        // 4. Send Email via Resend
        console.log(`Sending email via Resend to ${email}...`);

        if (!RESEND_API_KEY) {
            console.error("RESEND_API_KEY is missing!");
            throw new Error("RESEND_API_KEY secret is missing in Supabase.");
        }

        const emailResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${RESEND_API_KEY}`
            },
            body: JSON.stringify({
                from: "TraivoAI <noreply@wanderai.in>",
                to: email.toLowerCase().trim(),
                subject: "Your Password Reset Code",
                html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 12px;">
            <h2 style="color: #0d9488;">Reset Your Password</h2>
            <p>You requested a password reset. Use the code below to proceed. This code will expire in 15 minutes.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #111827; margin: 20px 0;">
              ${otp}
            </div>
            <p style="color: #6b7280; font-size: 14px;">If you didn't request this, you can safely ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #9ca3af; font-size: 12px; text-align: center;">© 2024 TraivoAI</p>
          </div>
        `
            })
        });

        const resBody = await emailResponse.json();
        console.log("Resend response status:", emailResponse.status);
        console.log("Resend response body:", resBody);

        if (!emailResponse.ok) {
            console.error(`Resend API Failure: ${emailResponse.status}`, resBody);
            // Hide technical details from end user
            return new Response(JSON.stringify({ error: "We're having trouble sending emails right now. Please try again in a few minutes." }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

        return new Response(JSON.stringify({ success: true, message: "OTP sent successfully" }), {
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error) {
        console.error("Function error:", error);
        // Map common errors to user-friendly messages
        let clientMsg = "An unexpected error occurred. Please try again later.";
        let status = 500;

        if (error.message?.includes("Account not found")) {
            clientMsg = error.message;
            status = 404;
        }

        return new Response(JSON.stringify({ error: clientMsg }), {
            status: status,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
